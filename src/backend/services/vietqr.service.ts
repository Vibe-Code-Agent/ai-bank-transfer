import axios, { AxiosResponse } from 'axios';

export interface Bank {
    id: number;
    name: string;
    code: string;
    bin: string;
    shortName: string;
    logo: string;
    transferSupported: number;
    lookupSupported: number;
}

export interface VietQRResponse {
    code: string;
    desc: string;
    data: Bank[];
}

export interface QRGenerateRequest {
    accountNo: string;
    accountName: string;
    acqId: string;
    addInfo?: string;
    amount?: number;
    format?: 'compact' | 'qr_only' | 'print';
}

export interface QRGenerateResponse {
    code: string;
    desc: string;
    data: {
        qrCode: string;
        qrDataURL: string;
    };
}

export interface AccountLookupRequest {
    bin: string;
    accountNo: string;
}

export interface AccountLookupResponse {
    code: string;
    desc: string;
    data?: {
        accountName: string;
        accountNo: string;
    };
}

export class VietQRService {
    private readonly baseURL = 'https://api.vietqr.io/v2';
    private readonly clientId: string;
    private readonly apiKey: string;
    private banksCache: Bank[] | null = null;
    private cacheTimestamp: number = 0;
    private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

    constructor(clientId: string, apiKey: string) {
        this.clientId = clientId;
        this.apiKey = apiKey;
    }

    private getHeaders() {
        return {
            'x-client-id': this.clientId,
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json'
        };
    }

    async getBanks(): Promise<Bank[]> {
        const now = Date.now();

        // Return cached data if still valid
        if (this.banksCache && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
            return this.banksCache;
        }

        try {
            const response: AxiosResponse<VietQRResponse> = await axios.get(
                `${this.baseURL}/banks`,
                { headers: this.getHeaders() }
            );

            if (response.data.code === '00') {
                this.banksCache = response.data.data;
                this.cacheTimestamp = now;
                return response.data.data;
            } else {
                throw new Error(`VietQR API error: ${response.data.desc}`);
            }
        } catch (error) {
            console.error('Error fetching banks from VietQR:', error);
            throw new Error('Failed to fetch bank list from VietQR API');
        }
    }

    async findBank(bankQuery: string): Promise<Bank | null> {
        const banks = await this.getBanks();
        const query = bankQuery.toLowerCase().trim();

        // Search by various fields
        const foundBank = banks.find(bank =>
            bank.name.toLowerCase().includes(query) ||
            bank.shortName.toLowerCase().includes(query) ||
            bank.code.toLowerCase().includes(query) ||
            bank.bin.includes(query)
        );

        return foundBank || null;
    }

    async generateQR(request: QRGenerateRequest): Promise<QRGenerateResponse> {
        try {
            const response: AxiosResponse<QRGenerateResponse> = await axios.post(
                `${this.baseURL}/generate`,
                request,
                { headers: this.getHeaders() }
            );

            if (response.data.code === '00') {
                return response.data;
            } else {
                throw new Error(`VietQR QR generation error: ${response.data.desc}`);
            }
        } catch (error) {
            console.error('Error generating QR code:', error);
            throw new Error('Failed to generate QR code from VietQR API');
        }
    }

    async lookupAccount(bin: string, accountNo: string): Promise<string | null> {
        try {
            const request: AccountLookupRequest = {
                bin,
                accountNo
            };

            const response: AxiosResponse<AccountLookupResponse> = await axios.post(
                `${this.baseURL}/lookup`,
                request,
                { headers: this.getHeaders() }
            );

            if (response.data.code === '00' && response.data.data) {
                return response.data.data.accountName;
            } else {
                console.warn(`Account lookup failed: ${response.data.desc}`);
                return null;
            }
        } catch (error) {
            console.error('Error looking up account:', error);
            // Don't throw error, just return null to allow QR generation to continue
            return null;
        }
    }
}
