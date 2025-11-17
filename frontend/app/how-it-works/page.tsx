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
            <h2 className="text-2xl font-bold text-[#566886] mb-4">1. Create Kid Profiles</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Set up profiles for each child with their name, age, and a secure PIN. Each profile gets personalized content rules tailored to your family&apos;s values.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Individual profiles for each child</li>
              <li>Age-appropriate content management</li>
              <li>PIN-protected access for kids</li>
            </ul>
          </section>

          <section className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-[#566886]">
            <h2 className="text-2xl font-bold text-[#566886] mb-4">2. Curate Content Libraries</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Search thousands of movies and TV shows from The Movie Database. Simply allow or block content for each child&apos;s profile with a single tap.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Browse movies and TV shows</li>
              <li>Allow or block specific titles</li>
              <li>Community-driven content warnings and tags</li>
            </ul>
          </section>

          <section className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-[#C2B7EE]">
            <h2 className="text-2xl font-bold text-[#566886] mb-4">3. Pair Android Devices</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Install the Axolotly launcher on your child&apos;s Android device and pair it with a simple 6-digit code. The launcher enforces your rules automatically.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Quick 6-digit code pairing</li>
              <li>Kid-friendly launcher interface</li>
              <li>Only approved content appears</li>
            </ul>
          </section>

          <section className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-[#B2D8BF]">
            <h2 className="text-2xl font-bold text-[#566886] mb-4">4. Monitor and Adjust</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Track device activity, set daily screen time limits, and see what your kids are watching. Adjust permissions anytime from your parent dashboard.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Daily screen time limits and bedtime schedules</li>
              <li>View device activity and usage statistics</li>
              <li>Update content permissions on the go</li>
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
