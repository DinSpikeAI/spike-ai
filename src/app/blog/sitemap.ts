import { createClient } from "@supabase/supabase-js";
import { getAllPosts } from "@/lib/blog";

const SITE_URL = "https://www.spikeai.studio";

export default async function sitemap() {
  const pages = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily" as const, priority: 1 },
    { url: `${SITE_URL}/blog`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${SITE_URL}/auth`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${SITE_URL}/submit`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${SITE_URL}/creators`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
  ];

  // Add blog posts
  try {
    const posts = await getAllPosts();
    posts.forEach((post) => {
      pages.push({
        url: `${SITE_URL}/blog/${post.slug}`,
        lastModified: new Date(post.date),
        changeFrequency: "monthly" as const,
        priority: 0.8,
      });
    });
  } catch {}

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
