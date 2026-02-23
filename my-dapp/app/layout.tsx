import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "./components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Degen Echo",
  description: "Predict SOL. Stack gains.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ background: "#0a0010" }}>
        <Providers>
          <Navbar />
          <div className="pt-14">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
