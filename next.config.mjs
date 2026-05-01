/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Remotion bundler/renderer pull native bindings; avoid webpack parsing them for API routes.
    serverComponentsExternalPackages: [
      "@remotion/bundler",
      "@remotion/renderer",
      "@remotion/studio",
      "@remotion/studio-server",
      "@remotion/studio-shared",
      "@remotion/media-utils",
      "remotion",
      "esbuild",
      "@rspack/core",
    ],
  },
};

export default nextConfig;
