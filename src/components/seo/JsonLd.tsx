// src/components/seo/JsonLd.tsx
export function JsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization", // Or "ProfessionalService" or "PhotographyBusiness"
    "name": "Prime Evoke Private Limited",
    "url": "https://primeevokeofficial.com",
    "logo": "https://primeevokeofficial.com/logo.png", // Ensure you have a logo in public folder
    "sameAs": [
      "https://www.facebook.com/your-page",
      "https://www.instagram.com/your-page"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+94-71-123-4567", // Replace with real number
      "contactType": "customer service",
      "areaServed": "LK",
      "availableLanguage": ["en", "si"]
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}