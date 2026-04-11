"use client";

import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function TermsPage() {
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
          <span className="text-[15px] font-semibold tracking-wide text-white/50">Terms of Service</span>
        </div>
      </div>

      <div className="relative z-10 max-w-[720px] mx-auto px-6 py-16 md:py-24">

        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-[10px] font-bold tracking-[0.25em] text-white/30 uppercase mb-6">
            <Shield size={13} />
            Legal
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Terms of Service</h1>
          <p className="text-white/20 text-sm">Last updated: April 11, 2026</p>
          <p className="text-white/20 text-sm mt-1">Spike AI — spikeai.studio</p>
        </div>

        <div className="terms-content space-y-10">

          <Section title="1. Acceptance of Terms">
            <p>By accessing or using spikeai.studio (&quot;the Platform&quot;), operated by Spike AI (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, do not use the Platform. We reserve the right to update these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the updated Terms.</p>
          </Section>

          <Section title="2. Platform Description">
            <p>Spike AI is a streaming platform for AI-generated cinema. The Platform allows creators to showcase films made with artificial intelligence tools and allows viewers to discover and watch such content. The Platform is currently in an early development stage, and features, availability, and functionality may change without prior notice.</p>
          </Section>

          <Section title="3. Eligibility & Age Restriction">
            <p><strong>3.1 Minimum Age.</strong> You must be at least 18 years of age to create an account, upload content, or participate in the Pioneer Creator program. Users between the ages of 13 and 17 may only use the Platform with verified parental or legal guardian consent.</p>
            <p><strong>3.2 Compliance.</strong> By using the Platform, you represent that you meet the age requirements set forth above. We reserve the right to request proof of age at any time and to terminate accounts that do not comply with this requirement.</p>
            <p><strong>3.3 Child Safety.</strong> We comply with applicable child protection laws, including the Children&apos;s Online Privacy Protection Act (COPPA) and equivalent regulations. We do not knowingly collect personal information from children under 13. If we discover that a child under 13 has provided personal information, we will delete it immediately.</p>
          </Section>

          <Section title="4. User Accounts">
            <p>You may be required to create an account to access certain features. You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate and current information. We reserve the right to suspend or terminate accounts that violate these Terms or that we reasonably believe are being used for unauthorized purposes.</p>
          </Section>

          <Section title="5. Content Ownership & Licensing">
            <p><strong>5.1 Your Content.</strong> You retain full ownership of all intellectual property rights in any content you upload, submit, or display on the Platform (&quot;Your Content&quot;). Spike AI does not claim ownership of Your Content.</p>
            <p><strong>5.2 License Grant.</strong> By uploading or submitting content to the Platform, you grant Spike AI a non-exclusive, worldwide, royalty-free, revocable license to: (a) host, display, stream, and distribute Your Content on the Platform; (b) create clips, excerpts, thumbnails, and edited versions of Your Content for promotional purposes, including but not limited to trailers, social media posts, advertisements, newsletters, and partner showcases; (c) sublicense these rights to third-party service providers solely for the purpose of operating the Platform. This license exists solely for the purpose of operating and promoting the Platform and Spike AI.</p>
            <p><strong>5.3 Promotional Use.</strong> You expressly agree that Spike AI may use, edit, crop, remix, and incorporate portions of Your Content into promotional materials for the Platform without additional compensation or approval. Such promotional use will include reasonable attribution to you as the creator where practical.</p>
            <p><strong>5.4 Revocation.</strong> You may request removal of Your Content from the Platform at any time by contacting us. We will remove the content within a reasonable timeframe. Note that promotional materials created prior to your removal request may continue to exist in already-published form.</p>
            <p><strong>5.5 Representations.</strong> You represent and warrant that: (a) you own or have the necessary rights, licenses, and permissions to submit Your Content; (b) Your Content does not infringe, misappropriate, or violate any third party&apos;s intellectual property, privacy, or other rights; (c) you have obtained all necessary consents from any individuals appearing in Your Content; (d) Your Content does not contain unlicensed music, images, or other copyrighted material belonging to third parties.</p>
            <p><strong>5.6 AI-Generated Content.</strong> You acknowledge that the legal status of AI-generated content may vary by jurisdiction. You are solely responsible for ensuring that Your Content complies with all applicable laws and regulations in your jurisdiction, including any requirements related to disclosure of AI generation.</p>
          </Section>

          <Section title="6. Content Authenticity & Integrity">
            <p><strong>6.1 Accurate Representation.</strong> You agree to accurately represent the nature and origin of Your Content. You must not: (a) label non-AI content as AI-generated; (b) label AI-generated content as traditionally filmed when it is not; (c) misrepresent which AI tools were used in creation.</p>
            <p><strong>6.2 Tool Attribution.</strong> You agree to make reasonable efforts to accurately tag and attribute the AI tools used in the creation of Your Content (such as &quot;Made with&quot; tags). Deliberately false tool attribution undermines Platform integrity and may result in content removal or account suspension.</p>
            <p><strong>6.3 Deepfakes & Misleading Content.</strong> You must not upload content that: (a) creates realistic but false depictions of real, identifiable individuals (including public figures, politicians, and private persons) without their explicit consent; (b) is designed to deceive viewers into believing fabricated events actually occurred; (c) constitutes non-consensual intimate imagery of any person, whether real or AI-generated; (d) could reasonably be used for fraud, defamation, or political manipulation.</p>
            <p><strong>6.4 Consequences.</strong> Violation of this section may result in immediate content removal, account suspension, permanent ban, and/or referral to appropriate legal authorities.</p>
          </Section>

          <Section title="7. Copyright Infringement & DMCA Takedown">
            <p><strong>7.1 Respect for Copyright.</strong> Spike AI respects the intellectual property rights of others and expects users to do the same. We will respond to notices of alleged copyright infringement that comply with applicable law.</p>
            <p><strong>7.2 Reporting Infringement.</strong> If you believe that content on the Platform infringes your copyright, you may submit a takedown notice to spikeaistudio@gmail.com containing: (a) identification of the copyrighted work claimed to be infringed; (b) identification of the material to be removed, with sufficient information to locate it; (c) your contact information; (d) a statement that you have a good faith belief that the use is unauthorized; (e) a statement, under penalty of perjury, that the information is accurate and that you are authorized to act on behalf of the copyright owner; (f) your physical or electronic signature.</p>
            <p><strong>7.3 Takedown Actions.</strong> Upon receipt of a valid takedown notice, Spike AI will: (a) promptly remove or disable access to the allegedly infringing content; (b) notify the user who uploaded the content; (c) provide the uploader an opportunity to submit a counter-notice if they believe the removal was in error.</p>
            <p><strong>7.4 Repeat Infringers.</strong> Spike AI will terminate the accounts of users who are determined to be repeat infringers in appropriate circumstances.</p>
            <p><strong>7.5 Safe Harbor.</strong> Spike AI acts as a service provider and hosts user-generated content. We do not pre-screen all content for copyright compliance. Our compliance with this takedown procedure is intended to maintain our eligibility for safe harbor protections under applicable law.</p>
          </Section>

          <Section title="8. Pioneer Creator Program">
            <p><strong>8.1 Nature of Program.</strong> The Pioneer Creator program is a voluntary, non-exclusive recognition program for early creators on the Platform. Participation in the program does NOT constitute: (a) an employment or contractor relationship; (b) a partnership, joint venture, or agency relationship; (c) any form of equity, ownership interest, or profit-sharing arrangement in Spike AI; (d) a guarantee of compensation, payment, or financial benefit of any kind.</p>
            <p><strong>8.2 Program Benefits.</strong> Benefits described in connection with the Pioneer Creator program (such as profile pages, badges, and features) are provided at our sole discretion and may be modified, suspended, or discontinued at any time without notice or liability.</p>
            <p><strong>8.3 Future Monetization.</strong> Any future monetization features, revenue-sharing programs, or compensation arrangements, if introduced, will be governed by separate agreements and are not guaranteed by participation in the Pioneer Creator program or any current communications.</p>
          </Section>

          <Section title="9. Acceptable Use">
            <p>You agree not to: (a) upload content that is illegal, harmful, threatening, abusive, defamatory, obscene, or otherwise objectionable; (b) upload content depicting minors in any harmful or exploitative manner; (c) infringe upon the intellectual property rights of others; (d) attempt to gain unauthorized access to the Platform or its systems; (e) use the Platform for any unlawful purpose; (f) impersonate any person or entity; (g) upload malware, viruses, or other harmful code; (h) scrape, crawl, or use automated means to access the Platform without permission; (i) use the Platform to distribute spam, phishing content, or unsolicited commercial communications.</p>
          </Section>

          <Section title="10. Video Hosting & Third-Party Services">
            <p>The Platform may embed or link to video content hosted on third-party services such as YouTube and Vimeo. Such content is subject to the terms of service of those respective platforms. Spike AI is not responsible for the availability, accuracy, or content of third-party services. Embedding of third-party content does not imply endorsement by, or affiliation with, those services.</p>
          </Section>

          <Section title="11. Tool Partnerships & Attribution">
            <p>The Platform may feature attribution, badges, or showcases related to AI tools and tool companies. Such features are provided for informational and promotional purposes. References to tool partnerships or collaborations do not constitute endorsement by the tool companies unless explicitly stated. Partnership terms and features are subject to change.</p>
          </Section>

          <Section title="12. Disclaimer of Warranties">
            <p>THE PLATFORM IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS. WE DO NOT WARRANT THAT THE PLATFORM WILL MEET YOUR EXPECTATIONS OR REQUIREMENTS.</p>
          </Section>

          <Section title="13. Limitation of Liability">
            <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, SPIKE AI, ITS FOUNDERS, EMPLOYEES, AGENTS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF OR INABILITY TO USE THE PLATFORM, REGARDLESS OF THE THEORY OF LIABILITY. OUR TOTAL AGGREGATE LIABILITY SHALL NOT EXCEED THE AMOUNT YOU HAVE PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR ONE HUNDRED US DOLLARS ($100), WHICHEVER IS LESS.</p>
          </Section>

          <Section title="14. Indemnification">
            <p>You agree to defend, indemnify, and hold harmless Spike AI, its founders, employees, and agents from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys&apos; fees) arising out of or related to: (a) Your Content; (b) your use of the Platform; (c) your violation of these Terms; (d) your violation of any rights of a third party; (e) any claim that Your Content caused damage to a third party.</p>
          </Section>

          <Section title="15. Termination">
            <p><strong>15.1 By You.</strong> You may stop using the Platform at any time and request deletion of your account and content.</p>
            <p><strong>15.2 By Us.</strong> We reserve the right to suspend, restrict, or terminate your access to the Platform at any time, for any reason, including but not limited to violation of these Terms, at our sole discretion, with or without notice.</p>
            <p><strong>15.3 Effect.</strong> Upon termination, your right to use the Platform ceases immediately. Sections 5, 6, 7, 13, 14, and 17 shall survive termination.</p>
          </Section>

          <Section title="16. Modifications to Platform">
            <p>We reserve the right to modify, suspend, or discontinue any part of the Platform (including any features, content, or services) at any time, temporarily or permanently, with or without notice and without liability to you. We are under no obligation to maintain, support, or update the Platform.</p>
          </Section>

          <Section title="17. Governing Law & Disputes">
            <p>These Terms shall be governed by and construed in accordance with the laws of the State of Israel, without regard to its conflict of law provisions. Any dispute arising out of or relating to these Terms or the Platform shall be resolved exclusively in the competent courts of Tel Aviv-Jaffa, Israel. You consent to the personal jurisdiction of such courts.</p>
          </Section>

          <Section title="18. Confidentiality">
            <p>Any non-public information shared by Spike AI with creators or partners (including but not limited to partnership details, business plans, and financial information) is confidential and may not be disclosed to third parties without our prior written consent.</p>
          </Section>

          <Section title="19. Privacy" id="privacy">
            <p><strong>19.1 Data Collection.</strong> We collect minimal personal information necessary to operate the Platform, including email addresses, profile information, authentication data, and usage analytics.</p>
            <p><strong>19.2 Data Use.</strong> Your information is used solely for: (a) operating and improving the Platform; (b) communicating with you about your account and the Platform; (c) complying with legal obligations.</p>
            <p><strong>19.3 Data Sharing.</strong> We do not sell your personal information to third parties. We may share information with: (a) service providers who assist in operating the Platform (such as Supabase, Vercel, Google); (b) law enforcement when required by law.</p>
            <p><strong>19.4 Data Security.</strong> We implement reasonable security measures to protect your information. However, no method of electronic storage or transmission is 100% secure.</p>
            <p><strong>19.5 Cookies.</strong> The Platform may use cookies and similar technologies for authentication and analytics purposes.</p>
            <p><strong>19.6 Your Rights.</strong> You may request access to, correction of, or deletion of your personal data by contacting us at spikeaistudio@gmail.com.</p>
            <p><strong>19.7 Children.</strong> We do not knowingly collect personal information from children under 13. See Section 3 for age requirements.</p>
          </Section>

          <Section title="20. Miscellaneous">
            <p><strong>20.1 Entire Agreement.</strong> These Terms constitute the entire agreement between you and Spike AI regarding the Platform and supersede all prior agreements and understandings, whether written or oral.</p>
            <p><strong>20.2 Severability.</strong> If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.</p>
            <p><strong>20.3 Waiver.</strong> Our failure to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision.</p>
            <p><strong>20.4 Assignment.</strong> You may not assign or transfer your rights under these Terms. We may assign our rights without restriction.</p>
            <p><strong>20.5 Force Majeure.</strong> Spike AI shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable control, including but not limited to natural disasters, war, terrorism, pandemics, power outages, or internet disruptions.</p>
          </Section>

          <Section title="21. Contact">
            <p>For questions about these Terms, contact us at:</p>
            <p className="mt-2">
              <strong>Spike AI</strong><br />
              Email: spikeaistudio@gmail.com<br />
              Website: spikeai.studio
            </p>
          </Section>

        </div>

        <div className="mt-20 pt-8 border-t border-white/[0.04] text-center">
          <p className="text-[12px] text-white/10">&copy; {new Date().getFullYear()} Spike AI. All rights reserved.</p>
        </div>
      </div>

      <style jsx>{`
        .terms-content p {
          font-size: 14px;
          line-height: 1.8;
          color: rgba(255,255,255,0.35);
          margin-bottom: 8px;
        }
        .terms-content strong {
          color: rgba(255,255,255,0.6);
        }
      `}</style>
    </div>
  );
}

function Section({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <div id={id}>
      <h2 className="text-[16px] font-bold text-white/70 mb-4 tracking-wide">{title}</h2>
      <div className="pl-0">{children}</div>
    </div>
  );
}
