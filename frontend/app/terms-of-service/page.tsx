'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header variant="pink" />

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Terms of Service</h1>
          <p className="text-gray-500 text-sm">Last Updated: January 1, 2025</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-10">
          <section>
            <h2 className="text-2xl font-semibold text-[#F77B8A] mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              By accessing or using the Axolotly application, website, and related services (collectively, the &ldquo;Service&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to these Terms, you may not access or use the Service.
            </p>
            <p className="text-gray-700 leading-relaxed">
              These Terms constitute a legally binding agreement between you and Axolotly (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By creating an account, you represent that you are at least 18 years of age and have the legal capacity to enter into this agreement. If you are using the Service on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#F77B8A] mb-4">2. Description of Service</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Axolotly is a parental control and content management platform designed to help parents create safe, curated digital experiences for their children. The Service includes:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>A parent dashboard for managing child profiles, content libraries, and device settings</li>
              <li>An Android-based kids launcher that provides a controlled environment for children</li>
              <li>Content filtering and curation tools powered by streaming service integrations</li>
              <li>Device pairing and management capabilities</li>
              <li>Screen time monitoring and limit-setting features</li>
              <li>Content safety reports and advisory information</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              We reserve the right to modify, suspend, or discontinue any part of the Service at any time, with or without notice. We will make reasonable efforts to notify users of significant changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#F77B8A] mb-4">3. User Accounts</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              To use the Service, you must create a parent account. You are responsible for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Providing accurate and complete registration information</li>
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use of your account</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              You may create child profiles under your parent account. You represent and warrant that you are the parent or legal guardian of any child whose profile you create, or that you have obtained the necessary consent from the child&rsquo;s parent or legal guardian. Each child profile is managed exclusively through the parent account and does not constitute a separate user account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#F77B8A] mb-4">4. Subscription & Payment</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Axolotly offers both free and paid subscription tiers. By subscribing to a paid plan, you agree to the following:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Billing:</strong> Subscription fees are billed on a recurring basis (monthly or annually) depending on the plan you select. Payment is due at the beginning of each billing cycle.</li>
              <li><strong>Payment Methods:</strong> We accept payment through the methods displayed at checkout. You authorize us to charge your selected payment method for all fees incurred.</li>
              <li><strong>Price Changes:</strong> We may change subscription prices with at least 30 days&rsquo; notice. Price changes will take effect at the start of your next billing cycle.</li>
              <li><strong>Refunds:</strong> Subscription fees are generally non-refundable. However, if you cancel within 14 days of your initial purchase and have not substantially used the Service, you may request a full refund by contacting our support team.</li>
              <li><strong>Free Trial:</strong> If we offer a free trial, you will not be charged until the trial period ends. You may cancel at any time during the trial to avoid being charged.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#F77B8A] mb-4">5. Content Management</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Axolotly provides tools to help parents curate and manage the content available to their children. You acknowledge and agree that:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Content availability depends on your active streaming service subscriptions and may change without notice as streaming providers update their catalogs</li>
              <li>Content ratings and safety information are sourced from third-party providers and may not always be complete or accurate</li>
              <li>Axolotly does not host, stream, or provide access to any video content directly; we facilitate access to content through your existing streaming subscriptions</li>
              <li>You are ultimately responsible for reviewing and approving the content available to your children</li>
              <li>Content reports and safety advisories are provided as informational tools and should not be the sole basis for content decisions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#F77B8A] mb-4">6. Device & Child Monitoring</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Axolotly enables parents to monitor and manage their children&rsquo;s device usage. By using these features, you acknowledge and agree that:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>You will only use monitoring features on devices used by children under your legal guardianship</li>
              <li>You are responsible for complying with all applicable laws regarding the monitoring of minors in your jurisdiction</li>
              <li>Device pairing requires physical access to the child&rsquo;s device and a valid 6-digit pairing code</li>
              <li>Screen time limits and content restrictions may not be 100% effective in all circumstances due to device-specific limitations</li>
              <li>We do not guarantee uninterrupted monitoring and are not liable for any gaps in monitoring coverage</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#F77B8A] mb-4">7. Acceptable Use</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              You agree not to use the Service to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Monitor or track any individual who is not your minor child or a minor under your legal guardianship</li>
              <li>Violate any applicable local, state, national, or international law or regulation</li>
              <li>Circumvent, disable, or interfere with security-related features of the Service</li>
              <li>Attempt to access accounts, devices, or data belonging to other users</li>
              <li>Use the Service for any commercial purpose beyond its intended family use</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Transmit any viruses, malware, or other harmful code through the Service</li>
              <li>Use automated systems (bots, scrapers) to access the Service without our written permission</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              We reserve the right to suspend or terminate your account if we reasonably believe you have violated these acceptable use guidelines.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#F77B8A] mb-4">8. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              The Service and its original content, features, and functionality are owned by Axolotly and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              The Axolotly name, logo, and all related names, logos, product and service names, designs, and slogans are trademarks of Axolotly. You may not use these marks without our prior written permission.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We grant you a limited, non-exclusive, non-transferable, revocable license to use the Service for its intended purpose, subject to these Terms. This license does not include the right to modify, distribute, or create derivative works based on the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#F77B8A] mb-4">9. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL AXOLOTLY, ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Loss of profits, data, use, goodwill, or other intangible losses</li>
              <li>Any unauthorized access to or alteration of your data</li>
              <li>Any content or conduct of any third party on the Service</li>
              <li>Any failure of the Service to prevent access to specific content</li>
              <li>Any gaps in device monitoring or screen time enforcement</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              Our total liability to you for all claims arising from or related to the Service shall not exceed the amount you have paid us in the twelve (12) months preceding the claim. The Service is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis without warranties of any kind, whether express or implied.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#F77B8A] mb-4">10. Termination</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              You may terminate your account at any time by contacting our support team or through your account settings. Upon termination:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Your right to access and use the Service will cease immediately</li>
              <li>All child profiles and associated data will be scheduled for deletion</li>
              <li>Paired devices will be automatically unpaired</li>
              <li>Any remaining subscription period will not be refunded unless required by applicable law</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              We may terminate or suspend your account immediately, without prior notice, if we determine that you have breached these Terms or if we are required to do so by law. We may also terminate the Service entirely with 30 days&rsquo; notice to all users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#F77B8A] mb-4">11. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Any disputes arising from these Terms or the Service shall first be resolved through good-faith negotiation. If negotiation fails, disputes shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association, except that either party may seek injunctive or equitable relief in any court of competent jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#F77B8A] mb-4">12. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We reserve the right to modify these Terms at any time. When we make material changes, we will:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Update the &ldquo;Last Updated&rdquo; date at the top of this page</li>
              <li>Notify you via email or through a prominent notice within the Service</li>
              <li>Provide at least 30 days&rsquo; notice before material changes take effect</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              Your continued use of the Service after the effective date of any changes constitutes your acceptance of the updated Terms. If you do not agree with the revised Terms, you must stop using the Service and terminate your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#F77B8A] mb-4">13. Contact</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <p className="text-gray-700 mb-2"><strong>Email:</strong> legal@axolotly.app</p>
              <p className="text-gray-700 mb-2"><strong>Support:</strong> support@axolotly.app</p>
              <p className="text-gray-700"><strong>Website:</strong> axolotly.app/contact</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}