import { createClient, SupabaseClient } from "@supabase/supabase-js";

/* ═══════════════════════════════════════════════════════════════
   SHARED SUPABASE CLIENT
   ═══════════════════════════════════════════════════════════════ */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;


/* ═══════════════════════════════════════════════════════════════
   ADMIN AUTH — Role-based via profiles table
   ═══════════════════════════════════════════════════════════════
   Priority:
     1. Logged-in user with role='admin' in profiles → true
     2. URL key fallback (?admin=...) → true (for initial setup only)
     3. Otherwise → false
   ═══════════════════════════════════════════════════════════════ */

export async function checkIsAdmin(urlKey?: string | null): Promise<{
  isAdmin: boolean;
  user: any | null;
  method: "auth" | "key" | "none";
}> {
  if (!supabase) return { isAdmin: false, user: null, method: "none" };

  // 1. Check if user is logged in
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user) {
    // 2. Check role in profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profile?.role === "admin") {
      return { isAdmin: true, user: session.user, method: "auth" };
    }
  }

  // URL key fallback removed for security

  return { isAdmin: false, user: session?.user || null, method: "none" };
}

/* ═══════════════════════════════════════════════════════════════
   YOUTUBE THUMBNAIL SYSTEM
   ═══════════════════════════════════════════════════════════════ */

export function getYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      return u.searchParams.get("v")
        || u.pathname.split("/embed/")[1]?.split("?")[0]
        || u.pathname.split("/shorts/")[1]?.split("?")[0]
        || null;
    }
    if (u.hostname === "youtu.be") {
      return u.pathname.slice(1).split("?")[0] || null;
    }
  } catch {}
  return null;
}

export function getVimeoId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("vimeo.com")) {
      return u.pathname.split("/").pop()?.split("?")[0] || null;
    }
  } catch {}
  return null;
}

export function getYouTubeThumbnail(url: string | null | undefined): string | null {
  const id = getYouTubeId(url);
  if (!id) return null;
  return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
}

export function getVimeoThumbnail(url: string | null | undefined): string | null {
  const id = getVimeoId(url);
  if (!id) return null;
  return `https://vumbnail.com/${id}_large.jpg`;
}

export function getVideoThumbnail(url: string | null | undefined): string | null {
  return getYouTubeThumbnail(url) || getVimeoThumbnail(url);
}

export function getSmartPoster(
  posterUrl: string | null | undefined,
  videoUrl: string | null | undefined,
  fallbackId?: string
): string {
  if (posterUrl && !posterUrl.includes("picsum.photos")) return posterUrl;
  const thumb = getVideoThumbnail(videoUrl);
  if (thumb) return thumb;
  if (posterUrl) return posterUrl;
  return `https://picsum.photos/seed/${fallbackId || "default"}/400/600`;
}

export function getSmartHeroImage(
  heroImage: string | null | undefined,
  videoUrl: string | null | undefined,
  posterUrl: string | null | undefined,
  fallbackId?: string
): string {
  if (heroImage && !heroImage.includes("picsum.photos")) return heroImage;
  const thumb = getVideoThumbnail(videoUrl);
  if (thumb) return thumb;
  if (heroImage) return heroImage;
  if (posterUrl) return posterUrl;
  return `https://picsum.photos/seed/${fallbackId || "default"}-wide/1920/1080`;
}
