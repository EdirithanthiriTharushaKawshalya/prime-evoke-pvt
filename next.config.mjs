/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        // Your project ID from the URL: https://lnmozptgjlsyiihnlqxs.supabase.co
        hostname: 'lnmozptgjlsyiihnlqxs.supabase.co', 
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;