'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "What is Axolotly?",
    answer: "Axolotly is a family-friendly parental control platform that helps parents create safe, curated digital experiences for their children. With Axolotly, you can manage which streaming content your kids can access, set screen time limits, and monitor device usage \u2014 all from a simple parent dashboard. Our kid-safe launcher replaces the default home screen on Android devices, ensuring children only see content you\u2019ve approved."
  },
  {
    question: "What devices are supported?",
    answer: "Axolotly\u2019s kid-safe launcher currently supports Android devices (phones and tablets) running Android 8.0 or later. The parent dashboard is fully web-based, so you can manage your family\u2019s settings from any device with a modern browser \u2014 including Windows, Mac, iOS, and Android. We\u2019re actively working on expanding device support in the future."
  },
  {
    question: "How does content filtering work?",
    answer: "Axolotly uses a multi-layered approach to content filtering. Parents curate a library of approved shows and movies from supported streaming services. Our system cross-references content with trusted databases for age ratings, content warnings, and episode-level details. Only content you\u2019ve explicitly approved appears in your child\u2019s launcher, so there are no surprises. You can also use our smart tagging system to filter by themes like violence, language, or scary content."
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. Security is a top priority at Axolotly. All data is transmitted using industry-standard TLS encryption. We store minimal personal information and never sell your data to third parties. Children\u2019s data receives extra protection in compliance with COPPA regulations. Our servers are hosted on secure, reputable cloud infrastructure, and we conduct regular security reviews to keep your family\u2019s information safe."
  },
  {
    question: "How much does Axolotly cost?",
    answer: "Axolotly offers a free tier that includes basic content management for one child profile. Our premium plans start at an affordable monthly rate and include features like multiple kid profiles, advanced screen time controls, detailed activity reports, and priority support. Visit our Pricing page for the latest plan details and to find the option that works best for your family."
  },
  {
    question: "Can I manage multiple kids?",
    answer: "Yes! With a premium plan, you can create individual profiles for each of your children. Each profile has its own approved content library, screen time settings, and age-appropriate filters. This means your 5-year-old and your 12-year-old can each have a tailored experience that\u2019s right for their age and maturity level. You manage everything from a single parent dashboard."
  },
  {
    question: "How does device pairing work?",
    answer: "Pairing is quick and simple. First, install the Axolotly Launcher app on your child\u2019s Android device. The app will display a unique 6-digit pairing code. Then, log in to your parent dashboard, navigate to Devices, and enter the code. The device will instantly link to your account, and your child\u2019s approved content library will appear on their device. The entire process takes less than a minute."
  },
  {
    question: "What streaming services are supported?",
    answer: "Axolotly supports a growing list of popular streaming services including Netflix, Disney+, Amazon Prime Video, Hulu, HBO Max, Apple TV+, Paramount+, and Peacock. We\u2019re continuously adding more services based on parent feedback. Our content database includes thousands of shows and movies across these platforms, complete with detailed age ratings and content advisories."
  },
  {
    question: "Can kids bypass the launcher?",
    answer: "The Axolotly Launcher is designed to be kid-resistant. When set as the default home screen on an Android device, it replaces the standard launcher so children can only access approved apps and content. The launcher requires a parent PIN to exit or modify settings. While no system is 100% foolproof, our launcher includes multiple safeguards to prevent unauthorized access to unapproved content or device settings."
  },
  {
    question: "How do screen time limits work?",
    answer: "Screen time limits let you set daily usage allowances for each child profile. You can configure total daily screen time, set specific allowed hours (e.g., no screens after 8 PM), and even set per-app time limits. When a child reaches their limit, the launcher gently notifies them and locks access until the next allowed period. Parents can override limits temporarily from the dashboard if needed."
  },
  {
    question: "Do you comply with COPPA?",
    answer: "Yes, Axolotly is fully committed to COPPA (Children\u2019s Online Privacy Protection Act) compliance. We collect minimal information from children, require verifiable parental consent before creating child profiles, and give parents full control over their children\u2019s data. Parents can review, modify, or delete their child\u2019s information at any time. Visit our COPPA Compliance page for complete details on our practices."
  },
  {
    question: "How do I cancel my subscription?",
    answer: "You can cancel your subscription at any time from your parent dashboard under Account Settings. There are no cancellation fees or long-term contracts. When you cancel, you\u2019ll continue to have access to your premium features until the end of your current billing period. Your data will be retained for 30 days after cancellation in case you decide to return, after which it will be permanently deleted upon request."
  }
];

function FAQAccordionItem({ item }: { item: FAQItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden transition-all duration-200 hover:border-[#F77B8A]/30">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-5 text-left bg-white hover:bg-pink-50/30 transition-colors"
      >
        <span className="text-gray-800 font-semibold text-lg pr-4">{item.question}</span>
        <svg
          className={`w-5 h-5 text-[#F77B8A] flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-6 pb-5 pt-0">
          <p className="text-gray-600 leading-relaxed">{item.answer}</p>
        </div>
      </div>
    </div>
  );
}

export default function FAQsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-pink-50/40 to-white">
      <Header variant="pink" />

      <main className="flex-1">
        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-pink-100/60 text-[#F77B8A] px-4 py-2 rounded-full text-sm font-medium mb-6">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                FAQs
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Find answers to common questions about Axolotly and how it helps keep your family safe online.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <FAQAccordionItem key={index} item={faq} />
              ))}
            </div>

            <div className="mt-20 text-center bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-10 border border-pink-100">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-[#F77B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Still have questions?</h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Can&apos;t find what you&apos;re looking for? Our support team is here to help you with any questions about Axolotly.
              </p>
              <a
                href="/contact"
                className="inline-flex items-center gap-2 bg-[#F77B8A] hover:shadow-[0_6px_20px_rgba(247,123,138,0.4)] hover:scale-105 text-white font-semibold py-3 px-8 rounded-full transition-all duration-200"
              >
                Contact Us
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}