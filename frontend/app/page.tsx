'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      <header className="text-center py-12 bg-gradient-to-br from-[#FF6B9D] to-[#FF8FB3]">
        <h1 className="text-4xl font-bold text-white mt-6">Axolotly</h1>
        <p className="text-white/90 mt-2 text-lg">Safe, simple parental controls</p>
      </header>

      <main>
        {/* Section 1: Our Mission */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Our Mission</h2>
            </div>
            <p className="text-lg text-gray-600 leading-relaxed text-center max-w-3xl mx-auto">
              Every parent deserves tools that protect their children without compromising trust, freedom, or joy. Axolotly is built to make protection intuitive, symbolic, and strong — not restrictive or complicated.
            </p>
          </div>
        </section>

        {/* Section 2: Why Axolotl? */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-5xl mx-auto px-6">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Why Axolotl?</h2>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed text-center max-w-3xl mx-auto">
                The name comes from my child's favorite animal: the axolotl. Known for its regenerative powers and gentle nature, it became our symbol of resilience, adaptability, and guardianship. It's not just cute — it's powerful. Just like the parents we serve.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: The Problem We're Solving */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">The Problem We're Solving</h2>
            </div>
            <p className="text-lg text-gray-600 leading-relaxed text-center max-w-3xl mx-auto">
              In today's ever-expanding internet environment, kids have access to more content than ever before — much of it unfiltered, overwhelming, or simply not age-appropriate. Axolotly helps parents monitor, guide, and protect their children's digital experiences with clarity and confidence.
            </p>
          </div>
        </section>

        {/* Section 4: Family-First Design */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-5xl mx-auto px-6">
            <div className="bg-gradient-to-br from-[#FF6B9D] to-[#FF8FB3] rounded-3xl shadow-lg p-12 text-white">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">Family-First Design</h2>
                <p className="text-lg leading-relaxed opacity-95 max-w-3xl mx-auto">
                  As a family-first creator, I've poured my values into every detail — from the symbolic logo to the enforcement logic, from the community flagging system to the calming color palette. Axolotly isn't just software. It's a promise to help parents feel confident, informed, and supported.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div className="bg-white/20 backdrop-blur-sm p-6 rounded-2xl text-center hover:bg-white/30 transition-all">
                  <div className="text-sm font-semibold">Symbolic Logo</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm p-6 rounded-2xl text-center hover:bg-white/30 transition-all">
                  <div className="text-sm font-semibold">Color Palette</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm p-6 rounded-2xl text-center hover:bg-white/30 transition-all">
                  <div className="text-sm font-semibold">Enforcement Logic</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm p-6 rounded-2xl text-center hover:bg-white/30 transition-all">
                  <div className="text-sm font-semibold">Community Flagging</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Always Within Reach */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Always Within Reach</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-3xl mx-auto">
                Whether you're on the road or at home, Axolotly stands watch — quietly, reliably, and with purpose. Because in a world of endless content, protecting what matters shouldn't be an afterthought.
              </p>
            </div>
          </div>
        </section>

        {/* Get Started Button */}
        <section className="max-w-4xl mx-auto px-6 py-16 text-center">
          <button
            onClick={() => router.push('/how-it-works')}
            className="bg-gradient-to-r from-[#FF6B9D] to-[#FF8FB3] hover:shadow-lg text-white font-bold py-4 px-12 rounded-full text-xl transition-all transform hover:scale-105"
          >
            Get Started
          </button>
        </section>
      </main>

      <footer className="text-center py-8 bg-gray-50 border-t border-gray-100 mt-12">
        <p className="text-gray-600">&copy; 2025 Axolotly. Built with love and protection.</p>
      </footer>
    </div>
  );
}
