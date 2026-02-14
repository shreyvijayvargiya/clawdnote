import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FileText, Mail, User, BarChart3, ArrowRight } from "lucide-react";
import { getAllBlogs } from "../../../lib/api/blog";
import { getAllEmails } from "../../../lib/api/emails";
import { getAllSubscribers } from "../../../lib/api/subscribers";

const StatCard = ({ icon: Icon, label, value, hint, onClick }) => {
	return (
		<button
			onClick={onClick}
			className="text-left p-5 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm transition-all"
		>
			<div className="flex items-center justify-between">
				<div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
					<Icon className="w-5 h-5 text-zinc-900" />
				</div>
				<ArrowRight className="w-4 h-4 text-zinc-400" />
			</div>
			<div className="mt-4 text-2xl font-bold text-zinc-900">{value}</div>
			<div className="mt-1 text-sm font-medium text-zinc-900">{label}</div>
			{hint && <div className="mt-1 text-xs text-zinc-600">{hint}</div>}
		</button>
	);
};

const HomeTab = ({ onNavigate }) => {
	const { data: blogs = [] } = useQuery({
		queryKey: ["blogs"],
		queryFn: () => getAllBlogs(),
	});
	const { data: emails = [] } = useQuery({
		queryKey: ["emails"],
		queryFn: () => getAllEmails(),
	});
	const { data: subscribers = [] } = useQuery({
		queryKey: ["subscribers"],
		queryFn: () => getAllSubscribers(),
	});

	const publishedBlogs = blogs.filter((b) => b.status === "published").length;
	const draftBlogs = blogs.filter((b) => b.status === "draft").length;
	const emailDrafts = emails.filter((e) => e.status === "draft").length;
	const activeSubscribers = subscribers.filter((s) => s.status === "active").length;

	return (
		<div className="px-4 sm:px-6 py-4">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-lg font-semibold text-zinc-900">Dashboard</h1>
					<p className="text-sm text-zinc-600">
						Blog kit overview (content + newsletter + analytics).
					</p>
				</div>
				<Link
					href="/"
						target="_blank"
					rel="noreferrer"
					className="text-sm font-medium text-zinc-900 hover:text-zinc-600 transition-colors"
				>
					View site
				</Link>
			</div>

			<div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<StatCard
					icon={FileText}
					label="Published posts"
					value={publishedBlogs}
					hint={`${draftBlogs} drafts`}
					onClick={() => onNavigate?.("blogs")}
				/>
				<StatCard
					icon={Mail}
					label="Email drafts"
					value={emailDrafts}
					hint="Write and send campaigns"
					onClick={() => onNavigate?.("emails")}
				/>
				<StatCard
					icon={User}
					label="Subscribers"
					value={activeSubscribers}
					hint="Active subscribers"
					onClick={() => onNavigate?.("subscribers")}
				/>
				<StatCard
					icon={BarChart3}
					label="Analytics"
					value="Open"
					hint="Traffic and engagement"
					onClick={() => onNavigate?.("analytics")}
				/>
									</div>

			<div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
				<p className="text-sm font-semibold text-zinc-900">Quick start</p>
				<ul className="mt-2 text-sm text-zinc-700 space-y-1 list-disc pl-5">
					<li>Go to Blogs → create your first post</li>
					<li>Publish it and verify it shows up on the homepage + /blog</li>
					<li>Collect subscribers from the homepage Subscribe section</li>
					<li>Send a newsletter from Emails</li>
				</ul>
			</div>
		</div>
	);
};

export default HomeTab;

