'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function COPPACompliancePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header variant="pink" />

      <main className="flex-1">
        <section className="bg-gradient-to-br from-pink-50 via-white to-orange-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-4">
              <span className="inline-flex items-center gap-2 bg-[#F77B8A]/10 text-[#F77B8A] px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Children&apos;s Privacy
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-4">
              COPPA Compliance
            </h1>
            <p className="text-gray-500 text-center text-lg mb-2">
              Our commitment to protecting children&apos;s privacy and safety online
            </p>
            <p className="text-gray-400 text-center text-sm">Last updated: January 15, 2026</p>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-4xl mx-auto px-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 space-y-12">

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <span className="w-10 h-10 bg-[#F77B8A]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#F77B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </span>
                  Our Commitment
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Axolotly is built BY parents, FOR parents. We understand the importance of protecting children&apos;s privacy because we are parents ourselves. Our platform is designed from the ground up with children&apos;s safety and privacy as our highest priority.
                </p>
                <p className="text-gray-600 leading-relaxed mb-4">
                  We are fully committed to complying with the Children&apos;s Online Privacy Protection Act (COPPA) and go above and beyond its requirements to ensure that every child&apos;s data is handled with the utmost care and responsibility.
                </p>
                <div className="bg-pink-50 border border-pink-100 rounded-xl p-6">
                  <p className="text-gray-700 font-medium">
                    At Axolotly, the parent is always in control. We never collect, use, or share a child&apos;s personal information without verified parental consent, and parents can review, modify, or delete their child&apos;s data at any time.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <span className="w-10 h-10 bg-[#F77B8A]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#F77B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  What is COPPA?
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  The Children&apos;s Online Privacy Protection Act (COPPA) is a United States federal law enacted in 1998 and enforced by the Federal Trade Commission (FTC). It is designed to protect the privacy of children under the age of 13 by regulating how online services collect, use, and disclose personal information from minors.
                </p>
                <p className="text-gray-600 leading-relaxed mb-4">
                  COPPA requires operators of websites and online services directed at children, or those who knowingly collect personal information from children under 13, to:
                </p>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-[#F77B8A]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-[#F77B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Post a clear, comprehensive privacy policy describing their information practices
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-[#F77B8A]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-[#F77B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Obtain verifiable parental consent before collecting personal information from children
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-[#F77B8A]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-[#F77B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Give parents the choice to consent to collection and use of their child&apos;s information
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-[#F77B8A]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-[#F77B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Provide parents access to their child&apos;s personal information and the ability to delete it
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-[#F77B8A]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-[#F77B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Maintain the confidentiality, security, and integrity of children&apos;s personal information
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <span className="w-10 h-10 bg-[#F77B8A]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#F77B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </span>
                  Information We Collect from Children
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Axolotly is a parental control platform where the parent account holder creates and manages all child profiles. We collect only the minimum amount of information necessary to provide our service. Information associated with child profiles includes:
                </p>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-3">
                    <span className="font-semibold text-[#F77B8A] flex-shrink-0">&#8226;</span>
                    <span><strong>Display name or nickname</strong> &mdash; chosen by the parent to identify the child&apos;s profile within the family account. This does not need to be the child&apos;s real name.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-semibold text-[#F77B8A] flex-shrink-0">&#8226;</span>
                    <span><strong>Age or date of birth</strong> &mdash; provided by the parent to enable age-appropriate content filtering and recommendations.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-semibold text-[#F77B8A] flex-shrink-0">&#8226;</span>
                    <span><strong>Content viewing activity</strong> &mdash; which shows and movies the child accesses through the Axolotly launcher, used to provide parents with usage reports.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-semibold text-[#F77B8A] flex-shrink-0">&#8226;</span>
                    <span><strong>Device usage data</strong> &mdash; screen time duration and session information, visible only to the parent through their dashboard.</span>
                  </li>
                </ul>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mt-6">
                  <p className="text-gray-700 text-sm">
                    <strong>Important:</strong> Children do not create their own accounts. All child profiles are created and managed exclusively by the parent or legal guardian. Children interact only with the kid-friendly launcher interface and never provide personal information directly.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <span className="w-10 h-10 bg-[#F77B8A]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#F77B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  Parental Consent
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Because Axolotly is a tool designed for parents to manage their children&apos;s digital experiences, parental consent is inherently built into our service model:
                </p>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-3">
                    <span className="font-semibold text-[#F77B8A] flex-shrink-0">&#8226;</span>
                    <span><strong>Account creation requires an adult.</strong> Only parents or legal guardians can create an Axolotly account, providing their email address and agreeing to our terms of service and privacy policy.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-semibold text-[#F77B8A] flex-shrink-0">&#8226;</span>
                    <span><strong>Parents create all child profiles.</strong> By creating a child profile and adding it to the Axolotly launcher, the parent provides affirmative consent for the collection of the limited information described above.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-semibold text-[#F77B8A] flex-shrink-0">&#8226;</span>
                    <span><strong>Parents control all settings.</strong> Content libraries, screen time limits, and device pairing are all managed exclusively through the parent dashboard.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-semibold text-[#F77B8A] flex-shrink-0">&#8226;</span>
                    <span><strong>Consent can be revoked at any time.</strong> Parents can delete a child&apos;s profile or their entire account at any time, which will remove all associated data.</span>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <span className="w-10 h-10 bg-[#F77B8A]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#F77B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </span>
                  Parental Rights
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  As a parent or legal guardian using Axolotly, you have the following rights regarding your child&apos;s information:
                </p>
                <div className="grid gap-4">
                  <div className="bg-gray-50 rounded-xl p-5">
                    <h3 className="font-semibold text-gray-900 mb-2">Review</h3>
                    <p className="text-gray-600 text-sm">You can review all information associated with your child&apos;s profile at any time through your parent dashboard, including viewing history, screen time reports, and profile details.</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-5">
                    <h3 className="font-semibold text-gray-900 mb-2">Modify</h3>
                    <p className="text-gray-600 text-sm">You can update your child&apos;s profile information, adjust content filters, modify screen time limits, and change any settings associated with their account.</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-5">
                    <h3 className="font-semibold text-gray-900 mb-2">Delete</h3>
                    <p className="text-gray-600 text-sm">You can delete your child&apos;s profile at any time, which will permanently remove all associated data including viewing history and usage reports.</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-5">
                    <h3 className="font-semibold text-gray-900 mb-2">Refuse Further Collection</h3>
                    <p className="text-gray-600 text-sm">You can withdraw consent and stop further collection of your child&apos;s information by removing their profile or deleting your account entirely.</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <span className="w-10 h-10 bg-[#F77B8A]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#F77B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  Data Security for Children
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  We take the security of children&apos;s data extremely seriously and implement robust measures to protect it:
                </p>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-3">
                    <span className="font-semibold text-[#F77B8A] flex-shrink-0">&#8226;</span>
                    <span><strong>Encryption in transit and at rest.</strong> All data transmitted between devices and our servers is encrypted using TLS 1.2 or higher. Stored data is encrypted using industry-standard AES-256 encryption.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-semibold text-[#F77B8A] flex-shrink-0">&#8226;</span>
                    <span><strong>Access controls.</strong> Only the parent account holder can access their child&apos;s profile data. Our internal team access is strictly limited and monitored.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-semibold text-[#F77B8A] flex-shrink-0">&#8226;</span>
                    <span><strong>Data minimization.</strong> We collect only the information strictly necessary to provide our service. We do not collect photos, precise location, or contact information from children.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-semibold text-[#F77B8A] flex-shrink-0">&#8226;</span>
                    <span><strong>No advertising to children.</strong> We never use children&apos;s data for advertising purposes, and the kids launcher interface contains no advertisements.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-semibold text-[#F77B8A] flex-shrink-0">&#8226;</span>
                    <span><strong>Regular security audits.</strong> We conduct regular security assessments to identify and address potential vulnerabilities in our systems.</span>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <span className="w-10 h-10 bg-[#F77B8A]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#F77B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </span>
                  Third-Party Services
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Axolotly integrates with streaming services (such as Netflix, Disney+, and others) to help parents curate content libraries for their children. It is important to understand how these integrations work:
                </p>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-3">
                    <span className="font-semibold text-[#F77B8A] flex-shrink-0">&#8226;</span>
                    <span>We do not share children&apos;s personal information with streaming service providers. Axolotly acts as a launcher that directs children to parent-approved content.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-semibold text-[#F77B8A] flex-shrink-0">&#8226;</span>
                    <span>We use TMDB (The Movie Database) for content metadata such as show descriptions, ratings, and images. No child data is shared with TMDB.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-semibold text-[#F77B8A] flex-shrink-0">&#8226;</span>
                    <span>Any third-party service providers we use for infrastructure (such as hosting and database services) are contractually bound to maintain the same level of data protection.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-semibold text-[#F77B8A] flex-shrink-0">&#8226;</span>
                    <span>We do not use any third-party analytics or tracking tools that would collect children&apos;s personal information.</span>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <span className="w-10 h-10 bg-[#F77B8A]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#F77B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  Contact Our Privacy Team
                </h2>
                <p className="text-gray-600 leading-relaxed mb-6">
                  If you have any questions about our COPPA compliance practices, wish to exercise your parental rights, or have concerns about how your child&apos;s information is being handled, please contact our dedicated privacy team:
                </p>
                <div className="bg-gradient-to-r from-pink-50 to-orange-50 border border-pink-100 rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-[#F77B8A] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-gray-900 font-medium">privacy@axolotly.app</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-[#F77B8A] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-500">Response Time</p>
                      <p className="text-gray-900 font-medium">Within 48 hours for all privacy-related inquiries</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-[#F77B8A] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-500">General Support</p>
                      <p className="text-gray-900 font-medium">support@axolotly.app</p>
                    </div>
                  </div>
                </div>
                <p className="text-gray-500 text-sm mt-6">
                  You may also contact the Federal Trade Commission (FTC) for more information about COPPA at{' '}
                  <a href="https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa" target="_blank" rel="noopener noreferrer" className="text-[#F77B8A] hover:underline">
                    ftc.gov
                  </a>.
                </p>
              </div>

            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}