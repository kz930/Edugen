/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["remotion", "@remotion/player", "cytoscape", "react-cytoscapejs"],
  experimental: {
    // Remotion bundler/renderer pull native bindings; avoid webpack parsing them for API routes.
    serverComponentsExternalPackages: [
      "@remotion/bundler",
      "@remotion/renderer",
      "@remotion/studio",
      "@remotion/studio-server",
      "@remotion/studio-shared",
      "@remotion/media-utils",
      "music-metadata",
      // `remotion` must NOT be listed here — it conflicts with `transpilePackages`.
      "esbuild",
      "@rspack/core",
    ],
  },
};

export default nextConfig;
