import axios from 'axios';

export interface BankApp {
    appId: string;
    appLogo: string;
    appName: string;
    bankName: string;
    monthlyInstall: number;
    deeplink: string;
    autofill: number;
}

export interface BankDeeplinkInfo {
    appId: string;
    appLogo: string;
    appName: string;
    bankName: string;
    deeplink: string;
    hasAutofill: boolean;
}

export class BankDeeplinkService {
    private static instance: BankDeeplinkService;
    private bankApps: BankApp[] = [];
    private bankMapping: Map<string, BankApp> = new Map();

    private constructor() {}

    static getInstance(): BankDeeplinkService {
        if (!BankDeeplinkService.instance) {
            BankDeeplinkService.instance = new BankDeeplinkService();
        }
        return BankDeeplinkService.instance;
    }

    async loadBankApps(): Promise<void> {
        try {
            const response = await axios.get('https://api.vietqr.io/v2/ios-app-deeplinks');
            this.bankApps = response.data.apps;
            
            // Create mapping for quick lookup
            this.bankMapping.clear();
            this.bankApps.forEach(app => {
                // Map by various bank identifiers
                this.bankMapping.set(app.appId.toLowerCase(), app);
                this.bankMapping.set(app.bankName.toLowerCase(), app);
                this.bankMapping.set(app.appName.toLowerCase(), app);
            });

            console.log(`Loaded ${this.bankApps.length} bank apps for deeplinks`);
        } catch (error) {
            console.error('Error loading bank apps:', error);
            throw new Error('Failed to load bank apps for deeplinks');
        }
    }

    findBankDeeplink(bankName: string): BankDeeplinkInfo | null {
        if (this.bankApps.length === 0) {
            console.warn('Bank apps not loaded yet');
            return null;
        }

        const normalizedBankName = bankName.toLowerCase();
        
        // Try to find by various matching strategies
        let foundApp = this.bankMapping.get(normalizedBankName);
        
        if (!foundApp) {
            // Try partial matching
            foundApp = this.bankApps.find(app => 
                app.bankName.toLowerCase().includes(normalizedBankName) ||
                app.appName.toLowerCase().includes(normalizedBankName) ||
                app.appId.toLowerCase().includes(normalizedBankName)
            );
        }

        if (!foundApp) {
            // Try common bank name mappings
            const bankMappings: { [key: string]: string } = {
                'vpbank': 'vpb',
                'techcombank': 'tcb',
                'vietcombank': 'vcb',
                'bidv': 'bidv',
                'mbbank': 'mb',
                'acb': 'acb',
                'vietinbank': 'icb',
                'sacombank': 'scb',
                'agribank': 'agb',
                'shinhan': 'shb',
                'tpbank': 'tpb-pay',
                'vib': 'vib-2',
                'ocb': 'ocb',
                'seabank': 'seab',
                'lienvietpostbank': 'lpb',
                'namabank': 'nab',
                'kienlongbank': 'klb',
                'baovietbank': 'bvb',
                'saigonbank': 'sgicb',
                'oceanbank': 'oceanbank',
                'ncb': 'ncb',
                'cimb': 'cimb',
                'woori': 'wvn'
            };

            const mappedAppId = bankMappings[normalizedBankName];
            if (mappedAppId) {
                foundApp = this.bankMapping.get(mappedAppId);
            }
        }

        if (foundApp) {
            return {
                appId: foundApp.appId,
                appLogo: foundApp.appLogo,
                appName: foundApp.appName,
                bankName: foundApp.bankName,
                deeplink: foundApp.deeplink,
                hasAutofill: foundApp.autofill === 1
            };
        }

        return null;
    }

    generateQRDeeplink(qrDataURL: string, bankInfo: BankDeeplinkInfo): string {
        // Create a deeplink that includes the QR code data
        // This is a custom implementation - you might need to adjust based on VietQR's actual deeplink format
        const baseUrl = bankInfo.deeplink;
        const qrData = qrDataURL.split(',')[1]; // Remove data:image/png;base64, prefix
        
        return `${baseUrl}&qr=${encodeURIComponent(qrData)}`;
    }

    getAllBankApps(): BankApp[] {
        return [...this.bankApps];
    }
}
