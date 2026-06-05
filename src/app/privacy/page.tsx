import { Logo } from "@/components/ui/logo";
import Link from "next/link";

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>

        <p className="text-sm mb-8" style={{ color: "var(--color-text-muted)" }}>
          Effective Date: January 1, 2025 | Last Updated: June 1, 2025
        </p>

        <div
          className="space-y-8 text-sm leading-[1.8]"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {/* ─── 1. Introduction ─── */}
          <section>
            <h2
              className="mb-3"
              style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}
            >
              1. Introduction
            </h2>
            <p>
              JambOS (&quot;we,&quot; &quot;us,&quot; &quot;our,&quot; or the &quot;Company&quot;) operates the JambOS platform, accessible via the website at jambos.ng, the JambOS mobile application, the JambOS Progressive Web App, and the JambOS WhatsApp Bot (collectively, the &quot;Service&quot; or &quot;Platform&quot;). This Privacy Policy describes how we collect, use, store, share, and protect your personal information when you access or use our Service.
            </p>
            <p className="mt-3">
              By creating an account, accessing, or using the Service in any manner, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy. If you do not agree with any part of this policy, you must not access or use the Service. If you are under the age of 18, you confirm that you have obtained consent from a parent or legal guardian before using the Service and that your parent or guardian has read and agrees to this Privacy Policy on your behalf.
            </p>
            <p className="mt-3">
              This Privacy Policy applies to all users of the Platform, including students, parents, guardians, educators, administrators, and any other individuals who interact with our Service. It governs all data collected through the Platform, including data collected through the website, mobile application, APIs, WhatsApp integration, email communications, and any other method of interaction with JambOS.
            </p>
          </section>

          {/* ─── 2. Definitions ─── */}
          <section>
            <h2
              className="mb-3"
              style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}
            >
              2. Definitions
            </h2>
            <p>
              <strong style={{ color: "var(--color-text-primary)" }}>&quot;Personal Data&quot;</strong> means any information that identifies, relates to, describes, is reasonably capable of being associated with, or could reasonably be linked, directly or indirectly, to an identified or identifiable natural person. This includes but is not limited to name, email address, phone number, location data, academic performance data, and device identifiers.
            </p>
            <p className="mt-3">
              <strong style={{ color: "var(--color-text-primary)" }}>&quot;Usage Data&quot;</strong> means data collected automatically through the use of the Service, including but not limited to pages visited, features used, time spent on pages, click patterns, scroll depth, test performance metrics, answer patterns, time spent per question, question navigation behavior, and interaction with AI features.
            </p>
            <p className="mt-3">
              <strong style={{ color: "var(--color-text-primary)" }}>&quot;Performance Data&quot;</strong> means all data generated through your academic interactions with the Platform, including test scores, accuracy rates, response times, topic-level performance breakdowns, difficulty progression data, predicted scores, weakness identification data, spaced repetition scheduling data, and all analytics derived from your test-taking behavior.
            </p>
            <p className="mt-3">
              <strong style={{ color: "var(--color-text-primary)" }}>&quot;Device Data&quot;</strong> means information about the device you use to access the Service, including device type, operating system, browser type and version, screen resolution, device language, IP address, mobile network information, and unique device identifiers.
            </p>
            <p className="mt-3">
              <strong style={{ color: "var(--color-text-primary)" }}>&quot;AI Interaction Data&quot;</strong> means all data generated through your interactions with our artificial intelligence features, including questions asked to the AI tutor, AI-generated explanations viewed, AI-generated study plans, and all inputs and outputs of AI-powered features.
            </p>
          </section>

          {/* ─── 3. Information We Collect ─── */}
          <section>
            <h2
              className="mb-3"
              style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}
            >
              3. Information We Collect
            </h2>

            <h3 className="font-semibold mt-4 mb-2" style={{ color: "var(--color-text-primary)" }}>
              3.1 Information You Provide Directly
            </h3>
            <p>
              When you create an account, complete onboarding, or use our Service, you may provide us with the following categories of information: your full legal name or preferred name; email address; password (which is immediately hashed and never stored in plaintext); phone number (if you choose to link your WhatsApp account); date of birth; gender; Nigerian state of residence; city of residence; school name and type (public, private, federal government, state government, international, or home school); class level (SS1, SS2, SS3, graduate, or gap year); JAMB examination year; target JAMB score; preferred university and course of study; previous JAMB scores (if applicable); preferred study time slots; daily study hours commitment; learning style preferences; and profile photograph (if you sign in via Google OAuth, your Google profile picture may be imported).
            </p>

            <h3 className="font-semibold mt-4 mb-2" style={{ color: "var(--color-text-primary)" }}>
              3.2 Information Collected Automatically
            </h3>
            <p>
              When you use the Platform, we automatically collect: your IP address and approximate geographic location derived from it; device type, operating system, and browser information; pages and features accessed, including timestamps of access; duration of each visit and session patterns; referral URLs and exit pages; click patterns and navigation flow within the Platform; scroll behavior and interaction with interface elements; performance data from all test sessions, including which answer you selected for each question, whether each answer was correct, the time spent on each individual question, whether you flagged or skipped questions, your self-rated confidence levels (when this feature is available), and the overall test completion time; your interaction patterns with the AI tutor, including all questions submitted and all responses viewed; your engagement with the microlearning feed, including cards viewed, time spent on each card, cards liked, and cards saved; your study plan completion rates, including tasks completed, tasks skipped, and study session durations; your leaderboard positions and ranking changes over time; your referral activity, including referral codes generated and referral codes redeemed; and your subscription status and payment history.
            </p>

            <h3 className="font-semibold mt-4 mb-2" style={{ color: "var(--color-text-primary)" }}>
              3.3 Information from Third Parties
            </h3>
            <p>
              If you sign in using Google OAuth, we receive your Google account name, email address, and profile picture from Google. We do not access your Google Drive, Gmail, Google Calendar, or any other Google service data. If you make a payment through Paystack, we receive transaction confirmation data, including the transaction reference, amount, status, and timestamp. We do not receive or store your full credit card number, debit card number, or bank account details, as all payment processing is handled securely by Paystack. If you interact with our WhatsApp bot, we receive your WhatsApp phone number, message content, and message metadata from Meta&apos;s WhatsApp Business API.
            </p>

            <h3 className="font-semibold mt-4 mb-2" style={{ color: "var(--color-text-primary)" }}>
              3.4 Cookies and Similar Technologies
            </h3>
            <p>
              We use essential cookies to maintain your authentication session and remember your preferences. We use a session token cookie (named &quot;authjs.session-token&quot; or &quot;__Secure-authjs.session-token&quot;) that is strictly necessary for the Platform to function. We do not use third-party advertising cookies, tracking pixels for advertising purposes, or any technology that tracks your browsing activity across other websites. We may use analytics tools to understand aggregate usage patterns, but these do not track individual users across third-party sites.
            </p>
          </section>

          {/* ─── 4. How We Use Your Information ─── */}
          <section>
            <h2
              className="mb-3"
              style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}
            >
              4. How We Use Your Information
            </h2>
            <p>We use the information we collect for the following purposes:</p>

            <h3 className="font-semibold mt-4 mb-2" style={{ color: "var(--color-text-primary)" }}>
              4.1 Providing and Personalizing the Service
            </h3>
            <p>
              We use your Personal Data and Performance Data to create and maintain your account; authenticate your identity and manage your session; generate personalized study plans using spaced repetition algorithms and AI-driven recommendations; adapt question difficulty to your demonstrated skill level using our adaptive learning engine; identify your weak topics and prioritize them in your study schedule; predict your JAMB score based on your performance patterns; calculate your admission probability for specific university courses; generate your national, state, school, and subject-based rankings; power the AI tutor to provide contextually relevant explanations based on your learning history; curate the microlearning feed to prioritize content relevant to your subject choices and weak areas; generate daily challenges calibrated to your skill level; and process your subscription and payment transactions.
            </p>

            <h3 className="font-semibold mt-4 mb-2" style={{ color: "var(--color-text-primary)" }}>
              4.2 Analytics and Platform Improvement
            </h3>
            <p>
              We aggregate and anonymize Performance Data to identify the most commonly failed questions and topics across all users; calculate question difficulty indices and discrimination indices to improve our question bank; detect potentially incorrect or ambiguous questions through statistical analysis of response patterns; understand how students progress through subjects over time; measure the effectiveness of different learning approaches and study plan formats; improve the accuracy of our score prediction algorithms; identify technical issues, bugs, and performance bottlenecks; and conduct internal research on educational technology methods. When data is used for these purposes, it is aggregated in a manner that does not identify individual users.
            </p>

            <h3 className="font-semibold mt-4 mb-2" style={{ color: "var(--color-text-primary)" }}>
              4.3 Communications
            </h3>
            <p>
              We may use your email address to send transactional emails related to your account, such as password reset requests, subscription confirmations, and payment receipts. We may send educational notifications such as study reminders, streak alerts, and daily challenge notifications if you have opted in to receive them. We will not send you marketing emails without your explicit consent, and you can opt out of all non-essential communications at any time through your account settings or by clicking the unsubscribe link in any email.
            </p>

            <h3 className="font-semibold mt-4 mb-2" style={{ color: "var(--color-text-primary)" }}>
              4.4 Safety and Security
            </h3>
            <p>
              We use information to detect and prevent fraud, abuse, and unauthorized access; enforce our Terms of Service; protect the security and integrity of the Platform; comply with legal obligations; and respond to lawful requests from government authorities when required by applicable law.
            </p>
          </section>

          {/* ─── 5. Legal Basis for Processing ─── */}
          <section>
            <h2
              className="mb-3"
              style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}
            >
              5. Legal Basis for Processing
            </h2>
            <p>
              We process your personal information based on the following legal grounds: (a) Performance of a Contract, where processing is necessary to fulfill our obligations under the Terms of Service you agreed to when creating your account, including providing the core educational service, managing your account, and processing payments; (b) Consent, where you have given us explicit consent to process your data for specific purposes, such as receiving marketing communications or participating in optional features like the WhatsApp bot; (c) Legitimate Interests, where processing is necessary for our legitimate interests in improving the Platform, conducting analytics, preventing fraud, and ensuring security, provided that these interests are not overridden by your fundamental rights and freedoms; and (d) Legal Obligations, where processing is necessary to comply with applicable laws and regulations, including the Nigeria Data Protection Regulation (NDPR), the Nigeria Data Protection Act (NDPA) 2023, and any other applicable data protection legislation.
            </p>
          </section>

          {/* ─── 6. Data Sharing and Disclosure ─── */}
          <section>
            <h2
              className="mb-3"
              style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}
            >
              6. Data Sharing and Disclosure
            </h2>

            <h3 className="font-semibold mt-4 mb-2" style={{ color: "var(--color-text-primary)" }}>
              6.1 We Do Not Sell Your Data
            </h3>
            <p>
              We do not sell, rent, lease, or trade your personal information to third parties for their commercial purposes. This is an absolute commitment. We have never sold user data and will never do so.
            </p>

            <h3 className="font-semibold mt-4 mb-2" style={{ color: "var(--color-text-primary)" }}>
              6.2 Service Providers
            </h3>
            <p>
              We share limited data with trusted third-party service providers who perform services on our behalf, subject to strict contractual obligations regarding data protection and confidentiality. These include: Neon (our database hosting provider, which stores your account and performance data on secure PostgreSQL infrastructure); Vercel (our web hosting provider, which processes web requests and serves the Platform); Anthropic (our AI provider, which processes your questions to the AI tutor to generate explanations; note that AI interaction data sent to Anthropic is not used to train their models per our agreement); Google (which provides OAuth authentication services and receives only the minimum data necessary for authentication); Paystack (our payment processor, which handles all payment transactions and has access only to data necessary to process your payments); and Meta/WhatsApp (which facilitates WhatsApp bot communications if you choose to use this feature).
            </p>

            <h3 className="font-semibold mt-4 mb-2" style={{ color: "var(--color-text-primary)" }}>
              6.3 Aggregated and Anonymized Data
            </h3>
            <p>
              We may share aggregated, anonymized data that cannot be used to identify individual users with educational institutions, researchers, publishers, and government agencies for the purposes of improving educational outcomes. Examples include aggregate statistics about the most commonly failed topics, average performance trends by region, and overall platform usage patterns. This data is stripped of all personally identifiable information before sharing.
            </p>

            <h3 className="font-semibold mt-4 mb-2" style={{ color: "var(--color-text-primary)" }}>
              6.4 Legal Requirements
            </h3>
            <p>
              We may disclose your information if required to do so by law, regulation, legal process, or governmental request, including but not limited to responding to court orders, subpoenas, or requests from law enforcement agencies. We may also disclose information when we believe in good faith that disclosure is necessary to protect the rights, property, or safety of JambOS, our users, or the public.
            </p>

            <h3 className="font-semibold mt-4 mb-2" style={{ color: "var(--color-text-primary)" }}>
              6.5 Business Transfers
            </h3>
            <p>
              In the event of a merger, acquisition, reorganization, bankruptcy, or sale of all or a portion of our assets, your personal information may be transferred as part of that transaction. We will notify you via email or a prominent notice on our Platform before your personal information becomes subject to a different privacy policy.
            </p>

            <h3 className="font-semibold mt-4 mb-2" style={{ color: "var(--color-text-primary)" }}>
              6.6 With Your Consent
            </h3>
            <p>
              We may share your information with third parties when you have given us explicit consent to do so. For example, if you choose to share your result card on social media, the shared content is generated by our Platform and distributed according to the sharing mechanism you selected.
            </p>
          </section>

          {/* ─── 7. Data Retention ─── */}
          <section>
            <h2
              className="mb-3"
              style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}
            >
              7. Data Retention
            </h2>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide you with the Service. Specifically: your account information (name, email, profile data) is retained for the duration of your account&apos;s existence; your performance data (test results, scores, analytics) is retained for the duration of your account plus 12 months after account deletion to allow for account recovery if requested; your payment data is retained for 7 years after the transaction date as required by Nigerian tax and financial regulations; your AI interaction data (tutor conversations) is retained for 90 days from the date of the interaction for quality improvement purposes, after which it is permanently deleted; your WhatsApp interaction data is retained for 30 days from the date of the interaction; and server logs containing your IP address and request data are retained for 90 days.
            </p>
            <p className="mt-3">
              When you delete your account, we initiate a process to permanently delete or anonymize all of your personal information from our active systems within 30 days. Some information may persist in encrypted backups for up to 90 days, after which it is permanently deleted when the backup rotation cycle completes. Anonymized, aggregated data that cannot be used to identify you may be retained indefinitely for research and platform improvement purposes.
            </p>
          </section>

          {/* ─── 8. Data Security ─── */}
          <section>
            <h2
              className="mb-3"
              style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}
            >
              8. Data Security
            </h2>
            <p>
              We implement comprehensive technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include: encryption of all data in transit using TLS 1.2 or higher; encryption of all data at rest in our database systems; password hashing using bcrypt with a cost factor of 10, ensuring that even in the unlikely event of a database breach, your password cannot be recovered; secure session management using cryptographically signed JSON Web Tokens (JWTs) with short expiration periods; regular security assessments and vulnerability scanning of our infrastructure; access controls that limit employee access to personal data to only those who require it to perform their job functions; secure development practices including code review and dependency auditing; and database access restricted to application-level connections with no direct external access permitted.
            </p>
            <p className="mt-3">
              While we strive to protect your personal information, no method of transmission over the Internet or method of electronic storage is 100% secure. We cannot guarantee the absolute security of your data, but we commit to promptly notifying affected users in the event of a data breach that poses a risk to your rights and freedoms, in accordance with applicable law.
            </p>
          </section>

          {/* ─── 9. Your Rights ─── */}
          <section>
            <h2
              className="mb-3"
              style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}
            >
              9. Your Rights
            </h2>
            <p>
              Under the Nigeria Data Protection Regulation (NDPR), the Nigeria Data Protection Act (NDPA) 2023, and other applicable data protection laws, you have the following rights regarding your personal information:
            </p>
            <p className="mt-3">
              <strong style={{ color: "var(--color-text-primary)" }}>Right of Access:</strong> You have the right to request a copy of all personal data we hold about you. We will provide this data in a commonly used, machine-readable format within 30 days of your request.
            </p>
            <p className="mt-3">
              <strong style={{ color: "var(--color-text-primary)" }}>Right to Rectification:</strong> You have the right to request correction of any inaccurate personal data we hold about you. You can update most of your information directly through your account settings, or contact us for data that cannot be self-corrected.
            </p>
            <p className="mt-3">
              <strong style={{ color: "var(--color-text-primary)" }}>Right to Erasure:</strong> You have the right to request deletion of your personal data. You can delete your account through the Settings page, which will initiate permanent deletion of your data as described in the Data Retention section. Certain data may be retained where we have a legal obligation to do so.
            </p>
            <p className="mt-3">
              <strong style={{ color: "var(--color-text-primary)" }}>Right to Restrict Processing:</strong> You have the right to request that we restrict the processing of your personal data under certain circumstances, such as when you contest the accuracy of the data or object to our processing.
            </p>
            <p className="mt-3">
              <strong style={{ color: "var(--color-text-primary)" }}>Right to Data Portability:</strong> You have the right to receive your personal data in a structured, commonly used, machine-readable format and to transmit that data to another service provider without hindrance.
            </p>
            <p className="mt-3">
              <strong style={{ color: "var(--color-text-primary)" }}>Right to Object:</strong> You have the right to object to the processing of your personal data where we rely on legitimate interests as the legal basis for processing, or where your data is processed for direct marketing purposes.
            </p>
            <p className="mt-3">
              <strong style={{ color: "var(--color-text-primary)" }}>Right to Withdraw Consent:</strong> Where processing is based on your consent, you have the right to withdraw that consent at any time. Withdrawal of consent does not affect the lawfulness of processing carried out before the withdrawal.
            </p>
            <p className="mt-3">
              <strong style={{ color: "var(--color-text-primary)" }}>Right to Lodge a Complaint:</strong> You have the right to lodge a complaint with the Nigeria Data Protection Commission (NDPC) or any other relevant supervisory authority if you believe that our processing of your personal data violates applicable data protection law.
            </p>
            <p className="mt-3">
              To exercise any of these rights, please contact us at the email address provided in the Contact section below. We will respond to your request within 30 days. We may need to verify your identity before processing your request.
            </p>
          </section>

          {/* ─── 10. Children's Privacy ─── */}
          <section>
            <h2
              className="mb-3"
              style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}
            >
              10. Children&apos;s Privacy
            </h2>
            <p>
              Our Service is designed to be used by students preparing for JAMB examinations, which may include individuals under the age of 18. We recognize the importance of protecting children&apos;s privacy and comply with the Nigerian Child Rights Act 2003 and applicable data protection legislation regarding minors.
            </p>
            <p className="mt-3">
              If you are under 18 years of age, you must have the consent of a parent or legal guardian to use the Service. By allowing a minor to use JambOS, the parent or guardian agrees to this Privacy Policy on behalf of the minor and takes responsibility for the minor&apos;s use of the Service.
            </p>
            <p className="mt-3">
              We do not knowingly collect personal information from children under the age of 13 without verifiable parental consent. If we become aware that we have collected personal information from a child under 13 without parental consent, we will take immediate steps to delete that information.
            </p>
            <p className="mt-3">
              For users between 13 and 17 years of age, we limit data collection to what is necessary to provide the educational service. We do not display targeted advertisements to minors, do not share minor users&apos; personal information with third parties for marketing purposes, and do not use minor users&apos; data for purposes unrelated to the educational service.
            </p>
          </section>

          {/* ─── 11. International Data Transfers ─── */}
          <section>
            <h2
              className="mb-3"
              style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}
            >
              11. International Data Transfers
            </h2>
            <p>
              Your personal information may be stored and processed in countries outside of Nigeria, including the United States, where our hosting provider (Vercel) and database provider (Neon) operate infrastructure. When we transfer your data internationally, we ensure that appropriate safeguards are in place in accordance with the NDPR and NDPA requirements for cross-border data transfers, including ensuring that the receiving country provides an adequate level of data protection or that appropriate contractual safeguards (such as standard contractual clauses) are in place with the data recipient.
            </p>
          </section>

          {/* ─── 12. AI and Automated Decision-Making ─── */}
          <section>
            <h2
              className="mb-3"
              style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}
            >
              12. Artificial Intelligence and Automated Decision-Making
            </h2>
            <p>
              Our Platform uses artificial intelligence and automated decision-making systems in several ways: our adaptive learning engine automatically adjusts question difficulty based on your performance history; our score prediction engine uses statistical models to estimate your likely JAMB score; our study plan generator automatically creates personalized study schedules; our AI tutor uses large language models (provided by Anthropic) to generate explanations and answer your questions; and our recommendation engine automatically identifies your weak topics and prioritizes them.
            </p>
            <p className="mt-3">
              These automated systems are designed to enhance your learning experience and are not used to make decisions that produce legal effects or similarly significantly affect you. The predicted scores and admission probabilities generated by our system are estimates based on available data and should not be relied upon as guarantees of actual JAMB performance or university admission outcomes.
            </p>
            <p className="mt-3">
              When you interact with our AI tutor, your questions are sent to Anthropic&apos;s API for processing. We include contextual information about your current topic and performance level to improve response quality, but we do not send your personally identifiable information (such as your name or email) to the AI provider. Anthropic&apos;s processing of this data is governed by their data processing agreement with us.
            </p>
          </section>

          {/* ─── 13. WhatsApp Bot ─── */}
          <section>
            <h2
              className="mb-3"
              style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}
            >
              13. WhatsApp Bot Privacy
            </h2>
            <p>
              If you choose to interact with our WhatsApp bot, the following additional terms apply: your WhatsApp phone number is collected and stored to identify your session; all messages you send to the bot are processed by our servers to determine intent and generate responses; quiz responses submitted via WhatsApp are recorded in the same manner as responses submitted through the web platform; conversation history within WhatsApp sessions is stored for 30 days to enable contextual responses; you may unlink your WhatsApp account at any time through the Platform settings; and Meta (the parent company of WhatsApp) has access to message metadata in accordance with WhatsApp&apos;s own privacy policy, which is separate from this policy.
            </p>
          </section>

          {/* ─── 14. Referral Program ─── */}
          <section>
            <h2
              className="mb-3"
              style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}
            >
              14. Referral Program Privacy
            </h2>
            <p>
              If you participate in our referral program, we collect and process the following information: your unique referral code; the identity of users who sign up using your referral code (limited to a first name and join date visible to you); the number of successful referrals attributed to your code; and reward eligibility and redemption history. We do not share the academic performance, personal details, or usage patterns of referred users with the referring user, or vice versa.
            </p>
          </section>

          {/* ─── 15. Payment Data ─── */}
          <section>
            <h2
              className="mb-3"
              style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}
            >
              15. Payment Information
            </h2>
            <p>
              All payment processing is handled by Paystack, a PCI-DSS Level 1 certified payment processor. We do not directly collect, store, or process your credit card numbers, debit card numbers, bank account numbers, BVN, or other financial instrument details. The only payment-related data we store consists of: the Paystack transaction reference; the amount and currency of each transaction; the payment status (pending, successful, failed, or refunded); the subscription plan associated with the payment; and timestamps of payment events. For questions about how Paystack handles your payment data, please refer to Paystack&apos;s privacy policy at paystack.com/privacy.
            </p>
          </section>

          {/* ─── 16. Third-Party Links ─── */}
          <section>
            <h2
              className="mb-3"
              style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}
            >
              16. Third-Party Links and Services
            </h2>
            <p>
              Our Platform may contain links to third-party websites, applications, or services that are not operated by us. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services. We strongly advise you to review the privacy policy of every site you visit. Our inclusion of a link to a third-party site does not constitute an endorsement of that site&apos;s privacy practices.
            </p>
          </section>

          {/* ─── 17. NDPR Compliance ─── */}
          <section>
            <h2
              className="mb-3"
              style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}
            >
              17. Nigeria Data Protection Regulation (NDPR) and NDPA Compliance
            </h2>
            <p>
              JambOS is committed to compliance with the Nigeria Data Protection Regulation (NDPR) 2019 and the Nigeria Data Protection Act (NDPA) 2023. In accordance with these regulations, we ensure that: all processing of personal data is carried out in accordance with a lawful basis; personal data is collected for specified, explicit, and legitimate purposes and not further processed in a manner incompatible with those purposes; personal data is adequate, relevant, and limited to what is necessary for the purposes for which it is processed; personal data is accurate and, where necessary, kept up to date; personal data is stored only for as long as necessary for the purposes for which it was collected; and appropriate technical and organizational measures are in place to ensure the security and confidentiality of personal data.
            </p>
            <p className="mt-3">
              As required by the NDPR, we have designated a Data Protection Officer who can be contacted at the email address provided in the Contact section below. We conduct periodic data protection impact assessments for processing activities that are likely to result in high risk to the rights and freedoms of individuals. We maintain records of our data processing activities as required by applicable law.
            </p>
          </section>

          {/* ─── 18. Changes ─── */}
          <section>
            <h2
              className="mb-3"
              style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}
            >
              18. Changes to This Privacy Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. When we make material changes, we will notify you by posting the updated policy on this page with a revised &quot;Last Updated&quot; date and, for significant changes, by sending a notification to the email address associated with your account or displaying a prominent notice within the Platform at least 14 days before the changes take effect. Your continued use of the Service after the effective date of any changes constitutes your acceptance of the revised Privacy Policy. We encourage you to review this page periodically to stay informed about how we protect your information.
            </p>
          </section>

          {/* ─── 19. Contact ─── */}
          <section>
            <h2
              className="mb-3"
              style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}
            >
              19. Contact Information
            </h2>
            <p>
              If you have any questions, concerns, or complaints about this Privacy Policy or our data processing practices, or if you wish to exercise any of your rights under applicable data protection law, please contact us at:
            </p>
            <div
              className="mt-3 rounded-xl p-4"
              style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-surface-border)" }}
            >
              <p style={{ color: "var(--color-text-primary)" }}>
                <strong>JambOS</strong>
              </p>
              <p className="mt-1">
                Data Protection Officer<br />
                Email:{" "}
                <a href="mailto:privacy@jambos.ng" style={{ color: "var(--color-accent-green)" }} className="hover:underline">
                  privacy@jambos.ng
                </a>
              </p>
              <p className="mt-2">
                For general inquiries:{" "}
                <a href="mailto:hello@jambos.ng" style={{ color: "var(--color-accent-green)" }} className="hover:underline">
                  hello@jambos.ng
                </a>
              </p>
            </div>
            <p className="mt-3">
              We aim to respond to all data protection inquiries within 30 days. If you are not satisfied with our response, you have the right to lodge a complaint with the Nigeria Data Protection Commission (NDPC).
            </p>
          </section>

          {/* ─── 20. Governing Law ─── */}
          <section>
            <h2
              className="mb-3"
              style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}
            >
              20. Governing Law
            </h2>
            <p>
              This Privacy Policy shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria, including but not limited to the Nigeria Data Protection Act (NDPA) 2023, the Nigeria Data Protection Regulation (NDPR) 2019, the Cybercrimes (Prohibition, Prevention, etc.) Act 2015, and the Child Rights Act 2003. Any dispute arising out of or in connection with this Privacy Policy shall be subject to the exclusive jurisdiction of the courts of the Federal Republic of Nigeria.
            </p>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-6" style={{ borderTop: "1px solid var(--color-surface-border)" }}>
          <div className="flex items-center justify-center gap-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
            <Link href="/terms" className="hover:underline" style={{ color: "var(--color-text-tertiary)" }}>
              Terms of Service
            </Link>
            <span>|</span>
            <Link href="/dashboard" className="hover:underline" style={{ color: "var(--color-text-tertiary)" }}>
              Back to App
            </Link>
          </div>
          <p className="mt-2 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
            &copy; {new Date().getFullYear()} JambOS. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}