import { createClient } from "@supabase/supabase-js";

const SITE_URL = "https://spikeai.com";

export default async function sitemap() {
  const pages = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily" as const, priority: 1 },
    { url: `${SITE_URL}/auth`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${SITE_URL}/submit`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
  ];

  // Add all approved movies
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && key) {
    try {
      const supabase = createClient(url, key);
      const { data } = await supabase
        .from("movies")
        .select("id, updated_at")
        .eq("status", "approved");

      if (data) {
        data.forEach((movie) => {
          pages.push({
            url: `${SITE_URL}/movie/${movie.id}`,
            lastModified: new Date(movie.updated_at),
            changeFrequency: "weekly" as const,
            priority: 0.8,
          });
        });
      }
    } catch {}
  }

  return pages;
}
