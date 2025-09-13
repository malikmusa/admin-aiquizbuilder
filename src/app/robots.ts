// app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aiquizbuilder.com";
  const isProd = process.env.VERCEL_ENV === "production" && !siteUrl.includes("vercel.app");

  // In non-prod (Preview/Dev) -> block indexing entirely
  if (!isProd) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
      sitemap: `${siteUrl}/sitemap.xml`,
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Disallow app/private areas & embeds
        disallow: [
          "/api/",
          "/dashboard",
          "/profile",
          "/settings",
          "/billing",
          "/login",
          "/signup",
          "/quizzes",      // user’s private list
          "/quiz/",        // quiz detail pages (omit this if you WANT quiz pages indexed)
          "/embed",        // embedded widgets
          "/*?*",          // (optional) block faceted duplicates with querystrings
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
