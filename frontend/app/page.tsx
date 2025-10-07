'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#fdfdfc]">
      <header className="text-center py-8 bg-[#F47950] text-white">
        <img 
          src="/axolotly-logo.png" 
          alt="Axolotly Logo" 
          className="w-64 h-64 mx-auto"
        />
      </header>

      <main>
        {/* Section 1: Our Mission */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-[#566886] mb-6">Our Mission</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Every parent deserves tools that protect their children without compromising trust, freedom, or joy. Axolotly is built to make protection intuitive, symbolic, and strong — not restrictive or complicated.
              </p>
            </div>
            <div className="text-6xl text-center opacity-30">
              🦎👨‍👩‍👧‍👦
            </div>
          </div>
        </section>

        {/* Section 2: Why Axolotl? */}
        <section className="bg-[#C2B7EE] py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="text-6xl mb-6">🦎</div>
            <h2 className="text-4xl font-bold text-[#566886] mb-6">Why Axolotl?</h2>
            <p className="text-lg text-gray-800 leading-relaxed">
              The name comes from my child's favorite animal: the axolotl. Known for its regenerative powers and gentle nature, it became our symbol of resilience, adaptability, and guardianship. It's not just cute — it's powerful. Just like the parents we serve.
            </p>
          </div>
        </section>

        {/* Section 3: The Problem We're Solving */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-6xl text-center opacity-20">
              📱💻📺🎮
            </div>
            <div>
              <h2 className="text-4xl font-bold text-[#566886] mb-6">The Problem We're Solving</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                In today's ever-expanding internet environment, kids have access to more content than ever before — much of it unfiltered, overwhelming, or simply not age-appropriate. Axolotly helps parents monitor, guide, and protect their children's digital experiences with clarity and confidence.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Family-First Design */}
        <section className="bg-[#F47950] text-white py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-4xl font-bold mb-6 text-center">Family-First Design</h2>
            <p className="text-lg leading-relaxed mb-8 text-center">
              As a family-first creator, I've poured my values into every detail — from the symbolic logo to the enforcement logic, from the community flagging system to the calming color palette. Axolotly isn't just software. It's a promise to help parents feel confident, informed, and supported.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-white/20 p-4 rounded-lg text-center">
                <div className="text-3xl mb-2">🦎</div>
                <div className="text-sm font-semibold">Symbolic Logo</div>
              </div>
              <div className="bg-white/20 p-4 rounded-lg text-center">
                <div className="text-3xl mb-2">🎨</div>
                <div className="text-sm font-semibold">Color Palette</div>
              </div>
              <div className="bg-white/20 p-4 rounded-lg text-center">
                <div className="text-3xl mb-2">🔒</div>
                <div className="text-sm font-semibold">Enforcement Logic</div>
              </div>
              <div className="bg-white/20 p-4 rounded-lg text-center">
                <div className="text-3xl mb-2">👥</div>
                <div className="text-sm font-semibold">Community Flagging</div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Always Within Reach */}
        <section className="bg-[#566886] text-white py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-6">Always Within Reach</h2>
            <p className="text-lg leading-relaxed mb-8">
              Whether you're on the road or at home, Axolotly stands watch — quietly, reliably, and with purpose. Because in a world of endless content, protecting what matters shouldn't be an afterthought.
            </p>
            <div className="flex justify-center gap-8 text-5xl">
              <div>📱</div>
              <div>💻</div>
              <div>🛡️</div>
            </div>
          </div>
        </section>

        {/* Get Started Button */}
        <section className="max-w-4xl mx-auto px-6 py-16 text-center">
          <button
            onClick={() => router.push('/how-it-works')}
            className="bg-[#F47950] hover:bg-[#d66540] text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors"
          >
            Get Started
          </button>
        </section>
      </main>

      <footer className="text-center py-6 bg-[#F47950] text-white mt-12">
        <p>&copy; 2025 Axolotly. Built with love and protection.</p>
      </footer>
    </div>
  );
}
