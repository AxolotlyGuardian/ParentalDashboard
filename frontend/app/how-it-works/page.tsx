'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function HowItWorks() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#fdfdfc]">
      <Header variant="blue" />

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-[#566886] mb-8 text-center">How Axolotly Works for Parents</h1>
        
        <p className="text-lg text-gray-700 mb-12 leading-relaxed">
          Axolotly is designed to empower parents with intuitive, symbolic tools that protect their children's digital experiences — without friction, fear, or complexity. Here's how it works:
        </p>

        <div className="space-y-8">
          <section className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-[#688ac6]">
            <h2 className="text-2xl font-bold text-[#566886] mb-4">1. Plug In Protection</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Axolotly activates instantly when connected to your child's device. It begins monitoring screen activity, flagging inappropriate content, and enforcing boundaries — all without requiring complex setup.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>No app installation required</li>
              <li>Compatible with most HDMI-enabled devices</li>
              <li>Portable and travel-ready</li>
            </ul>
          </section>

          <section className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-[#566886]">
            <h2 className="text-2xl font-bold text-[#566886] mb-4">2. Real-Time Visibility</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Parents receive real-time insights into what their child is watching, playing, or browsing. Axolotly doesn't spy — it informs.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Live content summaries</li>
              <li>Flagged content alerts</li>
              <li>Symbolic dashboard with color-coded trust signals</li>
            </ul>
          </section>

          <section className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-[#C2B7EE]">
            <h2 className="text-2xl font-bold text-[#566886] mb-4">3. Enforcement That Feels Natural</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Axolotly uses gentle enforcement logic inspired by the axolotl's regenerative nature. It doesn't punish — it redirects.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Time limits and screen nudges</li>
              <li>Content filters based on age and values</li>
              <li>Community-flagged content moderation</li>
            </ul>
          </section>

          <section className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-[#B2D8BF]">
            <h2 className="text-2xl font-bold text-[#566886] mb-4">4. Parent-Centric Design</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Every feature is built with your emotional clarity in mind. You don't need to be tech-savvy — just family-savvy.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Simple interface with symbolic icons</li>
              <li>Customizable protection levels</li>
              <li>Travel mode for on-the-go families</li>
            </ul>
          </section>

          <section className="bg-[#688ac6] text-white p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Why the Axolotl?</h2>
            <p className="leading-relaxed mb-4">
              The axolotl is more than a mascot — it's a metaphor. Known for its ability to regenerate and adapt, it represents the kind of protection we believe in: gentle, resilient, and ever-watchful. It's also my child's favorite animal — a personal reminder that this brand is built by a parent, for parents.
            </p>
            <p className="text-xl font-semibold">
              Axolotly protects what matters — quietly, reliably, and with purpose.
            </p>
          </section>
        </div>

        <div className="text-center mt-12 space-y-4">
          <button
            onClick={() => router.push('/parent')}
            className="bg-[#688ac6] hover:bg-[#5276b3] text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors"
          >
            Continue to App
          </button>
          <div>
            <button
              onClick={() => router.push('/pricing')}
              className="text-[#566886] hover:text-[#688ac6] font-semibold underline transition-colors"
            >
              View Pricing Plans
            </button>
          </div>
        </div>
      </main>

      <footer className="text-center py-6 bg-[#688ac6] text-white mt-12">
        <p>&copy; 2025 Axolotly. Built with love and protection.</p>
      </footer>
    </div>
  );
}
