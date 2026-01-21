import {
  connect,
  getAccount,
  getEvents,
  getRecords,
  requestCreateEvent,
  EventType,
  Network,
  type Event,
  type RecordWithPlaintext,
} from "@puzzlehq/sdk-core";

declare global {
  interface Window {
    aleo?: {
      puzzleWalletClient?: any;
    };
    leoWallet?: {
      connect: (options: { dAppName: string; chainID: string }) => Promise<string[]>;
      disconnect: () => Promise<void>;
      getAccounts: () => Promise<string[]>;
      isConnected: () => boolean;
    };
    foxwallet?: {
      aleo?: {
        connect: (options: { dAppName: string; chainID: string }) => Promise<string[]>;
        disconnect: () => Promise<void>;
        getAccounts: () => Promise<string[]>;
        isConnected: () => boolean;
        on: (event: string, callback: (data: any) => void) => void;
        removeListener: (event: string, callback: (data: any) => void) => void;
      };
    };
  }
}

export type UserRole = "issuer" | "holder" | "verifier";

export interface WalletState {
  address: string | null;
  network: string | null;
  connected: boolean;
  role: UserRole | null;
}

export type CertificateTypeKey =
  | "degree"
  | "diploma"
  | "certification"
  | "internship"
  | "employment";

export const CERT_TYPE_TO_U8: Record<CertificateTypeKey, number> = {
  degree: 1,
  diploma: 2,
  certification: 3,
  internship: 4,
  employment: 5,
};

export const U8_TO_CERT_TYPE: Record<number, CertificateTypeKey | "unknown"> = {
  1: "degree",
  2: "diploma",
  3: "certification",
  4: "internship",
  5: "employment",
};

const PROGRAM_ID =
  process.env.NEXT_PUBLIC_ZK_CERT_PROGRAM_ID || "zk_cert_main.aleo";

const RPC_URL =
  process.env.NEXT_PUBLIC_ALEO_RPC_URL || "https://api.explorer.provable.com/v1";

const NETWORK_SLUG =
  (process.env.NEXT_PUBLIC_ALEO_NETWORK || "testnet").toLowerCase() === "mainnet"
    ? "mainnet"
    : "testnet";

const NETWORK_ENUM =
  NETWORK_SLUG === "mainnet" ? Network.AleoMainnet : Network.AleoTestnet;

// Aleo field modulus (BLS12-377 base field)
const ALEO_FIELD_MODULUS = BigInt(
  "8444461749428370424248824938781546531375899335154063827935233455917409239041"
);

function ensureU64(value: string): string {
  return value.endsWith("u64") ? value : `${value}u64`;
}

function ensureU8(value: string): string {
  return value.endsWith("u8") ? value : `${value}u8`;
}

async function sha256Bytes(message: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(message);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(digest);
}

async function sha256ToU64(message: string): Promise<bigint> {
  const bytes = await sha256Bytes(message);
  // Use first 8 bytes (big-endian) as u64.
  let n = BigInt(0);
  for (let i = 0; i < 8; i++) n = (n << BigInt(8)) + BigInt(bytes[i]);
  return n;
}

async function sha256ToField(message: string): Promise<string> {
  const bytes = await sha256Bytes(message);
  // Convert full 32 bytes to bigint (big-endian) then mod field.
  let n = BigInt(0);
  for (const b of bytes) n = (n << BigInt(8)) + BigInt(b);
  const field = n % ALEO_FIELD_MODULUS;
  return `${field.toString()}field`;
}

export type ChainCertificateInfo = {
  cert_id: string; // e.g. 1u64
  issuer: string;
  holder: string;
  cert_hash: string; // e.g. 123field
  issue_date: string; // e.g. 1700000000u64
  cert_type: string; // e.g. 1u8
  is_revoked: boolean;
};

function parseLeoBool(value: string | undefined): boolean {
  return String(value).trim().toLowerCase() === "true";
}

