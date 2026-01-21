"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Shield,
  CheckCircle2,
  XCircle,
  ScanLine,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { U8_TO_CERT_TYPE, walletService } from "@/lib/aleo-wallet";

type VerifyResult = {
  valid: boolean;
  certId: string;
  type: string;
  issuer: string;
  holder: string;
  certHash: string;
  revoked: boolean;
};

function stripSuffix(value: string, suffix: string) {
  return value.endsWith(suffix) ? value.slice(0, -suffix.length) : value;
}

function ensureU64(value: string): string {
  if (!value) return value;
  return value.endsWith("u64") ? value : `${value}u64`;
}

export default function VerifyPage() {
  const [proofData, setProofData] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);

  const example = useMemo(
    () =>
      JSON.stringify({
        certId: "123u64",
        issuer: "aleo1...",
        type: "degree",
        programId: walletService.getProgramId(),
        network: walletService.getNetworkSlug(),
      }),
    []
  );

  const handleVerify = async () => {
    if (!proofData.trim()) {
      toast.error("Please paste the verification payload");
      return;
    }

    setVerifying(true);
    setResult(null);

    try {
      let certId = "";

      // Accept either JSON payload (from Holder QR) or plain cert_id.
      try {
        const parsed = JSON.parse(proofData);
        certId = String(parsed?.certId || "");
      } catch {
        certId = proofData.trim();
      }

      certId = ensureU64(certId);

      if (!certId || !/^[0-9]+u64$/.test(certId)) {
        toast.error("Invalid certificate ID. Expected like 123u64");
        setVerifying(false);
        return;
      }

      const info = await walletService.getCertificateInfo(certId);
      if (!info) {
        toast.error("Certificate not found on-chain");
        setResult({
          valid: false,
          certId,
          type: "unknown",
          issuer: "",
          holder: "",
          certHash: "",
          revoked: false,
        });
        return;
      }

      const certTypeNum = Number(stripSuffix(info.cert_type || "0u8", "u8"));
      const certType = U8_TO_CERT_TYPE[certTypeNum] || "unknown";

      const revoked = Boolean(info.is_revoked);
      const valid = !revoked;

      setResult({
        valid,
        certId: info.cert_id,
        type: certType,
        issuer: info.issuer,
        holder: info.holder,
        certHash: info.cert_hash,
        revoked,
      });

      if (valid) {
        toast.success("Certificate verified on-chain");
      } else {
        toast.error("Certificate is revoked");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
      <header className="border-b border-emerald-500/20 backdrop-blur-sm bg-slate-950/50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-emerald-400" />
            <span className="text-2xl font-bold code-font text-emerald-400">
              ZK-Cert
            </span>
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
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 mb-6">
              <ScanLine className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-4xl font-bold mb-4 text-white">
              Verify Certificate
            </h1>
            <p className="text-slate-400">
              Paste the verification payload (from the holder QR) to verify this
              certificate against on-chain state.
            </p>
          </div>

          <Card className="p-8 bg-slate-900/50 border-emerald-500/20 mb-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Verification Payload *
                </label>
                <Textarea
                  value={proofData}
                  onChange={(e) => setProofData(e.target.value)}
                  placeholder={example}
                  rows={6}
                  className="bg-slate-800/50 border-emerald-500/20 text-white code-font text-sm"
                />
                <p className="text-xs text-slate-500 mt-2">
                  On-chain mapping used: <span className="code-font">certificates</span> in{" "}
                  <span className="code-font">{walletService.getProgramId()}</span>
                </p>
              </div>

              <Button
                onClick={handleVerify}
                disabled={verifying}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white glow"
              >
                {verifying ? "Verifying..." : "Verify On-Chain"}
              </Button>
            </div>
          </Card>

          {result && (
            <Card
              className={`p-8 border-2 ${
                result.valid
                  ? "bg-emerald-900/20 border-emerald-500/50"
                  : "bg-red-900/20 border-red-500/50"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                    result.valid ? "bg-emerald-500/20" : "bg-red-500/20"
                  }`}
                >
                  {result.valid ? (
                    <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                  ) : (
                    <XCircle className="w-7 h-7 text-red-400" />
                  )}
                </div>

                <div className="flex-1">
                  <h3
                    className={`text-2xl font-bold mb-4 ${
                      result.valid ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {result.valid ? "Certificate Valid" : "Certificate Invalid"}
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-slate-700">
                      <span className="text-slate-400">Certificate ID</span>
                      <span className="code-font text-white">
                        {result.certId}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-700">
                      <span className="text-slate-400">Type</span>
                      <span className="text-white capitalize">{result.type}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-700">
                      <span className="text-slate-400">Issuer</span>
                      <span className="code-font text-white text-sm">
                        {result.issuer ? `${result.issuer.slice(0, 12)}...` : ""}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-700">
                      <span className="text-slate-400">Holder</span>
                      <span className="code-font text-white text-sm">
                        {result.holder ? `${result.holder.slice(0, 12)}...` : ""}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-700">
                      <span className="text-slate-400">Certificate Hash</span>
                      <span className="code-font text-white text-sm">
                        {result.certHash || ""}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-400">Status</span>
                      <span
                        className={`font-bold ${
                          result.valid ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {result.valid ? "Active" : "Revoked"}
                      </span>
                    </div>
                  </div>

                  {result.issuer && (
                    <div className="mt-6">
                      <a
                        className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:underline"
                        href={`https://explorer.provable.com/program/${walletService.getProgramId()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <LinkIcon className="w-4 h-4" />
                        View program on explorer
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
