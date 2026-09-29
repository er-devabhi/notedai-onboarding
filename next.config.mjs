/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // lib/prisma.ts reads CA certs from certs/ via readFileSync at runtime, which
  // Next's file tracer can't detect on its own — without this the SSR bundle
  // omits certs/ and DB connections to RDS/Supabase hosts fail with ENOENT.
  outputFileTracingIncludes: {
    '/**': ['./certs/**'],
  },
}

export default nextConfig