function parseMappingValueToCertificateInfo(raw: string): ChainCertificateInfo | null {
  // Try JSON first (some endpoints return JSON)
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return {
        cert_id: String(parsed.cert_id ?? parsed.certId ?? ""),
        issuer: String(parsed.issuer ?? ""),
        holder: String(parsed.holder ?? ""),
        cert_hash: String(parsed.cert_hash ?? parsed.certHash ?? ""),
        issue_date: String(parsed.issue_date ?? parsed.issueDate ?? ""),
        cert_type: String(parsed.cert_type ?? parsed.certType ?? ""),
        is_revoked: Boolean(parsed.is_revoked ?? parsed.isRevoked ?? false),
      };
    }
  } catch {
    // fall through
  }

  // Fallback: parse Leo struct string (best-effort)
  // Example-ish: "{ cert_id: 1u64, issuer: aleo1..., holder: aleo1..., cert_hash: 123field, issue_date: 170u64, cert_type: 1u8, is_revoked: false }"
  const issuer = raw.match(/issuer:\s*(aleo1[0-9a-z]+)/i)?.[1] ?? "";
  const holder = raw.match(/holder:\s*(aleo1[0-9a-z]+)/i)?.[1] ?? "";
  const cert_id = raw.match(/cert_id:\s*([0-9]+u64)/i)?.[1] ?? "";
  const cert_hash = raw.match(/cert_hash:\s*([0-9]+field)/i)?.[1] ?? "";
  const issue_date = raw.match(/issue_date:\s*([0-9]+u64)/i)?.[1] ?? "";
  const cert_type = raw.match(/cert_type:\s*([0-9]+u8)/i)?.[1] ?? "";
  const is_revoked = parseLeoBool(raw.match(/is_revoked:\s*(true|false)/i)?.[1]);

  if (!cert_id || !issuer || !holder) return null;

  return { cert_id, issuer, holder, cert_hash, issue_date, cert_type, is_revoked };
}

class AleoWalletService {
  private static instance: AleoWalletService;
  private walletState: WalletState = {
    address: null,
    network: null,
    connected: false,
    role: null,
  };

  private constructor() {}

  // Wait for wallet injection (browser extensions may take time)
  private async waitForWallet(walletType: 'leo' | 'fox', timeout: number = 3000): Promise<boolean> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (walletType === 'leo' && this.hasLeoWallet()) {
        return true;
      }
      if (walletType === 'fox' && this.hasFoxWallet()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return false;
  }

  static getInstance(): AleoWalletService {
    if (!AleoWalletService.instance) {
      AleoWalletService.instance = new AleoWalletService();
    }
    return AleoWalletService.instance;
  }

    private hasPuzzleWalletClient(): boolean {
      if (typeof window === "undefined") return false;
      return !!window?.aleo?.puzzleWalletClient;
    }

    private hasLeoWallet(): boolean {
      if (typeof window === "undefined") return false;
      // Check multiple possible injection points for Leo Wallet
      return !!(window?.leoWallet || (window as any).leo);
    }

    private hasFoxWallet(): boolean {
      if (typeof window === "undefined") return false;
      // Check multiple possible injection points for Fox Wallet
      return !!(window?.foxwallet?.aleo || (window as any).foxwallet);
    }

