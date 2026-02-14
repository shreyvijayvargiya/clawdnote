import React, { useState, useMemo } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import Navbar from "../../app/components/Navbar";
import Footer from "../../app/components/Footer";
import {
	Calendar,
	ArrowLeft,
	Copy,
	Check,
	Link as LinkIcon,
	Twitter,
	Heart,
	MessageCircle,
	Repeat2,
	ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { getAllBlogs, getBlogById } from "../../lib/api/blog";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { htmlToMarkdown } from "../../lib/utils/htmlToMarkdown";
import Head from "next/head";
import BlogTableOfContents from "../../app/components/BlogTableOfContents";
import BlogCommentsDrawer, {
	BlogCommentsPanel,
} from "../../app/components/BlogCommentsDrawer";

const BlogPostPage = () => {
	const router = useRouter();
	const { slug } = router.query;
	const [isCommentsOpen, setIsCommentsOpen] = useState(false);

	const { data: allBlogs = [] } = useQuery({
		queryKey: ["blogs", "published"],
		queryFn: () => getAllBlogs("published"),
		enabled: !!slug,
	});

	const { data: blog, isLoading } = useQuery({
		queryKey: ["blog", slug],
		queryFn: async () => {
			if (!slug) return null;
			const blogs = await getAllBlogs("published");
			const foundBlog = blogs.find((b) => b.slug === slug);
			// If not found by slug, try to find by ID (in case slug is actually an ID)
			if (!foundBlog) {
				return blogs.find((b) => b.id === slug) || null;
			}
			return foundBlog;
		},
		enabled: !!slug,
	});

	const moreBlogs = useMemo(() => {
		if (!blog?.id) return [];
		return (allBlogs || [])
			.filter((b) => b?.id && b.id !== blog.id)
			.slice(0, 3);
	}, [allBlogs, blog?.id]);

	// Convert content to markdown (handle both HTML and markdown)
	// Must be called before any early returns to follow Rules of Hooks
	const markdownContent = useMemo(() => {
		if (!blog?.content) return "";
		const content = blog.content;

		// Check if it's HTML
		const isHTML =
			content.includes("<") &&
			content.includes(">") &&
			content.match(/<\/?[a-z][\s\S]*>/i);

		if (isHTML) {
			// Convert HTML to markdown
			return htmlToMarkdown(content);
		}

		// Already markdown or plain text
		return content;
	}, [blog?.content]);

	if (isLoading) {
		return (
			<div className="min-h-screen flex flex-col">
				<Navbar />
				<div className="flex-1 flex items-center justify-center">
					<div className="text-zinc-600">Loading...</div>
				</div>
				<Footer />
			</div>
		);
	}

	if (!blog) {
		return (
			<div className="min-h-screen flex flex-col">
				<Navbar />
				<div className="flex-1 flex items-center justify-center">
					<div className="text-center">
						<h1 className="text-2xl font-bold text-zinc-900 mb-4">
							Blog Post Not Found
						</h1>
						<Link href="/blog" className="text-zinc-600 hover:text-zinc-900">
							Back to Blog
						</Link>
					</div>
				</div>
				<Footer />
			</div>
		);
	}

	const formatDate = (date) => {
		if (!date) return "N/A";
		const d = date?.toDate ? date.toDate() : new Date(date);
		return d.toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	// Get excerpt from content for meta description
	const getExcerpt = (content) => {
		if (!content) return "";
		const text = content.replace(/<[^>]*>/g, "").substring(0, 160);
		return text.length < content.length ? text + "..." : text;
	};

	const getCardExcerpt = (content) => {
		if (!content) return "";
		const text = content
			.replace(/<[^>]*>/g, " ")
			.replace(/\s+/g, " ")
			.trim();
		if (!text) return "";
		return text.length > 120 ? `${text.slice(0, 120)}…` : text;
	};

	// Code block component with copy button
	const CodeBlock = ({ language, children, ...props }) => {
		const [copied, setCopied] = useState(false);
		const codeString = String(children).replace(/\n$/, "");

		const lightTheme = {
			...oneLight,
		};

		const handleCopyCode = async () => {
			try {
				await navigator.clipboard.writeText(codeString);
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
				toast.success("Code copied to clipboard!");
			} catch (error) {
				console.error("Failed to copy code:", error);
				toast.error("Failed to copy code");
			}
		};

		return (
			<div className="relative group mb-4">
				<div className="absolute top-2 right-2 z-10">
					<motion.button
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={handleCopyCode}
						className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
							copied
								? "bg-green-100 text-green-700"
								: "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
						}`}
					>
						{copied ? (
							<>
								<Check className="w-3 h-3" />
								Copied
							</>
						) : (
							<>
								<Copy className="w-3 h-3" />
								Copy
							</>
						)}
					</motion.button>
				</div>
				<SyntaxHighlighter
					language={language || "javascript"}
					style={lightTheme}
					PreTag="div"
					className="rounded border border-zinc-200 !bg-white"
					customStyle={{
						background: "#ffffff",
						padding: "1rem",
						margin: 0,
						fontSize: "0.875rem",
						border: "1px solid #e4e4e7",
					}}
					{...props}
				>
					{codeString}
				</SyntaxHighlighter>
			</div>
		);
	};

	return (
		<>
			<Head>
				<title>{blog.title} - YourApp Blog</title>
				<meta
					name="description"
					content={getExcerpt(blog.content) || blog.title}
				/>
				{blog.bannerImage && (
					<>
						<meta property="og:image" content={blog.bannerImage} />
						<meta name="twitter:image" content={blog.bannerImage} />
						<meta name="twitter:card" content="summary_large_image" />
					</>
				)}
				<meta property="og:title" content={blog.title} />
				<meta
					property="og:description"
					content={getExcerpt(blog.content) || blog.title}
				/>
				<meta property="og:type" content="article" />
				<meta
					property="og:url"
					content={`${
						typeof window !== "undefined" ? window.location.href : ""
					}`}
				/>
				{blog.createdAt && (
					<meta
						property="article:published_time"
						content={
							blog.createdAt?.toDate
								? blog.createdAt.toDate().toISOString()
								: new Date(blog.createdAt).toISOString()
						}
					/>
				)}
				{blog.author && (
					<meta property="article:author" content={blog.author} />
				)}
			</Head>
			<div className="min-h-screen flex flex-col">
				<Navbar />

				<article className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
					<BlogTableOfContents containerSelector="#blog-content" />
					<div className="max-w-3xl mx-auto">
						<Link
							href="/blog"
							className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 mb-6"
						>
							<ArrowLeft className="w-4 h-4" />
							Back to Blog
						</Link>

						{blog.bannerImage && (
							<img
								src={blog.bannerImage}
								alt={blog.title}
								className="w-full h-64 sm:h-96 object-cover rounded-xl mb-6 border border-zinc-100"
							/>
						)}

						<div className="flex items-center justify-between flex-wrap gap-3 my-4">
							<div className="flex items-center gap-2">
								<button
									type="button"
									aria-label="Like"
									className="px-2.5 py-2 rounded-xl hover:bg-zinc-100 bg-zinc-50 text-zinc-700 transition-colors inline-flex items-center gap-2"
								>
									<Heart className="w-4 h-4" />
									<span className="text-xs font-semibold text-zinc-700">
										128
									</span>
								</button>
								<button
									type="button"
									aria-label="Comment"
									onClick={() => setIsCommentsOpen(true)}
									className="px-2.5 py-2 rounded-xl hover:bg-zinc-100 bg-zinc-50 text-zinc-700 transition-colors inline-flex items-center gap-2"
								>
									<MessageCircle className="w-4 h-4" />
									<span className="text-xs font-semibold text-zinc-700">
										24
									</span>
								</button>
								<button
									type="button"
									aria-label="Reshare"
									className="px-2.5 py-2 rounded-xl hover:bg-zinc-100 bg-zinc-50 text-zinc-700 transition-colors inline-flex items-center gap-2"
								>
									<Repeat2 className="w-4 h-4" />
									<span className="text-xs font-semibold text-zinc-700">7</span>
								</button>
							</div>
							<div className="flex items-center gap-2">
								{/* Copy Markdown Button */}
								<motion.button
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									onClick={async () => {
										try {
											await navigator.clipboard.writeText(markdownContent);
											toast.success("Markdown copied to clipboard!");
										} catch (error) {
											toast.error("Failed to copy markdown");
										}
									}}
									className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition-colors text-xs font-medium"
									title="Copy Markdown"
								>
									<Copy className="w-3.5 h-3.5" />
									Copy Markdown
								</motion.button>
								{/* Share to Twitter Button */}
								<motion.a
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
										blog.title,
									)}&url=${encodeURIComponent(
										typeof window !== "undefined" ? window.location.href : "",
									)}`}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-500 hover:bg-zinc-600 text-white rounded-xl transition-colors text-xs font-medium"
									title="Share on Twitter"
								>
									<Twitter className="w-3.5 h-3.5" />
									Share
								</motion.a>
								{/* Copy Link Button */}
								<motion.button
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									onClick={async () => {
										try {
											const url =
												typeof window !== "undefined"
													? window.location.href
													: "";
											await navigator.clipboard.writeText(url);
											toast.success("Link copied to clipboard!");
										} catch (error) {
											toast.error("Failed to copy link");
										}
									}}
									className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition-colors text-xs font-medium"
									title="Copy Link"
								>
									<LinkIcon className="w-3.5 h-3.5" />
									Copy Link
								</motion.button>
							</div>
						</div>

						<h1 className="text-4xl font-bold text-zinc-900 mb-4">
							{blog.title}
						</h1>

						<div className="flex items-center gap-2 text-sm text-zinc-600 mb-12">
							<Calendar className="w-4 h-4" />
							{formatDate(blog.createdAt)}
							{blog.author && (
								<>
									<span>•</span>
									<span>{blog.author}</span>
								</>
							)}
						</div>
						<div
							id="blog-content"
							className="blog-content prose prose-zinc max-w-none prose-base"
						>
							<ReactMarkdown
								components={{
									h1: ({ node, ...props }) => (
										<h1
											className="text-3xl font-bold text-zinc-900 mb-4 mt-8"
											{...props}
										/>
									),
									h2: ({ node, ...props }) => (
										<h2
											className="text-2xl font-bold text-zinc-900 mb-3 mt-6"
											{...props}
										/>
									),
									h3: ({ node, ...props }) => (
										<h3
											className="text-xl font-semibold text-zinc-900 mb-2 mt-4"
											{...props}
										/>
									),
									h4: ({ node, ...props }) => (
										<h4
											className="text-lg font-semibold text-zinc-900 mb-2 mt-3"
											{...props}
										/>
									),
									p: ({ node, ...props }) => (
										<p
											className="text-zinc-700 mb-4 leading-7 text-base"
											{...props}
										/>
									),
									ul: ({ node, ...props }) => (
										<ul
											className="list-disc mb-4 space-y-2 text-zinc-700 text-base ml-6 pl-2"
											style={{ listStylePosition: "outside" }}
											{...props}
										/>
									),
									ol: ({ node, ...props }) => (
										<ol
											className="list-decimal mb-4 space-y-2 text-zinc-700 text-base ml-6 pl-2"
											style={{ listStylePosition: "outside" }}
											{...props}
										/>
									),
									li: ({ node, ...props }) => (
										<li className="mb-1.5 leading-7" {...props} />
									),
									code: ({ node, inline, className, children, ...props }) => {
										// Only render as code block if it's a block-level code (not inline)
										if (inline) {
											return (
												<code
													className="text-zinc-900 bg-zinc-100 px-1.5 py-0.5 rounded text-sm font-mono"
													{...props}
												>
													{children}
												</code>
											);
										}

										// Block-level code - check if it's actually code or just text
										const match = /language-(\w+)/.exec(className || "");
										const language = match ? match[1] : "";
										const codeString = String(children).replace(/\n$/, "");

										// Only render as CodeBlock if it looks like actual code
										// (has language specified or contains code-like patterns)
										if (language || codeString.match(/[{}();=<>[\]]/)) {
											return (
												<CodeBlock language={language} {...props}>
													{codeString}
												</CodeBlock>
											);
										}

										// If it doesn't look like code, render as regular text
										return (
											<div className="text-zinc-700 mb-4 leading-7 text-base">
												{codeString}
											</div>
										);
									},
									pre: ({ node, children, ...props }) => {
										// Pre tag is handled by CodeBlock component
										return <>{children}</>;
									},
									blockquote: ({ node, ...props }) => (
										<blockquote
											className="border-l-4 border-zinc-300 pl-4 italic text-zinc-600 my-6 text-base"
											{...props}
										/>
									),
									a: ({ node, ...props }) => (
										<a
											className="text-blue-600 hover:text-blue-800 underline"
											target="_blank"
											rel="noopener noreferrer"
											{...props}
										/>
									),
									strong: ({ node, ...props }) => (
										<strong
											className="font-semibold text-zinc-900"
											{...props}
										/>
									),
									em: ({ node, ...props }) => (
										<em className="italic text-zinc-800" {...props} />
									),
									img: ({ node, ...props }) => (
										<img
											className="rounded-xl shadow-lg my-6 w-full h-auto"
											{...props}
										/>
									),
									hr: ({ node, ...props }) => (
										<hr className="border-zinc-200 my-8" {...props} />
									),
								}}
							>
								{markdownContent}
							</ReactMarkdown>
						</div>

						{/* Comments (UI-only) */}
						<details className="mt-12 rounded-2xl border border-zinc-200 bg-white p-5">
							<summary className="cursor-pointer select-none text-sm font-semibold text-zinc-900">
								Comments preview
							</summary>
							<div className="mt-5">
								<BlogCommentsPanel />
							</div>
						</details>

						{/* More blogs */}
						{moreBlogs.length > 0 && (
							<section className="mt-14 pt-10 border-t border-zinc-200">
								<div className="flex items-end justify-between gap-4">
									<div>
										<h2 className="text-2xl font-bold text-zinc-900">
											More blogs
										</h2>
										<p className="text-sm text-zinc-600 mt-1">
											Keep reading similar posts.
										</p>
									</div>
									<Link
										href="/blog"
										className="text-sm font-medium text-zinc-900 hover:text-zinc-600 transition-colors"
									>
										View all
									</Link>
								</div>

								<div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
									{moreBlogs.map((b, idx) => (
										<motion.article
											key={b.id}
											initial={{ opacity: 0, y: 16 }}
											whileInView={{ opacity: 1, y: 0 }}
											viewport={{ once: true, margin: "-80px" }}
											transition={{
												duration: 0.45,
												ease: "easeOut",
												delay: idx * 0.06,
											}}
											className="flex flex-col bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:shadow-md hover:border-zinc-300 transition-all"
										>
											{b.bannerImage && (
												<img
													src={b.bannerImage}
													alt={b.title}
													className="w-full h-40 object-cover"
												/>
											)}
											<div className="p-5 flex-1 flex flex-col">
												<div className="text-xs text-zinc-600">
													{formatDate(b.createdAt)}
													{b.author ? ` • ${b.author}` : ""}
												</div>
												<h3 className="mt-2 text-lg font-bold text-zinc-900 flex-1">
													{b.title || "Untitled"}
												</h3>
												<p className="mt-2 text-sm text-zinc-600 leading-relaxed line-clamp-3">
													{getCardExcerpt(b.content) ||
														"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt."}
												</p>
												<div className="mt-4">
													<Link
														href={
															b.slug ? `/blog/${b.slug}` : `/blog/id/${b.id}`
														}
														className="inline-flex items-center gap-2 text-sm font-medium text-zinc-900 hover:text-zinc-600 transition-colors"
													>
														Read more <ArrowRight className="w-4 h-4" />
													</Link>
												</div>
											</div>
										</motion.article>
									))}
								</div>
							</section>
						)}
					</div>
				</article>

				<BlogCommentsDrawer
					isOpen={isCommentsOpen}
					onClose={() => setIsCommentsOpen(false)}
				/>

				<Footer />
			</div>
		</>
	);
};

export default BlogPostPage;
