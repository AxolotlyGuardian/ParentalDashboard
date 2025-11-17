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
          Axolotly empowers parents with intuitive tools that protect their children&apos;s digital experiences—without friction, fear, or complexity. Here&apos;s how it works:
        </p>

        <div className="space-y-8">
          <section className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-[#688ac6]">
            <h2 className="text-2xl font-bold text-[#566886] mb-4">1. Plug In Protection</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Connect your child&apos;s device and Axolotly activates instantly. It monitors content, applies your rules, and enforces boundaries—all without complex setup.
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
              Get real-time insights into what your child is watching, playing, or browsing. Axolotly doesn&apos;t spy—it informs.
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
              Gentle enforcement inspired by the axolotl&apos;s regenerative nature. Axolotly doesn&apos;t punish—it redirects.
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
              Every feature is built with your peace of mind in focus. You don&apos;t need to be tech-savvy—just family-focused.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Simple interface with symbolic icons</li>
              <li>Customizable protection levels</li>
              <li>Travel mode for on-the-go families</li>
            </ul>
          </section>
        </div>
      </main>

      <footer className="text-center py-6 bg-[#688ac6] text-white mt-12">
        <p>&copy; 2025 Axolotly. Built with love and protection.</p>
      </footer>
    </div>
  );
}