    private async connectLeoWallet(role: UserRole): Promise<WalletState> {
      // Wait for wallet injection if not immediately available
      const walletAvailable = await this.waitForWallet('leo');
      if (!walletAvailable && !this.hasLeoWallet()) {
        throw new Error("Leo Wallet not detected. Please install it from https://leo.app and refresh the page.");
      }

      try {
        // Leo Wallet uses adapter pattern - check for adapter first
        // Try multiple injection points
        const leoWallet = (window as any).leoWallet || (window as any).leo || (window as any).leoWalletAdapter;
        
        if (!leoWallet) {
          throw new Error("Leo Wallet provider not found. Please make sure Leo Wallet extension is installed and enabled.");
        }

        let address: string | null = null;
        
        // Method 1: Try adapter connect method (if using adapter pattern)
        if (typeof leoWallet.connect === 'function') {
          try {
            // Leo adapter connect takes: decryptPermission, network, programs?
            // Try with proper parameters
            await leoWallet.connect("UponRequest", "testnet");
            // After connect, get publicKey
            if (leoWallet.publicKey) {
              address = leoWallet.publicKey;
            }
          } catch (e: any) {
            console.log("Leo adapter connect failed, trying alternatives:", e.message);
          }
        }
        
        // Method 2: Try direct publicKey access
        if (!address && leoWallet.publicKey) {
          address = leoWallet.publicKey;
        }
        
        // Method 3: Try requestAccounts pattern
        if (!address && typeof leoWallet.requestAccounts === 'function') {
          try {
            const accounts = await leoWallet.requestAccounts();
            address = Array.isArray(accounts) ? accounts[0] : (typeof accounts === 'string' ? accounts : null);
          } catch (e) {
            console.log("requestAccounts failed:", e);
          }
        }
        
        // Method 4: Try getAccounts pattern
        if (!address && typeof leoWallet.getAccounts === 'function') {
          try {
            const accounts = await leoWallet.getAccounts();
            address = Array.isArray(accounts) ? accounts[0] : (typeof accounts === 'string' ? accounts : null);
          } catch (e) {
            console.log("getAccounts failed:", e);
          }
        }
        
        // Method 5: Try connect with object (some versions)
        if (!address && typeof leoWallet.connect === 'function') {
          try {
            const result = await leoWallet.connect({ 
              dAppName: "ZK-Cert", 
              chainID: "testnet" 
            });
            address = Array.isArray(result) ? result[0] : (typeof result === 'string' ? result : result?.address || null);
          } catch (e) {
            console.log("Object connect failed:", e);
          }
        }

        if (!address || typeof address !== 'string') {
          throw new Error("Failed to retrieve wallet address from Leo Wallet. Please make sure the wallet is unlocked and try again.");
        }

        // Ensure address is a string
        address = String(address);

        this.walletState = {
          address,
          network: NETWORK_ENUM,
          connected: true,
          role,
        };

        if (typeof window !== "undefined") {
          localStorage.setItem("userRole", role);
          localStorage.setItem("walletAddress", address);
          localStorage.setItem("walletType", "leo");
        }

        return this.walletState;
      } catch (error: any) {
        const errorMessage = error?.message || "Unknown error";
        throw new Error(`Leo Wallet connection failed: ${errorMessage}. Please make sure Leo Wallet is installed, unlocked, and try refreshing the page.`);
      }
    }

    private async connectFoxWallet(role: UserRole): Promise<WalletState> {
      // Wait for wallet injection if not immediately available
      const walletAvailable = await this.waitForWallet('fox');
      if (!walletAvailable && !this.hasFoxWallet()) {
        throw new Error("Fox Wallet not detected. Please install it from https://foxwallet.com and refresh the page.");
      }

      try {
        // Fox Wallet API: window.foxwallet.aleo
        const foxProvider = window.foxwallet?.aleo || (window as any).foxwallet?.aleo;
        
        if (!foxProvider) {
          throw new Error("Fox Wallet provider not found. Please make sure Fox Wallet extension is installed and enabled.");
        }

        let address: string | null = null;
        
        // Fox Wallet API: connect(historyMode, chainId) - takes TWO STRING PARAMETERS
        if (typeof foxProvider.connect === 'function') {
          try {
            // Correct API: connect(historyMode, chainId)
            const historyMode = "ON_CHAIN_HISTORY"; // or undefined for no history
            const chainId = NETWORK_SLUG === "mainnet" ? "mainnetbeta" : "testnetbeta";
            
            const result = await foxProvider.connect(historyMode, chainId);
            
            // Handle response - should be a string address
            if (typeof result === 'string') {
              address = result;
            } else if (Array.isArray(result)) {
              address = result[0];
            } else if (result && typeof result === 'object') {
              address = result.address || result.account || result.publicKey || null;
            }
          } catch (e: any) {
            // Try without history mode
            try {
              const chainId = NETWORK_SLUG === "mainnet" ? "mainnetbeta" : "testnetbeta";
              const result = await foxProvider.connect(undefined, chainId);
              address = typeof result === 'string' ? result : (Array.isArray(result) ? result[0] : String(result || ""));
            } catch (e2: any) {
              throw new Error(`Fox Wallet connection failed: ${e?.message || e2?.message || "Unknown error"}`);
            }
          }
        } else {
          throw new Error("Fox Wallet connect method not found");
        }

        if (!address || address === "null" || address === "undefined") {
          throw new Error("Failed to retrieve wallet address from Fox Wallet. Please make sure the wallet is unlocked.");
        }

        // Ensure address is a string
        address = String(address);

        this.walletState = {
          address,
          network: NETWORK_ENUM,
          connected: true,
          role,
        };

        if (typeof window !== "undefined") {
          localStorage.setItem("userRole", role);
          localStorage.setItem("walletAddress", address);
          localStorage.setItem("walletType", "fox");
        }

        return this.walletState;
      } catch (error: any) {
        const errorMessage = error?.message || "Unknown error";
        throw new Error(`Fox Wallet connection failed: ${errorMessage}. Please make sure Fox Wallet is installed, unlocked, and try again.`);
      }
    }

