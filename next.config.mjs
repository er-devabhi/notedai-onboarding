/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    rules:
      process.env.NODE_ENV === 'development'
        ? {
            '**/*.{tsx,jsx}': {
              loaders: [
                {
                  loader: '@locator/webpack-loader',
                  options: { env: 'development' },
                },
              ],
            },
          }
        : {},
  },
}

export default nextConfig
