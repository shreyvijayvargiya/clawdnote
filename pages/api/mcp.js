import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import admin from "firebase-admin";
import {
	ListToolsRequestSchema,
	CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { v4 as uuidv4 } from "uuid";

// Disable bodyParser to let the MCP SDK handle the raw request stream
export const config = {
	api: {
		bodyParser: false,
	},
};

// Initialize Firebase Admin
if (!admin.apps.length) {
	const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
	const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
	try {
		if (serviceAccountKey) {
			admin.initializeApp({
				credential: admin.credential.cert(JSON.parse(serviceAccountKey)),
				projectId: projectId,
			});
		} else {
			admin.initializeApp({ projectId });
		}
	} catch (e) {
		console.error("[MCP Server] Firebase Admin init error:", e.message);
	}
}

const db = admin.firestore();

// Registry for active sessions
// Map<sessionId, { mcpServer, transport, userId, lastSeen }>
if (!global.mcpSessions) {
	global.mcpSessions = new Map();
}

// Cleanup stale sessions every 5 minutes
if (!global.mcpCleanupStarted) {
	setInterval(() => {
		const now = Date.now();
		const timeout = 1000 * 60 * 15; // 15 minutes
		for (const [sid, session] of global.mcpSessions.entries()) {
			if (now - session.lastSeen > timeout) {
				console.log(`[MCP Server] Cleaning up stale session: ${sid}`);
				global.mcpSessions.delete(sid);
			}
		}
	}, 1000 * 60 * 5);
	global.mcpCleanupStarted = true;
}

export default async function handler(req, res) {
	try {
		const host = req.headers.host || "localhost:3000";
		const protocol = host.includes("localhost") ? "http" : "https";
		const urlObj = new URL(req.url, `${protocol}://${host}`);
		
		// The SDK uses 'mcp-session-id' header or 'sessionId' query param
		const sessionId = urlObj.searchParams.get("sessionId") || req.headers["mcp-session-id"] || urlObj.searchParams.get("sid");
		
		console.log(`[MCP Server] Request: ${req.method} ${req.url} (Session: ${sessionId || "new"})`);

		// 1. If we have a session ID, route to existing session
		if (sessionId) {
			const session = global.mcpSessions.get(sessionId);
			if (session) {
				session.lastSeen = Date.now();
				return await session.transport.handleRequest(req, res);
			} else {
				console.warn(`[MCP Server] Session not found: ${sessionId}`);
				return res.status(404).json({ error: "Session not found" });
			}
		}

		// 2. No session ID -> Start a NEW session
		// Authenticate with API Key
		const apiKey = urlObj.searchParams.get("apiKey") || req.headers["x-api-key"];

		if (!apiKey) {
			console.error("[MCP Server] Missing API Key for new session");
			return res.status(401).json({ error: "Missing API Key" });
		}

		// Verify API Key
		const keysSnapshot = await db.collection("api_keys").where("key", "==", apiKey).limit(1).get();
		if (keysSnapshot.empty) {
			return res.status(401).json({ error: "Invalid API Key" });
		}

		const userId = keysSnapshot.docs[0].data().userId;
		console.log(`[MCP Server] Authenticating new session for user: ${userId}`);

		// Create FRESH server and transport
		const mcpServer = new McpServer(
			{ name: "clawdnote-hosted", version: "1.0.0" },
			{ capabilities: { tools: {} } }
		);

		// Define Tools
		mcpServer.server.setRequestHandler(ListToolsRequestSchema, async () => {
			console.log(`[MCP Server] Listing tools for user: ${userId}`);
			return {
				tools: [
					{
						name: "list_notes",
						description: "List all notes",
						inputSchema: { type: "object", properties: {} },
					},
					{
						name: "get_note",
						description: "Get note content",
						inputSchema: {
							type: "object",
							properties: { noteId: { type: "string" } },
							required: ["noteId"],
						},
					},
					{
						name: "create_note",
						description: "Create a new note with a title and content (HTML format preferred)",
						inputSchema: {
							type: "object",
							properties: {
								title: { type: "string" },
								content: { type: "string" }
							},
							required: ["title", "content"],
						},
					},
					{
						name: "update_note",
						description: "Update an existing note",
						inputSchema: {
							type: "object",
							properties: {
								noteId: { type: "string" },
								title: { type: "string" },
								content: { type: "string" }
							},
							required: ["noteId"],
						},
					},
					{
						name: "delete_note",
						description: "Delete a note",
						inputSchema: {
							type: "object",
							properties: {
								noteId: { type: "string" }
							},
							required: ["noteId"],
						},
					},
					{
						name: "ping",
						description: "Check connection",
						inputSchema: { type: "object", properties: {} },
					}
				],
			};
		});

		mcpServer.server.setRequestHandler(CallToolRequestSchema, async (request) => {
			const { name, arguments: args } = request.params;
			console.log(`[MCP Server] Calling tool: ${name} for user: ${userId}`);

			if (name === "ping") return { content: [{ type: "text", text: "pong" }] };
			
			const notesCollection = db.collection("notes");
			if (name === "list_notes") {
				const snap = await notesCollection.where("userId", "==", userId).get();
				const notes = snap.docs.map(d => ({ id: d.id, title: d.data().title }));
				return { content: [{ type: "text", text: JSON.stringify(notes) }] };
			}
			if (name === "get_note") {
				const doc = await notesCollection.doc(args.noteId).get();
				if (!doc.exists || doc.data().userId !== userId) return { content: [{ type: "text", text: "Not found" }], isError: true };
				return { content: [{ type: "text", text: JSON.stringify(doc.data()) }] };
			}
			if (name === "create_note") {
				const newNote = {
					userId,
					title: args.title,
					content: args.content,
					createdAt: admin.firestore.FieldValue.serverTimestamp(),
					updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				};
				const docRef = await notesCollection.add(newNote);
				return { content: [{ type: "text", text: `Note created successfully with ID: ${docRef.id}` }] };
			}
			if (name === "update_note") {
				const { noteId, ...updates } = args;
				const docRef = notesCollection.doc(noteId);
				const doc = await docRef.get();
				if (!doc.exists || doc.data().userId !== userId) {
					return { content: [{ type: "text", text: "Note not found or unauthorized" }], isError: true };
				}
				await docRef.update({
					...updates,
					updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				});
				return { content: [{ type: "text", text: `Note ${noteId} updated successfully` }] };
			}
			if (name === "delete_note") {
				const docRef = notesCollection.doc(args.noteId);
				const doc = await docRef.get();
				if (!doc.exists || doc.data().userId !== userId) {
					return { content: [{ type: "text", text: "Note not found or unauthorized" }], isError: true };
				}
				await docRef.delete();
				return { content: [{ type: "text", text: `Note ${args.noteId} deleted successfully` }] };
			}
			throw new Error(`Unknown tool: ${name}`);
		});

		const newSessionId = uuidv4();
		const transport = new StreamableHTTPServerTransport({
			sessionIdGenerator: () => newSessionId,
		});

		await mcpServer.connect(transport);
		
		// Store the session
		global.mcpSessions.set(newSessionId, { 
			mcpServer, 
			transport, 
			userId, 
			lastSeen: Date.now() 
		});

		console.log(`[MCP Server] Created new session: ${newSessionId}`);

		// Cleanup on close (for SSE streams)
		res.on('close', () => {
			if (req.method === "GET") {
				console.log(`[MCP Server] SSE stream closed for session: ${newSessionId}`);
			}
		});

		await transport.handleRequest(req, res);

	} catch (error) {
		console.error("[MCP Server] Fatal Error:", error);
		if (!res.headersSent) {
			res.status(500).json({ error: error.message || "Internal Server Error" });
		}
	}
}
