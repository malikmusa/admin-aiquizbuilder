// app/sitemap.ts
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aiquizbuilder.com";
  const now = new Date();

  const staticRoutes: Array<[string, number, MetadataRoute.Sitemap[0]["changeFrequency"]]> = [
    ["/",             1.0, "weekly"],
    ["/generate",     0.9, "weekly"],
    ["/about",        0.7, "monthly"],
    ["/contact",      0.7, "monthly"],
    ["/privacy",      0.6, "yearly"],
    ["/cookies",      0.6, "yearly"],
    ["/cookies",      0.6, "yearly"],
    ["/refund",       0.5, "yearly"],
    ["/security",     0.5, "yearly"],
    ["/use-cases",    0.5, "monthly"],
    ["/use-cases/education", 0.7, "monthly"],
    ["/use-cases/training",  0.7, "monthly"],
    ["/use-cases/marketing", 0.7, "monthly"],
  ];

  

  const pages: MetadataRoute.Sitemap = [
    ...staticRoutes?.map(([path, priority, cf]) => ({
      url: `${siteUrl}${path}`,
      lastModified: now,
      changeFrequency: cf,
      priority,
    })),
    // ...quizEntries,
  ];

  return pages;
}
