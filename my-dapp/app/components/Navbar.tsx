"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home" },
    { href: "/rules", label: "Rules" },
    { href: "/transparency", label: "Transparency" },
  ];

  return (
    <>
      <style>{`
        .wallet-adapter-button {
          height: 36px !important;
          padding: 0 12px !important;
          font-size: 12px !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          max-width: 140px !important;
          line-height: 36px !important;
        }
      `}</style>
      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b border-purple-900"
        style={{ background: "rgba(10,0,16,0.95)", backdropFilter: "blur(12px)" }}
      >
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">

          {/* Desktop links */}
          <div className="hidden sm:flex items-center gap-6">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm font-bold transition-colors ${
                  pathname === l.href
                    ? "text-purple-300"
                    : "text-gray-500 hover:text-purple-400"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <WalletMultiButton />
          </div>

          {/* Mobile */}
          <div className="flex sm:hidden items-center justify-between w-full">
            <WalletMultiButton />
            <button
              onClick={() => setOpen(!open)}
              className="text-purple-400 p-2"
              aria-label="Toggle menu"
            >
              {open ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {open && (
          <div
            className="sm:hidden border-t border-purple-900 px-4 py-3 flex flex-col gap-3"
            style={{ background: "rgba(10,0,16,0.98)" }}
          >
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`text-sm font-bold py-2 transition-colors ${
                  pathname === l.href
                    ? "text-purple-300"
                    : "text-gray-500 hover:text-purple-400"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </>
  );
}
