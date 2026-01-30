'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 4.99,
    color: '#688ac6',
    colorHover: '#5276b3',
    deviceLimit: 1,
    features: [
      '1 Axolotly device',
      'Real-time analytics',
      'Content filtering',
      'Remote parent dashboard',
    ],
  },
  {
    id: 'family',
    name: 'Family',
    price: 9.99,
    color: '#FF6B9D',
    colorHover: '#e85a89',
    gradient: true,
    deviceLimit: 3,
    features: [
      'Up to 3 devices',
      'Shared family dashboard',
      'Per-child enforcement tiers',
      'Weekly alert summaries',
    ],
    popular: true,
  },
  {
    id: 'educator',
    name: 'Educator',
    price: 19.99,
    color: '#9B8DC6',
    colorHover: '#8778b3',
    deviceLimit: 10,
    features: [
      'Up to 10 devices',
      'Classroom mode',
      'Group analytics',
      'Curriculum content presets',
    ],
  },
];

const HARDWARE_PRICE = 39;
const BUNDLE_PRICING: Record<number, { perUnit: number; savings: string }> = {
  1: { perUnit: 39, savings: '' },
  2: { perUnit: 31, savings: 'Save 20%' },
  3: { perUnit: 27, savings: 'Save 30%' },
};

export default function Pricing() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string>('family');
  const [hardwareUnits, setHardwareUnits] = useState(1);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [step, setStep] = useState<'plan' | 'configure' | 'checkout'>('plan');

  const plan = PLANS.find((p) => p.id === selectedPlan)!;
  const bundlePrice = BUNDLE_PRICING[Math.min(hardwareUnits, 3)] ?? { perUnit: Math.round(39 * 0.65), savings: 'Save 35%+' };
  const hardwareCost = bundlePrice.perUnit * hardwareUnits;
  const monthlyTotal = plan.price;

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/parent?redirect=pricing');
        return;
      }

      const res = await fetch('/api/subscriptions/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan: selectedPlan,
          hardware_units: hardwareUnits,
          success_url: window.location.origin + '/pricing/success',
          cancel_url: window.location.origin + '/pricing',
        }),
      });

      if (res.status === 401 || res.status === 403) {
        router.push('/parent?redirect=pricing');
        return;
      }

      const data = await res.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfdfc]">
      <Header variant="pink" />

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-[#566886] mb-4">
            Protection that grows with your family
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Choose the plan that fits your needs. No contracts, cancel anytime.
          </p>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {(['plan', 'configure', 'checkout'] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (s === 'plan') setStep('plan');
                    else if (s === 'configure' && step !== 'plan') setStep('configure');
                  }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    step === s
                      ? 'bg-[#FF6B9D] text-white'
                      : i < ['plan', 'configure', 'checkout'].indexOf(step)
                      ? 'bg-[#688ac6] text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {i + 1}
                </button>
                <span
                  className={`text-sm font-medium ${step === s ? 'text-[#FF6B9D]' : 'text-gray-400'}`}
                >
                  {s === 'plan' ? 'Choose Plan' : s === 'configure' ? 'Configure' : 'Checkout'}
                </span>
                {i < 2 && <div className="w-12 h-0.5 bg-gray-200 mx-2" />}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Choose Plan */}
        {step === 'plan' && (
          <>
            <section className="mb-16">
              <div className="grid md:grid-cols-3 gap-8">
                {PLANS.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlan(p.id)}
                    className={`bg-white rounded-lg p-8 border-t-4 cursor-pointer transition-all relative ${
                      selectedPlan === p.id
                        ? 'shadow-xl transform md:scale-105'
                        : 'shadow-lg hover:shadow-xl'
                    }`}
                    style={{ borderTopColor: p.color }}
                  >
                    {p.popular && selectedPlan === p.id && (
                      <div
                        className="absolute top-0 right-0 text-white px-4 py-1 rounded-bl-lg text-sm font-semibold"
                        style={{ background: `linear-gradient(to right, ${p.color}, ${p.colorHover})` }}
                      >
                        Most Popular
                      </div>
                    )}
                    <h3 className="text-2xl font-bold text-[#566886] mb-2">{p.name}</h3>
                    <div className="mb-6">
                      <div className="text-sm text-gray-500">$39 per unit +</div>
                      <span className="text-4xl font-bold" style={{ color: p.color }}>
                        ${p.price.toFixed(2)}
                      </span>
                      <span className="text-gray-600">/month</span>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start">
                          <span className="text-gray-700">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlan(p.id);
                        setStep('configure');
                      }}
                      className={`w-full text-white font-bold py-3 rounded-lg transition-colors`}
                      style={{
                        background: p.gradient
                          ? `linear-gradient(to right, ${p.color}, ${p.colorHover})`
                          : p.color,
                      }}
                    >
                      Choose {p.name}
                    </button>
                  </div>
                ))}
              </div>

              {/* All Plans Include */}
              <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                <h4 className="font-bold text-[#566886] mb-3 text-center">All plans include:</h4>
                <div className="grid md:grid-cols-2 gap-3 text-gray-700">
                  <div className="flex items-center">Intelligent content protection</div>
                  <div className="flex items-center">Full access to parent dashboard</div>
                  <div className="flex items-center">Community-driven content tagging</div>
                  <div className="flex items-center">Secure cloud syncing</div>
                </div>
              </div>
            </section>

            {/* Social proof */}
            <section className="mb-16 text-center">
              <h3 className="text-lg font-semibold text-[#566886] mb-2">Trusted by families everywhere</h3>
              <p className="text-gray-500">
                Designed by a parent who understands your challenges. Simple, trustworthy, and reliable.
              </p>
            </section>
          </>
        )}

        {/* Step 2: Configure hardware */}
        {step === 'configure' && (
          <section className="max-w-2xl mx-auto mb-16">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-[#566886] mb-6 text-center">
                Configure Your {plan.name} Plan
              </h2>

              {/* Selected plan summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 flex justify-between items-center">
                <div>
                  <span className="font-semibold text-[#566886]">{plan.name} Plan</span>
                  <span className="text-gray-500 ml-2">Up to {plan.deviceLimit} device{plan.deviceLimit > 1 ? 's' : ''}</span>
                </div>
                <span className="text-lg font-bold" style={{ color: plan.color }}>
                  ${plan.price.toFixed(2)}/mo
                </span>
              </div>

              {/* Hardware units selector */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-[#566886] mb-3">
                  How many Axolotly units?
                </label>
                <div className="flex gap-3">
                  {[1, 2, 3].map((n) => (
                    <button
                      key={n}
                      onClick={() => setHardwareUnits(n)}
                      className={`flex-1 py-4 rounded-lg border-2 transition-all text-center ${
                        hardwareUnits === n
                          ? 'border-[#FF6B9D] bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl font-bold text-[#566886]">{n}</div>
                      <div className="text-sm text-gray-500">
                        ${BUNDLE_PRICING[n]?.perUnit ?? 25}/unit
                      </div>
                      {BUNDLE_PRICING[n]?.savings && (
                        <div className="text-xs font-semibold text-green-600 mt-1">
                          {BUNDLE_PRICING[n].savings}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Need 4+ units? Contact us for custom enterprise pricing.
                </p>
              </div>

              {/* Order summary */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Hardware ({hardwareUnits} unit{hardwareUnits > 1 ? 's' : ''})</span>
                  <span>${hardwareCost.toFixed(2)} one-time</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{plan.name} subscription</span>
                  <span>${monthlyTotal.toFixed(2)}/month</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-[#566886]">
                  <span>Due today</span>
                  <span>${(hardwareCost + monthlyTotal).toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-400">
                  Then ${monthlyTotal.toFixed(2)}/month. Cancel anytime.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep('plan')}
                  className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('checkout')}
                  className="flex-1 py-3 rounded-lg text-white font-bold transition-all"
                  style={{
                    background: `linear-gradient(to right, #FF6B9D, #FF8FB3)`,
                  }}
                >
                  Continue to Checkout
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Step 3: Checkout confirmation */}
        {step === 'checkout' && (
          <section className="max-w-2xl mx-auto mb-16">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-[#566886] mb-6 text-center">
                Complete Your Order
              </h2>

              <div className="space-y-3 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-[#566886] mb-2">Order Summary</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{plan.name} Plan (monthly)</span>
                      <span>${plan.price.toFixed(2)}/mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Axolotly Device x{hardwareUnits}
                        {bundlePrice.savings && (
                          <span className="text-green-600 ml-1 text-xs">({bundlePrice.savings})</span>
                        )}
                      </span>
                      <span>${hardwareCost.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-1 mt-2 flex justify-between font-bold">
                      <span>Total due today</span>
                      <span>${(hardwareCost + monthlyTotal).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 text-sm text-[#566886]">
                  <p className="font-semibold mb-1">What happens next:</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-600">
                    <li>Complete secure payment via Stripe</li>
                    <li>Your Axolotly device(s) ship within 3-5 business days</li>
                    <li>Pair your device and set up your family dashboard</li>
                    <li>Start protecting your family&apos;s screen time</li>
                  </ol>
                </div>

                <div className="text-xs text-gray-400 text-center">
                  30-day money-back guarantee on hardware. Cancel subscription anytime.
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('configure')}
                  className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="flex-1 py-3 rounded-lg text-white font-bold transition-all disabled:opacity-50"
                  style={{
                    background: `linear-gradient(to right, #FF6B9D, #FF8FB3)`,
                  }}
                >
                  {isCheckingOut ? 'Processing...' : 'Subscribe & Pay'}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-[#566886] mb-6 text-center">Common Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Can I change plans later?',
                a: 'Yes! You can upgrade or downgrade at any time from your parent dashboard. Changes take effect on your next billing cycle.',
              },
              {
                q: 'What if I need more devices?',
                a: 'You can upgrade to a higher-tier plan or contact us for custom enterprise pricing for 4+ devices.',
              },
              {
                q: 'Is there a free trial?',
                a: 'We offer a 30-day money-back guarantee on hardware and your first month of service.',
              },
              {
                q: 'How does the device work?',
                a: 'Axolotly replaces the standard Android launcher on a TV streaming device. It only shows content you\'ve approved through the parent dashboard.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="bg-white rounded-lg shadow p-5">
                <h3 className="font-semibold text-[#566886] mb-1">{q}</h3>
                <p className="text-gray-600 text-sm">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center bg-gradient-to-r from-[#FF6B9D] to-[#FF8FB3] text-white rounded-xl p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to protect your family?</h2>
          <p className="text-lg mb-8">
            Join families who trust Axolotly to keep screen time safe and intentional.
          </p>
          <button
            onClick={() => {
              setStep('plan');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
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
