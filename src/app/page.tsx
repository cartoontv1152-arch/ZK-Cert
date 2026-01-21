"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Lock, Eye, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent"></div>
      
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        <header className="border-b border-emerald-500/20 backdrop-blur-sm bg-slate-950/50">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-emerald-400" />
              <span className="text-2xl font-bold code-font text-emerald-400">ZK-Cert</span>
            </div>
            <nav className="flex items-center gap-6">
              <Link href="/how-it-works" className="text-slate-300 hover:text-emerald-400 transition">
                How It Works
              </Link>
              <Link href="/verify" className="text-slate-300 hover:text-emerald-400 transition">
                Verify Certificate
              </Link>
              <Link href="/faq" className="text-slate-300 hover:text-emerald-400 transition">
                FAQ
              </Link>
              <Button 
                onClick={() => router.push("/login")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white glow"
              >
                Get Started
              </Button>
            </nav>
          </div>
        </header>

          <main className="container mx-auto px-6 py-20">
            <div className="text-center max-w-4xl mx-auto mb-20 animate-in fade-in duration-1000">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6 glow hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-sm text-emerald-400 code-font font-bold">🔒 Built on Aleo • Zero-Knowledge Proofs</span>
              </div>
              
              <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent leading-tight">
                Prove Everything.
                <br />
                Reveal Nothing.
              </h1>
              
              <p className="text-xl text-slate-400 mb-6 leading-relaxed">
                Private certificate verification system powered by <span className="text-emerald-400 font-bold">Aleo blockchain</span>. 
                No PDFs, no data leaks, no fake certificates. Just cryptographic proof.
              </p>
              
              <p className="text-base text-slate-500 mb-10 max-w-3xl mx-auto">
                ZK-Cert eliminates document fraud by storing cryptographic hashes on-chain while keeping personal data private. 
                Institutions issue certificates, holders generate zero-knowledge proofs, and verifiers confirm authenticity—all without exposing sensitive information.
              </p>

              <div className="flex gap-4 justify-center flex-wrap">
                <Button 
                  size="lg" 
                  onClick={() => router.push("/login")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg px-8 glow-strong hover:scale-105 transition-transform"
                >
                  Launch App <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => router.push("/verify")}
                  className="border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 hover:scale-105 transition-transform"
                >
                  Verify a Certificate
                </Button>
              </div>
            </div>

          <div className="grid md:grid-cols-3 gap-6 mb-20">
            <Card className="p-8 bg-slate-900/50 border-emerald-500/20 backdrop-blur hover:border-emerald-500/40 transition group">
              <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Lock className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-emerald-400">Zero Knowledge</h3>
              <p className="text-slate-400">
                Prove your certificate is valid without revealing any personal information. Complete privacy guaranteed.
              </p>
            </Card>

            <Card className="p-8 bg-slate-900/50 border-emerald-500/20 backdrop-blur hover:border-emerald-500/40 transition group">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Shield className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-cyan-400">On-Chain Verification</h3>
              <p className="text-slate-400">
                All verifications happen on Aleo testnet. Immutable, transparent, and tamper-proof.
              </p>
            </Card>

            <Card className="p-8 bg-slate-900/50 border-emerald-500/20 backdrop-blur hover:border-emerald-500/40 transition group">
              <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Eye className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-emerald-400">No Fake Certificates</h3>
              <p className="text-slate-400">
                Cryptographic hashes prevent forgery. Only verified institutions can issue certificates.
              </p>
            </Card>
          </div>

          <div className="bg-slate-900/30 border border-emerald-500/20 rounded-2xl p-12 backdrop-blur">
            <h2 className="text-3xl font-bold mb-8 text-center text-emerald-400">How ZK-Cert Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-emerald-400">1</span>
                </div>
                <h4 className="font-bold mb-2 text-emerald-400">Institute Issues</h4>
                <p className="text-slate-400 text-sm">
                  Verified institutions issue certificates by storing cryptographic hashes on-chain
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-cyan-400">2</span>
                </div>
                <h4 className="font-bold mb-2 text-cyan-400">Student Proves</h4>
                <p className="text-slate-400 text-sm">
                  Certificate holders generate zero-knowledge proofs without sharing documents
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-emerald-400">3</span>
                </div>
                <h4 className="font-bold mb-2 text-emerald-400">Verifier Confirms</h4>
                <p className="text-slate-400 text-sm">
                  Anyone can verify the proof on-chain without seeing personal details
                </p>
              </div>
            </div>
          </div>
        </main>

          <footer className="border-t border-emerald-500/20 mt-20 backdrop-blur-sm bg-slate-950/50">
            <div className="container mx-auto px-6 py-8">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  <span className="text-slate-400 code-font">ZK-Cert</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <span className="text-sm text-slate-500">Built on</span>
                  <span className="text-emerald-400 font-bold code-font">ALEO</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400">Testnet</span>
                </div>
                <p className="text-slate-600 text-sm code-font">© 2026 ZK-Cert. Privacy-first certificate verification.</p>
              </div>
            </div>
          </footer>
      </div>
    </div>
  );
}
