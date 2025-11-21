// src/app/robots.ts
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/login'], // Don't let Google index your admin pages
    },
    sitemap: 'https://primeevokeofficial.com/sitemap.xml',
  }
}