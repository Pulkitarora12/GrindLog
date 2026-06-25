import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { isAuthorized, logout } from "@/lib/auth";
import { redirect } from "next/navigation";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "DevLog — Track & Log",
  description: "A personal productivity tracker and editorial blogging platform.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isAdmin = await isAuthorized();

  const handleLogout = async () => {
    "use server";
    await logout();
    redirect("/");
  };

  return (
    <html
      lang="en"
      className={`${inter.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#faf9f6] text-[#111827] font-sans">
        {/* Navigation Header */}
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="font-serif text-2xl font-bold tracking-tight hover:opacity-80">
              DevLog<span className="text-emerald-700">.</span>
            </Link>

            {/* Navigation links */}
            <nav className="flex items-center gap-6 text-sm font-medium text-gray-600">
              <Link href="/" className="hover:text-gray-900 transition-colors">
                Dashboard
              </Link>
              <Link href="/feed" className="hover:text-gray-900 transition-colors">
                Feed
              </Link>
              <Link href="/calendar" className="hover:text-gray-900 transition-colors">
                Calendar
              </Link>
              <Link href="/tracks" className="hover:text-gray-900 transition-colors">
                Tracks
              </Link>
              <Link href="/series" className="hover:text-gray-900 transition-colors">
                Series
              </Link>
              
              {isAdmin && (
                <Link
                  href="/new"
                  className="ml-2 inline-flex items-center justify-center rounded-sm border border-gray-900 bg-gray-900 px-3 py-1.5 text-xs text-white hover:bg-gray-800 transition-colors"
                >
                  + New Entry
                </Link>
              )}
            </nav>
          </div>
        </header>

        {/* Main Content Wrapper */}
        <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-500">
          <div className="mx-auto max-w-5xl px-6 flex items-center justify-center gap-4">
            <span>&copy; {new Date().getFullYear()} DevLog. Built with Next.js, Prisma, and Vercel.</span>
            {isAdmin && (
              <form action={handleLogout} className="inline">
                <button type="submit" className="text-xs text-red-600 hover:underline cursor-pointer">
                  Logout Admin
                </button>
              </form>
            )}
          </div>
        </footer>
      </body>
    </html>
  );
}
