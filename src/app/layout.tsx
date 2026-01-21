import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "ZK-Cert | Private Certificate Verification on Aleo",
  description:
    "Privacy-first certificate verification system using zero-knowledge proofs on Aleo blockchain. Prove everything, reveal nothing.",
  keywords: [
    "zero-knowledge proofs",
    "certificate verification",
    "Aleo blockchain",
    "privacy",
    "cryptographic verification",
    "blockchain certificates",
    "ZK proofs",
  ],
  authors: [{ name: "ZK-Cert" }],
  creator: "ZK-Cert",
  publisher: "ZK-Cert",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: "ZK-Cert | Private Certificate Verification on Aleo",
    description: "Privacy-first certificate verification system using zero-knowledge proofs on Aleo blockchain",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZK-Cert | Private Certificate Verification",
    description: "Privacy-first certificate verification system using zero-knowledge proofs on Aleo blockchain",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/logo.svg",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
