"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, Loader2, Check, AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

const AI_TOOLS = [
  "Runway Gen-4", "Kling AI", "Sora", "Pika Labs", "Hailuo", "Midjourney",
  "ElevenLabs", "Seedance", "Veo", "Luma", "Google Gemini", "Other",
];

export default function BecomeCreatorPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyCreator, setAlreadyCreator] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [socialYoutube, setSocialYoutube] = useState("");
  const [sampleWorkUrl, setSampleWorkUrl] = useState("");
  const [country, setCountry] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    async function load() {
      const { data: { session } } = await supabase!.auth.getSession();
      if (!session?.user) { setLoading(false); return; }
      setUser(session.user);
      const { data: profile } = await supabase!.from("profiles").select("*").eq("id", session.user.id).single();
      if (profile) {
        setDisplayName(profile.display_name || session.user.user_metadata?.full_name || "");
        setBio(profile.bio || "");
        setWebsite(profile.website || "");
        setSocialYoutube(profile.social_youtube || "");
        setSampleWorkUrl(profile.sample_work_url || "");
        if (profile.user_type === "creator") setAlreadyCreator(true);
      } else {
        setDisplayName(session.user.user_metadata?.full_name || "");
      }
      setLoading(false);
    }
    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setDisplayName(prev => prev || session.user.user_metadata?.full_name || "");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    if (!supabase) return;
    setGoogleLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/become-creator` },
      });
    } catch {
      setError("Sign in failed.");
      setGoogleLoading(false);
    }
  };

  const toggleTool = (tool: string) => {
    setSelectedTools(prev =>
      prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]
    );
  };

  const handleSubmit = async () => {
    if (!supabase || !user) return;
    if (!displayName.trim()) { setError("Please enter your name."); return; }
    if (!sampleWorkUrl.trim()) { setError("Please add a link to your work."); return; }
    if (selectedTools.length === 0) { setError("Please select at least one AI tool."); return; }
    if (!termsAccepted) { setError("Please accept the Creator Agreement."); return; }
    setSubmitting(true);
    setError(null);
    const { error: e } = await supabase.from("profiles").update({
      display_name: displayName.trim(), bio: bio.trim(), website: website.trim(),
      social_youtube: socialYoutube.trim(), sample_work_url: sampleWorkUrl.trim(),
      creator_request: "pending",
    }).eq("id", user.id);
    if (!e) {
      setSubmitted(true);
      try {
        await fetch("/api/creator-apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: displayName.trim(), email: user.email,
            film_url: sampleWorkUrl.trim(), website: website.trim(),
            social: socialYoutube.trim(), bio: bio.trim(),
            country: country.trim(), ai_tools: selectedTools,
          }),
        });
      } catch {}
    } else { setError("Something went wrong. Please try again."); }
    setSubmitting(false);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 className="w-5 h-5 text-white/10 animate-spin" />
    </div>
  );

  if (alreadyCreator) return (
    <div style={{ minHeight: "100vh", background: "#050505", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
        <Check size={28} style={{ color: "rgba(255,255,255,0.4)" }} />
      </div>
      <h1 style={{ fontSize: 30, fontWeight: 700, color: "white", marginBottom: 12, textAlign: "center" }}>You&apos;re already a creator</h1>
      <p style={{ fontSize: 15, color: "rgba(255,255,255,0.3)", marginBottom: 40 }}>Start uploading your AI films.</p>
      <button onClick={() => router.push("/submit")}
        style={{ padding: "16px 40px", background: "white", color: "black", fontSize: 14, fontWeight: 700, borderRadius: 50, border: "none", cursor: "pointer" }}>
        Submit Film
      </button>
    </div>
  );

  if (submitted) return (
    <div style={{ minHeight: "100vh", background: "#050505", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, fontSize: 24 }}>&#10003;</div>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "white", marginBottom: 16, textAlign: "center" }}>Application Received</h1>
      <p style={{ fontSize: 15, color: "rgba(255,255,255,0.35)", textAlign: "center", maxWidth: 420, lineHeight: 1.6, marginBottom: 12 }}>
        Thanks for applying to Spike AI. We review every application personally and will get back to you within 48 hours.
      </p>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.2)", marginBottom: 40 }}>- Dean Moshe, Founder of Spike AI</p>
      <button onClick={() => router.push("/")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 14, cursor: "pointer" }}>&larr; Back to home</button>
    </div>
  );

  // ─── Inline styles for pixel-perfect control ───
  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "#050505",
    color: "#e5e5e5",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  };

  const innerStyle: React.CSSProperties = {
    maxWidth: 640,
    margin: "0 auto",
    padding: "60px 24px 80px",
  };

  const logoStyle: React.CSSProperties = {
    fontSize: 20,
    fontWeight: 600,
    letterSpacing: "0.18em",
    color: "white",
    textAlign: "center" as const,
    marginBottom: 48,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 36,
    fontWeight: 800,
    letterSpacing: "-0.02em",
    color: "white",
    marginBottom: 14,
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: 15,
    color: "rgba(255,255,255,0.35)",
    fontWeight: 300,
    lineHeight: 1.7,
    marginBottom: 44,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.2em",
    textTransform: "uppercase" as const,
    color: "rgba(255,255,255,0.3)",
    marginBottom: 10,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: "16px 18px",
    color: "white",
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "border-color 0.3s, box-shadow 0.3s",
  };

  const fieldStyle: React.CSSProperties = {
    marginBottom: 28,
  };

  return (
    <div style={containerStyle}>
      <div style={innerStyle}>

        {/* Logo */}
        <div style={logoStyle}>spike AI</div>

        {/* Title */}
        <h1 style={titleStyle}>Join as Creator</h1>
        <p style={subtitleStyle}>
          Spike AI is the home for AI-generated cinema. We give creators a dedicated space to showcase their work, reach new audiences, and get recognized. Free to join, free to upload.
        </p>

        {/* Google Sign In */}
        {!user && (
          <div style={{ marginBottom: 40 }}>
            <button onClick={handleGoogleSignIn} disabled={googleLoading}
              style={{
                width: "100%", padding: "16px 20px", background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, color: "rgba(255,255,255,0.85)",
                fontSize: 15, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center",
                gap: 12, cursor: "pointer", fontFamily: "inherit", transition: "all 0.3s",
              }}>
              {googleLoading ? <Loader2 size={18} className="animate-spin" style={{ color: "rgba(255,255,255,0.4)" }} /> : <><GoogleIcon className="w-5 h-5" /> Sign in with Google to apply</>}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "28px 0" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", textTransform: "uppercase" as const, letterSpacing: "0.15em" }}>fill your details below</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
            </div>
          </div>
        )}

        {/* Signed in badge */}
        {user && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12, marginBottom: 32,
            padding: "14px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(52,211,153,0.6)" }} />
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>{user.user_metadata?.full_name || user.email}</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", marginLeft: "auto" }}>signed in</span>
          </div>
        )}

        {/* ═══ Form Fields ═══ */}

        <div style={fieldStyle}>
          <label style={labelStyle}>Your Name / Studio Name <span style={{ color: "rgba(255,255,255,0.4)" }}>*</span></label>
          <input value={displayName} onChange={(e) => { setDisplayName(e.target.value); setError(null); }}
            placeholder="e.g. Daniel Overton or Ovey Studios" style={inputStyle} />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Your Best AI Film (YouTube or Vimeo link) <span style={{ color: "rgba(255,255,255,0.4)" }}>*</span></label>
          <input value={sampleWorkUrl} onChange={(e) => { setSampleWorkUrl(e.target.value); setError(null); }}
            placeholder="https://youtube.com/watch?v=..." style={inputStyle} />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Website / Portfolio (optional)</label>
          <input value={website} onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://..." style={inputStyle} />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>YouTube Channel or Social Link</label>
          <input value={socialYoutube} onChange={(e) => setSocialYoutube(e.target.value)}
            placeholder="https://youtube.com/@yourchannel" style={inputStyle} />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Tell Us About Your Work</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4}
            placeholder="What kind of AI films do you make? What's your creative vision?"
            style={{ ...inputStyle, minHeight: 100, resize: "vertical" as const }} />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Country</label>
          <input value={country} onChange={(e) => setCountry(e.target.value)}
            placeholder="e.g. United Kingdom" style={inputStyle} />
        </div>

        {/* AI Tools Grid */}
        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>AI Tools You Use <span style={{ color: "rgba(255,255,255,0.4)" }}>*</span></label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 6 }}>
            {AI_TOOLS.map((tool) => (
              <button key={tool} onClick={() => toggleTool(tool)} type="button"
                style={{
                  padding: "12px 12px", borderRadius: 10,
                  border: selectedTools.includes(tool) ? "1px solid rgba(255,255,255,0.35)" : "1px solid rgba(255,255,255,0.08)",
                  background: selectedTools.includes(tool) ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.03)",
                  color: selectedTools.includes(tool) ? "white" : "rgba(255,255,255,0.45)",
                  fontSize: 12, fontWeight: 500, textAlign: "center" as const, cursor: "pointer",
                  fontFamily: "inherit", transition: "all 0.2s",
                }}>
                {tool}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "36px 0" }} />

        {/* Creator Agreement */}
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 14, padding: 24, marginBottom: 28,
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.65)", marginBottom: 14 }}>Creator Agreement</h3>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.7, marginBottom: 8 }}>By submitting this application, you confirm that:</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.7, marginBottom: 8 }}>1. You own or have the rights to all content you upload to Spike AI.</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.7, marginBottom: 8 }}>2. Your films do not contain deepfakes of real people without their consent.</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.7, marginBottom: 8 }}>3. You grant Spike AI a non-exclusive license to display, promote, and distribute your content on the platform and associated marketing channels.</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.7, marginBottom: 8 }}>4. You will tag all AI tools used in the creation of each film.</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.7 }}>5. Spike AI may feature your work in platform showcases, social media, and creator spotlights.</p>
        </div>

        {/* Terms Checkbox */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", marginBottom: 28 }}>
          <input type="checkbox" checked={termsAccepted}
            onChange={(e) => { setTermsAccepted(e.target.checked); setError(null); }}
            style={{ width: 18, height: 18, marginTop: 2, flexShrink: 0, accentColor: "white", cursor: "pointer" }} />
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
            I have read and agree to the Creator Agreement above, the{" "}
            <a href="/terms" target="_blank" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "underline" }}>Terms of Service</a>, and the{" "}
            <a href="/community-guidelines" target="_blank" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "underline" }}>Community Guidelines</a>.
          </span>
        </div>

        {/* Error */}
        {error && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: 16, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.1)", borderRadius: 12, marginBottom: 20 }}>
            <AlertCircle size={15} style={{ color: "rgba(239,68,68,0.6)", flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 13, color: "rgba(239,68,68,0.6)" }}>{error}</p>
          </div>
        )}

        {/* Submit */}
        {user ? (
          <button onClick={handleSubmit} disabled={submitting}
            style={{
              width: "100%", padding: 18, borderRadius: 50, border: "none",
              background: "linear-gradient(180deg, #ffffff 0%, #e8e8eb 100%)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.12), 0 4px 24px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
              color: "black", fontSize: 15, fontWeight: 700, letterSpacing: "0.02em",
              cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.3 : 1,
              fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
            {submitting ? <Loader2 size={18} className="animate-spin" /> : "Submit Application"}
          </button>
        ) : (
          <p style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.2)", padding: "8px 0" }}>
            Sign in with Google above to submit your application.
          </p>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "40px 0 0", borderTop: "1px solid rgba(255,255,255,0.04)", marginTop: 40 }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.15)" }}>&copy; 2026 Spike AI. The home for AI-generated cinema.</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 12 }}>
            <a href="/terms" style={{ fontSize: 11, color: "rgba(255,255,255,0.1)", textDecoration: "none" }}>Terms</a>
            <a href="/privacy" style={{ fontSize: 11, color: "rgba(255,255,255,0.1)", textDecoration: "none" }}>Privacy</a>
            <a href="/community-guidelines" style={{ fontSize: 11, color: "rgba(255,255,255,0.1)", textDecoration: "none" }}>Guidelines</a>
          </div>
        </div>

      </div>
    </div>
  );
}