    async connectWallet(role: UserRole, walletType: 'puzzle' | 'leo' | 'fox' = 'puzzle'): Promise<WalletState> {
      if (walletType === 'leo') {
        return await this.connectLeoWallet(role);
      }

      if (walletType === 'fox') {
        return await this.connectFoxWallet(role);
      }

      if (!this.hasPuzzleWalletClient() && this.hasLeoWallet()) {
        return await this.connectLeoWallet(role);
      }

      if (!this.hasPuzzleWalletClient() && this.hasFoxWallet()) {
        return await this.connectFoxWallet(role);
      }

      if (!this.hasPuzzleWalletClient()) {
        throw new Error(
          "No wallet detected. Please install Puzzle, Leo, or Fox Wallet"
        );
      }

      const connectResponse = await connect({
      dAppInfo: {
        name: "ZK-Cert",
        description: "Private Certificate Verification System on Aleo",
        iconUrl: `${window.location.origin}/logo.svg`,
      },
      permissions: {
        programIds: {
          [NETWORK_ENUM]: [PROGRAM_ID],
        },
      },
    });

    const address = connectResponse?.connection?.address;
    const network = connectResponse?.connection?.network;

    if (!address) {
      throw new Error("Failed to retrieve wallet address");
    }

    this.walletState = {
      address: String(address),
      network: network || NETWORK_ENUM,
      connected: true,
      role,
    };

      if (typeof window !== "undefined") {
        localStorage.setItem("userRole", role);
        localStorage.setItem("walletAddress", address);
        localStorage.setItem("walletType", "puzzle");
      }

    return this.walletState;
  }

  async disconnectWallet(): Promise<void> {
    const walletType = typeof window !== "undefined" ? localStorage.getItem("walletType") : null;
    
    if (walletType === "leo" && this.hasLeoWallet()) {
      try {
        const leoWallet = window.leoWallet || (window as any).leo;
        if (leoWallet && typeof leoWallet.disconnect === 'function') {
          await leoWallet.disconnect();
        }
      } catch (error) {
        console.error("Failed to disconnect Leo Wallet:", error);
      }
    }

    if (walletType === "fox" && this.hasFoxWallet()) {
      try {
        const foxProvider = window.foxwallet?.aleo || (window as any).foxwallet?.aleo || (window as any).foxwallet;
        if (foxProvider && typeof foxProvider.disconnect === 'function') {
          await foxProvider.disconnect();
        }
      } catch (error) {
        console.error("Failed to disconnect Fox Wallet:", error);
      }
    }

    this.walletState = {
      address: null,
      network: null,
      connected: false,
      role: null,
    };

    if (typeof window !== "undefined") {
      localStorage.removeItem("userRole");
      localStorage.removeItem("walletAddress");
      localStorage.removeItem("walletType");
    }
  }

  getWalletState(): WalletState {
    return this.walletState;
  }

