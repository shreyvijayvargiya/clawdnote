import React from "react";
import Navbar from "../app/components/Navbar";
import Footer from "../app/components/Footer";
import SubscribeCard from "../app/components/SubscribeCard";

const SubscriberPage = () => {
	const avatars = [
		"https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=96&q=60",
		"https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=96&q=60",
		"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=60",
		"https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=96&q=60",
		"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=96&q=60",
		"https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=96&q=60",
	];

	return (
		<div className="min-h-screen flex flex-col">
			<Navbar />
			<main className="flex-1 px-4 sm:px-6 lg:px-8 bg-white">
				<div className="max-w-6xl mx-auto py-16">
					<div className="max-w-xl mx-auto text-center">
						<h1 className="text-3xl sm:text-4xl font-bold text-zinc-900">
							Subscribe to the newsletter
						</h1>
						<p className="mt-3 text-zinc-600">
							Get new posts and product notes delivered to your inbox.
						</p>
					</div>

					<div className="mt-8 flex justify-center">
						<div className="flex items-center gap-2">
							<div className="flex -space-x-2">
								{avatars.slice(0, 6).map((src, idx) => (
									<img
										key={src}
										src={src}
										alt={`Subscriber ${idx + 1}`}
										className="w-9 h-9 rounded-full object-cover ring-2 ring-white"
									/>
								))}
							</div>
							<div className="text-sm text-zinc-700">
								<span className="font-semibold text-zinc-900">2k</span>{" "}
								subscribers have joined
							</div>
						</div>
					</div>

					<div className="mt-6 flex justify-center">
						<div className="w-full max-w-xl">
							<SubscribeCard layout="stacked" />
						</div>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	);
};

export default SubscriberPage;

