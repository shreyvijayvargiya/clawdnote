import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import Navbar from "../app/components/Navbar";
import Footer from "../app/components/Footer";
import { motion } from "framer-motion";
import { Calendar, ArrowRight, Search } from "lucide-react";
import { getAllBlogs } from "../lib/api/blog";

const BlogPage = () => {
	const [searchQuery, setSearchQuery] = useState("");

	const { data: blogs = [], isLoading } = useQuery({
		queryKey: ["blogs"],
		queryFn: () => getAllBlogs("published"),
	});

	const filteredBlogs = blogs.filter((blog) =>
		blog.title?.toLowerCase().includes(searchQuery.toLowerCase())
	);

	

	const formatDate = (date) => {
		if (!date) return "N/A";
		const d = date?.toDate ? date.toDate() : new Date(date);
		return d.toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	return (
		<div className="min-h-screen flex flex-col">
			<Navbar />

			<section className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
				<div className="max-w-6xl mx-auto">
					{/* Header */}
					<div className="text-center mb-12">
						<h1 className="text-4xl font-bold text-zinc-900 mb-4">Blog</h1>
						<p className="text-lg text-zinc-600">
							Latest articles, updates, and insights
						</p>
					</div>

					{/* Tabs + Search (UI-only tabs) */}
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
						<div className="flex justify-start">
							<div className="inline-flex items-center rounded-full bg-white border border-zinc-200 shadow-sm p-1">
								{["All", "Product", "Design", "Startup Growth"].map((t) => (
									<button
										key={t}
										type="button"
										className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
											t === "All"
												? "bg-white text-zinc-900 shadow-sm border border-zinc-200"
												: "text-zinc-700 hover:text-zinc-900"
										}`}
									>
										{t}
									</button>
								))}
							</div>
						</div>

						<div className="flex justify-start sm:justify-end">
							<div className="relative w-full sm:w-fit">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
								<input
									type="text"
									placeholder="Search blog posts..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full sm:w-fit sm:min-w-[250px] pl-10 pr-4 py-2 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-100"
								/>
							</div>
						</div>
					</div>

					{/* Blog List */}
					{isLoading ? (
						<div className="text-center py-12 text-zinc-600">Loading...</div>
					) : filteredBlogs.length === 0 ? (
						<div className="text-center py-12 text-zinc-600">
							{searchQuery
								? "No blog posts found matching your search."
								: "No blog posts yet. Check back soon!"}
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
							{filteredBlogs.map((blog, index) => (
								<motion.article
									key={blog.id}
									initial={{ opacity: 0, y: 20 }}
									whileInView={{ opacity: 1, y: 0 }}
									viewport={{ once: true }}
									transition={{ delay: index * 0.1 }}
									className="flex flex-col p-4 bg-white border border-zinc-200 hover:ring hover:ring-zinc-50 rounded-xl hover:border-zinc-300 hover:shadow-md transition-all"
								>
									{blog.bannerImage && (
										<img
											src={blog.bannerImage}
											alt={blog.title}
											className="w-full h-48 object-cover rounded-xl mb-4"
										/>
									)}
									<div className="flex items-center gap-2 text-xs text-zinc-600 mb-2">
										<Calendar className="w-3 h-3" />
										{formatDate(blog.createdAt)}
										{blog.author && (
											<>
												<span>•</span>
												<span>{blog.author}</span>
											</>
										)}
									</div>
									<h2 className="text-xl font-bold text-zinc-900 flex-1">
										{blog.title}
									</h2>
										<p className="text-zinc-700 mb-4 flex-1">
										Lorem Ipsum is simply dummy text of the printing and typesetting industry.
									</p>
									<Link
										href={blog.slug ? `/blog/${blog.slug}` : `/blog/id/${blog.id}`}
										className="inline-flex items-center gap-2 text-xs mb-3 font-medium text-zinc-100 bg-zinc-800 hover:bg-zinc-900 p-2 rounded hover:shadow-xl w-fit hover:text-white transition-colors mt-auto"
									>
										Read More
										<ArrowRight className="w-4 h-4" />
									</Link>
								</motion.article>
							))}
						</div>
					)}
				</div>
			</section>

			<Footer />
		</div>
	);
};

export default BlogPage;
