import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: `${SITE_URL}/`,
      lastModified,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/events`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];
}

