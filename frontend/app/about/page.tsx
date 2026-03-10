'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      <Header variant="pink" />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#FFF0F3] via-white to-[#F0F4FF] py-20 md:py-28">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#F77B8A]/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl"></div>
          </div>
          <div className="max-w-4xl mx-auto px-6 relative text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
              About <span className="text-[#F77B8A]">Axolotly</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
              Protect what matters. A parent&apos;s tool, made by a parent, for the exact moment every family lives through.
            </p>
          </div>
        </section>

        {/* Origin Story */}
        <section className="py-20 md:py-24 bg-gray-900">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-10">
              How Axolotly Started
            </h2>

            <div className="space-y-6 text-gray-300 text-lg leading-relaxed">
              <p>
                Axolotly started the way most good ideas do &mdash; with a problem no one had solved yet.
              </p>
              <p>
                One evening, my wife and I were in the living room watching a show. Our youngest son, who was three at the time, had taken his tablet and wandered into another room. We didn&apos;t think much of it. A little while later, I looked around and realized he&apos;d been gone longer than I&apos;d noticed. I called him back in, and when he came back with his tablet, he&apos;d been watching something we wouldn&apos;t have chosen for him.
              </p>
              <p>
                It wasn&apos;t anything catastrophic. But it was that familiar parental feeling &mdash; the one where you realize you can&apos;t be in every room at once, and the tools that are supposed to help you just don&apos;t go far enough. Netflix has age ratings. YouTube has a kids mode. But none of them let me decide, title by title, exactly what my son could see.
              </p>

              <div className="border-l-4 border-[#F77B8A] pl-6 py-2 my-8">
                <p className="text-white text-xl font-semibold italic">
                  &ldquo;Wouldn&apos;t it be great if there was a device that just showed the shows and movies we picked &mdash; and nothing else?&rdquo;
                </p>
              </div>

              <p>
                I looked at my wife and said those words. That was the moment. I started building it the next week.
              </p>
              <p>
                The name came from our oldest son, who was seven. He&apos;d gotten obsessed with axolotls after discovering that the rarest mob in Minecraft is a blue axolotl. What started as a video game fascination turned into a genuine love for the animal &mdash; he learned everything about them, drew them constantly, and talked about them nonstop. When it came time to name the company, the connection felt natural. Axolotls are resilient, protective, and gentle. They guard their environment quietly. That&apos;s what I wanted this product to be for families.
              </p>
              <p>
                Axolotly is named after my son&apos;s love for axolotls and built from my drive to protect what my children see and experience. It&apos;s a parent&apos;s tool, made by a parent, for the exact moment I lived through in my own living room.
              </p>
            </div>

            <div className="mt-10 text-gray-500 text-base">
              &mdash; Alexander Barrett, Founder
            </div>
          </div>
        </section>

        {/* How It Works (brief) */}
        <section className="py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Parents hand-pick the exact shows and movies their child can access. Those titles, and only those titles, appear on the child&apos;s device. The streaming apps are invisible infrastructure.
            </p>
            <button
              onClick={() => router.push('/how-it-works')}
              className="text-[#F77B8A] hover:text-[#e5697a] font-semibold text-lg transition-colors underline underline-offset-4"
            >
              See the full walkthrough
            </button>
          </div>
        </section>

        {/* Chinampas Narrative */}
        <section className="py-20 md:py-24 bg-gradient-to-br from-[#f0fdfa] via-white to-[#f0fdf4]">
          <div className="max-w-3xl mx-auto px-6">
            <div className="inline-flex items-center gap-2 bg-[#2dd4bf]/10 text-[#2dd4bf] px-4 py-1.5 rounded-full text-sm font-medium mb-8">
              <span className="text-base">&#127807;</span>
              Community Feature
            </div>

            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-10">
              Why We Call Them <span className="text-[#2dd4bf]">Chinampas</span>
            </h2>

            <div className="space-y-6 text-gray-700 text-lg leading-relaxed">
              <p>
                The axolotl&apos;s native home is Lake Xochimilco, a network of canals and waterways in the heart of Mexico City. For centuries before the axolotl became an internet-famous salamander, these waters were home to something else remarkable &mdash; chinampas.
              </p>
              <p>
                Chinampas were floating gardens built by Aztec families. Each family would stake out a small plot in the shallow lake, layer it with soil and vegetation, and carefully cultivate exactly what they needed to feed their children. Every chinampa was different because every family was different. One family might grow corn and squash. Another might grow beans and chili peppers. Each garden reflected the hands that built it.
              </p>
              <p>
                But chinampas weren&apos;t isolated. They were connected by canals. Families could travel between them, see what their neighbors were growing, and share what worked. The whole system thrived because individual care created collective abundance &mdash; each family tending their own garden while contributing to a community that fed everyone.
              </p>

              <div className="bg-[#2dd4bf]/5 border border-[#2dd4bf]/20 rounded-2xl p-8 my-10">
                <p className="text-gray-900 text-xl font-bold mb-4">
                  That&apos;s exactly what Chinampas are on Axolotly.
                </p>
                <p className="text-gray-700">
                  When you curate your child&apos;s content on Axolotly &mdash; hand-picking every show and movie they can access &mdash; you&apos;re building a chinampa. A content garden, cultivated by you, for your family. Every title is there because you put it there.
                </p>
              </div>

              <p>
                And just like the families of Xochimilco, you don&apos;t have to build alone. When you publish your chinampa, other parents can browse it, see what you&apos;ve chosen, and adopt your selections for their own children. A first-time parent who doesn&apos;t know where to start can explore chinampas built by families they trust &mdash; from their church, their community, or parents who share their values &mdash; and plant those same titles in their child&apos;s profile with a single tap.
              </p>
              <p>
                You cultivate. You share. Others grow from what you&apos;ve planted.
              </p>
            </div>

            <div className="mt-10 border-l-4 border-[#2dd4bf] pl-6 py-2">
              <p className="text-gray-900 text-2xl font-bold italic">
                Individual intention, shared generously.
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 md:py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Our Values</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center p-8">
                <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <svg className="w-7 h-7 text-[#F77B8A]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/></svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Family-First Design</h3>
                <p className="text-gray-600 leading-relaxed">
                  Every feature is built with real families in mind, not just tech specs.
                </p>
              </div>
              <div className="text-center p-8">
                <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <svg className="w-7 h-7 text-[#F77B8A]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">You Decide What&apos;s Right</h3>
                <p className="text-gray-600 leading-relaxed">
                  Axolotly doesn&apos;t dictate what&apos;s right or wrong. You set the rules.
                </p>
              </div>
              <div className="text-center p-8">
                <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <svg className="w-7 h-7 text-[#F77B8A]" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13zm0-11a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5.5z"/></svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Always Within Reach</h3>
                <p className="text-gray-600 leading-relaxed">
                  Monitor and manage from anywhere. Axolotly stands watch, quietly and reliably.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 md:py-24 bg-gradient-to-br from-[#F77B8A] via-[#f8909e] to-[#e8697a]">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6">Start protecting your family today</h2>
            <p className="text-lg text-white/90 mb-10 max-w-2xl mx-auto">
              Hand-pick every show and movie your child can watch. Nothing more, nothing less.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => router.push('/parent?signup=true')}
                className="w-full sm:w-auto bg-white text-[#F77B8A] hover:bg-gray-50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.15)] font-bold py-4 px-10 rounded-full text-lg transition-all duration-200 hover:scale-105"
              >
                Get Started
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
