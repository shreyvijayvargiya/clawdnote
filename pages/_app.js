import React from "react";
import { useRouter } from "next/router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import "../styles/globals.css";
import { store } from "../lib/store/store";

import { ThemeProvider } from "../lib/context/ThemeContext";

// Create a client
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			staleTime: 5 * 60 * 1000, // 5 minutes
		},
	},
});

const MyApp = ({ Component, pageProps }) => {
	const router = useRouter();
	const isAdminRoute = router.pathname.startsWith("/admin");

	// Only wrap with Redux for app routes (not admin)
	const AppComponent = isAdminRoute ? (
		<Component {...pageProps} />
	) : (
		<Provider store={store}>
			<Component {...pageProps} />
		</Provider>
	);

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider>{AppComponent}</ThemeProvider>
		</QueryClientProvider>
	);
};

export default MyApp;
