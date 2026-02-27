'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header variant="pink" />

      <main className="flex-1">
        <section className="bg-gradient-to-br from-pink-50 via-white to-rose-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-gray-500 text-sm">Last Updated: January 1, 2026</p>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-4xl mx-auto px-6 space-y-12">

            <div>
              <p className="text-gray-700 leading-relaxed">
                At Axolotly, we take your privacy and the privacy of your children seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our parental control application and related services. Please read this policy carefully. By using Axolotly, you consent to the practices described in this Privacy Policy.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#F77B8A] mb-4">1. Information We Collect</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We collect information that you provide directly and information that is generated through your use of our services.
              </p>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Information</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4 ml-2">
                <li>Parent name and email address</li>
                <li>Account credentials (passwords are encrypted and never stored in plain text)</li>
                <li>Billing and subscription information</li>
              </ul>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Child Profile Information</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4 ml-2">
                <li>Child&apos;s display name (first name or nickname only)</li>
                <li>Age or date of birth (used to provide age-appropriate content filtering)</li>
                <li>Content preferences and restrictions set by parents</li>
              </ul>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Device Information</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-2">
                <li>Device identifiers and pairing codes</li>
                <li>Device type, model, and operating system version</li>
                <li>App usage data on managed devices</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#F77B8A] mb-4">2. How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use the information we collect for the following purposes:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-2">
                <li>To create and manage your Axolotly account</li>
                <li>To provide parental control features, including content filtering, screen time management, and device monitoring</li>
                <li>To pair and manage child devices securely</li>
                <li>To curate and recommend age-appropriate content for your children</li>
                <li>To process subscription payments and manage billing</li>
                <li>To send important account notifications and service updates</li>
                <li>To improve our services, troubleshoot issues, and develop new features</li>
                <li>To comply with legal obligations and enforce our terms of service</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#F77B8A] mb-4">3. Children&apos;s Privacy (COPPA Compliance)</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Axolotly is designed to help parents manage their children&apos;s digital experiences. We are committed to complying with the Children&apos;s Online Privacy Protection Act (COPPA) and take the following measures:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-2">
                <li>We do not collect personal information directly from children under 13 without verified parental consent</li>
                <li>All child profiles are created and managed exclusively by the parent or legal guardian</li>
                <li>We collect only the minimum information necessary to provide our parental control services</li>
                <li>Parents have full access to review, modify, or delete their child&apos;s information at any time</li>
                <li>We do not serve behavioral advertising to children</li>
                <li>We do not require children to provide more information than is reasonably necessary to use the service</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                For more details about our COPPA compliance practices, please visit our <a href="/coppa-compliance" className="text-[#F77B8A] hover:underline font-medium">COPPA Compliance page</a>.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#F77B8A] mb-4">4. Data Sharing</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We do not sell your personal information or your children&apos;s information to third parties. We may share information only in the following limited circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-2">
                <li><strong>Service Providers:</strong> We work with trusted third-party service providers who assist us in operating our platform, processing payments, and analyzing usage to improve our services. These providers are contractually obligated to protect your data.</li>
                <li><strong>Content Partners:</strong> We integrate with streaming services (Netflix, Disney+, etc.) to provide content metadata for filtering purposes. We do not share your personal data with these services.</li>
                <li><strong>Legal Requirements:</strong> We may disclose information if required by law, court order, or governmental regulation, or if we believe disclosure is necessary to protect the rights, safety, or property of Axolotly, our users, or others.</li>
                <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you of any such change in ownership or control of your personal information.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#F77B8A] mb-4">5. Data Security</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We implement industry-standard security measures to protect your information, including:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-2">
                <li>Encryption of data in transit (TLS/SSL) and at rest</li>
                <li>Secure password hashing using bcrypt</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Access controls limiting employee access to personal data</li>
                <li>Secure device pairing using time-limited, one-time codes</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                While we strive to protect your information, no method of electronic transmission or storage is 100% secure. We encourage you to use strong, unique passwords and to keep your account credentials confidential.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#F77B8A] mb-4">6. Your Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-2">
                <li><strong>Access:</strong> You can request a copy of the personal data we hold about you and your children</li>
                <li><strong>Correction:</strong> You can update or correct your account information at any time through the Parent Dashboard</li>
                <li><strong>Deletion:</strong> You can request deletion of your account and all associated data, including child profiles</li>
                <li><strong>Data Portability:</strong> You can request an export of your data in a commonly used format</li>
                <li><strong>Opt-Out:</strong> You can opt out of non-essential communications at any time</li>
                <li><strong>Parental Rights:</strong> Parents can review, modify, or delete any information associated with their child&apos;s profile at any time</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                To exercise any of these rights, please contact us at <a href="mailto:privacy@axolotly.app" className="text-[#F77B8A] hover:underline font-medium">privacy@axolotly.app</a>.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#F77B8A] mb-4">7. Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Axolotly uses cookies and similar tracking technologies to enhance your experience. We use the following types of cookies:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-2">
                <li><strong>Essential Cookies:</strong> Required for the basic functionality of our platform, including authentication and session management</li>
                <li><strong>Functional Cookies:</strong> Used to remember your preferences and settings</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our platform so we can improve our services</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                We do not use advertising or tracking cookies on children&apos;s devices. For more information, please see our <a href="/cookie-policy" className="text-[#F77B8A] hover:underline font-medium">Cookie Policy</a>.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#F77B8A] mb-4">8. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions or concerns about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <ul className="text-gray-700 space-y-2">
                  <li><strong>Email:</strong> <a href="mailto:privacy@axolotly.app" className="text-[#F77B8A] hover:underline">privacy@axolotly.app</a></li>
                  <li><strong>General Support:</strong> <a href="mailto:support@axolotly.app" className="text-[#F77B8A] hover:underline">support@axolotly.app</a></li>
                  <li><strong>Contact Form:</strong> <a href="/contact" className="text-[#F77B8A] hover:underline">axolotly.app/contact</a></li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#F77B8A] mb-4">9. Changes to This Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. When we make material changes, we will notify you by email or through a prominent notice on our platform prior to the changes taking effect. We encourage you to review this Privacy Policy periodically. Your continued use of Axolotly after any changes indicates your acceptance of the updated policy.
              </p>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}