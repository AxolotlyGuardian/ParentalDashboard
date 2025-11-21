'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      <Header variant="pink" />

      <main>
        {/* Section 1: Our Mission */}
        <section className="max-w-5xl mx-auto px-6 py-10">
          <div className="bg-white rounded-3xl shadow-md border border-pink-100 p-12">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Our Mission</h2>
            </div>
            <p className="text-lg text-gray-600 leading-relaxed text-center max-w-3xl mx-auto">
              Every parent deserves tools that protect their children without compromising trust, freedom, or joy. Axolotly makes protection intuitive, meaningful, and strong—not restrictive or complicated.
            </p>
          </div>
        </section>

        {/* Tagline */}
        <section className="max-w-5xl mx-auto px-6 py-6">
          <div className="text-center">
            <p className="text-xl italic text-gray-700 font-medium">
              Axolotly doesn't dictate what's right or wrong — it gives parents the tools to decide.
            </p>
          </div>
        </section>

        {/* Section 2: Why Axolotl? */}
        <section className="bg-gradient-to-r from-pink-100 to-pink-200/70 py-10">
          <div className="max-w-5xl mx-auto px-6">
            <div className="bg-white rounded-3xl shadow-md border border-pink-200 p-12">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Why Axolotly?</h2>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed text-center max-w-3xl mx-auto">
                The axolotl is known for its regenerative powers and gentle nature, making it the perfect symbol of resilience, adaptability, and guardianship. It&apos;s not just cute—it&apos;s mighty. Just like the parents we serve.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: The Problem We're Solving */}
        <section className="max-w-5xl mx-auto px-6 py-10">
          <div className="bg-white rounded-3xl shadow-md border border-blue-100 p-12">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">The Problem We&apos;re Solving</h2>
            </div>
            <p className="text-lg text-gray-600 leading-relaxed text-center max-w-3xl mx-auto">
              In today&apos;s digital world, children have unprecedented access to content—much of it unfiltered, overwhelming, or age-inappropriate. Axolotly helps parents monitor, guide, and protect their children&apos;s digital experiences with clarity and confidence.
            </p>
          </div>
        </section>

        {/* Section 4: Family-First Design */}
        <section className="bg-gradient-to-r from-blue-100 to-blue-200/70 py-10">
          <div className="max-w-5xl mx-auto px-6">
            <div className="bg-white rounded-3xl shadow-md border border-blue-200 p-12">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Family-First Design</h2>
                <p className="text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
                  Created by a parent who understands your challenges, every detail has been thoughtfully designed—from the symbolic logo to the enforcement logic, from the community tagging system to the calming color palette. Axolotly isn&apos;t just software. It&apos;s a promise to help parents feel confident, informed, and supported.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Always Within Reach */}
        <section className="max-w-5xl mx-auto px-6 py-10">
          <div className="bg-white rounded-3xl shadow-md border border-pink-100 p-12">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Always Within Reach</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-3xl mx-auto">
                Whether you&apos;re on the road or at home, Axolotly stands watch—quietly, reliably, and with purpose. Because in a world of endless content, protecting what matters shouldn&apos;t be an afterthought.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="text-center py-8 bg-gradient-to-r from-pink-100 to-blue-100 border-t border-pink-200">
        <p className="text-gray-700">&copy; 2025 Axolotly. Built with love and protection.</p>
      </footer>
    </div>
  );
}
