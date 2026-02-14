import React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, MessageCircle, ThumbsUp, ChevronDown } from "lucide-react";

const DEFAULT_COMMENTS = [
	{
		id: "c1",
		name: "William Claude",
		meta: "Jan 9",
		avatar:
			"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=96&q=60",
		highlight:
			"A few days before confetti drops and calendar pages flip, people start acting like January has magic in it. Same life, new number, and suddenly you’re going to become the kind of person…",
		body: "Mind-blowing insight, love reading every beat",
		likes: 14,
		replies: 0,
	},
	{
		id: "c2",
		name: "Inioluwa Oke",
		meta: "Jan 9",
		avatar:
			"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=60",
		highlight: null,
		body: "Beautiful ❤️",
		likes: 8,
		replies: 0,
	},
	{
		id: "c3",
		name: "wellnessnotes",
		meta: "Jan 10",
		avatar:
			"https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=96&q=60",
		highlight: "Move the bike closer. Then, stop talking",
		body: "That line says everything—alignment before action, intention before effort. Powerful piece.",
		likes: 7,
		replies: 1,
	},
];

export const BlogCommentsPanel = ({
	comments = DEFAULT_COMMENTS,
	className = "",
}) => {
	const totalLikes = comments.reduce((sum, c) => sum + (c.likes || 0), 0);
	const totalReplies = comments.reduce((sum, c) => sum + (c.replies || 0), 0);

	return (
		<div className={className}>
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
					<MessageCircle className="w-4 h-4 text-zinc-500" />
					Comments
					<span className="text-zinc-500 font-medium">
						({comments.length})
					</span>
				</div>
				<button
					type="button"
					className="inline-flex items-center gap-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
				>
					Most relevant <ChevronDown className="w-4 h-4" />
				</button>
			</div>

			<div className="mt-2 text-xs text-zinc-500">
				{totalLikes} likes • {totalReplies} replies
			</div>

			<div className="mt-5 space-y-8">
				{comments.map((c) => (
					<div key={c.id} className="flex gap-3">
						<img
							src={c.avatar}
							alt={c.name}
							className="w-9 h-9 rounded-full object-cover border border-zinc-200"
						/>
						<div className="flex-1 min-w-0">
							<div className="flex items-center justify-between gap-3">
								<div className="min-w-0">
									<div className="text-sm font-medium text-zinc-900 truncate">
										{c.name}{" "}
										<span className="text-zinc-500 font-normal">• {c.meta}</span>
									</div>
								</div>
								<div className="text-zinc-400 text-sm select-none">•••</div>
							</div>

							{c.highlight && (
								<div className="mt-3 border border-zinc-200 rounded-xl p-3 bg-zinc-50">
									<p className="text-sm text-zinc-800 leading-relaxed">
										<span className="bg-emerald-100/70">
											{c.highlight}
										</span>
									</p>
								</div>
							)}

							<p className="mt-3 text-sm text-zinc-700 leading-relaxed">
								{c.body}
							</p>

							<div className="mt-3 flex items-center gap-4 text-xs text-zinc-600">
								<div className="inline-flex items-center gap-1">
									<ThumbsUp className="w-4 h-4" />
									<span>{c.likes || 0}</span>
								</div>
								<button type="button" className="hover:text-zinc-900">
									Reply
								</button>
								{c.replies ? (
									<span className="text-zinc-500">
										{c.replies} reply{c.replies === 1 ? "" : "ies"}
									</span>
								) : null}
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

const BlogCommentsDrawer = ({ isOpen, onClose, comments }) => {
	if (typeof document === "undefined") return null;

	return createPortal(
		<AnimatePresence>
			{isOpen && (
				<>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-[9998] bg-black/40"
						onClick={onClose}
					/>
					<motion.aside
						initial={{ x: "100%" }}
						animate={{ x: 0 }}
						exit={{ x: "100%" }}
						transition={{ type: "spring", stiffness: 420, damping: 42 }}
						className="fixed right-0 top-0 bottom-0 z-[9999] w-full sm:w-[420px] bg-white border-l border-zinc-200 shadow-2xl"
						aria-label="Comments"
					>
						<div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
							<div className="text-sm font-semibold text-zinc-900">
								Comments
							</div>
							<button
								type="button"
								onClick={onClose}
								className="p-2 rounded-xl hover:bg-zinc-100 transition-colors"
								aria-label="Close"
							>
								<X className="w-5 h-5 text-zinc-700" />
							</button>
						</div>

						<div className="h-full overflow-auto px-4 py-4">
							<BlogCommentsPanel comments={comments} />
						</div>
					</motion.aside>
				</>
			)}
		</AnimatePresence>,
		document.body
	);
};

export default BlogCommentsDrawer;

