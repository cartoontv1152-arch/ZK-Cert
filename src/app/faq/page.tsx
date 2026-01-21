"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function FAQPage() {
  const faqs = [
    {
      q: "What is ZK-Cert?",
      a: "ZK-Cert is a privacy-first certificate verification system built on Aleo blockchain using zero-knowledge proofs. It allows you to prove certificate validity without sharing personal data.",
    },
    {
      q: "Do I need to upload my certificate?",
      a: "No! That's the key feature. ZK-Cert never requires PDFs or documents. Only cryptographic hashes are stored on-chain.",
    },
    {
      q: "How is my privacy protected?",
      a: "Zero-knowledge proofs allow verification without revealing your name, ID, grades, or any personal information. Only validity is proven.",
    },
    {
      q: "Can fake certificates be issued?",
      a: "No. Only verified institutions registered on-chain can issue certificates. The blockchain ensures authenticity.",
    },
    {
      q: "What is Puzzle Wallet?",
      a: "Puzzle Wallet is an Aleo wallet browser extension. It's required to interact with the Aleo blockchain and use ZK-Cert.",
    },
    {
      q: "Is this on mainnet?",
      a: "ZK-Cert currently runs on Aleo Testnet. All transactions are test transactions.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
      <header className="border-b border-emerald-500/20 backdrop-blur-sm bg-slate-950/50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-emerald-400" />
            <span className="text-2xl font-bold code-font text-emerald-400">ZK-Cert</span>
          </Link>
          <Link href="/login">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-20">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-slate-400 mb-12">
            Everything you need to know about ZK-Cert
          </p>

          <div className="space-y-6">
            {faqs.map((faq, idx) => (
              <Card key={idx} className="p-6 bg-slate-900/50 border-emerald-500/20">
                <h3 className="text-lg font-bold text-emerald-400 mb-2">{faq.q}</h3>
                <p className="text-slate-400">{faq.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
