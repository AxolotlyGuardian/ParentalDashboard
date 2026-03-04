'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const MONTHLY_PRICE = 14.99;
const ANNUAL_PRICE = 149.90;
const ANNUAL_MONTHLY_EQUIV = 12.49;
const ANNUAL_SAVINGS = ((MONTHLY_PRICE * 12) - ANNUAL_PRICE).toFixed(2);

const HARDWARE_BASE = 45.00;

function getUnitPrice(units: number): number {
  if (units >= 4) return Math.round(HARDWARE_BASE * 0.85 * 100) / 100;
  if (units === 3) return Math.round(HARDWARE_BASE * 0.90 * 100) / 100;
  if (units === 2) return Math.round(HARDWARE_BASE * 0.95 * 100) / 100;
  return HARDWARE_BASE;
}

function getDiscountLabel(units: number): string | null {
  if (units >= 4) return 'Save 15%';
  if (units === 3) return 'Save 10%';
  if (units === 2) return 'Save 5%';
  return null;
}

const FEATURES = [
  'Unlimited child profiles',
  'Full app blocking & allow-listing',
  'Screen time limits & bedtime schedule',
  'Detailed usage reports & trends',
  'Web content filtering (coming soon)',
  'Real-time parent dashboard',
  'Secure cloud syncing',
  'Priority support',
];

const FAQS = [
  {
    q: 'Can I add more devices later?',
    a: 'Yes — you can purchase additional Axolotly devices at any time from your dashboard. Multi-device discounts apply automatically.',
  },
  {
    q: 'What is the annual billing discount?',
    a: `Annual billing gives you 2 months free — you pay $${ANNUAL_PRICE.toFixed(2)}/year instead of $${(MONTHLY_PRICE * 12).toFixed(2)}, saving you $${ANNUAL_SAVINGS} per year.`,
  },
  {
    q: 'How do multi-device discounts work?',
    a: '2 devices: 5% off per unit ($42.75 each). 3 devices: 10% off per unit ($40.50 each). 4+ devices: 15% off per unit ($38.25 each). Discounts apply to the one-time hardware cost.',
  },
  {
    q: 'Is there a free trial?',
    a: 'We offer a 30-day money-back guarantee on hardware and your first month of service — no questions asked.',
  },
  {
    q: 'How does the device work?',
    a: "Axolotly replaces the standard Android launcher on a TV streaming device. It only shows content you've approved through the parent dashboard.",
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel your subscription at any time from your dashboard. Your access continues until the end of the current billing period.',
  },
];

