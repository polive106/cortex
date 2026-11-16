import type { NextConfig } from "next";

// Backstop for E2-US07: images may load only from this app, inline data or blob URLs, and
// Vercel avatars. A prompt-injected image URL in a reply or attachment can't phone home.
const IMG_SRC =
  "img-src 'self' data: blob: https://vercel.com https://*.vercel.com https://*.vercel.sh";

const nextConfig: NextConfig = {
  // Workspace packages ship TypeScript source.
  transpilePackages: ["@cortex/domain"],
  // Citations link to the brain the agent reads (E3-US08): the same settings, built into the
  // client. A repo name and a branch, never a credential.
  env: {
    BRAIN_REPO: process.env.BRAIN_REPO ?? "",
    BRAIN_BRANCH: process.env.BRAIN_BRANCH ?? "",
  },
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "Content-Security-Policy", value: IMG_SRC }] }];
  },
};

export default nextConfig;
