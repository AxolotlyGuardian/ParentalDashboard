'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function Pricing() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'family' | 'educator'>('family');

  return (
    <div className="min-h-screen bg-[#fdfdfc]">
      <Header variant="pink" />

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-[#566886] mb-4">Protection that grows with your family.</h1>
          <p className="text-xl text-gray-600 mb-4">
            Choose the plan that fits your needs — whether you're a solo parent, a growing household, or an educator.
          </p>
          <div className="inline-block bg-gradient-to-r from-[#FF6B9D] to-[#FF8FB3] text-white px-6 py-3 rounded-lg text-lg font-semibold">
            $39 per Axolotly unit + subscription fee
          </div>
        </div>

        {/* Plan Options */}
        <section className="mb-16">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Starter Plan */}
            <div 
              onClick={() => setSelectedPlan('starter')}
              className={`bg-white rounded-lg p-8 border-t-4 border-[#688ac6] cursor-pointer transition-all ${
                selectedPlan === 'starter' 
                  ? 'shadow-xl transform md:scale-105' 
                  : 'shadow-lg hover:shadow-xl'
              } relative`}
            >
              {selectedPlan === 'starter' && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-[#688ac6] to-[#5276b3] text-white px-4 py-1 rounded-bl-lg text-sm font-semibold">
                  Most Popular
                </div>
              )}
              <h3 className="text-2xl font-bold text-[#566886] mb-2">Starter</h3>
              <div className="mb-6">
                <div className="text-sm text-gray-500">$39 per unit +</div>
                <span className="text-4xl font-bold text-[#688ac6]">$4.99</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-gray-700">1 device</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-700">Real-time analytics</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-700">Content filtering</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-700">Remote dashboard</span>
                </li>
              </ul>
              <button className="w-full bg-[#688ac6] hover:bg-[#5276b3] text-white font-bold py-3 rounded-lg transition-colors">
                Choose Starter
              </button>
            </div>

            {/* Family Plan */}
            <div 
              onClick={() => setSelectedPlan('family')}
              className={`bg-white rounded-lg p-8 border-t-4 border-[#FF6B9D] cursor-pointer transition-all ${
                selectedPlan === 'family' 
                  ? 'shadow-xl transform md:scale-105' 
                  : 'shadow-lg hover:shadow-xl'
              } relative`}
            >
              {selectedPlan === 'family' && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-[#FF6B9D] to-[#FF8FB3] text-white px-4 py-1 rounded-bl-lg text-sm font-semibold">
                  Most Popular
                </div>
              )}
              <h3 className="text-2xl font-bold text-[#566886] mb-2">Family</h3>
              <div className="mb-6">
                <div className="text-sm text-gray-500">$39 per unit +</div>
                <span className="text-4xl font-bold text-[#FF6B9D]">$9.99</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-gray-700">Up to 3 devices</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-700">Shared dashboard</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-700">Enforcement tiers</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-700">Alert summaries</span>
                </li>
              </ul>
              <button className="w-full bg-gradient-to-r from-[#FF6B9D] to-[#FF8FB3] hover:shadow-lg text-white font-bold py-3 rounded-lg transition-all">
                Choose Family
              </button>
            </div>

            {/* Educator Plan */}
            <div 
              onClick={() => setSelectedPlan('educator')}
              className={`bg-white rounded-lg p-8 border-t-4 border-[#9B8DC6] cursor-pointer transition-all ${
                selectedPlan === 'educator' 
                  ? 'shadow-xl transform md:scale-105' 
                  : 'shadow-lg hover:shadow-xl'
              } relative`}
            >
              {selectedPlan === 'educator' && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-[#9B8DC6] to-[#8778b3] text-white px-4 py-1 rounded-bl-lg text-sm font-semibold">
                  Most Popular
                </div>
              )}
              <h3 className="text-2xl font-bold text-[#566886] mb-2">Educator</h3>
              <div className="mb-6">
                <div className="text-sm text-gray-500">$39 per unit +</div>
                <span className="text-4xl font-bold text-[#9B8DC6]">$19.99</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-gray-700">Up to 10 devices</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-700">Classroom mode</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-700">Group analytics</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-700">Content presets</span>
                </li>
              </ul>
              <button className="w-full bg-[#9B8DC6] hover:bg-[#8778b3] text-white font-bold py-3 rounded-lg transition-colors">
                Choose Educator
              </button>
            </div>
          </div>

          {/* All Plans Include */}
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h4 className="font-bold text-[#566886] mb-3 text-center">All plans include:</h4>
            <div className="grid md:grid-cols-2 gap-3 text-gray-700">
              <div className="flex items-center">
                Symbolic Guardian protection logic
              </div>
              <div className="flex items-center">
                Access to the parent dashboard
              </div>
              <div className="flex items-center">
                Community flagging and content updates
              </div>
              <div className="flex items-center">
                Secure cloud syncing
              </div>
            </div>
          </div>
        </section>

        {/* Bundle Add-On */}
        <section className="mb-16 bg-[#688ac6] text-white rounded-xl p-8">
          <h2 className="text-3xl font-bold mb-4 text-center">Bundle Add-On: Multi-Unit Discount</h2>
          <p className="text-center mb-8 text-lg">Add extra Axolotly units to your subscription and save on hardware costs.</p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="py-3 px-4">Bundle Size</th>
                  <th className="py-3 px-4">Hardware Cost</th>
                  <th className="py-3 px-4">Total Units</th>
                  <th className="py-3 px-4">Savings</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/10">
                  <td className="py-3 px-4 font-semibold">+1 Unit</td>
                  <td className="py-3 px-4">$31 per unit</td>
                  <td className="py-3 px-4">2</td>
                  <td className="py-3 px-4 text-white/90">Save 20%</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 px-4 font-semibold">+2 Units</td>
                  <td className="py-3 px-4">$27 per unit</td>
                  <td className="py-3 px-4">3</td>
                  <td className="py-3 px-4 text-white/90">Save 30%</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold">+3+ Units</td>
                  <td className="py-3 px-4">Custom Quote</td>
                  <td className="py-3 px-4">4+</td>
                  <td className="py-3 px-4 text-white/90">Save 35–50%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center bg-gradient-to-r from-[#FF6B9D] to-[#FF8FB3] text-white rounded-xl p-12">
          <h2 className="text-3xl font-bold mb-4">Start Protecting Today</h2>
          <p className="text-lg mb-8">No contracts. Cancel anytime. Your family's safety, always within reach.</p>
          <button 
            onClick={() => router.push('/parent')}
            className="bg-white text-[#FF6B9D] hover:bg-gray-100 font-bold py-4 px-8 rounded-full text-xl transition-colors"
          >
            Get Started Now
          </button>
        </section>
      </main>

      <footer className="text-center py-6 bg-[#688ac6] text-white mt-12">
        <p>&copy; 2025 Axolotly. Built with love and protection.</p>
      </footer>
    </div>
  );
}
