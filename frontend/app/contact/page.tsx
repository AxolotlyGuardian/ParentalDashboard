'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setFormData({ name: '', email: '', subject: 'General', message: '' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-pink-50/40 to-white">
      <Header variant="pink" />

      <main className="flex-1">
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Contact <span className="text-[#F77B8A]">Us</span>
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Have a question, suggestion, or need help? We&apos;d love to hear from you. Our team typically responds within 24 hours.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
              <div className="lg:col-span-2">
                {submitted && (
                  <div className="mb-8 bg-green-50 border border-green-200 rounded-2xl p-6 flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-800 mb-1">Message Sent Successfully!</h3>
                      <p className="text-green-700 text-sm">Thank you for reaching out. We&apos;ll get back to you within 24 hours.</p>
                    </div>
                    <button onClick={() => setSubmitted(false)} className="ml-auto text-green-400 hover:text-green-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-100 p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Your full name"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#F77B8A] focus:ring-2 focus:ring-[#F77B8A]/20 outline-none transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#F77B8A] focus:ring-2 focus:ring-[#F77B8A]/20 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#F77B8A] focus:ring-2 focus:ring-[#F77B8A]/20 outline-none transition-all text-sm bg-white"
                    >
                      <option value="General">General Inquiry</option>
                      <option value="Technical Support">Technical Support</option>
                      <option value="Billing">Billing</option>
                      <option value="Feature Request">Feature Request</option>
                      <option value="Bug Report">Bug Report</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      placeholder="How can we help you?"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#F77B8A] focus:ring-2 focus:ring-[#F77B8A]/20 outline-none transition-all text-sm resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#F77B8A] hover:shadow-[0_6px_20px_rgba(247,123,138,0.4)] hover:scale-[1.01] text-white font-semibold py-3.5 px-8 rounded-xl transition-all duration-200 text-sm"
                  >
                    Send Message
                  </button>
                </form>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-100 p-8">
                  <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-[#F77B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Email Us</h3>
                  <a href="mailto:support@axolotly.app" className="text-[#F77B8A] hover:underline text-sm font-medium">
                    support@axolotly.app
                  </a>
                  <p className="text-gray-500 text-sm mt-2">We aim to respond to all emails within 24 hours during business days.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-100 p-8">
                  <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-[#F77B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Response Time</h3>
                  <p className="text-gray-500 text-sm">Most inquiries are answered within 24 hours. Billing and technical support requests are prioritized.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-100 p-8">
                  <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-[#F77B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Quick Answers</h3>
                  <p className="text-gray-500 text-sm mb-3">Check our FAQs for instant answers to common questions.</p>
                  <a href="/faqs" className="text-[#F77B8A] hover:underline text-sm font-medium">
                    Visit FAQs &rarr;
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}