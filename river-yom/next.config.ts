import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',          
  images: {
    unoptimized: true,        
  },
  trailingSlash: true,       
  basePath: '/river-yom',  
};

export default nextConfig;
