"use client";

import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";

export default function PrivacyPolicyPage() {
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
          <span className="text-[15px] font-semibold tracking-wide text-white/50">Privacy Policy</span>
        </div>
      </div>

      <div className="relative z-10 max-w-[720px] mx-auto px-6 py-16 md:py-24">

        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-[10px] font-bold tracking-[0.25em] text-white/30 uppercase mb-6">
            <Lock size={13} />
            Privacy
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-white/20 text-sm">Last updated: April 11, 2026</p>
          <p className="text-white/20 text-sm mt-1">Spike AI, operated by Dean Moshe — spikeai.studio</p>
        </div>

        <div className="pp-content space-y-10">

          <Section title="1. Who We Are">
            <p>Spike AI (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the website spikeai.studio — a streaming platform for AI-generated cinema. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our Platform.</p>
            <p><strong>Operator:</strong> Dean Moshe<br /><strong>Contact:</strong> spikeaistudio@gmail.com<br /><strong>Location:</strong> Israel</p>
          </Section>

          <Section title="2. What Information We Collect">
            <p><strong>2.1 Account Information.</strong> When you create an account, we collect: your email address, display name, and profile picture (if provided). If you sign in with Google, we receive your name, email, and profile photo from Google.</p>
            <p><strong>2.2 Content Information.</strong> When you upload films or apply as a creator, we collect: your name, portfolio links, social media links, AI tools used, and any content you submit.</p>
            <p><strong>2.3 Usage Data.</strong> We automatically collect: pages visited, time spent on the Platform, device type, browser type, IP address, and referral source. This data is collected through cookies and analytics tools.</p>
            <p><strong>2.4 Communication Data.</strong> If you contact us by email, we retain the contents of your messages and our responses.</p>
          </Section>

          <Section title="3. How We Use Your Information">
            <p>We use your information to:</p>
            <p>• Operate, maintain, and improve the Platform</p>
            <p>• Create and manage your account</p>
            <p>• Display your creator profile and content</p>
            <p>• Communicate with you about your account, content, and Platform updates</p>
            <p>• Review content submissions for compliance with our guidelines</p>
            <p>• Respond to your inquiries and support requests</p>
            <p>• Detect and prevent fraud, abuse, and security issues</p>
            <p>• Comply with legal obligations</p>
            <p>We do <strong>not</strong> use your information for targeted advertising or sell it to third parties.</p>
          </Section>

          <Section title="4. Legal Basis for Processing (GDPR)">
            <p>If you are in the European Economic Area (EEA), we process your data based on:</p>
            <p><strong>Consent</strong> — when you create an account, submit content, or subscribe to communications.</p>
            <p><strong>Contract performance</strong> — to provide the services you requested (account, profile, content hosting).</p>
            <p><strong>Legitimate interest</strong> — to improve the Platform, ensure security, and prevent abuse.</p>
            <p><strong>Legal obligation</strong> — when required by law (e.g., responding to court orders).</p>
          </Section>

          <Section title="5. How We Share Your Information">
            <p>We do <strong>not sell</strong> your personal information. Period.</p>
            <p>We may share your information with:</p>
            <p><strong>Service Providers.</strong> Third-party services that help us operate the Platform:</p>
            <p>• <strong>Supabase</strong> — database and authentication (stores your account data)</p>
            <p>• <strong>Vercel</strong> — website hosting</p>
            <p>• <strong>Google</strong> — authentication (Google Sign-In) and analytics</p>
            <p>• <strong>FormSubmit</strong> — creator application form submissions</p>
            <p><strong>Law Enforcement.</strong> When required by law, court order, or governmental authority.</p>
            <p><strong>Business Transfers.</strong> If Spike AI is acquired, merged, or transfers assets, your information may be part of that transaction. We will notify you of any such change.</p>
          </Section>

          <Section title="6. Cookies & Tracking">
            <p><strong>6.1 What We Use.</strong> We use cookies and similar technologies for:</p>
            <p>• <strong>Authentication</strong> — keeping you signed in</p>
            <p>• <strong>Preferences</strong> — remembering your settings</p>
            <p>• <strong>Analytics</strong> — understanding how the Platform is used (aggregate, anonymized)</p>
            <p><strong>6.2 Third-Party Cookies.</strong> Third-party services (such as Google Analytics) may place their own cookies. These are subject to their respective privacy policies.</p>
            <p><strong>6.3 Your Choices.</strong> You can disable cookies in your browser settings. Note that disabling cookies may affect Platform functionality (e.g., you may be signed out).</p>
          </Section>

          <Section title="7. Data Storage & Security">
            <p><strong>7.1 Where.</strong> Your data is stored on servers operated by Supabase (cloud infrastructure) and Vercel. Servers may be located in the United States, Europe, or other regions.</p>
            <p><strong>7.2 Security Measures.</strong> We implement reasonable security measures including: encrypted connections (HTTPS/TLS), secure authentication, access controls, and regular security reviews. We comply with the Israeli Privacy Protection Law (1981) and Amendment 13 regarding data security.</p>
            <p><strong>7.3 No Guarantee.</strong> No system is 100% secure. While we take reasonable precautions, we cannot guarantee absolute security of your data.</p>
            <p><strong>7.4 Breach Notification.</strong> In the event of a data breach that affects your personal information, we will notify you and relevant authorities as required by applicable law (including GDPR Article 33-34 and Israeli data protection regulations).</p>
          </Section>

          <Section title="8. Data Retention">
            <p><strong>Account Data.</strong> We retain your account information for as long as your account is active. If you request deletion, we will delete your data within 30 days, except where retention is required by law.</p>
            <p><strong>Content.</strong> Uploaded content is retained until you request removal or we remove it for policy violations. Promotional materials created before removal may persist (see Terms of Service, Section 5.4).</p>
            <p><strong>Usage Data.</strong> Anonymized, aggregated usage data may be retained indefinitely for analytics purposes.</p>
            <p><strong>Communication Records.</strong> Email correspondence is retained for up to 3 years for legal and support purposes.</p>
          </Section>

          <Section title="9. Your Rights">
            <p>You have the right to:</p>
            <p><strong>Access</strong> — request a copy of the personal data we hold about you.</p>
            <p><strong>Correction</strong> — request correction of inaccurate data.</p>
            <p><strong>Deletion</strong> — request deletion of your personal data (&quot;right to be forgotten&quot;).</p>
            <p><strong>Portability</strong> — request your data in a structured, machine-readable format (GDPR).</p>
            <p><strong>Restrict Processing</strong> — request that we limit how we use your data (GDPR).</p>
            <p><strong>Object</strong> — object to processing based on legitimate interest (GDPR).</p>
            <p><strong>Withdraw Consent</strong> — withdraw consent at any time where processing is based on consent.</p>
            <p><strong>Israeli Residents.</strong> Under the Israeli Privacy Protection Law, you have the right to review personal data held in databases and request corrections.</p>
            <p>To exercise any of these rights, contact us at <strong>spikeaistudio@gmail.com</strong>. We will respond within 30 days.</p>
          </Section>

          <Section title="10. Children's Privacy">
            <p>Spike AI is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you are between 13 and 17, you may only use the Platform with verified parental consent. If we discover that we have collected data from a child under 13, we will delete it immediately. If you believe a child has provided us with personal information, please contact us.</p>
          </Section>

          <Section title="11. International Data Transfers">
            <p>Your data may be transferred to and processed in countries outside your country of residence, including Israel and the United States. These countries may have different data protection laws. By using the Platform, you consent to such transfers. Where required (e.g., GDPR), we ensure appropriate safeguards are in place for international transfers.</p>
          </Section>

          <Section title="12. Email Communications">
            <p><strong>Transactional Emails.</strong> We send essential emails about your account (confirmations, security alerts, Terms updates). These are not marketing and cannot be unsubscribed from.</p>
            <p><strong>Marketing Emails.</strong> We only send marketing emails with your explicit consent, in compliance with the Israeli Communications Law (Section 30A). Every marketing email includes an unsubscribe link. Unsubscribe requests are honored within 5 business days.</p>
          </Section>

          <Section title="13. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. We will notify registered users of material changes via email. The &quot;Last updated&quot; date at the top of this page reflects the most recent revision. Continued use of the Platform after changes constitutes acceptance.</p>
          </Section>

          <Section title="14. Contact Us">
            <p>For privacy-related questions, data requests, or concerns:</p>
            <p className="mt-2">
              <strong>Spike AI</strong><br />
              Operated by Dean Moshe<br />
              Email: spikeaistudio@gmail.com<br />
              Website: spikeai.studio
            </p>
            <p className="mt-4">For copyright and DMCA notices, see our <a href="/terms" className="text-purple-400/60 hover:text-purple-400/80 underline">Terms of Service</a>.</p>
            <p>For content reports, see our <a href="/community-guidelines" className="text-purple-400/60 hover:text-purple-400/80 underline">Community Guidelines</a>.</p>
          </Section>

        </div>

        <div className="mt-20 pt-8 border-t border-white/[0.04] text-center">
          <p className="text-[12px] text-white/10">&copy; {new Date().getFullYear()} Spike AI. All rights reserved.</p>
        </div>
      </div>

      <style jsx>{`
        .pp-content p {
          font-size: 14px;
          line-height: 1.8;
          color: rgba(255,255,255,0.35);
          margin-bottom: 8px;
        }
        .pp-content strong {
          color: rgba(255,255,255,0.6);
        }
        .pp-content a {
          transition: color 0.2s;
        }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[16px] font-bold text-white/70 mb-4 tracking-wide">{title}</h2>
      <div className="pl-0">{children}</div>
    </div>
  );
}
