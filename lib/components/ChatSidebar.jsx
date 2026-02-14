import React, { useEffect, useRef, useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { X, Send, Loader2, User, Bot, Copy, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";
import SyntaxHighlighter from "react-syntax-highlighter/dist/cjs/prism";
import { vscDarkPlus, vs } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { toast } from "sonner";

const ChatSidebar = ({ isOpen, onClose, isDarkMode }) => {
	const chatOptions = useMemo(() => ({
		api: "/api/chat",
		onResponse: (response) => {
			if (!response.ok) {
				toast.error("Failed to connect to AI");
			}
		},
		onError: (err) => {
			console.error("Chat Error:", err);
			toast.error("An error occurred during chat");
		}
	}), []);

	const { messages, input, handleInputChange, handleSubmit, isLoading, error, append } = useChat(chatOptions);

	const [localInput, setLocalInput] = useState(input || "");

	// Sync local input with useChat input if it's cleared from outside (e.g. on submit)
	useEffect(() => {
		if (input === "" && localInput !== "") {
			setLocalInput("");
		}
	}, [input]);

	const handleLocalInputChange = (e) => {
		const newValue = e.target.value;
		setLocalInput(newValue);
		handleInputChange(e);
	};

	const onFormSubmit = (e) => {
		if (e) e.preventDefault();
		if (!localInput.trim()) return;
		
		if (typeof handleSubmit === 'function') {
			handleSubmit(e);
		} else if (typeof append === 'function') {
			append({ role: 'user', content: localInput });
			setLocalInput("");
		} else {
			toast.error("Chat interface not ready. Please refresh.");
		}
	};

	const scrollRef = useRef(null);
	const textareaRef = useRef(null);

	// Auto-resize textarea
	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
		}
	}, [localInput]);

	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [messages]);

	const copyToClipboard = (text) => {
		navigator.clipboard.writeText(text);
		toast.success("Copied to clipboard!");
	};

	if (!isOpen) return null;

	return (
		<div
			className={`fixed right-0 top-0 h-screen w-80 md:w-96 z-50 flex flex-col border-l transition-all duration-300 transform ${isOpen ? "translate-x-0" : "translate-x-full"} ${isDarkMode ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-zinc-200 text-zinc-900 shadow-2xl"}`}
		>
			{/* Header */}
			<div
				className={`p-4 border-b flex items-center justify-between ${isDarkMode ? "border-zinc-800" : "border-zinc-100"}`}
			>
				<div className="flex items-center gap-2">
					<MessageSquare className="w-5 h-5 text-zinc-500" />
					<h2 className="font-bold">AI Assistant</h2>
				</div>
				<button
					onClick={onClose}
					className={`p-2 rounded-xl transition-colors ${isDarkMode ? "hover:bg-zinc-800" : "hover:bg-zinc-100"}`}
				>
					<X className="w-5 h-5" />
				</button>
			</div>

			{/* Messages */}
			<div
				ref={scrollRef}
				className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide"
			>
				{messages.length === 0 && (
					<div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
						<div
							className={`p-4 rounded-3xl ${isDarkMode ? "bg-zinc-800" : "bg-zinc-50"}`}
						>
							<Bot className="w-8 h-8 text-zinc-400" />
						</div>
						<div>
							<p className="font-semibold text-sm">How can I help you today?</p>
							<p
								className={`text-xs mt-1 ${isDarkMode ? "text-zinc-500" : "text-zinc-400"}`}
							>
								Ask me to write a note, summarize content, or help with
								formatting.
							</p>
						</div>
					</div>
				)}

				{messages.map((m) => {
					return (
						<div
							key={m.id}
							className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"} space-y-2`}
						>
							<div
								className={`flex items-center gap-2 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
							>
								<div
									className={`p-1.5 rounded-xl ${isDarkMode ? "bg-zinc-800" : "bg-zinc-100"}`}
								>
									{m.role === "user" ? (
										<User className="w-3 h-3" />
									) : (
										<Bot className="w-3 h-3" />
									)}
								</div>
								<span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
									{m.role === "user" ? "You" : "Assistant"}
								</span>
							</div>

							<div
								className={`relative group max-w-[90%] p-3 rounded-2xl text-sm leading-relaxed ${
									m.role === "user"
										? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 rounded-tr-none"
										: `${isDarkMode ? "bg-zinc-800/50 border-zinc-800" : "bg-zinc-50 border-zinc-100"} border rounded-tl-none shadow-sm`
								}`}
							>
								<div className={`prose prose-zinc dark:prose-invert prose-sm max-w-none prose-p:my-1 prose-pre:bg-transparent prose-pre:p-0 prose-code:text-zinc-500`}>
									<ReactMarkdown
										components={{
											code({ node, inline, className, children, ...props }) {
												const match = /language-(\w+)/.exec(className || "");
												return !inline && match ? (
													<div className="relative group/code my-2">
														<SyntaxHighlighter
															style={isDarkMode ? vscDarkPlus : vs}
															language={match[1]}
															PreTag="div"
															customStyle={{
																margin: 0,
																padding: "1rem",
																borderRadius: "0.75rem",
																fontSize: "0.875rem",
																border: isDarkMode
																	? "1px solid #27272a"
																	: "1px solid #e4e4e7",
																background: isDarkMode ? "#09090b" : "#f4f4f5",
															}}
															{...props}
														>
															{String(children).replace(/\n$/, "")}
														</SyntaxHighlighter>
														<button
															onClick={() => copyToClipboard(String(children))}
															className={`absolute top-2 right-2 p-1.5 rounded-xl ${
																isDarkMode ? "bg-zinc-800/50" : "bg-zinc-200/50"
															} opacity-0 group-hover/code:opacity-100 transition-opacity`}
														>
															<Copy className="w-3.5 h-3.5 text-zinc-400" />
														</button>
													</div>
												) : (
													<code className={className} {...props}>
														{children}
													</code>
												);
											},
										}}
									>
										{m.content}
									</ReactMarkdown>
								</div>
								{m.role === "assistant" && (
									<button
										onClick={() => copyToClipboard(m.content)}
										className="absolute -bottom-6 right-0 p-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
									>
										<Copy className="w-3.5 h-3.5" />
									</button>
								)}
							</div>
						</div>
					);
				})}

				{isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
					<div className="flex flex-col items-start space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
						<div className="flex items-center gap-2">
							<div
								className={`p-1.5 rounded-xl ${isDarkMode ? "bg-zinc-800" : "bg-zinc-100"}`}
							>
								<Bot className="w-3 h-3" />
							</div>
							<span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
								Assistant
							</span>
						</div>
						<div
							className={`p-4 rounded-2xl rounded-tl-none ${isDarkMode ? "bg-zinc-800/50" : "bg-zinc-50"} flex items-center gap-2`}
						>
							<Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
							<span className="text-xs text-zinc-500 font-medium">Thinking...</span>
						</div>
					</div>
				)}

				{error && (
					<div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs">
						{error.message || "Failed to get response. Please try again."}
					</div>
				)}
			</div>

			{/* Input */}
			<div
				className={`p-4 border-t ${isDarkMode ? "border-zinc-800" : "border-zinc-100"}`}
			>
				<form onSubmit={onFormSubmit} className="relative">
					<textarea
						ref={textareaRef}
						value={localInput}
						onChange={handleLocalInputChange}
						placeholder="Type your message..."
						rows={1}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault();
								onFormSubmit(e);
							}
						}}
						className={`w-full pl-4 pr-12 py-3 rounded-2xl text-sm border resize-none focus:ring-2 focus:ring-zinc-500 outline-none transition-all max-h-32 ${isDarkMode ? "bg-zinc-800 border-zinc-700 text-zinc-100" : "bg-white border-zinc-200 text-zinc-900"}`}
					/>
					<button
						type="submit"
						disabled={!localInput.trim() || isLoading}
						className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${localInput.trim() && !isLoading ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "text-zinc-400"}`}
					>
						{isLoading ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Send className="w-4 h-4" />
						)}
					</button>
				</form>
			</div>
		</div>
	);
};

export default ChatSidebar;
