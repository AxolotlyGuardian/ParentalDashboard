'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function SubscriptionSuccess() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#fdfdfc]">
      <Header variant="pink" />

      <main className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="bg-white rounded-xl shadow-lg p-12">
          <div className="text-6xl mb-6">&#10003;</div>
          <h1 className="text-3xl font-bold text-[#566886] mb-4">
            Welcome to the Axolotly family!
          </h1>
          <p className="text-gray-600 mb-8">
            Your subscription is active and your Axolotly device(s) will ship within 3-5 business days.
            In the meantime, set up your parent dashboard and start configuring content policies.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/parent')}
              className="w-full py-3 rounded-lg text-white font-bold"
              style={{ background: 'linear-gradient(to right, #FF6B9D, #FF8FB3)' }}
            >
              Go to Parent Dashboard
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 rounded-lg border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
