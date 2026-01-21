"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Shield,
  PlusCircle,
  FileText,
  Ban,
  LogOut,
  Wallet,
  RefreshCw,
} from "lucide-react";
import {
  CERT_TYPE_TO_U8,
  U8_TO_CERT_TYPE,
  walletService,
  type CertificateTypeKey,
} from "@/lib/aleo-wallet";
import { toast } from "sonner";

type IssuedCertificate = {
  certId: string; // e.g. 123u64
  holderAddress: string;
  certificateType: string;
  issueDate: number; // unix seconds
  certHash: string;
  isRevoked: boolean;
  eventId?: string;
};

function stripSuffix(value: string, suffix: string) {
  return value.endsWith(suffix) ? value.slice(0, -suffix.length) : value;
}

export default function IssuerDashboard() {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [issuerRegistered, setIssuerRegistered] = useState<boolean | null>(null);
  const [certificates, setCertificates] = useState<IssuedCertificate[]>([]);

  const [formData, setFormData] = useState({
    holderAddress: "",
    certificateType: "" as CertificateTypeKey | "",
    institutionName: "",
    description: "",
  });

  const stats = useMemo(() => {
    const total = certificates.length;
    const active = certificates.filter((c) => !c.isRevoked).length;
    const revoked = certificates.filter((c) => c.isRevoked).length;
    const uniqueHolders = new Set(certificates.map((c) => c.holderAddress)).size;
    return { total, active, revoked, uniqueHolders };
  }, [certificates]);

  const ensureIssuerSession = async () => {
    await walletService.checkConnection();
    const state = walletService.getWalletState();
    if (!state.connected || state.role !== "issuer" || !state.address) {
      router.push("/login");
      return null;
    }
    setWalletAddress(state.address);
    return state.address;
  };

  const refreshFromChain = async () => {
    const addr = await ensureIssuerSession();
    if (!addr) return;

    setRefreshing(true);
    try {
      const registered = await walletService.isIssuerRegistered(addr);
      setIssuerRegistered(registered);

      const events = await walletService.getIssuerIssueEvents();

      const parsed = await Promise.all(
        events.map(async (e) => {
          const [certId, holderAddress, certHash, issueDate, certType] =
            e.inputs || [];

          const chainInfo = certId ? await walletService.getCertificateInfo(certId) : null;

          const certTypeNum = Number(stripSuffix(certType || "0u8", "u8"));
          const certTypeKey = U8_TO_CERT_TYPE[certTypeNum] || "unknown";

          return {
            certId: certId || "",
            holderAddress: holderAddress || "",
            certificateType: certTypeKey,
            issueDate: Number(stripSuffix(issueDate || "0u64", "u64")),
            certHash: certHash || "",
            isRevoked: chainInfo?.is_revoked ?? false,
            eventId: e._id,
          } satisfies IssuedCertificate;
        })
      );

      // Newest first (created is Date, but we use inputs fallback)
      setCertificates(parsed.filter((c) => c.certId && c.holderAddress));
    } catch (error: any) {
      toast.error(error?.message || "Failed to load on-chain data");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    refreshFromChain();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleDisconnect = async () => {
    await walletService.disconnectWallet();
    toast.success("Wallet disconnected");
    router.push("/");
  };

  const handleIssueCertificate = async () => {
    if (!formData.holderAddress || !formData.certificateType) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const addr = await ensureIssuerSession();
      if (!addr) return;

      const registered =
        issuerRegistered ?? (await walletService.isIssuerRegistered(addr));

      if (!registered) {
        toast.message("Registering issuer on-chain...");
        await walletService.registerIssuer();
        setIssuerRegistered(true);
      }

      const result = await walletService.issueCertificate({
        holderAddress: formData.holderAddress,
        certificateType: formData.certificateType,
        institutionName: formData.institutionName,
        description: formData.description,
      });

      toast.success("Certificate issued on-chain", {
        description: `cert_id: ${result.certId}`,
      });

      setFormData({
        holderAddress: "",
        certificateType: "",
        institutionName: "",
        description: "",
      });

      await refreshFromChain();
    } catch (error: any) {
      toast.error(error?.message || "Failed to issue certificate");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeCertificate = async (certId: string) => {
    setLoading(true);
    try {
      await walletService.revokeCertificate(certId);
      toast.success("Certificate revoked on-chain");
      await refreshFromChain();
    } catch (error: any) {
      toast.error(error?.message || "Failed to revoke certificate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
      <header className="border-b border-emerald-500/20 backdrop-blur-sm bg-slate-950/50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-emerald-400" />
            <span className="text-2xl font-bold code-font text-emerald-400">
              ZK-Cert
            </span>
            <span className="text-sm text-slate-500">| Issuer Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={refreshFromChain}
              variant="outline"
              className="border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400"
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-emerald-500/20">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span className="text-sm code-font text-slate-300">
                {walletAddress
                  ? `${String(walletAddress).slice(0, 8)}...${String(walletAddress).slice(-6)}`
                  : ""}
              </span>
            </div>
            <Button
              onClick={handleDisconnect}
              variant="outline"
              className="border-red-500/30 hover:bg-red-500/10 text-red-400"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <Card className="p-8 bg-slate-900/50 border-emerald-500/20">
            <div className="flex items-center gap-3 mb-6">
              <PlusCircle className="w-6 h-6 text-emerald-400" />
              <h2 className="text-2xl font-bold text-emerald-400">
                Issue New Certificate
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="holderAddress" className="text-slate-300">
                  Holder Address *
                </Label>
                <Input
                  id="holderAddress"
                  value={formData.holderAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, holderAddress: e.target.value })
                  }
                  placeholder="aleo1..."
                  className="bg-slate-800/50 border-emerald-500/20 text-white"
                />
              </div>

              <div>
                <Label htmlFor="certificateType" className="text-slate-300">
                  Certificate Type *
                </Label>
                <select
                  id="certificateType"
                  value={formData.certificateType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      certificateType: e.target.value as CertificateTypeKey,
                    })
                  }
                  className="w-full h-10 rounded-md bg-slate-800/50 border border-emerald-500/20 text-white px-3 text-sm"
                >
                  <option value="" disabled>
                    Select type
                  </option>
                  {Object.keys(CERT_TYPE_TO_U8).map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="institutionName" className="text-slate-300">
                  Institution Name
                </Label>
                <Input
                  id="institutionName"
                  value={formData.institutionName}
                  onChange={(e) =>
                    setFormData({ ...formData, institutionName: e.target.value })
                  }
                  placeholder="Your institution name"
                  className="bg-slate-800/50 border-emerald-500/20 text-white"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-slate-300">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Certificate details..."
                  rows={4}
                  className="bg-slate-800/50 border-emerald-500/20 text-white"
                />
              </div>

              <Button
                onClick={handleIssueCertificate}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white glow"
              >
                {loading ? "Submitting..." : "Issue Certificate (On-Chain)"}
              </Button>
            </div>
          </Card>

          <Card className="p-8 bg-slate-900/50 border-emerald-500/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-cyan-400" />
                <h2 className="text-2xl font-bold text-cyan-400">Statistics</h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-3xl font-bold text-emerald-400 mb-2">
                  {stats.total}
                </div>
                <div className="text-sm text-slate-400">Total Issued</div>
              </div>
              <div className="p-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <div className="text-3xl font-bold text-cyan-400 mb-2">
                  {stats.active}
                </div>
                <div className="text-sm text-slate-400">Active</div>
              </div>
              <div className="p-6 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="text-3xl font-bold text-red-400 mb-2">
                  {stats.revoked}
                </div>
                <div className="text-sm text-slate-400">Revoked</div>
              </div>
              <div className="p-6 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="text-3xl font-bold text-yellow-400 mb-2">
                  {stats.uniqueHolders}
                </div>
                <div className="text-sm text-slate-400">Unique Holders</div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-lg bg-slate-800/30 border border-emerald-500/20">
              <div className="text-sm text-slate-400 mb-1">Issuer Status</div>
              <div className="text-white">
                {issuerRegistered === null
                  ? "Checking..."
                  : issuerRegistered
                    ? "Registered ✅"
                    : "Not registered (will auto-register on first issue)"}
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-8 bg-slate-900/50 border-emerald-500/20">
          <h2 className="text-2xl font-bold text-emerald-400 mb-6">
            Issued Certificates (On-Chain)
          </h2>

          {certificates.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No issued certificates found for this issuer
            </div>
          ) : (
            <div className="space-y-4">
              {certificates.map((cert) => (
                <div
                  key={cert.certId}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-800/30 border border-emerald-500/20"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="code-font text-emerald-400">
                        {cert.certId}
                      </span>
                      {cert.isRevoked && (
                        <span className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-400">
                          Revoked
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-400">
                      Type: {cert.certificateType} | Holder: {cert.holderAddress.slice(0, 12)}...
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Issued: {new Date(cert.issueDate * 1000).toLocaleDateString()} | cert_hash: {cert.certHash}
                    </div>
                  </div>
                  {!cert.isRevoked && (
                    <Button
                      onClick={() => handleRevokeCertificate(cert.certId)}
                      variant="outline"
                      size="sm"
                      className="border-red-500/30 hover:bg-red-500/10 text-red-400"
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
