import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  serverExternalPackages: ["sequelize", "sqlite3"],
};

export default nextConfig;
