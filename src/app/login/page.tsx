"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Building2, User, CheckCircle, AlertCircle } from "lucide-react";
import { walletService, UserRole } from "@/lib/aleo-wallet";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<'puzzle' | 'leo' | 'fox'>('puzzle');
  const [walletAvailability, setWalletAvailability] = useState<{
    puzzle: boolean;
    leo: boolean;
    fox: boolean;
  }>({ puzzle: false, leo: false, fox: false });

  useEffect(() => {
    // Check wallet availability on mount and periodically
    const checkWallets = () => {
      setWalletAvailability({
        puzzle: walletService.isWalletInstalled() && walletService.getInstalledWallets().includes('puzzle'),
        leo: walletService.isWalletInstalled() && walletService.getInstalledWallets().includes('leo'),
        fox: walletService.isWalletInstalled() && walletService.getInstalledWallets().includes('fox'),
      });
    };

    checkWallets();
    // Check periodically in case wallet is installed after page load
    const interval = setInterval(checkWallets, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleConnect = async (walletType: 'puzzle' | 'leo' | 'fox') => {
    if (!selectedRole) {
      toast.error("Please select your role first");
      return;
    }

      setConnecting(true);
      setSelectedWallet(walletType);
      try {
        const state = await walletService.connectWallet(selectedRole, walletType);
        
        toast.success(
          <div>
            <p className="font-bold">Connected as {selectedRole}</p>
            <p className="text-xs mt-1 opacity-80">Address: {state.address}</p>
          </div>,
          { duration: 5000 }
        );
        
        if (selectedRole === "issuer") {
          router.push("/issuer/dashboard");
        } else if (selectedRole === "holder") {
          router.push("/holder/dashboard");
        } else {
          router.push("/verify");
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to connect wallet");
      } finally {
        setConnecting(false);
      }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="w-10 h-10 text-emerald-400" />
              <span className="text-3xl font-bold code-font text-emerald-400">ZK-Cert</span>
            </div>
              <h1 className="text-4xl font-bold mb-4 text-white">Connect Your Wallet</h1>
              <p className="text-slate-400">Select your role and connect with Puzzle, Leo, or Fox Wallet</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card
              onClick={() => setSelectedRole("issuer")}
              className={`p-8 cursor-pointer transition-all ${
                selectedRole === "issuer"
                  ? "bg-emerald-600/20 border-emerald-500 glow"
                  : "bg-slate-900/50 border-emerald-500/20 hover:border-emerald-500/40"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-emerald-400" />
                </div>
                {selectedRole === "issuer" && (
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                )}
              </div>
              <h3 className="text-2xl font-bold mb-2 text-emerald-400">Issuer</h3>
              <p className="text-slate-400 text-sm mb-4">
                For institutes, colleges, and organizations that issue certificates
              </p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>• Issue certificates on-chain</li>
                <li>• Revoke certificates if needed</li>
                <li>• Track issued certificates</li>
              </ul>
            </Card>

            <Card
              onClick={() => setSelectedRole("holder")}
              className={`p-8 cursor-pointer transition-all ${
                selectedRole === "holder"
                  ? "bg-cyan-600/20 border-cyan-500 glow"
                  : "bg-slate-900/50 border-emerald-500/20 hover:border-emerald-500/40"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-cyan-400" />
                </div>
                {selectedRole === "holder" && (
                  <CheckCircle className="w-6 h-6 text-cyan-400" />
                )}
              </div>
              <h3 className="text-2xl font-bold mb-2 text-cyan-400">Holder</h3>
              <p className="text-slate-400 text-sm mb-4">
                For students and employees who hold certificates
              </p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>• View your certificates</li>
                <li>• Generate ZK proofs</li>
                <li>• Share verification QR codes</li>
              </ul>
            </Card>
          </div>

          <div className="text-center space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 justify-center max-w-3xl mx-auto">
              <div className="relative">
                <Button
                  size="lg"
                  onClick={() => handleConnect('puzzle')}
                  disabled={!selectedRole || connecting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg px-8 glow-strong disabled:opacity-50 w-full"
                >
                  {connecting && selectedWallet === 'puzzle' ? "Connecting..." : "Puzzle"}
                </Button>
                {!walletAvailability.puzzle && (
                  <div className="absolute -top-6 left-0 right-0 flex items-center justify-center gap-1 text-xs text-yellow-400">
                    <AlertCircle className="w-3 h-3" />
                    <span>Not detected</span>
                  </div>
                )}
              </div>
              <div className="relative">
                <Button
                  size="lg"
                  onClick={() => handleConnect('leo')}
                  disabled={!selectedRole || connecting}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white text-lg px-8 glow-strong disabled:opacity-50 w-full"
                >
                  {connecting && selectedWallet === 'leo' ? "Connecting..." : "Leo"}
                </Button>
                {!walletAvailability.leo && (
                  <div className="absolute -top-6 left-0 right-0 flex items-center justify-center gap-1 text-xs text-yellow-400">
                    <AlertCircle className="w-3 h-3" />
                    <span>Not detected</span>
                  </div>
                )}
              </div>
              <div className="relative">
                <Button
                  size="lg"
                  onClick={() => handleConnect('fox')}
                  disabled={!selectedRole || connecting}
                  className="bg-orange-600 hover:bg-orange-700 text-white text-lg px-8 glow-strong disabled:opacity-50 w-full"
                >
                  {connecting && selectedWallet === 'fox' ? "Connecting..." : "Fox"}
                </Button>
                {!walletAvailability.fox && (
                  <div className="absolute -top-6 left-0 right-0 flex items-center justify-center gap-1 text-xs text-yellow-400">
                    <AlertCircle className="w-3 h-3" />
                    <span>Not detected</span>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-slate-500 max-w-3xl mx-auto">
              <p>
                <a
                  href="https://puzzlewallet.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline"
                >
                  {walletAvailability.puzzle ? "✓ Installed" : "Get Puzzle"}
                </a>
              </p>
              <p>
                <a
                  href="https://leo.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline"
                >
                  {walletAvailability.leo ? "✓ Installed" : "Get Leo"}
                </a>
              </p>
              <p>
                <a
                  href="https://foxwallet.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-400 hover:underline"
                >
                  {walletAvailability.fox ? "✓ Installed" : "Get Fox"}
                </a>
              </p>
            </div>
            {!walletAvailability.puzzle && !walletAvailability.leo && !walletAvailability.fox && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg max-w-2xl mx-auto">
                <p className="text-yellow-400 text-sm">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  No wallets detected. Please install Puzzle, Leo, or Fox Wallet browser extension and refresh the page.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
