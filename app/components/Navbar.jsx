import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
	{ href: "/", label: "Home" },
	{ href: "/blog", label: "Blog" },
	{ href: "/subscribe", label: "Subscribe" },
	{ href: "/admin", label: "Admin" },
];

const Navbar = () => {
	const router = useRouter();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	const isActive = (href) => {
		if (href === "/") return router.pathname === "/";
		if (href.startsWith("/#")) return router.asPath === href;
		return router.pathname.startsWith(href);
	};

	return (
		<nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-zinc-200">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					<Link href="/" className="flex items-center">
						<span className="text-lg font-semibold text-zinc-900">
							YourBlog
						</span>
					</Link>

					<div className="hidden md:flex items-center gap-6">
						{NAV_LINKS.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								className={`text-sm font-medium transition-colors ${
									isActive(link.href)
										? "text-zinc-900"
										: "text-zinc-600 hover:text-zinc-900"
								}`}
							>
								{link.label}
							</Link>
						))}
					</div>

					<button
						onClick={() => setIsMobileMenuOpen((v) => !v)}
						className="md:hidden p-2 text-zinc-600 hover:text-zinc-900 transition-colors"
						aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
					>
						{isMobileMenuOpen ? (
							<X className="w-6 h-6" />
						) : (
							<Menu className="w-6 h-6" />
						)}
					</button>
				</div>

				{isMobileMenuOpen && (
					<div className="md:hidden border-t border-zinc-200 py-4">
						<div className="flex flex-col gap-3">
							{NAV_LINKS.map((link) => (
								<Link
									key={link.href}
									href={link.href}
									onClick={() => setIsMobileMenuOpen(false)}
									className={`text-sm font-medium transition-colors ${
										isActive(link.href)
											? "text-zinc-900"
											: "text-zinc-600 hover:text-zinc-900"
									}`}
								>
									{link.label}
								</Link>
							))}
						</div>
					</div>
				)}
			</div>
		</nav>
	);
};

export default Navbar;