export default function Pricing() {
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [hardwareUnits, setHardwareUnits] = useState(1);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [step, setStep] = useState<'plan' | 'configure' | 'checkout'>('plan');

  const unitPrice = getUnitPrice(hardwareUnits);
  const hardwareCost = unitPrice * hardwareUnits;
  const discountLabel = getDiscountLabel(hardwareUnits);
  const subscriptionDueToday = billingPeriod === 'annual' ? ANNUAL_PRICE : MONTHLY_PRICE;

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
          plan: 'axolotly',
          billing_period: billingPeriod,
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
      <main className="max-w-5xl mx-auto px-6 py-12">

        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-[#566886] mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            One plan. Everything included. No hidden fees.
          </p>
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
                <span className={`text-sm font-medium ${step === s ? 'text-[#FF6B9D]' : 'text-gray-400'}`}>
                  {s === 'plan' ? 'Choose Billing' : s === 'configure' ? 'Configure' : 'Checkout'}
                </span>
                {i < 2 && <div className="w-12 h-0.5 bg-gray-200 mx-2" />}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Plan */}
        {step === 'plan' && (
          <>
            {/* Billing toggle */}
            <div className="flex justify-center mb-10">
              <div className="inline-flex items-center bg-gray-100 rounded-full p-1 gap-1">
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                    billingPeriod === 'monthly' ? 'bg-white shadow text-[#566886]' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod('annual')}
                  className={`px-6 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                    billingPeriod === 'annual' ? 'bg-white shadow text-[#566886]' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Annual
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    2 months free
                  </span>
                </button>
              </div>
            </div>

            {/* Single plan card */}
            <section className="mb-12 flex justify-center">
              <div className="bg-white rounded-2xl shadow-2xl border-t-4 border-[#FF6B9D] p-10 w-full max-w-lg relative">
                <div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 text-white px-6 py-1 rounded-full text-sm font-bold shadow"
                  style={{ background: 'linear-gradient(to right, #FF6B9D, #FF8FB3)' }}
                >
                  Everything Included
                </div>

                <h2 className="text-3xl font-bold text-[#566886] mb-1 text-center mt-2">Axolotly</h2>
                <p className="text-gray-500 text-center mb-6 text-sm">Full parental control for your family</p>

                <div className="text-center mb-8">
                  <div className="flex items-end justify-center gap-1">
                    <span className="text-6xl font-extrabold text-[#FF6B9D]">
                      ${billingPeriod === 'annual' ? ANNUAL_MONTHLY_EQUIV.toFixed(2) : MONTHLY_PRICE.toFixed(2)}
                    </span>
                    <span className="text-gray-500 mb-2 text-lg">/mo</span>
                  </div>
                  {billingPeriod === 'annual' ? (
                    <div className="mt-1 space-y-0.5">
                      <p className="text-sm text-gray-500">
                        Billed annually at <span className="font-semibold text-[#566886]">${ANNUAL_PRICE.toFixed(2)}/yr</span>
                      </p>
                      <p className="text-sm font-semibold text-green-600">You save ${ANNUAL_SAVINGS}/year vs monthly</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 mt-1">
                      Switch to annual and save ${ANNUAL_SAVINGS}/year
                    </p>
                  )}
                </div>

                <div className="bg-[#f7f8fc] rounded-lg p-4 mb-6 text-center">
                  <p className="text-sm text-gray-600">
                    + <span className="font-semibold text-[#566886]">$45/device</span> one-time hardware fee
                  </p>
                  <p className="text-xs text-green-600 mt-1 font-medium">
                    Multi-device discounts: 5% off 2 · 10% off 3 · 15% off 4+
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <span className="text-[#FF6B9D] font-bold mt-0.5">✓</span>
                      <span className="text-gray-700 text-sm">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => setStep('configure')}
                  className="w-full py-4 rounded-xl text-white font-bold text-lg transition-all hover:opacity-90 active:scale-95"
                  style={{ background: 'linear-gradient(to right, #FF6B9D, #FF8FB3)' }}
                >
                  Get Started
                </button>
                <p className="text-xs text-gray-400 text-center mt-3">
                  30-day money-back guarantee · Cancel anytime
                </p>
              </div>
            </section>

            <div className="bg-gray-50 rounded-xl p-6 mb-16 max-w-2xl mx-auto">
              <h4 className="font-bold text-[#566886] mb-3 text-center">Every plan includes:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                <div className="flex items-center gap-2"><span className="text-[#FF6B9D]">✓</span> Intelligent content protection</div>
                <div className="flex items-center gap-2"><span className="text-[#FF6B9D]">✓</span> Full parent dashboard access</div>
                <div className="flex items-center gap-2"><span className="text-[#FF6B9D]">✓</span> Community-driven content tagging</div>
                <div className="flex items-center gap-2"><span className="text-[#FF6B9D]">✓</span> Secure cloud syncing</div>
              </div>
            </div>
          </>
        )}

        {/* Step 2: Configure */}
        {step === 'configure' && (
          <section className="max-w-2xl mx-auto mb-16">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-[#566886] mb-6 text-center">
                How many Axolotly devices?
              </h2>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 flex justify-between items-center">
                <div>
                  <span className="font-semibold text-[#566886]">Axolotly Plan</span>
                  <span className="text-gray-500 ml-2 text-sm capitalize">({billingPeriod})</span>
                </div>
                <span className="text-lg font-bold text-[#FF6B9D]">
                  {billingPeriod === 'annual' ? `$${ANNUAL_MONTHLY_EQUIV.toFixed(2)}/mo` : `$${MONTHLY_PRICE.toFixed(2)}/mo`}
                </span>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-[#566886] mb-3">
                  Select number of devices
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((n) => {
                    const price = getUnitPrice(n);
                    const label = getDiscountLabel(n);
                    return (
                      <button
                        key={n}
                        onClick={() => setHardwareUnits(n)}
                        className={`py-4 rounded-xl border-2 transition-all text-center ${
                          hardwareUnits === n
                            ? 'border-[#FF6B9D] bg-pink-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl font-bold text-[#566886]">{n}</div>
                        <div className="text-xs text-gray-500 mt-1">${price.toFixed(2)}/unit</div>
                        {label && <div className="text-xs font-semibold text-green-600 mt-1">{label}</div>}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Need 5+ units?{' '}
                  <a href="mailto:hello@axolotly.app" className="text-[#FF6B9D] underline">
                    Contact us
                  </a>{' '}
                  for custom pricing.
                </p>
              </div>

              <div className="border-t pt-4 space-y-2 mb-6">
                <div className="flex justify-between text-gray-600 text-sm">
                  <span>
                    Axolotly Device × {hardwareUnits}
                    {discountLabel && (
                      <span className="ml-2 text-xs font-semibold text-green-600">({discountLabel})</span>
                    )}
                  </span>
                  <span>${hardwareCost.toFixed(2)} one-time</span>
                </div>
                <div className="flex justify-between text-gray-600 text-sm">
                  <span>Axolotly subscription ({billingPeriod})</span>
                  <span>
                    {billingPeriod === 'annual' ? `$${ANNUAL_PRICE.toFixed(2)}/yr` : `$${MONTHLY_PRICE.toFixed(2)}/mo`}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-[#566886]">
                  <span>Due today</span>
                  <span>${(hardwareCost + subscriptionDueToday).toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-400">
                  {billingPeriod === 'annual'
                    ? `Then $${ANNUAL_PRICE.toFixed(2)}/yr. Cancel anytime.`
                    : `Then $${MONTHLY_PRICE.toFixed(2)}/month. Cancel anytime.`}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('plan')}
                  className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('checkout')}
                  className="flex-1 py-3 rounded-lg text-white font-bold transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(to right, #FF6B9D, #FF8FB3)' }}
                >
                  Continue to Checkout
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Step 3: Checkout */}
        {step === 'checkout' && (
          <section className="max-w-2xl mx-auto mb-16">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-[#566886] mb-6 text-center">
                Complete Your Order
              </h2>

              <div className="space-y-3 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-[#566886] mb-3">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Axolotly Plan ({billingPeriod === 'annual' ? 'Annual' : 'Monthly'})
                      </span>
                      <span className="font-medium">
                        {billingPeriod === 'annual' ? `$${ANNUAL_PRICE.toFixed(2)}/yr` : `$${MONTHLY_PRICE.toFixed(2)}/mo`}
                      </span>
                    </div>
                    {billingPeriod === 'annual' && (
                      <div className="flex justify-between text-green-600 text-xs">
                        <span>Annual discount (2 months free)</span>
                        <span>−${ANNUAL_SAVINGS}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Axolotly Device × {hardwareUnits}
                        {discountLabel && (
                          <span className="text-green-600 ml-1 text-xs">({discountLabel})</span>
                        )}
                      </span>
                      <span className="font-medium">${hardwareCost.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between font-bold text-[#566886]">
                      <span>Total due today</span>
                      <span>${(hardwareCost + subscriptionDueToday).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 text-sm text-[#566886]">
                  <p className="font-semibold mb-2">What happens next:</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-600">
                    <li>Complete secure payment via Stripe</li>
                    <li>Your Axolotly device(s) ship within 3–5 business days</li>
                    <li>Pair your device and set up your family dashboard</li>
                    <li>Start protecting your family&apos;s screen time</li>
                  </ol>
                </div>

                <div className="text-xs text-gray-400 text-center">
                  30-day money-back guarantee on hardware · Cancel subscription anytime
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
                  className="flex-1 py-3 rounded-lg text-white font-bold transition-all disabled:opacity-50 hover:opacity-90"
                  style={{ background: 'linear-gradient(to right, #FF6B9D, #FF8FB3)' }}
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
            {FAQS.map(({ q, a }) => (
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
      <Footer />
    </div>
  );
}
