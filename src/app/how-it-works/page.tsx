"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, ArrowRight } from "lucide-react";

export default function HowItWorksPage() {
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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            How ZK-Cert Works
          </h1>
          <p className="text-xl text-slate-400 mb-12">
            A privacy-first certificate verification system using zero-knowledge proofs
          </p>

          <div className="space-y-8">
            <Card className="p-8 bg-slate-900/50 border-emerald-500/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-emerald-400">1</span>
                </div>
                <h2 className="text-2xl font-bold text-emerald-400">Issuer Registration</h2>
              </div>
              <p className="text-slate-400">
                Institutions connect their Aleo wallet and register as verified issuers on the blockchain.
                Only verified issuers can issue certificates.
              </p>
            </Card>

            <Card className="p-8 bg-slate-900/50 border-emerald-500/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-cyan-400">2</span>
                </div>
                <h2 className="text-2xl font-bold text-cyan-400">Certificate Issuance</h2>
              </div>
              <p className="text-slate-400">
                Issuers create certificates by submitting metadata on-chain. A cryptographic hash is generated and stored,
                not the actual certificate. The holder receives a Certificate Record.
              </p>
            </Card>

            <Card className="p-8 bg-slate-900/50 border-emerald-500/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-emerald-400">3</span>
                </div>
                <h2 className="text-2xl font-bold text-emerald-400">Proof Generation</h2>
              </div>
              <p className="text-slate-400">
                Certificate holders generate zero-knowledge proofs that prove validity without revealing personal data.
                They can share QR codes or proof strings.
              </p>
            </Card>

            <Card className="p-8 bg-slate-900/50 border-emerald-500/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-cyan-400">4</span>
                </div>
                <h2 className="text-2xl font-bold text-cyan-400">Verification</h2>
              </div>
              <p className="text-slate-400">
                Anyone can verify proofs by querying the Aleo blockchain. The system checks if the certificate
                is valid, not revoked, and issued by a trusted institution.
              </p>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <Link href="/login">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white glow">
                Try It Now <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
