"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Shield,
  Award,
  QrCode,
  LogOut,
  Wallet,
  Download,
  RefreshCw,
} from "lucide-react";
import QRCodeReact from "react-qr-code";
import { toast } from "sonner";
import {
  U8_TO_CERT_TYPE,
  walletService,
  type ChainCertificateInfo,
} from "@/lib/aleo-wallet";

type HolderCertificate = {
  certId: string; // e.g. 123u64
  issuerAddress: string;
  certHash: string;
  certificateType: string;
  issueDate: number; // unix seconds
  isRevoked: boolean;
};

function getString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function stripSuffix(value: string, suffix: string) {
  return value.endsWith(suffix) ? value.slice(0, -suffix.length) : value;
}

function parseRecordFallback(plaintext: string, key: string, regex: RegExp): string {
  const m = plaintext.match(regex);
  return m?.[1] ?? "";
}

export default function HolderDashboard() {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [certificates, setCertificates] = useState<HolderCertificate[]>([]);
  const [selectedCert, setSelectedCert] = useState<HolderCertificate | null>(null);
  const [showQR, setShowQR] = useState(false);

  const proofData = useMemo(() => {
    if (!selectedCert) return "";
    return JSON.stringify({
      programId: walletService.getProgramId(),
      network: walletService.getNetworkSlug(),
      certId: selectedCert.certId,
      certHash: selectedCert.certHash,
      issuer: selectedCert.issuerAddress,
      type: selectedCert.certificateType,
    });
  }, [selectedCert]);

  const ensureHolderSession = async () => {
    await walletService.checkConnection();
    const state = walletService.getWalletState();
    if (!state.connected || state.role !== "holder" || !state.address) {
      router.push("/login");
      return null;
    }
    setWalletAddress(state.address);
    return state.address;
  };

  const parseCertificateFromChain = async (
    record: any,
    info: ChainCertificateInfo | null
  ): Promise<HolderCertificate | null> => {
    const data = record?.data || {};
    const plaintext = getString(record?.plaintext);

    const certId =
      getString(data.cert_id) ||
      parseRecordFallback(plaintext, "cert_id", /cert_id:\s*([0-9]+u64)/i);

    const issuer =
      getString(data.issuer) ||
      parseRecordFallback(plaintext, "issuer", /issuer:\s*(aleo1[0-9a-z]+)/i);

    const certHash =
      getString(data.cert_hash) ||
      parseRecordFallback(plaintext, "cert_hash", /cert_hash:\s*([0-9]+field)/i);

    const issueDateRaw =
      getString(data.issue_date) ||
      parseRecordFallback(plaintext, "issue_date", /issue_date:\s*([0-9]+u64)/i);

    const certTypeRaw =
      getString(data.cert_type) ||
      parseRecordFallback(plaintext, "cert_type", /cert_type:\s*([0-9]+u8)/i);

    if (!certId || !issuer) return null;

    const certTypeNum = Number(stripSuffix(certTypeRaw || "0u8", "u8"));
    const certTypeKey = U8_TO_CERT_TYPE[certTypeNum] || "unknown";

    const issueDate = Number(stripSuffix(issueDateRaw || "0u64", "u64"));

    return {
      certId,
      issuerAddress: issuer,
      certHash,
      certificateType: certTypeKey,
      issueDate,
      isRevoked: info?.is_revoked ?? false,
    };
  };

  const refreshFromChain = async () => {
    const addr = await ensureHolderSession();
    if (!addr) return;

    setRefreshing(true);
    try {
      const records = await walletService.getHolderCertificateRecords();

      const infos = await Promise.all(
        records.map((r: any) =>
          walletService.getCertificateInfo(
            getString(r?.data?.cert_id) ||
              parseRecordFallback(getString(r?.plaintext), "cert_id", /cert_id:\s*([0-9]+u64)/i)
          )
        )
      );

      const parsed = await Promise.all(
        records.map((r: any, idx: number) => parseCertificateFromChain(r, infos[idx]))
      );

      setCertificates(parsed.filter(Boolean) as HolderCertificate[]);
    } catch (error: any) {
      toast.error(error?.message || "Failed to load certificates");
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

  const handleGenerateProof = async (cert: HolderCertificate) => {
    // This app shares a verification payload (cert_id + program + network) via QR.
    // The verifier checks the on-chain mapping state for revocation.
    setSelectedCert(cert);
    setShowQR(true);
    toast.success("Verification payload generated");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950">
      <header className="border-b border-cyan-500/20 backdrop-blur-sm bg-slate-950/50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-cyan-400" />
            <span className="text-2xl font-bold code-font text-cyan-400">
              ZK-Cert
            </span>
            <span className="text-sm text-slate-500">| Holder Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={refreshFromChain}
              variant="outline"
              className="border-cyan-500/30 hover:bg-cyan-500/10 text-cyan-400"
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-cyan-500/20">
              <Wallet className="w-4 h-4 text-cyan-400" />
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
        {showQR && selectedCert ? (
          <Card className="max-w-2xl mx-auto p-8 bg-slate-900/50 border-cyan-500/20">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-cyan-400 mb-2">
                Verification Payload
              </h2>
              <p className="text-slate-400">
                Share this QR code (or copy payload) to verify your certificate
              </p>
            </div>

            <div className="flex justify-center p-8 bg-white rounded-lg mb-6">
              <QRCodeReact value={proofData} size={256} />
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 rounded-lg bg-slate-800/30 border border-cyan-500/20">
                <div className="text-sm text-slate-400 mb-1">Certificate ID</div>
                <div className="code-font text-cyan-400">{selectedCert.certId}</div>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/30 border border-cyan-500/20">
                <div className="text-sm text-slate-400 mb-1">Type</div>
                <div className="text-white">{selectedCert.certificateType}</div>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/30 border border-cyan-500/20">
                <div className="text-sm text-slate-400 mb-1">Payload</div>
                <div className="code-font text-xs text-slate-500 break-all">
                  {proofData}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => setShowQR(false)}
                variant="outline"
                className="flex-1 border-cyan-500/30"
              >
                Back to Certificates
              </Button>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(proofData);
                  toast.success("Payload copied!");
                }}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Copy Payload
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-cyan-400 mb-4">
                My Certificates
              </h1>
              <p className="text-slate-400">
                Certificates are loaded directly from your wallet records
              </p>
            </div>

            {certificates.length === 0 ? (
              <Card className="p-12 text-center bg-slate-900/50 border-cyan-500/20">
                <Award className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-400 mb-2">
                  No Certificates Yet
                </h3>
                <p className="text-slate-500">
                  Certificates issued to your wallet will appear here
                </p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {certificates.map((cert) => (
                  <Card
                    key={cert.certId}
                    className="p-6 bg-slate-900/50 border-cyan-500/20 hover:border-cyan-500/40 transition"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                        <Award className="w-6 h-6 text-cyan-400" />
                      </div>
                      {cert.isRevoked && (
                        <span className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-400">
                          Revoked
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-cyan-400 mb-2">
                      {cert.certificateType}
                    </h3>

                    <div className="space-y-2 text-sm mb-4">
                      <div>
                        <span className="text-slate-500">ID: </span>
                        <span className="code-font text-slate-400">
                          {cert.certId}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Issued: </span>
                        <span className="text-slate-400">
                          {new Date(cert.issueDate * 1000).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleGenerateProof(cert)}
                      disabled={cert.isRevoked}
                      className="w-full bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-50"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      Generate QR
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
