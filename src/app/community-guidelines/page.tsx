"use client";

import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";

export default function CommunityGuidelinesPage() {
  return (
    <div className="min-h-screen bg-[#060608] text-white relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.6) 0%, transparent 70%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)" }} />
      </div>

      <div className="sticky top-0 z-50 bg-[#060608]/70 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="max-w-[800px] mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/" className="w-9 h-9 rounded-full border border-white/[0.08] flex items-center justify-center text-white/25 hover:text-white transition-all">
            <ArrowLeft size={15} />
          </Link>
          <span className="text-[15px] font-semibold tracking-wide text-white/50">Community Guidelines</span>
        </div>
      </div>

      <div className="relative z-10 max-w-[720px] mx-auto px-6 py-16 md:py-24">

        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-[10px] font-bold tracking-[0.25em] text-white/30 uppercase mb-6">
            <Users size={13} />
            Community
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Community Guidelines</h1>
          <p className="text-white/20 text-sm">Last updated: April 11, 2026</p>
          <p className="text-white/25 text-[15px] mt-6 max-w-lg mx-auto leading-relaxed">
            Spike AI is built for creators who push the boundaries of AI cinema. These guidelines keep the platform safe, honest, and inspiring for everyone.
          </p>
        </div>

        <div className="cg-content space-y-10">

          <Section title="Our Principles" emoji="✦">
            <p>Spike AI exists to celebrate AI-generated cinema as a legitimate art form. We believe in creative freedom, honest attribution, and mutual respect between creators, viewers, and tool makers.</p>
          </Section>

          <Section title="What We Welcome" emoji="✓">
            <p>AI-generated films, shorts, series, trailers, and experimental works across all genres. We celebrate creators who invest real craft into their AI filmmaking process — whether that means 3 hours or 300 hours per project. All levels of experience are welcome.</p>
          </Section>

          <Section title="Content That Is Not Allowed" emoji="✕">
            <p><strong>Harmful or Illegal Content.</strong> Content that promotes violence, terrorism, self-harm, or any illegal activity. Content that exploits or endangers minors in any way.</p>
            <p><strong>Hate Speech & Discrimination.</strong> Content that promotes hatred, discrimination, or violence against individuals or groups based on race, ethnicity, religion, gender, sexual orientation, disability, nationality, or any other protected characteristic.</p>
            <p><strong>Non-Consensual Deepfakes.</strong> Realistic AI-generated depictions of real, identifiable people without their explicit consent. This includes public figures, politicians, and private individuals. Parody and satire that are clearly labeled as such may be permitted at our discretion.</p>
            <p><strong>Misleading Content.</strong> Content designed to deceive viewers into believing fabricated events actually occurred. Content presented as real footage when it is AI-generated, without disclosure.</p>
            <p><strong>Non-Consensual Intimate Content.</strong> Any sexual or intimate imagery of real or AI-generated individuals created without consent.</p>
            <p><strong>Copyright Infringement.</strong> Content that uses copyrighted music, images, footage, or other material without proper licensing or permission. If it is not yours and you do not have a license — do not upload it.</p>
            <p><strong>Spam & Self-Promotion Abuse.</strong> Uploading duplicate content, fake engagement, or using the platform solely for advertising unrelated products or services.</p>
            <p><strong>Impersonation.</strong> Pretending to be another creator, company, or public figure to mislead others.</p>
          </Section>

          <Section title="Honest Attribution" emoji="◈">
            <p><strong>AI Tool Tags.</strong> When you upload a film, tag the AI tools you used honestly (e.g., &quot;Made with Runway&quot;, &quot;Made with Kling&quot;). Deliberately misattributing tools undermines trust in the entire community and may result in content removal.</p>
            <p><strong>Original Work.</strong> Only upload content you created or have full rights to. If you collaborated with others, make sure all parties agree to the upload.</p>
            <p><strong>Credit Where Due.</strong> If your film includes music by a composer, voice acting by another artist, or contributions from collaborators — credit them. Spike AI values the full creative pipeline.</p>
          </Section>

          <Section title="How We Moderate" emoji="⚙">
            <p><strong>Review Process.</strong> All submitted films go through a review before appearing on the platform. We check for compliance with these guidelines, content quality, and accurate attribution.</p>
            <p><strong>Reporting.</strong> If you see content that violates these guidelines, report it to <strong>spikeaistudio@gmail.com</strong> with the film title or URL and a brief description of the issue. We take every report seriously.</p>
            <p><strong>Response Time.</strong> We aim to review reports within 48 hours. Urgent cases (illegal content, CSAM, imminent harm) are prioritized and actioned immediately.</p>
          </Section>

          <Section title="What Happens When You Violate Guidelines" emoji="⚠">
            <p>We believe in proportional enforcement. Depending on the severity and context:</p>
            <p><strong>First Violation (Minor).</strong> Content removal + warning via email. You get a chance to understand the rules and correct course.</p>
            <p><strong>Repeated Violations.</strong> Temporary account suspension (7–30 days) + all flagged content removed.</p>
            <p><strong>Severe Violations.</strong> Immediate permanent ban. This includes: illegal content, CSAM, non-consensual intimate content, and deliberate fraud. We may also report to law enforcement.</p>
            <p><strong>Appeals.</strong> If you believe your content was removed in error, you may appeal by emailing spikeaistudio@gmail.com with &quot;Appeal&quot; in the subject line. We will review your case within 7 business days.</p>
          </Section>

          <Section title="Pioneer Creators" emoji="★">
            <p>Pioneer Creators are held to the same standards as all users — no exceptions. The Pioneer Creator badge is a mark of being early, not a shield from moderation. Violations by Pioneer Creators are treated with the same enforcement process as any other user.</p>
          </Section>

          <Section title="Your Responsibility" emoji="→">
            <p>By uploading content to Spike AI, you agree that:</p>
            <p>• You are the creator or have full rights to the content.</p>
            <p>• You have tagged AI tools accurately.</p>
            <p>• Your content complies with these guidelines and our <a href="/terms" className="text-purple-400/60 hover:text-purple-400/80 underline">Terms of Service</a>.</p>
            <p>• You understand that Spike AI reserves the right to remove content and suspend accounts at its sole discretion.</p>
          </Section>

          <Section title="These Guidelines May Change" emoji="↻">
            <p>As the AI cinema landscape evolves, so will these guidelines. We will notify the community of significant changes. Continued use of the platform after updates constitutes acceptance.</p>
          </Section>

          <Section title="Contact" emoji="✉">
            <p>Questions, reports, or appeals:</p>
            <p className="mt-2">
              <strong>Email:</strong> spikeaistudio@gmail.com<br />
              <strong>Subject for reports:</strong> &quot;Content Report&quot;<br />
              <strong>Subject for appeals:</strong> &quot;Appeal&quot;
            </p>
          </Section>

        </div>

        <div className="mt-20 pt-8 border-t border-white/[0.04] text-center">
          <p className="text-[12px] text-white/10">&copy; {new Date().getFullYear()} Spike AI. All rights reserved.</p>
        </div>
      </div>

      <style jsx>{`
        .cg-content p {
          font-size: 14px;
          line-height: 1.8;
          color: rgba(255,255,255,0.35);
          margin-bottom: 8px;
        }
        .cg-content strong {
          color: rgba(255,255,255,0.6);
        }
        .cg-content a {
          transition: color 0.2s;
        }
      `}</style>
    </div>
  );
}

function Section({ title, children, emoji }: { title: string; children: React.ReactNode; emoji?: string }) {
  return (
    <div>
      <h2 className="text-[16px] font-bold text-white/70 mb-4 tracking-wide flex items-center gap-2.5">
        {emoji && <span className="text-white/20">{emoji}</span>}
        {title}
      </h2>
      <div className="pl-0">{children}</div>
    </div>
  );
}
