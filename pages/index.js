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
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { toast, Toaster } from "sonner";
import { auth } from "../lib/config/firebase";
import { useLiveQuery } from "dexie-react-hooks";
import { noteService } from "../lib/db/noteService";
import { db as localDb } from "../lib/db/localDb";
import {
	onAuthStateChange,
	signInWithGoogle,
	signOutUser,
} from "../lib/api/auth";
import { generateApiKey, getUserApiKeys, revokeApiKey } from "../lib/api/keys";
import TiptapEditor from "../app/components/TiptapEditor";
import { useTheme } from "../lib/context/ThemeContext";

const IndexPage = () => {
	const { isDarkMode, toggleTheme } = useTheme();
	const [user, setUser] = useState(null);
	const [isAuthLoading, setIsAuthLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [activeNoteId, setActiveNoteId] = useState(null);
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [showProfileModal, setShowProfileModal] = useState(false);

	const [apiKeys, setApiKeys] = useState([]);
	const [isGeneratingKey, setIsGeneratingKey] = useState(false);

	const router = useRouter();

	// Auth State
	useEffect(() => {
		const unsubscribe = onAuthStateChange((u) => {
			setUser(u);
			setIsAuthLoading(false);
		});
		return () => unsubscribe();
	}, []);

	// Fetch API Keys when modal opens
	useEffect(() => {
		if (showProfileModal && user) {
			getUserApiKeys(user.uid).then(setApiKeys);
		}
	}, [showProfileModal, user]);

	const handleGenerateKey = async () => {
		if (!user) return;
		setIsGeneratingKey(true);
		try {
			await generateApiKey(user.uid);
			const keys = await getUserApiKeys(user.uid);
			setApiKeys(keys);
			toast.success("New API key generated!");
		} catch (error) {
			toast.error("Failed to generate key");
		} finally {
			setIsGeneratingKey(false);
		}
	};

	const handleRevokeKey = async (id) => {
		try {
			await revokeApiKey(id);
			setApiKeys(apiKeys.filter((k) => k.id !== id));
			toast.success("API key revoked");
		} catch (error) {
			toast.error("Failed to revoke key");
		}
	};

	const copyToClipboard = (text) => {
		navigator.clipboard.writeText(text);
		toast.success("Copied to clipboard!");
	};

	// Fetch Notes Locally with useLiveQuery for real-time updates
	const notes = useLiveQuery(
		() => noteService.getAllNotes(user?.uid),
		[user?.uid]
	) || [];

	const isNotesLoading = notes.length === 0 && user;

	// Background Sync Effect
	useEffect(() => {
		if (user) {
			noteService.syncAllWithCloud(user.uid);
		}
	}, [user]);

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
		if (!user) {
			toast.error("Please login to create notes");
			return;
		}
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

	const activeNote = useMemo(
		() => notes.find((n) => n.id === activeNoteId),
		[notes, activeNoteId],
	);

	const handleLogin = async () => {
		try {
			await signInWithGoogle();
			toast.success("Logged in successfully!");
		} catch (err) {
			toast.error("Login failed");
		}
	};

	const handleLogout = async () => {
		try {
			await signOutUser();
			toast.success("Logged out");
		} catch (err) {
			toast.error("Logout failed");
		}
	};

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
					<button
						onClick={() => {
							if (user) {
								noteService.syncAllWithCloud(user.uid);
								toast.info("Syncing with cloud...");
							}
						}}
						className="flex items-center gap-3 w-full p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm font-medium"
					>
						<RefreshCw className="w-4 h-4" />
						Sync Now
					</button>

					<Link
						href="/graph-notes"
						onClick={() => setIsSidebarOpen(false)}
						className="flex items-center gap-3 w-full p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm font-medium"
					>
						<Network className="w-4 h-4" />
						Graph View
					</Link>

					{user ? (
						<button
							onClick={() => {
								setShowProfileModal(true);
								setIsSidebarOpen(false);
							}}
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
							<span className="truncate flex-1">
								{user.displayName || user.email}
							</span>
						</button>
					) : (
						<button
							onClick={() => {
								handleLogin();
								setIsSidebarOpen(false);
							}}
							className="flex items-center justify-center gap-2 w-full p-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors text-sm font-medium"
						>
							<User className="w-4 h-4" />
							Login with Google
						</button>
					)}
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

			{/* User Modal */}
			{showProfileModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 dark:bg-black/40 backdrop-blur-sm">
					<div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
						<div className="flex flex-col">
							{/* Header */}
							<div className="p-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
								<h3 className="p-2">Profile Settings</h3>
								<button
									onClick={() => setShowProfileModal(false)}
									className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800"
								>
									<X className="w-4 h-4" />
								</button>
							</div>

							<div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
								{/* User Info */}
								<div className="flex items-center gap-4">
									<div className="relative">
										{user.photoURL ? (
											<img
												src={user.photoURL}
												alt=""
												className="w-16 h-16 rounded-full ring-4 ring-zinc-50 dark:ring-zinc-800"
											/>
										) : (
											<div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center ring-4 ring-zinc-50 dark:ring-zinc-800">
												<User className="w-8 h-8 text-zinc-300" />
											</div>
										)}
									</div>
									<div>
										<h4 className="font-bold text-lg">{user.displayName}</h4>
										<p className="text-sm text-zinc-500">{user.email}</p>
									</div>
								</div>

								{/* Claude Integration */}
								<div className="space-y-2">
									<div className="flex items-center gap-1">
										<div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800">
											<Key className="w-4 h-4" />
										</div>
										<h4 className="font-bold">Claude Integration (MCP)</h4>
									</div>

									<p className="text-xs text-zinc-500 leading-relaxed">
										Connect your notes to Claude Desktop to search, create, and
										manage your notes directly from AI conversations.
									</p>

									<div className="space-y-3">
										{apiKeys.length > 0 ? (
											apiKeys.map((k) => (
												<div
													key={k.id}
													className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between"
												>
													<code className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
														{k.key.substring(0, 10)}********************
													</code>
													<div className="flex items-center gap-2">
														<button
															onClick={() => copyToClipboard(k.key)}
															className="p-2 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-colors text-zinc-500"
															title="Copy Key"
														>
															<Copy className="w-4 h-4" />
														</button>
														<button
															onClick={() => handleRevokeKey(k.id)}
															className="p-2 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-colors text-red-500"
															title="Revoke Key"
														>
															<Trash2 className="w-4 h-4" />
														</button>
													</div>
												</div>
											))
										) : (
											<button
												onClick={handleGenerateKey}
												disabled={isGeneratingKey}
												className="w-full p-4 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-700 dark:hover:text-zinc-300 transition-all flex flex-col items-center gap-2"
											>
												{isGeneratingKey ? (
													<Loader2 className="w-4 h-4 animate-spin" />
												) : (
													<>
														<Plus className="w-4 h-4" />
														<span className="text-sm font-medium">
															Generate API Key for Claude
														</span>
													</>
												)}
											</button>
										)}

										{apiKeys.length > 0 && (
											<div className="relative group">
												<div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 text-[11px] leading-relaxed font-mono overflow-x-auto">
													<p> &#123;</p>
													<p>&nbsp;&nbsp;"mcpServers": &#123;</p>
													<p>&nbsp;&nbsp;&nbsp;&nbsp;"clawdnote": &#123;</p>
													<p>
														&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"command":
														"/opt/homebrew/bin/node",
													</p>
													<p>
														&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"args":
														["/Users/shreyvijayvargiya/Desktop/project/clawdnote/mcp-server/connect.js"],
													</p>
													<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"env": &#123;</p>
													<p>
														&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"CLAWDNOTE_API_KEY": "
														{apiKeys[0].key}",
													</p>
													<p>
														&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"CLAWDNOTE_URL":
														"http://localhost:3000"
													</p>
													<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#125;</p>
													<p>&nbsp;&nbsp;&nbsp;&nbsp;&#125;</p>
													<p>&nbsp;&nbsp;&#125;</p>
													<p>&#125;</p>
												</div>
												<button
													onClick={() => {
														const config = {
															mcpServers: {
																clawdnote: {
																	command: "/opt/homebrew/bin/node",
																	args: [
																		"/Users/shreyvijayvargiya/Desktop/project/clawdnote/mcp-server/connect.js",
																	],
																	env: {
																		CLAWDNOTE_API_KEY: apiKeys[0].key,
																		CLAWDNOTE_URL: "http://localhost:3000",
																	},
																},
															},
														};
														copyToClipboard(JSON.stringify(config, null, 2));
													}}
													className="absolute top-3 right-3 p-2 rounded-xl bg-white/50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-900 transition-all text-zinc-500 opacity-0 group-hover:opacity-100 shadow-sm border border-zinc-200 dark:border-zinc-700"
													title="Copy Config"
												>
													<Copy className="w-3.5 h-3.5" />
												</button>
											</div>
										)}
									</div>
								</div>
							</div>

							{/* Footer */}
							<div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
								<button
									onClick={() => {
										handleLogout();
										setShowProfileModal(false);
									}}
									className="px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
								>
									<LogOut className="w-4 h-4" />
									Sign Out
								</button>
								<button
									onClick={() => setShowProfileModal(false)}
									className="px-6 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 transition-colors text-sm font-semibold"
								>
									Close
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default IndexPage;
