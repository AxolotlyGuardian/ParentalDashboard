'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';

export default function CookiePolicyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header variant="pink" />

      <main className="flex-1">
        <section className="bg-gradient-to-br from-pink-50 via-white to-coral-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
            <p className="text-gray-500 text-sm">Last updated: January 1, 2025</p>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-4xl mx-auto px-6 space-y-12">

            <div>
              <h2 className="text-2xl font-bold text-[#F77B8A] mb-4">What Are Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Cookies are small text files that are stored on your device (computer, tablet, or mobile phone) when you visit a website. They are widely used to make websites work more efficiently, provide a better user experience, and give website owners useful information about how their site is being used.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Cookies allow us to recognize your device and remember certain information about your visit, such as your preferences and settings. They do not contain personal information like your name or email address unless you have provided that information to us.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#F77B8A] mb-4">How We Use Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Axolotly uses cookies and similar technologies for a variety of purposes. Below is a breakdown of the types of cookies we use and why we use them.
              </p>

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#F77B8A]/10">
                      <th className="px-6 py-4 text-sm font-semibold text-gray-900 border-b border-gray-200">Cookie Type</th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-900 border-b border-gray-200">Purpose</th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-900 border-b border-gray-200">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-[#F77B8A]">Essential</td>
                      <td className="px-6 py-4 text-sm text-gray-600">Required for the website to function properly. These include cookies that enable you to log in, manage your account, and access secure areas of the site. Without these cookies, services you have asked for cannot be provided.</td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">Session &ndash; 30 days</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-[#F77B8A]">Functional</td>
                      <td className="px-6 py-4 text-sm text-gray-600">Allow us to remember your preferences and settings, such as your selected language, region, and display preferences. These cookies enhance your experience by personalizing the site for you.</td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">Up to 1 year</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-[#F77B8A]">Analytics</td>
                      <td className="px-6 py-4 text-sm text-gray-600">Help us understand how visitors interact with our website by collecting and reporting information anonymously. This data helps us improve the structure, content, and performance of our site.</td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">Up to 2 years</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-8 space-y-6">
                <div className="bg-pink-50/60 rounded-xl p-6 border border-pink-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Essential Cookies</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    These cookies are strictly necessary for the operation of our website and services. They include session cookies that keep you logged in as you navigate between pages, CSRF tokens that protect against cross-site request forgery, and cookies that remember your authentication state. Because these cookies are essential, they cannot be disabled.
                  </p>
                </div>

                <div className="bg-pink-50/60 rounded-xl p-6 border border-pink-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Functional Cookies</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Functional cookies allow Axolotly to remember choices you make and provide enhanced, more personalized features. For example, these cookies may remember which kid profile you last viewed, your preferred dashboard layout, or your notification preferences. The information these cookies collect may be anonymized and they cannot track your browsing activity on other websites.
                  </p>
                </div>

                <div className="bg-pink-50/60 rounded-xl p-6 border border-pink-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Cookies</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    We use analytics cookies to understand how visitors engage with our website. These cookies help us measure the number of visitors, see which pages are visited most often, and understand how users navigate through the site. All information these cookies collect is aggregated and therefore anonymous. We use this data solely to improve how our website works.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#F77B8A] mb-4">Third-Party Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                In some cases, we use cookies provided by trusted third parties. The following section details which third-party cookies you might encounter through our site:
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#F77B8A] rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Analytics providers:</strong> We may use services like Google Analytics to help us understand how our site is used. These cookies may track things such as how long you spend on the site and the pages you visit, so we can continue to produce engaging content.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#F77B8A] rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Payment processors:</strong> When you subscribe to Axolotly, our payment processor (Stripe) may set cookies to enable secure payment processing and fraud prevention.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#F77B8A] rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Authentication services:</strong> If you sign in using a third-party account, the authentication provider may set cookies to manage your sign-in session.</span>
                </li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                We do not use any advertising or tracking cookies. Axolotly does not sell your data or serve targeted advertisements.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#F77B8A] mb-4">Managing Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You can control and manage cookies in various ways. Most web browsers allow you to manage your cookie preferences through their settings. You can set your browser to refuse cookies, or to alert you when cookies are being sent. Please note that if you disable or refuse cookies, some parts of our website may become inaccessible or not function properly.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Here are links to cookie management instructions for common browsers:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#F77B8A] rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Google Chrome:</strong> Settings &gt; Privacy and Security &gt; Cookies and other site data</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#F77B8A] rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Mozilla Firefox:</strong> Settings &gt; Privacy & Security &gt; Cookies and Site Data</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#F77B8A] rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Safari:</strong> Preferences &gt; Privacy &gt; Manage Website Data</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#F77B8A] rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Microsoft Edge:</strong> Settings &gt; Cookies and site permissions &gt; Manage and delete cookies</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#F77B8A] mb-4">Changes to This Cookie Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our data practices. When we make changes, we will update the &ldquo;Last updated&rdquo; date at the top of this page. We encourage you to review this Cookie Policy periodically to stay informed about how we use cookies. Any changes will become effective when we post the revised policy on this page.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#F77B8A] mb-4">Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about our use of cookies or this Cookie Policy, please contact us:
              </p>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <p className="text-gray-700 mb-2"><strong>Email:</strong> support@axolotly.app</p>
                <p className="text-gray-700 mb-4"><strong>Subject:</strong> Cookie Policy Inquiry</p>
                <button
                  onClick={() => router.push('/contact')}
                  className="bg-[#F77B8A] hover:shadow-[0_6px_20px_rgba(247,123,138,0.4)] hover:scale-105 text-white font-semibold py-2.5 px-6 rounded-full transition-all duration-200 text-sm"
                >
                  Contact Us
                </button>
              </div>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}