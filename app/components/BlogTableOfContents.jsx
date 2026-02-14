import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

function createSlugger() {
	const counts = new Map();
	const slugify = (value) => {
		const base = String(value || "")
			.trim()
			.toLowerCase()
			.replace(/[`~!@#$%^&*()+=\[\]{};:'",.<>/?\\|]/g, "")
			.replace(/\s+/g, "-")
			.replace(/-+/g, "-")
			.replace(/^-|-$/g, "");

		const safe = base || "section";
		const current = counts.get(safe) || 0;
		counts.set(safe, current + 1);
		return current === 0 ? safe : `${safe}-${current}`;
	};
	return { slugify };
}

function getLevelFromTagName(tagName) {
	const m = /^H([1-6])$/.exec(String(tagName || "").toUpperCase());
	return m ? Number(m[1]) : null;
}

/**
 * Substack/Notion-like fixed Table of Contents:
 * - Collapsed "lines only" rail
 * - Expands on hover to show headings
 * - Click scrolls + updates URL hash
 * - Scrollspy highlights active heading and updates hash (replaceState)
 */
const BlogTableOfContents = ({
	containerSelector = "#blog-content",
	minLevel = 2,
	maxLevel = 4,
	topOffsetPx = 240,
	collapsedWidth = 44,
	expandedWidth = 320,
	title = "CONTENTS",
}) => {
	const [items, setItems] = useState([]);
	const [activeId, setActiveId] = useState("");
	const [isHover, setIsHover] = useState(false);
	const observerRef = useRef(null);
	const lastHashRef = useRef("");


	// Build TOC from rendered headings and ensure each heading has an id.
	useEffect(() => {
		if (typeof window === "undefined") return;

		const container = document.querySelector(containerSelector);
		if (!container) {
			setItems([]);
			return;
		}

		// Important: headings might not have ids; we filter purely by heading tags + text.
		const headingEls = Array.from(
			container.querySelectorAll("h1,h2,h3,h4,h5,h6")
		).filter((el) => {
			const level = getLevelFromTagName(el.tagName);
			const text = (el.textContent || "").trim();
			return !!text && level && level >= minLevel && level <= maxLevel;
		});

		const { slugify } = createSlugger();
		const nextItems = headingEls
			.map((el) => {
				const text = (el.textContent || "").trim();
				if (!text) return null;

				if (!el.id) el.id = slugify(text);
				// Improve anchor scrolling under sticky navbar
				el.style.scrollMarginTop = "96px";

				return {
					id: el.id,
					text,
					level: getLevelFromTagName(el.tagName),
				};
			})
			.filter(Boolean);

		setItems(nextItems);
		// initialize active from URL hash if present
		const hash = window.location.hash?.replace("#", "") || "";
		if (hash) setActiveId(hash);
	}, [containerSelector, minLevel, maxLevel]);

	// Scrollspy (IntersectionObserver) + URL hash update
	useEffect(() => {
		if (typeof window === "undefined") return;
		if (!items.length) return;

		const container = document.querySelector(containerSelector);
		if (!container) return;

		const headingEls = items
			.map((it) => document.getElementById(it.id))
			.filter(Boolean);

		if (observerRef.current) {
			try {
				observerRef.current.disconnect();
			} catch {
				// ignore
			}
		}

		const observer = new IntersectionObserver(
			(entries) => {
				// Pick the most visible intersecting heading
				const visible = entries
					.filter((e) => e.isIntersecting)
					.sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0));

				if (visible.length === 0) return;
				const id = visible[0].target?.id;
				if (!id) return;

				setActiveId((prev) => (prev === id ? prev : id));

				// Replace hash (no history spam) while scrolling
				if (lastHashRef.current !== id) {
					lastHashRef.current = id;
					window.history.replaceState(null, "", `#${id}`);
				}
			},
			{
				root: null,
				// Trigger when heading approaches top portion of the viewport
				rootMargin: "-20% 0px -70% 0px",
				threshold: [0.1, 0.25, 0.5, 0.75, 1],
			}
		);

		headingEls.forEach((el) => observer.observe(el));
		observerRef.current = observer;

		return () => {
			try {
				observer.disconnect();
			} catch {
				// ignore
			}
		};
	}, [items, containerSelector]);

	const handlePick = (id) => {
		if (typeof window === "undefined") return;
		const el = document.getElementById(id);
		if (!el) return;

		window.history.pushState(null, "", `#${id}`);
		setActiveId(id);
		el.scrollIntoView({ behavior: "smooth", block: "start" });
	};

	if (!items.length) return null;

		return (
		<div className={`hidden md:block fixed left-2 z-40 top-[${topOffsetPx}px]`}
    >
			<motion.aside
				onMouseEnter={() => setIsHover(true)}
				onMouseLeave={() => setIsHover(false)}
				animate={{ width: isHover ? expandedWidth : collapsedWidth }}
				transition={{ type: "spring", stiffness: 360, damping: 32 }}
				className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100/50 backdrop-blur min-h-24 max-h-96 overflow-y-auto scrollbar"
			>
				{/* Collapsed rail: simple lines */}
				<div className="absolute inset-y-0 left-0 w-[44px] flex flex-col items-center justify-center gap-1.5 px-2">
					{items.slice(0, 12).map((it, idx) => {
						const isActive = activeId === it.id;
						return (
							<div
								key={`${it.id}:${idx}`}
								className={`h-[2px] rounded-full transition-colors ${
									isActive ? "bg-zinc-400" : "bg-zinc-300"
								}`}
								style={{
									width: isActive ? 22 : 16,
									opacity: it.level === minLevel ? 1 : 0.7,
								}}
							/>
						);
					})}
				</div>

				{/* Expanded content */}
				<AnimatePresence initial={false}>
					{isHover && (
						<motion.div
							key="toc-expanded"
							initial={{ opacity: 0, x: -8 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -8 }}
							transition={{ duration: 0.15, ease: "easeOut" }}
							className="pl-[44px] pr-3 py-3"
						>
							<div className="px-2 pb-2 text-[11px] font-semibold tracking-wider text-zinc-800">
								{title}
							</div>
							<div className="max-h-[60vh] overflow-auto px-1 pb-1">
								{items.map((it) => {
									const isActive = activeId === it.id;
									const indent = Math.max(0, (it.level - minLevel) * 12);
									return (
										<button
											key={it.id}
											onClick={() => handlePick(it.id)}
											className={`w-full text-left rounded-xl px-2 py-1.5 text-sm transition-colors ${
												isActive
													? "bg-white text-zinc-900"
													: "text-zinc-800 hover:text-black hover:bg-white/5"
											}`}
											style={{ paddingLeft: 8 + indent }}
											title={it.text}
										>
											<span className="line-clamp-1">{it.text}</span>
										</button>
									);
								})}
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</motion.aside>
		</div>
	);
};

export default BlogTableOfContents;

