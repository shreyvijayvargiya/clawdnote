import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import admin from "firebase-admin";

// Initialize Firebase Admin
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!projectId) {
    console.error("CRITICAL ERROR: Missing FIREBASE_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variables.");
    process.exit(1);
  }

  try {
    if (serviceAccountKey) {
      const serviceAccount = JSON.parse(serviceAccountKey);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: projectId,
      });
    } else {
      // Fallback for environments where ADC is available or the user doesn't want to provide a key
      admin.initializeApp({
        projectId: projectId,
      });
    }
    console.error("Firebase Admin initialized successfully.");
  } catch (error) {
    console.error("Firebase Admin initialization failed:", error.message);
    // Don't exit if initialization fails, as the server might still be able to run 
    // if it's using a different auth method or doesn't need admin access immediately.
  }
}

const db = admin.firestore();
const NOTES_COLLECTION = "notes";

const mcpServer = new McpServer(
  {
    name: "clawdnote-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const server = mcpServer.server;

/**
 * List of available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_notes",
        description: "List all notes for a specific user",
        inputSchema: {
          type: "object",
          properties: {
            userId: { type: "string", description: "The ID of the user whose notes to list" },
          },
          required: ["userId"],
        },
      },
      {
        name: "get_note",
        description: "Get the content of a specific note",
        inputSchema: {
          type: "object",
          properties: {
            noteId: { type: "string", description: "The ID of the note to retrieve" },
          },
          required: ["noteId"],
        },
      },
      {
        name: "create_note",
        description: "Create a new note",
        inputSchema: {
          type: "object",
          properties: {
            userId: { type: "string", description: "The ID of the user creating the note" },
            title: { type: "string", description: "The title of the note" },
            content: { type: "string", description: "The HTML content of the note" },
          },
          required: ["userId", "title", "content"],
        },
      },
    ],
  };
});

/**
 * Tool handlers
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "list_notes": {
        const snapshot = await db.collection(NOTES_COLLECTION)
          .where("userId", "==", args.userId)
          .orderBy("updatedAt", "desc")
          .get();
        
        const notes = snapshot.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title,
          updatedAt: doc.data().updatedAt?.toDate().toISOString(),
        }));
        
        return {
          content: [{ type: "text", text: JSON.stringify(notes, null, 2) }],
        };
      }

      case "get_note": {
        const doc = await db.collection(NOTES_COLLECTION).doc(args.noteId).get();
        if (!doc.exists) {
          return {
            content: [{ type: "text", text: "Note not found" }],
            isError: true,
          };
        }
        return {
          content: [{ type: "text", text: JSON.stringify({ id: doc.id, ...doc.data() }, null, 2) }],
        };
      }

      case "create_note": {
        const newNote = {
          userId: args.userId,
          title: args.title,
          content: args.content,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        const docRef = await db.collection(NOTES_COLLECTION).add(newNote);
        return {
          content: [{ type: "text", text: `Note created with ID: ${docRef.id}` }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error("ClawdNote MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
