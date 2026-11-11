import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/about"],
      disallow: ["/api/", "/admin", "/account", "/dashboard", "/auth"],
    },
    sitemap: "https://or-path.vercel.app/sitemap.xml",
  };
}
