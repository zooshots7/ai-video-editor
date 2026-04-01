import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactStrictMode: false,
	serverExternalPackages: [],
	experimental: {
		serverActions: {
			bodySizeLimit: "100mb",
		},
	},
};

export default nextConfig;
