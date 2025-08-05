/** @type {import('next').NextConfig} */
const nextConfig = {
  // تحسين للإنتاج
  swcMinify: true,
  
  // تحسين الصور
  images: {
    unoptimized: true
  },
  
  // تحسين PWA
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ]
  },
  
  // تحسين الأداء
  experimental: {
    optimizeCss: true,
  },
  
  // ضغط الملفات
  compress: true,
  
  // تحسين الخطوط
  optimizeFonts: true,
}

module.exports = nextConfig
