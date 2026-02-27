'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function HowItWorks() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#fdfdfc]">
      <Header variant="blue" />

      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-[#F0F4FF] via-white to-[#FFF0F3] py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">How Axolotly Works</h1>
            <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
              Axolotly empowers parents with intuitive tools that protect their children&apos;s digital experiences — without friction, fear, or complexity.
            </p>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-16">
          <div className="space-y-8">
            <div className="group p-8 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 border-l-4 border-l-[#688ac6] hover:shadow-[0_8px_30px_rgba(104,138,198,0.15)] hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-[#688ac6]/10 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <span className="text-2xl font-bold text-[#688ac6]">1</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Create Kid Profiles</h2>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Set up profiles for each child with their name, age, and a secure PIN. Each profile gets personalized content rules tailored to your family&apos;s values.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-gray-600 text-sm">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      Individual profiles for each child
                    </li>
                    <li className="flex items-center gap-2 text-gray-600 text-sm">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      Age-appropriate content management
                    </li>
                    <li className="flex items-center gap-2 text-gray-600 text-sm">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      PIN-protected access for kids
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="group p-8 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 border-l-4 border-l-[#566886] hover:shadow-[0_8px_30px_rgba(86,104,134,0.15)] hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-[#566886]/10 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <span className="text-2xl font-bold text-[#566886]">2</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Curate Content Libraries</h2>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Search thousands of movies and TV shows from The Movie Database. Simply allow or block content for each child&apos;s profile with a single tap.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-gray-600 text-sm">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      Browse movies and TV shows
                    </li>
                    <li className="flex items-center gap-2 text-gray-600 text-sm">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      Allow or block specific titles
                    </li>
                    <li className="flex items-center gap-2 text-gray-600 text-sm">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      Community-driven content warnings and tags
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="group p-8 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 border-l-4 border-l-[#C2B7EE] hover:shadow-[0_8px_30px_rgba(194,183,238,0.2)] hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-[#C2B7EE]/10 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <span className="text-2xl font-bold text-[#9B8DD4]">3</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Pair Android Devices</h2>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Install the Axolotly launcher on your child&apos;s Android device and pair it with a simple 6-digit code. The launcher enforces your rules automatically.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-gray-600 text-sm">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      Quick 6-digit code pairing
                    </li>
                    <li className="flex items-center gap-2 text-gray-600 text-sm">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      Kid-friendly launcher interface
                    </li>
                    <li className="flex items-center gap-2 text-gray-600 text-sm">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      Only approved content appears
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="group p-8 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 border-l-4 border-l-[#B2D8BF] hover:shadow-[0_8px_30px_rgba(178,216,191,0.2)] hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-[#B2D8BF]/10 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <span className="text-2xl font-bold text-[#6DAE82]">4</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Monitor and Adjust</h2>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Track device activity, set daily screen time limits, and see what your kids are watching. Adjust permissions anytime from your parent dashboard.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-gray-600 text-sm">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      Daily screen time limits and bedtime schedules
                    </li>
                    <li className="flex items-center gap-2 text-gray-600 text-sm">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      View device activity and usage statistics
                    </li>
                    <li className="flex items-center gap-2 text-gray-600 text-sm">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      Update content permissions on the go
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gradient-to-br from-[#F77B8A] via-[#f8909e] to-[#e8697a]">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-extrabold text-white mb-4">Ready to get started?</h2>
            <p className="text-lg text-white/90 mb-8">
              Create your free account and start protecting your family in minutes.
            </p>
            <button
              onClick={() => router.push('/parent?signup=true')}
              className="bg-white text-[#F77B8A] hover:bg-gray-50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.15)] font-bold py-4 px-10 rounded-full text-lg transition-all duration-200 hover:scale-105"
            >
              Sign Up Free
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
