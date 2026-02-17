import type { NextConfig } from "next";

const repository = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const owner = process.env.GITHUB_REPOSITORY_OWNER ?? "";
const isUserOrOrgPagesRepo = repository.toLowerCase() === `${owner.toLowerCase()}.github.io`;

const githubPagesBasePath =
  process.env.GITHUB_ACTIONS === "true" && repository && !isUserOrOrgPagesRepo ? `/${repository}` : "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: githubPagesBasePath,
  assetPrefix: githubPagesBasePath || undefined,
};

export default nextConfig;
