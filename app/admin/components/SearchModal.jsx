import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, FileText, Mail, User } from "lucide-react";
import { getAllBlogs } from "../../../lib/api/blog";
import { getAllEmails } from "../../../lib/api/emails";
import { getAllSubscribers } from "../../../lib/api/subscribers";

const ICONS = {
	blogs: FileText,
	emails: Mail,
	subscribers: User,
};

const SearchModal = ({ isOpen, onClose, onNavigate }) => {
	const [query, setQuery] = useState("");

	const { data: blogs = [] } = useQuery({
		queryKey: ["blogs"],
		queryFn: () => getAllBlogs(),
		enabled: isOpen,
	});
	const { data: emails = [] } = useQuery({
		queryKey: ["emails"],
		queryFn: () => getAllEmails(),
		enabled: isOpen,
	});
	const { data: subscribers = [] } = useQuery({
		queryKey: ["subscribers"],
		queryFn: () => getAllSubscribers(),
		enabled: isOpen,
	});

	const results = useMemo(() => {
		const q = query.trim().toLowerCase();

		const all = [
			...blogs.map((b) => ({
				type: "blogs",
				id: b.id,
				title: b.title || "Untitled post",
				subtitle: b.status ? `Status: ${b.status}` : "Post",
			})),
			...emails.map((e) => ({
				type: "emails",
				id: e.id,
				title: e.subject || "Untitled email",
				subtitle: e.status ? `Status: ${e.status}` : "Email",
			})),
			...subscribers.map((s) => ({
				type: "subscribers",
				id: s.id,
				title: s.email || "Subscriber",
				subtitle: s.status ? `Status: ${s.status}` : "Subscriber",
			})),
		];

		if (!q) return all.slice(0, 30);

		return all
			.filter((r) => {
				const hay = `${r.type} ${r.title} ${r.subtitle}`.toLowerCase();
				return hay.includes(q);
			})
			.slice(0, 30);
	}, [query, blogs, emails, subscribers]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-[9999]">
			<button
				className="absolute inset-0 bg-black/40"
				onClick={onClose}
				aria-label="Close search"
			/>
			<div className="relative max-w-xl mx-auto mt-24 bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden">
				<div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-200">
					<Search className="w-4 h-4 text-zinc-500" />
					<input
						autoFocus
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search blogs, emails, subscribers…"
						className="flex-1 bg-transparent outline-none text-sm text-zinc-900 placeholder:text-zinc-500"
					/>
					<button
						onClick={onClose}
						className="p-1 rounded-xl hover:bg-zinc-100 transition-colors"
						aria-label="Close"
					>
						<X className="w-4 h-4 text-zinc-700" />
					</button>
				</div>

				<div className="max-h-[420px] overflow-auto">
					{results.length === 0 ? (
						<div className="p-6 text-sm text-zinc-600">No results.</div>
					) : (
						<ul className="p-2">
							{results.map((r) => {
								const Icon = ICONS[r.type] || FileText;
								return (
									<li key={`${r.type}:${r.id}`}>
										<button
											onClick={() => {
												onNavigate?.(r.type);
												onClose?.();
											}}
											className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-colors text-left"
										>
											<div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
												<Icon className="w-4 h-4 text-zinc-900" />
											</div>
											<div className="min-w-0">
												<div className="text-sm font-medium text-zinc-900 truncate">
													{r.title}
												</div>
												<div className="text-xs text-zinc-600 truncate">
													{r.subtitle}
												</div>
											</div>
										</button>
									</li>
								);
							})}
						</ul>
					)}
				</div>

				<div className="px-4 py-3 border-t border-zinc-200 text-xs text-zinc-500">
					Tip: press Cmd/Ctrl+K to open.
				</div>
			</div>
		</div>
	);
};

export default SearchModal;
