import type { NextConfig } from "next";

const repository = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const owner = process.env.GITHUB_REPOSITORY_OWNER ?? "";
const isUserOrOrgPagesRepo = repository.toLowerCase() === `${owner.toLowerCase()}.github.io`;
const isGithubActionsBuild = process.env.GITHUB_ACTIONS === "true";

const githubPagesBasePath =
  isGithubActionsBuild && repository && !isUserOrOrgPagesRepo ? `/${repository}` : "";

const nextConfig: NextConfig = {
  ...(isGithubActionsBuild
    ? {
        output: "export",
        trailingSlash: true,
      }
    : {}),
  images: {
    unoptimized: true,
  },
  basePath: githubPagesBasePath,
  assetPrefix: githubPagesBasePath || undefined,
};

export default nextConfig;
