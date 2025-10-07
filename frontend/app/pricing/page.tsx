'use client';

import { useRouter } from 'next/navigation';

export default function Pricing() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#fdfdfc]">
      <header className="text-center py-6 bg-[#F47950] text-white">
        <img 
          src="/axolotly-logo.png" 
          alt="Axolotly Logo" 
          className="w-32 h-32 mx-auto cursor-pointer"
          onClick={() => router.push('/')}
        />
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-[#566886] mb-4">Protection that grows with your family.</h1>
          <p className="text-xl text-gray-600">
            Choose the plan that fits your needs — whether you're a solo parent, a growing household, or an educator.
          </p>
        </div>

        {/* Plan Options */}
        <section className="mb-16">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Starter Plan */}
            <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-[#B2D8BF] hover:shadow-xl transition-shadow">
              <h3 className="text-2xl font-bold text-[#566886] mb-2">Starter</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-[#F47950]">$4.99</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-[#B2D8BF] mr-2">✓</span>
                  <span className="text-gray-700">1 device</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#B2D8BF] mr-2">✓</span>
                  <span className="text-gray-700">Real-time analytics</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#B2D8BF] mr-2">✓</span>
                  <span className="text-gray-700">Content filtering</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#B2D8BF] mr-2">✓</span>
                  <span className="text-gray-700">Remote dashboard</span>
                </li>
              </ul>
              <button className="w-full bg-[#B2D8BF] hover:bg-[#9ac4a8] text-gray-800 font-bold py-3 rounded-lg transition-colors">
                Choose Starter
              </button>
            </div>

            {/* Family Plan - Featured */}
            <div className="bg-white rounded-lg shadow-xl p-8 border-t-4 border-[#F47950] transform md:scale-105 relative">
              <div className="absolute top-0 right-0 bg-[#F47950] text-white px-4 py-1 rounded-bl-lg text-sm font-semibold">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold text-[#566886] mb-2">Family</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-[#F47950]">$9.99</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-[#F47950] mr-2">✓</span>
                  <span className="text-gray-700">Up to 3 devices</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#F47950] mr-2">✓</span>
                  <span className="text-gray-700">Shared dashboard</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#F47950] mr-2">✓</span>
                  <span className="text-gray-700">Enforcement tiers</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#F47950] mr-2">✓</span>
                  <span className="text-gray-700">Alert summaries</span>
                </li>
              </ul>
              <button className="w-full bg-[#F47950] hover:bg-[#d66540] text-white font-bold py-3 rounded-lg transition-colors">
                Choose Family
              </button>
            </div>

            {/* Educator Plan */}
            <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-[#C2B7EE] hover:shadow-xl transition-shadow">
              <h3 className="text-2xl font-bold text-[#566886] mb-2">Educator</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-[#F47950]">$19.99</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-[#C2B7EE] mr-2">✓</span>
                  <span className="text-gray-700">Up to 10 devices</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#C2B7EE] mr-2">✓</span>
                  <span className="text-gray-700">Classroom mode</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#C2B7EE] mr-2">✓</span>
                  <span className="text-gray-700">Group analytics</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#C2B7EE] mr-2">✓</span>
                  <span className="text-gray-700">Content presets</span>
                </li>
              </ul>
              <button className="w-full bg-[#C2B7EE] hover:bg-[#b3a4e3] text-gray-800 font-bold py-3 rounded-lg transition-colors">
                Choose Educator
              </button>
            </div>
          </div>

          {/* All Plans Include */}
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h4 className="font-bold text-[#566886] mb-3 text-center">All plans include:</h4>
            <div className="grid md:grid-cols-2 gap-3 text-gray-700 text-sm">
              <div className="flex items-center">
                <span className="text-[#F47950] mr-2">•</span>
                Symbolic Guardian protection logic
              </div>
              <div className="flex items-center">
                <span className="text-[#F47950] mr-2">•</span>
                Access to the parent dashboard
              </div>
              <div className="flex items-center">
                <span className="text-[#F47950] mr-2">•</span>
                Community flagging and content updates
              </div>
              <div className="flex items-center">
                <span className="text-[#F47950] mr-2">•</span>
                Secure cloud syncing
              </div>
            </div>
          </div>
        </section>

        {/* Bundle Add-On */}
        <section className="mb-16 bg-[#566886] text-white rounded-xl p-8">
          <h2 className="text-3xl font-bold mb-4 text-center">Bundle Add-On: Multi-Stick Discount</h2>
          <p className="text-center mb-8 text-lg">Add extra Axolotly units to your subscription and save.</p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="py-3 px-4">Bundle Size</th>
                  <th className="py-3 px-4">Add-On Price</th>
                  <th className="py-3 px-4">Total Devices</th>
                  <th className="py-3 px-4">Savings</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/10">
                  <td className="py-3 px-4 font-semibold">+1 Stick</td>
                  <td className="py-3 px-4">+$3.99/month</td>
                  <td className="py-3 px-4">2</td>
                  <td className="py-3 px-4 text-[#B2D8BF]">Save 20%</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 px-4 font-semibold">+2 Sticks</td>
                  <td className="py-3 px-4">+$6.99/month</td>
                  <td className="py-3 px-4">3</td>
                  <td className="py-3 px-4 text-[#B2D8BF]">Save 30%</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold">+3+ Sticks</td>
                  <td className="py-3 px-4">Custom Quote</td>
                  <td className="py-3 px-4">4+</td>
                  <td className="py-3 px-4 text-[#B2D8BF]">Save 35–50%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center bg-[#F47950] text-white rounded-xl p-12">
          <h2 className="text-3xl font-bold mb-4">Start Protecting Today</h2>
          <p className="text-lg mb-8">No contracts. Cancel anytime. Your family's safety, always within reach.</p>
          <button 
            onClick={() => router.push('/mode-select')}
            className="bg-white text-[#F47950] hover:bg-gray-100 font-bold py-4 px-8 rounded-lg text-xl transition-colors"
          >
            Get Started Now
          </button>
        </section>
      </main>

      <footer className="text-center py-6 bg-[#F47950] text-white mt-12">
        <p>&copy; 2025 Axolotly. Built with love and protection.</p>
      </footer>
    </div>
  );
}
