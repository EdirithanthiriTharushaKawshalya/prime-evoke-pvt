import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This is the new block you need to add
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lnmozptgjlsyiihnlqxs.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;