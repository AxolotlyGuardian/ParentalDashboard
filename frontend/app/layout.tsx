import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Axolotly - Parental Control Protection",
  description: "Protection that grows with your family",
  icons: {
    icon: '/axolotly-logo.svg',
    apple: '/axolotly-logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${nunito.variable} font-sans antialiased`}
        style={{ fontFamily: 'var(--font-nunito)' }}
      >
        {children}
      </body>
    </html>
  );
}
