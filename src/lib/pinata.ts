import axios from "axios";

export interface PinataMetadata {
  certId: string;
  issuerAddress: string;
  holderAddress: string;
  certificateType: string;
  issueDate: string;
  institutionName?: string;
  description?: string;
}

export interface PinataUploadResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

class PinataService {
  private apiKey: string;
  private apiSecret: string;
  private jwt: string;
  private baseUrl = "https://api.pinata.cloud";

  constructor() {
    this.apiKey = process.env.PINATA_API_KEY || "";
    this.apiSecret = process.env.PINATA_API_SECRET || "";
    this.jwt = process.env.PINATA_JWT || "";
  }

  async uploadJSON(
    data: PinataMetadata
  ): Promise<PinataUploadResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/pinning/pinJSONToIPFS`,
        {
          pinataContent: data,
          pinataMetadata: {
            name: `zk-cert-${data.certId}`,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.jwt}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Pinata upload error:", error);
      throw new Error("Failed to upload to IPFS via Pinata");
    }
  }

  async fetchJSON(ipfsHash: string): Promise<PinataMetadata> {
    try {
      const response = await axios.get(
        `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
      );
      return response.data;
    } catch (error) {
      console.error("Pinata fetch error:", error);
      throw new Error("Failed to fetch from IPFS");
    }
  }

  async unpinFile(ipfsHash: string): Promise<void> {
    try {
      await axios.delete(`${this.baseUrl}/pinning/unpin/${ipfsHash}`, {
        headers: {
          Authorization: `Bearer ${this.jwt}`,
        },
      });
    } catch (error) {
      console.error("Pinata unpin error:", error);
      throw new Error("Failed to unpin file from IPFS");
    }
  }
}

export const pinataService = new PinataService();