  async checkConnection(): Promise<boolean> {
    try {
      const walletType = typeof window !== "undefined" ? localStorage.getItem("walletType") : null;
      
      // Check Puzzle Wallet
      if (walletType === "puzzle" && this.hasPuzzleWalletClient()) {
        const account = await getAccount();
        if (account?.account?.address) {
          const savedRole =
            (typeof window !== "undefined" ? localStorage.getItem("userRole") : null) ||
            null;

          this.walletState = {
            address: String(account.account.address || ""),
            network: account.account.network || NETWORK_ENUM,
            connected: true,
            role: savedRole as UserRole | null,
          };
          return true;
        }
      }
      
      // Check Leo Wallet
      if (walletType === "leo" && this.hasLeoWallet()) {
        const leoWallet = window.leoWallet || (window as any).leo;
        if (leoWallet) {
          try {
            let address: string | null = null;
            if (typeof leoWallet.getAccounts === 'function') {
              const accounts = await leoWallet.getAccounts();
              address = Array.isArray(accounts) ? accounts[0] : accounts;
            } else if (typeof leoWallet.isConnected === 'function' && leoWallet.isConnected()) {
              // Try to get address from stored state
              address = typeof window !== "undefined" ? localStorage.getItem("walletAddress") : null;
            }
            
            if (address) {
              const savedRole = typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
              this.walletState = {
                address: String(address),
                network: NETWORK_ENUM,
                connected: true,
                role: savedRole as UserRole | null,
              };
              return true;
            }
          } catch (e) {
            console.error("Error checking Leo Wallet connection:", e);
          }
        }
      }
      
      // Check Fox Wallet
      if (walletType === "fox" && this.hasFoxWallet()) {
        const foxProvider = window.foxwallet?.aleo || (window as any).foxwallet?.aleo || (window as any).foxwallet;
        if (foxProvider) {
          try {
            let address: string | null = null;
            if (typeof foxProvider.getAccounts === 'function') {
              const accounts = await foxProvider.getAccounts();
              address = Array.isArray(accounts) ? accounts[0] : accounts;
            } else if (typeof foxProvider.isConnected === 'function' && foxProvider.isConnected()) {
              address = typeof window !== "undefined" ? localStorage.getItem("walletAddress") : null;
            }
            
            if (address) {
              const savedRole = typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
              this.walletState = {
                address: String(address),
                network: NETWORK_ENUM,
                connected: true,
                role: savedRole as UserRole | null,
              };
              return true;
            }
          } catch (e) {
            console.error("Error checking Fox Wallet connection:", e);
          }
        }
      }
      
      return false;
    } catch {
      return false;
    }
  }

    isWalletInstalled(): boolean {
      return this.hasPuzzleWalletClient() || this.hasLeoWallet() || this.hasFoxWallet();
    }

    getInstalledWallets(): Array<'puzzle' | 'leo' | 'fox'> {
      const wallets: Array<'puzzle' | 'leo' | 'fox'> = [];
      if (this.hasPuzzleWalletClient()) wallets.push('puzzle');
      if (this.hasLeoWallet()) wallets.push('leo');
      if (this.hasFoxWallet()) wallets.push('fox');
      return wallets;
    }

  // ----------------------
  // On-chain helpers
  // ----------------------

  getProgramId(): string {
    return PROGRAM_ID;
  }

  getNetworkSlug(): string {
    return NETWORK_SLUG;
  }

