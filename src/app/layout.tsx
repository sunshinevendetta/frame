import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FrameProvider } from "@airstack/frames";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cosmic Chuckles Game",
  description: "A fun and exciting game built with Next.js and Phaser",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <FrameProvider
          publicKey={process.env.NEXT_PUBLIC_FRAMES_PUBLIC_KEY}
          localization={{
            locale: "en",
            messages: {
              // Add any localization messages if needed
            },
          }}
        >
          {children}
        </FrameProvider>
      </body>
    </html>
  );
}
