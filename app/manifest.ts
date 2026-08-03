import { MetadataRoute } from 'next'
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NovoBlink — Your Tech Store',
    short_name: 'NovoBlink',
    description: 'Bangladesh\'s premier online gadget store — smartphones, laptops, audio, and accessories.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAFAF8',
    theme_color: '#1a1a1a',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