  private async fetchMappingValue(mappingName: string, mappingKey: string): Promise<string> {
    const base = RPC_URL.replace(/\/$/, "");
    const url = `${base}/${NETWORK_SLUG}/program/${PROGRAM_ID}/mapping/${mappingName}/${encodeURIComponent(
      mappingKey
    )}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Mapping query failed: ${res.status}`);
    }
    return await res.text();
  }

  async getCertificateInfo(certId: string): Promise<ChainCertificateInfo | null> {
    try {
      const raw = await this.fetchMappingValue("certificates", ensureU64(certId));
      return parseMappingValueToCertificateInfo(raw);
    } catch {
      return null;
    }
  }

  async isIssuerRegistered(issuerAddress: string): Promise<boolean> {
    try {
      const raw = await this.fetchMappingValue("verified_issuers", issuerAddress);
      return parseLeoBool(raw);
    } catch {
      return false;
    }
  }

  private getWalletType(): 'puzzle' | 'leo' | 'fox' | null {
    if (typeof window === "undefined") return null;
    return (localStorage.getItem("walletType") as 'puzzle' | 'leo' | 'fox') || 'puzzle';
  }

  private async executeTransaction(
    functionId: string,
    inputs: string[],
    fee: number = 1_000_000
  ): Promise<{ eventId?: string; txId?: string }> {
    const walletType = this.getWalletType();
    
    // Use Puzzle Wallet SDK (primary method)
    if (walletType === 'puzzle' || !walletType) {
      return await requestCreateEvent({
        type: EventType.Execute,
        programId: PROGRAM_ID,
        functionId,
        fee,
        inputs,
      });
    }

    // For Leo and Fox wallets, use their transaction APIs
    if (walletType === 'leo' && this.hasLeoWallet()) {
      const leoWallet = window.leoWallet || (window as any).leo;
      if (leoWallet && typeof leoWallet.requestTransaction === 'function') {
        const chainId = NETWORK_SLUG === 'mainnet' ? 'mainnetbeta' : 'testnetbeta';
        const result = await leoWallet.requestTransaction({
          address: this.walletState.address!,
          chainId,
          transitions: [{
            program: PROGRAM_ID,
            functionName: functionId,
            inputs,
          }],
          fee,
        });
        return { txId: result?.txId || result?.transactionId || result };
      }
      throw new Error("Leo Wallet transaction API not available. Please use Puzzle Wallet for transactions.");
    }

    if (walletType === 'fox' && this.hasFoxWallet()) {
      const foxProvider = window.foxwallet?.aleo || (window as any).foxwallet?.aleo || (window as any).foxwallet;
      if (foxProvider && typeof foxProvider.requestTransaction === 'function') {
        const chainId = NETWORK_SLUG === 'mainnet' ? 'mainnetbeta' : 'testnetbeta';
        const result = await foxProvider.requestTransaction({
          address: this.walletState.address!,
          chainId,
          transitions: [{
            program: PROGRAM_ID,
            functionName: functionId,
            inputs,
          }],
          fee,
        });
        return { txId: result?.txId || result?.transactionId || result };
      }
      throw new Error("Fox Wallet transaction API not available. Please use Puzzle Wallet for transactions.");
    }

    // Fallback to Puzzle Wallet
    return await requestCreateEvent({
      type: EventType.Execute,
      programId: PROGRAM_ID,
      functionId,
      fee,
      inputs,
    });
  }

  async registerIssuer(): Promise<{ eventId?: string }> {
    if (!this.walletState.connected || !this.walletState.address) {
      throw new Error("Wallet not connected");
    }

    return await this.executeTransaction("register_issuer", [this.walletState.address]);
  }

  async issueCertificate(params: {
    holderAddress: string;
    certificateType: CertificateTypeKey;
    institutionName?: string;
    description?: string;
  }): Promise<{
    eventId?: string;
    certId: string; // e.g. 123u64
    certHash: string; // e.g. 123field
    issueDate: string; // e.g. 1700000000u64
    certType: string; // e.g. 1u8
  }> {
    if (!this.walletState.connected || !this.walletState.address) {
      throw new Error("Wallet not connected");
    }

    const issuer = this.walletState.address;
    const issueDateNumber = Math.floor(Date.now() / 1000);
    const issueDate = `${issueDateNumber}u64`;
    const certTypeU8 = CERT_TYPE_TO_U8[params.certificateType];
    const certType = ensureU8(String(certTypeU8));

    const material = JSON.stringify({
      issuer,
      holder: params.holderAddress,
      certType: params.certificateType,
      issueDate: issueDateNumber,
      institutionName: params.institutionName || "",
      description: params.description || "",
      programId: PROGRAM_ID,
      network: NETWORK_SLUG,
    });

    const certIdBig = await sha256ToU64(material);
    const certId = `${certIdBig.toString()}u64`;

    const certHash = await sha256ToField(material);

    const resp = await this.executeTransaction("issue_certificate", [
      certId,
      params.holderAddress,
      certHash,
      issueDate,
      certType,
    ]);

    return {
      eventId: resp.eventId || resp.txId,
      certId,
      certHash,
      issueDate,
      certType,
    };
  }

  async revokeCertificate(certId: string): Promise<{ eventId?: string }> {
    if (!this.walletState.connected || !this.walletState.address) {
      throw new Error("Wallet not connected");
    }

    return await this.executeTransaction("revoke_certificate", [ensureU64(certId)]);
  }

  async getHolderCertificateRecords(): Promise<RecordWithPlaintext[]> {
    if (!this.walletState.connected || !this.walletState.address) {
      throw new Error("Wallet not connected");
    }

    const resp = await getRecords({
      address: this.walletState.address,
      network: NETWORK_ENUM,
      filter: {
        programIds: [PROGRAM_ID],
        names: ["Certificate"],
        status: "All",
      },
    });

    return resp.records;
  }

  async getIssuerIssueEvents(): Promise<Event[]> {
    if (!this.walletState.connected || !this.walletState.address) {
      throw new Error("Wallet not connected");
    }

    const resp = await getEvents({
      address: this.walletState.address,
      network: NETWORK_ENUM,
      filter: {
        type: EventType.Execute,
        programId: PROGRAM_ID,
        functionId: "issue_certificate",
      },
    });

    return resp.events;
  }
}

export const walletService = AleoWalletService.getInstance();
