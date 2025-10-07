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
          className="w-48 h-48 mx-auto mb-4"
        />
        <h1 className="text-4xl font-bold mb-2">Axolotly</h1>
        <p className="text-xl font-semibold">Protect What Matters</p>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#566886] mb-6">About Us</h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              Axolotly was born from a simple truth: every parent deserves tools that protect their children without compromising trust, freedom, or joy. As a family-first creator, I built Axolotly not just as a product — but as a promise.
            </p>
            <p>
              The name comes from my child's favorite animal: the axolotl. Known for its regenerative powers and gentle nature, the axolotl became our symbol of resilience, adaptability, and guardianship. It's not just cute — it's powerful. Just like the parents we serve.
            </p>
            <p>
              Axolotly is designed to travel with families, enforce screen safety, and empower parents with real-time insights. Our mission is to make protection feel intuitive, symbolic, and strong — not restrictive or complicated.
            </p>
            <p>
              Whether you're on the road or at home, Axolotly stands watch — quietly, reliably, and with purpose. Because in a world of endless content, protecting what matters shouldn't be an afterthought.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#566886] mb-6">Brand Colors</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#F47950] text-white font-bold text-center p-6 rounded-lg">
              <div className="mb-2">Coral</div>
              <div className="text-sm">#F47950</div>
            </div>
            <div className="bg-[#566886] text-white font-bold text-center p-6 rounded-lg">
              <div className="mb-2">Slate Blue</div>
              <div className="text-sm">#566886</div>
            </div>
            <div className="bg-[#C2B7EE] text-gray-800 font-bold text-center p-6 rounded-lg">
              <div className="mb-2">Lavender</div>
              <div className="text-sm">#C2B7EE</div>
            </div>
            <div className="bg-[#B2D8BF] text-gray-800 font-bold text-center p-6 rounded-lg">
              <div className="mb-2">Mint</div>
              <div className="text-sm">#B2D8BF</div>
            </div>
          </div>
        </section>

        <div className="text-center">
          <button
            onClick={() => router.push('/mode-select')}
            className="bg-[#F47950] hover:bg-[#d66540] text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors"
          >
            Get Started
          </button>
        </div>
      </main>

      <footer className="text-center py-6 bg-[#F47950] text-white mt-12">
        <p>&copy; 2025 Axolotly. Built with love and protection.</p>
      </footer>
    </div>
  );
}
