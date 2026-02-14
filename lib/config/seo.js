/**
 * Centralized SEO Configuration
 *
 * Add or modify routes here to automatically set SEO tags.
 * Routes are matched in order - more specific routes should come first.
 *
 * Supported patterns:
 * - Exact match: "/pricing" matches only /pricing
 * - Nested routes: "/blog/*" matches /blog, /blog/[slug], /blog/id/[id], etc.
 * - Wildcard: "*" matches all routes (use as fallback)
 *
 * @example
 * {
 *   path: "/pricing",
 *   title: "Pricing - My SaaS",
 *   description: "Choose the perfect plan for your needs",
 *   keywords: "pricing, plans, subscription",
 *   ogImage: "/og-pricing.png"
 * }
 */

export const SEO_CONFIG = {
	// Homepage
	"/": {
		title: "YourBlog - Blog Website Builder Kit",
		description:
			"Launch a beautiful blog website with a CMS, newsletter subscribers, and analytics. Built with Next.js and Firebase.",
		keywords: "blog, blog cms, newsletter, nextjs blog, firebase blog",
		ogImage: "/og-blog.png",
		ogType: "website",
	},

	// Blog routes (nested)
	"/blog/*": {
		title: "Blog - YourBlog",
		description:
			"Read our latest blog posts, tutorials, and updates.",
		keywords: "blog, articles, tutorials, newsletter",
		ogImage: "/og-blog.png",
		ogType: "article",
	},

	// 404 Error Page
	"/404": {
		title: "404 - Page Not Found - YourBlog",
		description: "The page you are looking for does not exist.",
		keywords: "404, page not found, error",
		ogImage: "/og-default.png",
		ogType: "website",
		noindex: true, // Hide 404 pages from search engines
	},

	// Admin routes (nested)
	"/admin/*": {
		title: "Admin Dashboard - YourBlog",
		description: "Admin dashboard for managing your blog content.",
		keywords: "admin, blog cms, dashboard",
		ogImage: "/og-admin.png",
		ogType: "website",
		noindex: true, // Hide admin routes from search engines
	},

	// Default/fallback for all other routes
	"*": {
		title: "YourBlog - Blog Website Builder Kit",
		description:
			"Launch a blog website with a CMS, newsletter subscribers, and analytics.",
		keywords: "blog, cms, newsletter, nextjs, firebase",
		ogImage: "/og-default.png",
		ogType: "website",
	},
};

/**
 * Get SEO config for a specific path
 * @param {string} pathname - The current pathname
 * @returns {object} SEO configuration object
 */
export const getSEOConfig = (pathname) => {
	// Try exact match first
	if (SEO_CONFIG[pathname]) {
		return SEO_CONFIG[pathname];
	}

	// Try nested route patterns (e.g., "/blog/*")
	for (const [pattern, config] of Object.entries(SEO_CONFIG)) {
		if (pattern.includes("*")) {
			const basePath = pattern.replace("/*", "");
			if (pathname.startsWith(basePath)) {
				return config;
			}
		}
	}

	// Fallback to wildcard
	return SEO_CONFIG["*"] || {};
};

/**
 * Get canonical URL for a path
 * @param {string} pathname - The current pathname
 * @param {string} baseUrl - Base URL of the site (optional)
 * @returns {string} Canonical URL
 */
export const getCanonicalUrl = (pathname, baseUrl = "") => {
	if (!baseUrl) {
		// Try to get from environment or use current origin
		if (typeof window !== "undefined") {
			baseUrl = window.location.origin;
		} else {
			baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
		}
	}
	return `${baseUrl}${pathname}`;
};
