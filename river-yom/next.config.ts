import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',          
  images: {
    unoptimized: true,        
  },
  trailingSlash: true,       
  basePath: '/river-yom',  // ← ใส่ถ้าจะวางเว็บไว้ใต้ subfolder เช่น http://localhost/river-yom/
};

export default nextConfig;
