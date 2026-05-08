import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FitProgress",
  description: "Sledování tréninků a progresu.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="cs"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#070812] text-white">
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute -top-48 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-linear-to-r from-indigo-600/25 via-fuchsia-600/20 to-cyan-500/10 blur-3xl" />
          <div className="absolute bottom-[-260px] right-[-220px] h-[520px] w-[520px] rounded-full bg-linear-to-tr from-fuchsia-600/25 via-indigo-600/20 to-transparent blur-3xl" />
        </div>
        {children}
      </body>
    </html>
  );
}
