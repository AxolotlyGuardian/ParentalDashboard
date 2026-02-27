'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      <Header variant="pink" />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#FFF0F3] via-white to-[#F0F4FF] py-20 md:py-28">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#F77B8A]/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl"></div>
          </div>
          <div className="max-w-7xl mx-auto px-6 relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-[#F77B8A]/10 text-[#F77B8A] px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-[#F77B8A] rounded-full animate-pulse"></span>
                Trusted by families everywhere
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
                Protection that grows{' '}
                <span className="text-[#F77B8A]">with your family</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto">
                Take control of your children&apos;s screen time with smart content filtering, device management, and real-time monitoring. Simple for parents, safe for kids.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => router.push('/parent?signup=true')}
                  className="w-full sm:w-auto bg-[#F77B8A] hover:shadow-[0_8px_30px_rgba(247,123,138,0.4)] hover:scale-105 text-white font-bold py-4 px-10 rounded-full text-lg transition-all duration-200"
                >
                  Start Free Trial
                </button>
                <button
                  onClick={() => router.push('/how-it-works')}
                  className="w-full sm:w-auto text-gray-700 hover:text-[#F77B8A] font-semibold py-4 px-10 rounded-full text-lg transition-all border border-gray-200 hover:border-[#F77B8A]/40 hover:bg-pink-50/40"
                >
                  See How It Works
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Bar */}
        <section className="border-y border-gray-100 bg-gray-50/50 py-6">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 text-gray-400 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                <span className="text-gray-600 font-medium">COPPA Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                <span className="text-gray-600 font-medium">No Ads or Tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                <span className="text-gray-600 font-medium">Works with 16+ Streaming Apps</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                <span className="text-gray-600 font-medium">Android Supported</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 md:py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Everything you need to keep kids safe</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Powerful tools that give you control without taking away the fun.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="group p-8 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(247,123,138,0.15)] hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">🎬</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Content Filtering</h3>
                <p className="text-gray-600 leading-relaxed">
                  Search thousands of movies and TV shows. Allow or block specific titles for each child with a single tap.
                </p>
              </div>

              <div className="group p-8 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(247,123,138,0.15)] hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">⏱️</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Screen Time Limits</h3>
                <p className="text-gray-600 leading-relaxed">
                  Set daily screen time limits and bedtime schedules. Kids get gentle reminders when their time is almost up.
                </p>
              </div>

              <div className="group p-8 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(247,123,138,0.15)] hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">📱</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Device Management</h3>
                <p className="text-gray-600 leading-relaxed">
                  Pair Android devices with a simple 6-digit code. The kid-friendly launcher shows only approved content.
                </p>
              </div>

              <div className="group p-8 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(247,123,138,0.15)] hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">👥</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Kid Profiles</h3>
                <p className="text-gray-600 leading-relaxed">
                  Create individual profiles for each child with age-appropriate settings, PIN-protected access, and personalized rules.
                </p>
              </div>

              <div className="group p-8 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(247,123,138,0.15)] hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Activity Monitoring</h3>
                <p className="text-gray-600 leading-relaxed">
                  See what your kids are watching in real-time. Get usage reports across all devices from one dashboard.
                </p>
              </div>

              <div className="group p-8 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(247,123,138,0.15)] hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">🏷️</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Content Tags</h3>
                <p className="text-gray-600 leading-relaxed">
                  Community-driven content warnings flag violence, language, and age-inappropriate scenes so you can make informed decisions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Axolotly Section */}
        <section className="py-20 md:py-24 bg-gradient-to-br from-[#FFF0F3] via-[#FFF5F7] to-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6">
                  Why families choose <span className="text-[#F77B8A]">Axolotly</span>
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed mb-8">
                  Named after the resilient and gentle axolotl, Axolotly embodies adaptability and guardianship. Created by a parent who understands your challenges, every detail has been thoughtfully designed.
                </p>
                <div className="space-y-5">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-[#F77B8A]/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-[#F77B8A]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Family-First Design</h4>
                      <p className="text-gray-600 text-sm mt-1">Every feature is built with real families in mind, not just tech specs.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-[#F77B8A]/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-[#F77B8A]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">You Decide What&apos;s Right</h4>
                      <p className="text-gray-600 text-sm mt-1">Axolotly doesn&apos;t dictate what&apos;s right or wrong. You set the rules.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-[#F77B8A]/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-[#F77B8A]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Always Within Reach</h4>
                      <p className="text-gray-600 text-sm mt-1">Monitor and manage from anywhere. Axolotly stands watch, quietly and reliably.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-3xl p-10 shadow-[0_8px_40px_rgba(247,123,138,0.12)] border border-pink-100/50">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-pink-50/60 rounded-2xl">
                    <div className="text-4xl">🎬</div>
                    <div>
                      <div className="text-2xl font-extrabold text-gray-900">16+</div>
                      <div className="text-sm text-gray-600">Streaming Services Supported</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-blue-50/60 rounded-2xl">
                    <div className="text-4xl">🏷️</div>
                    <div>
                      <div className="text-2xl font-extrabold text-gray-900">72+</div>
                      <div className="text-sm text-gray-600">Content Warning Tags</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-green-50/60 rounded-2xl">
                    <div className="text-4xl">📱</div>
                    <div>
                      <div className="text-2xl font-extrabold text-gray-900">Unlimited</div>
                      <div className="text-sm text-gray-600">Devices Per Family</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-purple-50/60 rounded-2xl">
                    <div className="text-4xl">🔒</div>
                    <div>
                      <div className="text-2xl font-extrabold text-gray-900">Real-time</div>
                      <div className="text-sm text-gray-600">Content Enforcement</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Summary */}
        <section className="py-20 md:py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Get started in minutes</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Three simple steps to a safer digital experience for your family.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="w-16 h-16 bg-[#F77B8A] text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6 group-hover:scale-110 group-hover:shadow-[0_6px_20px_rgba(247,123,138,0.4)] transition-all duration-300">1</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Create Profiles</h3>
                <p className="text-gray-600">Set up profiles for each child with their name, age, and a secure PIN.</p>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 bg-[#F77B8A] text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6 group-hover:scale-110 group-hover:shadow-[0_6px_20px_rgba(247,123,138,0.4)] transition-all duration-300">2</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Curate Content</h3>
                <p className="text-gray-600">Browse and allow movies and shows from Netflix, Disney+, and more.</p>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 bg-[#F77B8A] text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6 group-hover:scale-110 group-hover:shadow-[0_6px_20px_rgba(247,123,138,0.4)] transition-all duration-300">3</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Pair Devices</h3>
                <p className="text-gray-600">Install the launcher on your child&apos;s device and pair with a 6-digit code.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-24 bg-gradient-to-br from-[#F77B8A] via-[#f8909e] to-[#e8697a]">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6">Start protecting your family today</h2>
            <p className="text-lg text-white/90 mb-10 max-w-2xl mx-auto">
              Plans start at just $4.99/month. Join thousands of parents who trust Axolotly to keep their kids safe online.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => router.push('/parent?signup=true')}
                className="w-full sm:w-auto bg-white text-[#F77B8A] hover:bg-gray-50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.15)] font-bold py-4 px-10 rounded-full text-lg transition-all duration-200 hover:scale-105"
              >
                Sign Up Free
              </button>
              <button
                onClick={() => router.push('/pricing')}
                className="w-full sm:w-auto text-white font-semibold py-4 px-10 rounded-full text-lg transition-all border-2 border-white/40 hover:border-white hover:bg-white/10"
              >
                See Plans & Pricing
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
