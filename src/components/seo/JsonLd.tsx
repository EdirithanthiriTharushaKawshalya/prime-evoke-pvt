// src/components/seo/JsonLd.tsx
export function JsonLd() {
  const baseUrl = "https://primeevokeofficial.com";

  // 1. Organization Schema (Fixes the missing logo in Knowledge Graph)
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Prime Evoke Private Limited",
    "url": baseUrl,
    "logo": `${baseUrl}/icon.png`, // Ensure this path matches your logo file
    "sameAs": [
      "https://www.facebook.com/primeevoke", // Add your actual FB URL
      "https://www.instagram.com/primeevoke", // Add your Instagram
      "https://www.linkedin.com/company/prime-evoke" // Add LinkedIn
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+94-77-716-4600",
      "contactType": "customer service",
      "areaServed": "LK",
      "availableLanguage": ["en", "si"]
    }
  };

  // 2. Site Navigation Schema (Influences Sitelinks)
  // This explicitly lists your 4 main verticals to Google
  const navigationSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": [
      {
        "@type": "SiteNavigationElement",
        "position": 1,
        "name": "Evoke Gallery",
        "description": "Wedding & Portrait Photography",
        "url": `${baseUrl}/evoke-gallery`
      },
      {
        "@type": "SiteNavigationElement",
        "position": 2,
        "name": "Studio Zine",
        "description": "Brand & Commercial Visuals",
        "url": `${baseUrl}/studio-zine`
      },
      {
        "@type": "SiteNavigationElement",
        "position": 3,
        "name": "Evoke Waves",
        "description": "Audio Production House",
        "url": `${baseUrl}/evoke-waves`
      },
      {
        "@type": "SiteNavigationElement",
        "position": 4,
        "name": "Evoke Rental House",
        "description": "Camera & Equipment Rentals",
        "url": `${baseUrl}/rentals`
      }
    ]
  };

  return (
    <>
      {/* Organization Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      {/* Navigation Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(navigationSchema) }}
      />
    </>
  );
}