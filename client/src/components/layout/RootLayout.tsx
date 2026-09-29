import React from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "../common/Navbar.tsx";
import { Footer } from "../common/Footer.tsx";

export const RootLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      {/* Background Decorative Gradient Orbs for Glassmorphism */}
      <div className="fixed top-[-10rem] left-[-10rem] w-[35rem] h-[35rem] rounded-full bg-indigo-500/15 dark:bg-indigo-500/10 blur-[120px] pointer-events-none -z-10" />
      <div className="fixed top-[20%] right-[-10rem] w-[30rem] h-[30rem] rounded-full bg-purple-500/15 dark:bg-purple-500/10 blur-[130px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10rem] left-[20%] w-[35rem] h-[35rem] rounded-full bg-pink-500/10 dark:bg-pink-500/5 blur-[140px] pointer-events-none -z-10" />

      {/* Persistent Glassmorphism Navigation */}
      <Navbar />

      {/* Main Routed Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Persistent Footer */}
      <Footer />
    </div>
  );
};

export default RootLayout;
