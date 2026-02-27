'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const steps = [
  {
    number: 1,
    title: 'Create Your Parent Account',
    description:
      'Sign up for a free Axolotly account using your email address. You\'ll set up your parent dashboard where you can manage everything — from content libraries to screen time rules. The process takes less than a minute, and no credit card is required to get started.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    number: 2,
    title: 'Add Kid Profiles',
    description:
      'Create individual profiles for each of your children. Customize their name, age, and avatar. Each profile gets its own content library and screen time settings, so you can tailor the experience to each child\'s age and maturity level.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    number: 3,
    title: 'Install the Launcher on an Android Device',
    description:
      'Download and install the Axolotly Kids Launcher on your child\'s Android tablet or phone. The launcher replaces the default home screen with a safe, kid-friendly interface that only shows the apps and content you\'ve approved.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    number: 4,
    title: 'Pair with a 6-Digit Code',
    description:
      'Open the Axolotly Launcher on the child\'s device and enter the unique 6-digit pairing code displayed in your parent dashboard. This securely links the device to your account, giving you full remote control over the child\'s experience.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
  {
    number: 5,
    title: 'Curate the Content Library',
    description:
      'Browse thousands of shows and movies from popular streaming services and hand-pick what your child can watch. Use age ratings, content tags, and episode-level reviews to build a library you feel great about. You can update it anytime from your dashboard.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    number: 6,
    title: 'Set Screen Time Limits',
    description:
      'Define daily screen time limits, allowed hours, and bedtime schedules for each child. Axolotly enforces the rules automatically on the device — no arguments, no workarounds. You can adjust limits on the fly from the parent dashboard whenever you need to.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function SetupGuidePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-pink-50/40 to-white">
      <Header variant="pink" />

      <main className="flex-1">
        <section className="max-w-4xl mx-auto px-6 pt-16 pb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Setup Guide
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get Axolotly up and running in just a few minutes. Follow these simple steps to create a safe, curated digital experience for your kids.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 pb-20">
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#F77B8A] via-[#F77B8A]/40 to-transparent hidden md:block" />

            <div className="space-y-12">
              {steps.map((step) => (
                <div key={step.number} className="relative flex gap-6 md:gap-10 items-start">
                  <div className="relative z-10 flex-shrink-0 w-16 h-16 rounded-2xl bg-[#F77B8A] text-white flex items-center justify-center shadow-lg shadow-[#F77B8A]/25">
                    <span className="text-2xl font-bold">{step.number}</span>
                  </div>

                  <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-[#F77B8A]">{step.icon}</div>
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                        {step.title}
                      </h2>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-r from-[#F77B8A] to-[#f9919e] py-16 mb-0">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to start?
            </h2>
            <p className="text-white/90 text-lg mb-8 max-w-xl mx-auto">
              Create your free parent account today and set up a safe digital space for your kids in minutes.
            </p>
            <button
              onClick={() => router.push('/parent?signup=true')}
              className="bg-white text-[#F77B8A] font-semibold py-3 px-10 rounded-full text-lg hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              Get Started Free
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
