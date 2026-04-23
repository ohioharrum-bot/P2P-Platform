/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'rvgfbbjclpaznfkfvcdl.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'boutiquederoyal.com',
      },
      {
        protocol: 'https',
        hostname: 'www.boutiquederoyal.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      },
      {
        protocol: 'https',
        hostname: 'khayest.pk',
      },
      {
        protocol: 'https',
        hostname: 'essensa.ee',
      },
      {
        protocol: 'https',
        hostname: 'www.essensa.ee',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'static.sweetcare.com',
      },
      {
        protocol: 'https',
        hostname: 'fandi-perfume.com',
      },
      {
        protocol: 'https',
        hostname: 'creedboutique.com',
      },
      {
        protocol: 'https',
        hostname: 'fragrancerevolutionboutique.co.uk',
      },
    ],
  },
}

module.exports = nextConfig