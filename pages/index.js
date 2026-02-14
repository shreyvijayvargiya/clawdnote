import React, { useState, useEffect, useMemo } from "react";
import {
	Plus,
	Search,
	Settings,
	User,
	LogOut,
	Mic,
	Square,
	Check,
	Loader2,
	FileText,
	Network,
	Sun,
	Moon,
	Menu,
	X,
	Key,
	Copy,
	Trash2,
	Trash,
	RefreshCw,
	Activity,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { toast, Toaster } from "sonner";
import { useLiveQuery } from "dexie-react-hooks";
import { noteService } from "../lib/db/noteService";
import { db as localDb } from "../lib/db/localDb";
import TiptapEditor from "../lib/components/TiptapEditor";
import { useTheme } from "../lib/context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";

const IndexPage = () => {
	const { isDarkMode, toggleTheme } = useTheme();
	// Use a mock stable user for initial render to avoid hydration mismatch
	const [user, setUser] = useState({
		uid: "local-user",
		displayName: "Local User",
		photoURL: null,
	});
	const [isAuthLoading, setIsAuthLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [activeNoteId, setActiveNoteId] = useState(null);
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [showProfileModal, setShowProfileModal] = useState(false);
	const [systemInfo, setSystemInfo] = useState({ workspacePath: "", connectScriptPath: "" });

	const [mcpStatus, setMcpStatus] = useState({ connected: false });
	const [isFetchingMcpStatus, setIsFetchingMcpStatus] = useState(false);

	const router = useRouter();

	// Live query for API keys
	const apiKeys = useLiveQuery(() => localDb.apiKeys.toArray()) || [];

	// Fetch MCP Status
	const fetchMcpStatus = async () => {
		setIsFetchingMcpStatus(true);
		try {
			const res = await fetch("/api/mcp-status");
			const data = await res.json();
			setMcpStatus(data);
		} catch (error) {
			console.error("Failed to fetch MCP status:", error);
		} finally {
			setIsFetchingMcpStatus(false);
		}
	};

	// Fetch System Info (Path)
	const fetchSystemInfo = async () => {
		try {
			const res = await fetch("/api/system-info");
			const data = await res.json();
			setSystemInfo(data);
		} catch (error) {
			console.error("Failed to fetch system info:", error);
		}
	};

	useEffect(() => {
		fetchMcpStatus();
		fetchSystemInfo();
		const interval = setInterval(fetchMcpStatus, 10000); // Check every 10s

		// Randomize user identity on client-side only
		const seed = Math.random();
		setUser({
			uid: "local-user",
			displayName: "Random User " + Math.floor(seed * 1000),
			photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`,
		});

		return () => clearInterval(interval);
	}, []);

	// Fetch Notes Locally with useLiveQuery for real-time updates
	const notes = useLiveQuery(
		() => noteService.getAllNotes(user?.uid),
		[user?.uid]
	) || [];

	const isNotesLoading = notes.length === 0 && !isAuthLoading && user;

	// Filter Notes
	const filteredNotes = useMemo(() => {
		return notes.sort((a, b) => b.updatedAt - a.updatedAt).filter(
			(note) =>
				note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				note.content?.toLowerCase().includes(searchQuery.toLowerCase()),
		);
	}, [notes, searchQuery]);

	// Actions
	const handleCreateNote = async () => {
		try {
			const newNote = await noteService.saveNote(user.uid, {
				title: "Untitled Note",
				content: "<p>Start typing...</p>",
			});
			setActiveNoteId(newNote.id);
			toast.success("Note created locally");
		} catch (error) {
			toast.error("Failed to create note");
		}
	};

	const handleDeleteNote = async (id) => {
		try {
			await noteService.deleteNote(id);
			if (activeNoteId === id) {
				setActiveNoteId(null);
			}
			toast.success("Note deleted");
		} catch (error) {
			toast.error("Failed to delete note");
		}
	};

	const generateNewApiKey = async () => {
		const newKey = {
			key: `sk_${uuidv4().replace(/-/g, "")}`,
			name: `Key ${apiKeys.length + 1}`,
			createdAt: Date.now()
		};
		await localDb.apiKeys.add(newKey);
		toast.success("New API Key generated");
	};

	const deleteApiKey = async (id) => {
		await localDb.apiKeys.delete(id);
		toast.success("API Key deleted");
	};

	const activeNote = useMemo(
		() => notes.find((n) => n.id === activeNoteId),
		[notes, activeNoteId],
	);

	const copyToClipboard = (text) => {
		navigator.clipboard.writeText(text);
		toast.success("Copied to clipboard!");
	};

	const getMcpConfig = (apiKey = "YOUR_API_KEY") => ({
		mcpServers: {
			clawdnote: {
				command: "node",
				args: [
					systemInfo.connectScriptPath || "/path/to/clawdnote/mcp-server/connect.js",
				],
				env: {
					CLAWDNOTE_API_KEY: apiKey,
					CLAWDNOTE_URL: "http://localhost:3000",
				},
			},
		},
	});

	if (isAuthLoading) {
		return (
			<div
				className={`h-screen w-screen flex items-center justify-center ${isDarkMode ? "bg-zinc-950" : "bg-zinc-50"}`}
			>
				<Loader2
					className={`w-8 h-8 animate-spin ${isDarkMode ? "text-zinc-700" : "text-zinc-400"}`}
				/>
			</div>
		);
	}

	return (
		<div
			className={`flex h-screen ${isDarkMode ? "dark bg-zinc-950 text-zinc-100" : "bg-white text-zinc-900"} font-sans transition-colors duration-300`}
		>
			<Toaster position="top-right" theme={isDarkMode ? "dark" : "light"} />

			{/* Sidebar Overlay */}
			{isSidebarOpen && (
				<div
					className="fixed inset-0 z-40 bg-zinc-950/20 backdrop-blur-sm md:hidden"
					onClick={() => setIsSidebarOpen(false)}
				/>
			)}

			{/* Sidebar */}
			<aside
				className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50 dark:bg-zinc-900 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
					isSidebarOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
					<div className="flex items-center justify-between mb-4">
						<h1 className="text-xl font-bold tracking-tight bg-gradient-to-br from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500 bg-clip-text text-transparent">
							ClawdNote
						</h1>
						<div className="flex items-center gap-2">
							<button
								onClick={() => setIsSidebarOpen(false)}
								className="md:hidden p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
							>
								<X className="w-4 h-4" />
							</button>
							<button
								onClick={toggleTheme}
								className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
								title={
									isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
								}
							>
								{isDarkMode ? (
									<Sun className="w-4 h-4" />
								) : (
									<Moon className="w-4 h-4" />
								)}
							</button>
							<button
								onClick={() => {
									handleCreateNote();
									setIsSidebarOpen(false);
								}}
								className="p-1 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
							>
								<Plus className="w-4 h-4" />
							</button>
						</div>
					</div>
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
						<input
							type="text"
							placeholder="Search notes..."
							className="w-full pl-9 pr-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-700 transition-all outline-none"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto py-1">
					{isNotesLoading ? (
						<div className="flex flex-col gap-2 p-4">
							{[1, 2, 3, 5, 6, 7, 8, 9, 10].map((i) => (
								<div
									key={i}
									className="h-16 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-xl"
								/>
							))}
						</div>
					) : filteredNotes.length > 0 ? (
						filteredNotes.map((note) => (
							<button
								key={note.id}
								onClick={() => {
									setActiveNoteId(note.id);
									setIsSidebarOpen(false);
								}}
								className={`w-full text-left p-3 hover:bg-white dark:hover:bg-zinc-800 transition-colors group relative ${
									activeNoteId === note.id
										? "bg-white dark:bg-zinc-800 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-700"
										: ""
								}`}
							>
								<h3 className={`font-semibold text-xs truncate pr-2 ${activeNoteId === note.id ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-700 dark:text-zinc-300'}`}>
									{note.title || "Untitled"}:{" "}
									<span className="font-normal text-zinc-500 dark:text-zinc-400">
										{note.content?.replace(/<[^>]*>/g, "") || "No content"}
									</span>
								</h3>
								<div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
									<button
										onClick={(e) => {
											e.stopPropagation();
											handleDeleteNote(note.id);
										}}
										className="text-zinc-400 hover:text-red-500"
									>
										<Trash className="w-3.5 h-3.5" />
									</button>
								</div>
							</button>
						))
					) : (
						<div className="p-8 text-center text-zinc-400 flex flex-col items-center gap-2">
							<FileText className="w-8 h-8 opacity-20" />
							<p className="text-sm">No notes found</p>
						</div>
					)}
				</div>

				<div className="p-2 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1">
					<div className="flex items-center justify-between p-2 mb-1">
						<div className="flex items-center gap-2">
							<Activity className={`w-3.5 h-3.5 ${mcpStatus.connected ? "text-green-500" : "text-zinc-400"}`} />
							<span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
								MCP Status
							</span>
						</div>
						<div className="flex items-center gap-1.5">
							<div className={`w-1.5 h-1.5 rounded-full ${mcpStatus.connected ? "bg-green-500 animate-pulse" : "bg-zinc-300 dark:bg-zinc-700"}`} />
							<span className="text-[10px] font-medium text-zinc-500">
								{mcpStatus.connected ? "Connected" : "Disconnected"}
							</span>
						</div>
					</div>

					<Link
						href="/graph-notes"
						onClick={() => setIsSidebarOpen(false)}
						className="flex items-center gap-3 w-full p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm font-medium"
					>
						<Network className="w-4 h-4" />
						Graph View
					</Link>

					<button 
						onClick={() => setShowProfileModal(true)}
						className="flex items-center gap-3 w-full p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm font-medium text-left"
					>
						{user.photoURL ? (
							<img
								src={user.photoURL}
								alt=""
								className="w-6 h-6 rounded-full"
							/>
						) : (
							<User className="w-4 h-4" />
						)}
						<span className="truncate flex-1 text-xs">
							{user.displayName}
						</span>
					</button>
				</div>
			</aside>

			{/* Main Content */}
			<main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-950 relative">
				{/* Mobile Header */}
				<header className="md:hidden flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 sticky top-0 z-30">
					<button
						onClick={() => setIsSidebarOpen(true)}
						className="p-2 -ml-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
					>
						<Menu className="w-6 h-6" />
					</button>
					<h1 className="text-lg font-bold tracking-tight">ClawdNote</h1>
					<button
						onClick={handleCreateNote}
						className="p-2 -mr-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
					>
						<Plus className="w-6 h-6" />
					</button>
				</header>
				{activeNote ? (
					<TiptapEditor
						key={activeNote.id}
						initialNote={activeNote}
						onUpdate={(updatedNote) => {
							// Local state is updated via useLiveQuery automatically
						}}
					/>
				) : (
					<div className="flex-1 flex flex-col items-center justify-center bg-zinc-50/30 dark:bg-zinc-900/10 text-zinc-400">
						<div className="max-w-md text-center p-8">
							<div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center justify-center mx-auto mb-6">
								<FileText className="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
							</div>
							<h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
								Select a note to view
							</h2>
							<p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
								Choose a note from the sidebar or create a new one to get
								started with your ideas.
							</p>
							<button
								onClick={handleCreateNote}
								className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
							>
								<Plus className="w-4 h-4" />
								New Note
							</button>
						</div>
					</div>
				)}
			</main>

			{/* MCP Config Modal */}
			<AnimatePresence>
				{showProfileModal && (
					<div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 dark:bg-black/40 backdrop-blur-sm">
						<motion.div 
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden"
						>
							<div className="flex flex-col">
								<div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
									<h3 className="font-bold">MCP Configuration</h3>
									<button
										onClick={() => setShowProfileModal(false)}
										className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800"
									>
										<X className="w-4 h-4" />
									</button>
								</div>

								<div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
									{/* User Section */}
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-4">
											{user.photoURL ? (
												<img src={user.photoURL} className="w-12 h-12 rounded-full ring-2 ring-zinc-100 dark:ring-zinc-800" />
											) : (
												<div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
													<User className="w-6 h-6 text-zinc-400" />
												</div>
											)}
											<div>
												<h4 className="font-bold">{user.displayName}</h4>
												<p className="text-xs text-zinc-500">Local Data Only</p>
											</div>
										</div>
										<button
											onClick={generateNewApiKey}
											className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
										>
											<Plus className="w-3.5 h-3.5" />
											New API Key
										</button>
									</div>

									{/* API Keys List */}
									<div className="space-y-3">
										<h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Active API Keys</h4>
										{apiKeys.length === 0 ? (
											<div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-dashed border-zinc-200 dark:border-zinc-700 text-center">
												<p className="text-xs text-zinc-400 italic">No API keys generated yet.</p>
											</div>
										) : (
											<div className="grid gap-2">
												{apiKeys.map((k) => (
													<div key={k.id} className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
														<div className="flex flex-col gap-0.5">
															<span className="text-[10px] font-bold text-zinc-400 uppercase">{k.name}</span>
															<code className="text-xs font-mono">{k.key.substring(0, 8)}...{k.key.substring(k.key.length - 4)}</code>
														</div>
														<div className="flex items-center gap-1">
															<button
																onClick={() => copyToClipboard(k.key)}
																className="p-2 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-zinc-500"
																title="Copy Key"
															>
																<Copy className="w-3.5 h-3.5" />
															</button>
															<button
																onClick={() => deleteApiKey(k.id)}
																className="p-2 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-red-500"
																title="Delete Key"
															>
																<Trash2 className="w-3.5 h-3.5" />
															</button>
														</div>
													</div>
												))}
											</div>
										)}
									</div>

									{/* Claude Config Section */}
									<div className="space-y-3">
										<div className="flex items-center gap-2">
											<Key className="w-4 h-4 text-indigo-500" />
											<h4 className="font-bold text-sm">Claude Desktop Config</h4>
										</div>
										<p className="text-xs text-zinc-500 leading-relaxed">
											Copy this configuration to your <code>claude_desktop_config.json</code> to connect Claude to your local notes.
										</p>
										
										<div className="relative group">
											<pre className="p-4 rounded-2xl bg-zinc-900 text-indigo-300 text-[10px] font-mono overflow-x-auto border border-zinc-800">
												{JSON.stringify(getMcpConfig(apiKeys[0]?.key || "YOUR_API_KEY"), null, 2)}
											</pre>
											<button
												onClick={() => copyToClipboard(JSON.stringify(getMcpConfig(apiKeys[0]?.key || "YOUR_API_KEY"), null, 2))}
												className="absolute top-3 right-3 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-all"
											>
												<Copy className="w-3.5 h-3.5" />
											</button>
										</div>
										<p className="text-[10px] text-zinc-400 italic">
											Note: Make sure <code>node</code> is in your system path.
										</p>
									</div>
								</div>

								<div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
									<button
										onClick={() => setShowProfileModal(false)}
										className="px-6 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-bold"
									>
										Done
									</button>
								</div>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>
		</div>
	);
};

export default IndexPage;
