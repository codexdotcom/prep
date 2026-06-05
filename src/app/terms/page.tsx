import { Logo } from "@/components/ui/logo";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div style={{ background: "var(--color-surface)", minHeight: "100vh" }}>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Link href="/" className="inline-block mb-8">
          <Logo />
        </Link>

        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "2rem",
            color: "var(--color-text-primary)",
            marginBottom: "0.5rem",
          }}
        >
          Terms of Service
        </h1>

        <p className="text-sm mb-8" style={{ color: "var(--color-text-muted)" }}>
          Effective Date: January 1, 2025 | Last Updated: June 1, 2025
        </p>

        <div
          className="space-y-8 text-sm leading-[1.8]"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {/* 1 */}
          <section>
            <h2 className="mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
              1. Acceptance of Terms
            </h2>
            <p>
              These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;User,&quot; &quot;you,&quot; or &quot;your&quot;) and JambOS (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) governing your access to and use of the JambOS platform, including the website at jambos.ng, the Progressive Web App, the WhatsApp bot, all associated APIs, and any related services (collectively, the &quot;Service&quot;).
            </p>
            <p className="mt-3">
              By creating an account, accessing, or using the Service in any manner, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy, which is incorporated herein by reference. If you do not agree to these Terms, you must immediately cease all use of the Service. Your continued use of the Service following the posting of any changes to these Terms constitutes acceptance of those changes.
            </p>
            <p className="mt-3">
              If you are under 18 years of age, you represent that your parent or legal guardian has reviewed and agrees to these Terms on your behalf. The parent or guardian assumes full responsibility for the minor&apos;s compliance with these Terms and for any activities conducted under the minor&apos;s account.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
              2. Description of Service
            </h2>
            <p>
              JambOS is an AI-powered educational technology platform designed to assist students preparing for the Joint Admissions and Matriculation Board (JAMB) Unified Tertiary Matriculation Examination (UTME) in Nigeria. The Service provides, among other features: a computer-based test (CBT) simulator with past examination questions; an AI-powered adaptive learning engine that personalizes question difficulty and study plans; an AI tutor capable of answering academic questions and providing step-by-step explanations; performance analytics including predicted JAMB scores, accuracy tracking, and weakness identification; a microlearning content feed with study tips, mnemonics, and exam strategies; university admission probability calculations (Reality Mode); national, state, school, and subject-based student rankings; a gamification system including XP, levels, achievements, daily missions, and leaderboards; a daily challenge feature with competitive scoring; a referral program; subscription-based premium features; and a WhatsApp bot interface.
            </p>
            <p className="mt-3">
              The Service is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time, with or without notice, and without liability to you.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
              3. Account Registration and Security
            </h2>
            <p>
              To access certain features of the Service, you must create an account by providing accurate, current, and complete information. You may register using your email address and a password, or by authenticating through Google OAuth. You are solely responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to immediately notify us of any unauthorized use of your account or any other breach of security.
            </p>
            <p className="mt-3">
              You may not create multiple accounts for the same individual, create accounts using false or misleading information, share your account credentials with any third party, use another person&apos;s account without their express permission, or transfer or sell your account to any other person or entity. We reserve the right to suspend or terminate any account that we believe, in our sole discretion, violates these Terms or is being used fraudulently.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
              4. Subscription Plans and Payment
            </h2>
            <p>
              The Service offers both free and paid subscription tiers. The free tier provides limited access to questions, basic CBT simulation, and limited analytics. Paid subscription tiers (Starter, Pro, and Elite) provide additional features as described on our pricing page. Subscription prices are denominated in Nigerian Naira (NGN) and are subject to change with 30 days&apos; advance notice to existing subscribers.
            </p>
            <p className="mt-3">
              All payments are processed through Paystack, a third-party payment processor. By subscribing to a paid plan, you authorize us to charge the applicable subscription fee to your selected payment method on a recurring monthly basis until you cancel. You are responsible for providing accurate and current payment information.
            </p>
            <p className="mt-3">
              Subscriptions automatically renew at the end of each billing period unless cancelled before the renewal date. You may cancel your subscription at any time through your account settings. Cancellation takes effect at the end of the current billing period, and you will retain access to paid features until that date. We do not provide partial refunds for unused portions of a subscription period.
            </p>
            <p className="mt-3">
              We reserve the right to offer promotional pricing, discounts, free trials, or referral rewards at our discretion. Such offers are subject to their own specific terms and may be modified or withdrawn at any time. Free premium access earned through the referral program is subject to the referral program terms and may be revoked if referrals are determined to be fraudulent.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
              5. Acceptable Use
            </h2>
            <p>
              You agree to use the Service only for lawful purposes and in accordance with these Terms. You expressly agree not to: use the Service to cheat on any actual JAMB examination or any other official examination; share, distribute, reproduce, or commercially exploit any questions, answers, explanations, or other content from the Platform without our prior written consent; use automated scripts, bots, scrapers, or other automated means to access the Service, extract data, or submit responses; attempt to gain unauthorized access to any portion of the Service, other accounts, computer systems, or networks connected to the Service; interfere with or disrupt the Service or servers or networks connected to the Service; impersonate any person or entity or falsely state or misrepresent your affiliation with any person or entity; upload or transmit viruses, malware, or any other malicious code; use the Service to harass, bully, threaten, or intimidate other users; manipulate rankings, leaderboards, scores, or any gamification features through fraudulent means including but not limited to creating multiple accounts, using automated answering tools, or colluding with other users; circumvent, disable, or interfere with any security features of the Service or features that prevent or restrict use or copying of content; reverse engineer, decompile, disassemble, or attempt to derive the source code of any portion of the Service; or use the AI tutor to generate content for purposes unrelated to JAMB preparation or in violation of any applicable law.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
              6. Intellectual Property Rights
            </h2>
            <p>
              All content, features, and functionality of the Service, including but not limited to text, graphics, logos, icons, images, audio clips, software, and the compilation thereof, are the exclusive property of JambOS or its licensors and are protected by Nigerian and international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
            </p>
            <p className="mt-3">
              The questions in our question bank may include questions sourced from publicly available past JAMB examination papers, original questions created by our team, and AI-generated questions. While past JAMB questions are in the public domain, our specific compilation, organization, explanations, analytics, and presentation of such questions constitute our proprietary content.
            </p>
            <p className="mt-3">
              You are granted a limited, non-exclusive, non-transferable, revocable license to access and use the Service for your personal, non-commercial educational purposes. This license does not include the right to modify, reproduce, distribute, create derivative works from, publicly display, publicly perform, republish, download, store, or transmit any content from the Service except as incidental to normal use of the Service (such as browser caching) or as expressly permitted by us in writing.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
              7. AI-Generated Content Disclaimer
            </h2>
            <p>
              The Service utilizes artificial intelligence, including large language models provided by third-party providers, to generate explanations, study plans, recommendations, score predictions, and other content. While we strive for accuracy, AI-generated content may occasionally contain errors, inaccuracies, or omissions. You acknowledge and agree that AI-generated content is provided for educational guidance purposes only and should not be relied upon as the sole source of information for examination preparation.
            </p>
            <p className="mt-3">
              Predicted JAMB scores, admission probabilities, and performance analytics are statistical estimates based on available data and algorithmic models. These predictions are not guarantees of actual examination performance or university admission outcomes. Actual JAMB scores may differ significantly from predictions. University admission decisions depend on numerous factors beyond JAMB scores, including post-UTME performance, catchment area, and institutional policies, which are outside the scope of our predictions. We expressly disclaim any liability for decisions made in reliance on AI-generated predictions or recommendations.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
              8. User-Generated Content
            </h2>
            <p>
              Certain features of the Service may allow you to submit content, including but not limited to questions submitted to the AI tutor, flagged question reports, and profile information (collectively, &quot;User Content&quot;). You retain ownership of any intellectual property rights you hold in your User Content. By submitting User Content, you grant us a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to use, reproduce, modify, distribute, and display your User Content in connection with operating, improving, and promoting the Service.
            </p>
            <p className="mt-3">
              You represent and warrant that you own or have the necessary rights to submit your User Content and that your User Content does not infringe the intellectual property rights, privacy rights, or any other rights of any third party. We reserve the right to remove any User Content that violates these Terms or that we find objectionable in our sole discretion.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
              9. Referral Program
            </h2>
            <p>
              The JambOS referral program allows users to earn free premium access by referring new users to the Service. Referral rewards are subject to the following conditions: the referred user must be a genuinely new user who creates a unique account and completes the onboarding process; self-referrals (referring yourself using a different account) are prohibited and will result in forfeiture of all referral rewards and potential account termination; referral rewards are earned based on completed referrals as outlined on the referral page; we reserve the right to modify the referral program terms, reward tiers, or reward amounts at any time; and we reserve the right to revoke referral rewards if we determine that referrals were obtained through fraudulent, deceptive, or manipulative means.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
              10. Gamification and Rankings
            </h2>
            <p>
              The Service includes gamification features such as XP points, levels, achievements, streaks, daily missions, and leaderboard rankings. These features are designed solely to enhance educational motivation and engagement. XP, levels, and rankings have no monetary value and cannot be exchanged, traded, or redeemed for cash, goods, or services outside the Platform.
            </p>
            <p className="mt-3">
              We reserve the right to adjust, reset, or recalculate XP totals, levels, rankings, and achievements at any time to maintain system integrity, correct errors, or address fraudulent activity. Any attempt to manipulate gamification features, including through automated tools, multiple accounts, or coordinated activity with other users, constitutes a violation of these Terms and may result in account suspension or termination.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
              11. WhatsApp Bot
            </h2>
            <p>
              The JambOS WhatsApp bot is an optional feature that allows you to interact with certain Service features through WhatsApp. By using the WhatsApp bot, you additionally agree to WhatsApp&apos;s own Terms of Service and Privacy Policy. You acknowledge that messages sent to and from the bot transit through Meta&apos;s infrastructure and are subject to Meta&apos;s data practices. We are not responsible for WhatsApp&apos;s handling of your data.
            </p>
            <p className="mt-3">
              The WhatsApp bot is provided for educational convenience and may have limitations compared to the full web platform. We do not guarantee the availability, accuracy, or completeness of the WhatsApp bot experience. Standard messaging charges from your mobile carrier may apply to your use of the WhatsApp bot.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
              12. Disclaimer of Warranties
            </h2>
            <p>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS. WE DO NOT WARRANT THE ACCURACY, COMPLETENESS, OR RELIABILITY OF ANY CONTENT, INCLUDING QUESTIONS, ANSWERS, EXPLANATIONS, PREDICTIONS, OR AI-GENERATED RESPONSES.
            </p>
            <p className="mt-3">
              WE MAKE NO REPRESENTATION OR WARRANTY THAT THE SERVICE WILL RESULT IN ANY PARTICULAR JAMB SCORE, UNIVERSITY ADMISSION, OR ACADEMIC OUTCOME. EDUCATIONAL OUTCOMES DEPEND ON NUMEROUS FACTORS INCLUDING BUT NOT LIMITED TO INDIVIDUAL EFFORT, PRIOR KNOWLEDGE, EXAMINATION CONDITIONS, AND INSTITUTIONAL POLICIES THAT ARE BEYOND OUR CONTROL.
            </p>
            <p className="mt-3">
              SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF CERTAIN WARRANTIES, SO SOME OF THE ABOVE EXCLUSIONS MAY NOT APPLY TO YOU. IN SUCH CASES, THE EXCLUSIONS APPLY TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
              13. Limitation of Liability
            </h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL JAMBOS, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AFFILIATES, SUCCESSORS, OR ASSIGNS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA, OR OTHER INTANGIBLE LOSSES, REGARDLESS OF WHETHER SUCH DAMAGES ARE BASED ON CONTRACT, TORT, STRICT LIABILITY, OR ANY OTHER LEGAL THEORY, AND REGARDLESS OF WHETHER WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p className="mt-3">
              OUR TOTAL AGGREGATE LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE GREATER OF (A) THE TOTAL AMOUNT YOU HAVE PAID TO US IN SUBSCRIPTION FEES DURING THE SIX (6) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM, OR (B) FIVE THOUSAND NIGERIAN NAIRA (NGN 5,000).
            </p>
          </section>

          {/* 14 */}
          <section>
            <h2 className="mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
              14. Indemnification
            </h2>
            <p>
              You agree to indemnify, defend, and hold harmless JambOS, its officers, directors, employees, agents, affiliates, successors, and assigns from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable attorneys&apos; fees) arising out of or in connection with your use of the Service, your violation of these Terms, your violation of any applicable law or regulation, your User Content, your infringement of any third-party rights, or any activity conducted through your account whether or not authorized by you.
            </p>
          </section>

          {/* 15 */}
          <section>
            <h2 className="mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
              15. Termination
            </h2>
            <p>
              We may suspend or terminate your account and access to the Service at any time, with or without cause, and with or without notice. Grounds for termination include but are not limited to violation of these Terms, fraudulent or illegal activity, extended period of inactivity, non-payment of subscription fees, abusive behavior toward other users or our staff, and any conduct that we determine in our sole discretion to be harmful to the Service, other users, or our business interests.
            </p>
            <p className="mt-3">
              You may terminate your account at any time by deleting your account through the Settings page or by contacting us. Upon termination, your right to use the Service will immediately cease. Provisions of these Terms that by their nature should survive termination shall survive, including but not limited to intellectual property provisions, warranty disclaimers, limitation of liability, indemnification, and dispute resolution provisions.
            </p>
            <p className="mt-3">
              Upon account termination or deletion, your personal data will be handled in accordance with our Privacy Policy&apos;s data retention provisions. Specifically, your personal information will be permanently deleted or anonymized within 30 days of account deletion, with certain data retained longer as required by applicable law.
            </p>
          </section>

          {/* 16 */}
          <section>
            <h2 className="mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
              16. Dispute Resolution
            </h2>
            <p>
              Any dispute, controversy, or claim arising out of or relating to these Terms or the Service shall first be attempted to be resolved through good-faith negotiation between the parties for a period of not less than thirty (30) days. If the dispute cannot be resolved through negotiation, it shall be submitted to mediation administered by the Lagos Multi-Door Courthouse or a mutually agreed mediation service.
            </p>
            <p className="mt-3">
              If mediation is unsuccessful, the dispute shall be resolved by binding arbitration conducted in Lagos, Nigeria, in accordance with the Arbitration and Mediation Act 2023 of the Federal Republic of Nigeria. The arbitration shall be conducted by a single arbitrator mutually agreed upon by the parties. The language of arbitration shall be English. The arbitrator&apos;s decision shall be final and binding, and judgment upon the award may be entered in any court of competent jurisdiction.
            </p>
            <p className="mt-3">
              Notwithstanding the foregoing, either party may seek injunctive or other equitable relief in any court of competent jurisdiction to prevent the actual or threatened infringement, misappropriation, or violation of intellectual property rights or confidentiality obligations.
            </p>
            <p className="mt-3">
              You agree that any claims shall be brought in your individual capacity and not as a plaintiff or class member in any purported class, collective, or representative proceeding. You expressly waive any right to participate in a class action lawsuit or class-wide arbitration against JambOS.
            </p>
          </section>

          {/* 17 */}
          <section>
            <h2 className="mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
              17. JAMB and Third-Party Trademarks
            </h2>
            <p>
              &quot;JAMB,&quot; &quot;Joint Admissions and Matriculation Board,&quot; &quot;UTME,&quot; and related marks are trademarks of the Joint Admissions and Matriculation Board of Nigeria. JambOS is not affiliated with, endorsed by, or sponsored by JAMB or any Nigerian university. All references to JAMB, UTME, WAEC, NECO, and specific Nigerian universities are for informational and educational purposes only. University names, cutoff scores, and admission requirements referenced on the Platform are based on publicly available information and may not reflect the most current data.
            </p>
          </section>

          {/* 18 */}
          <section>
            <h2 className="mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
              18. Availability and Force Majeure
            </h2>
            <p>
              We aim to maintain the Service available 24 hours a day, 7 days a week, but do not guarantee uninterrupted access. The Service may be unavailable due to scheduled maintenance, emergency maintenance, technical failures, internet connectivity issues, third-party service provider outages, or events beyond our reasonable control. We shall not be liable for any failure or delay in performing our obligations under these Terms due to force majeure events including but not limited to natural disasters, acts of war or terrorism, epidemics or pandemics, government actions or regulations, power failures, internet infrastructure failures, or labor disputes.
            </p>
          </section>

          {/* 19 */}
          <section>
            <h2 className="mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
              19. Modifications to Terms
            </h2>
            <p>
              We reserve the right to modify these Terms at any time. When we make material changes, we will update the &quot;Last Updated&quot; date at the top of these Terms and notify you through the Service interface or by email at least 14 days before the changes take effect. Your continued use of the Service after the effective date of any modifications constitutes your acceptance of the modified Terms. If you do not agree to the modified Terms, you must stop using the Service and may delete your account.
            </p>
          </section>

          {/* 20 */}
          <section>
            <h2 className="mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
              20. Severability
            </h2>
            <p>
              If any provision of these Terms is held to be invalid, illegal, or unenforceable by a court of competent jurisdiction, such provision shall be modified to the minimum extent necessary to make it valid, legal, and enforceable, or if modification is not possible, shall be severed from these Terms. The invalidity or unenforceability of any provision shall not affect the validity or enforceability of any other provision, and the remaining provisions shall continue in full force and effect.
            </p>
          </section>

          {/* 21 */}
          <section>
            <h2 className="mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
              21. Entire Agreement
            </h2>
            <p>
              These Terms, together with our Privacy Policy and any additional terms and conditions applicable to specific features of the Service (such as subscription plan terms or referral program terms), constitute the entire agreement between you and JambOS with respect to your use of the Service. These Terms supersede all prior or contemporaneous communications, proposals, and agreements, whether oral or written, between you and JambOS regarding the Service.
            </p>
          </section>

          {/* 22 */}
          <section>
            <h2 className="mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
              22. Governing Law
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria, without regard to its conflict of law principles. Any legal action or proceeding not subject to the arbitration provisions above shall be brought exclusively in the courts of Lagos State, Nigeria, and you consent to the personal jurisdiction of such courts.
            </p>
          </section>

          {/* 23 */}
          <section>
            <h2 className="mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
              23. Contact Information
            </h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <div
              className="mt-3 rounded-xl p-4"
              style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-surface-border)" }}
            >
              <p style={{ color: "var(--color-text-primary)" }}><strong>JambOS</strong></p>
              <p className="mt-1">
                Email:{" "}
                <a href="mailto:legal@jambos.ng" style={{ color: "var(--color-accent-green)" }} className="hover:underline">
                  legal@jambos.ng
                </a>
              </p>
              <p className="mt-1">
                General:{" "}
                <a href="mailto:hello@jambos.ng" style={{ color: "var(--color-accent-green)" }} className="hover:underline">
                  hello@jambos.ng
                </a>
              </p>
            </div>
          </section>
        </div>

        <footer className="mt-16 pt-6" style={{ borderTop: "1px solid var(--color-surface-border)" }}>
          <div className="flex items-center justify-center gap-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
            <Link href="/privacy" className="hover:underline" style={{ color: "var(--color-text-tertiary)" }}>Privacy Policy</Link>
            <span>|</span>
            <Link href="/dashboard" className="hover:underline" style={{ color: "var(--color-text-tertiary)" }}>Back to App</Link>
          </div>
          <p className="mt-2 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
            &copy; {new Date().getFullYear()} JambOS. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}