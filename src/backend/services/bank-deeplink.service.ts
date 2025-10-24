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
    monthlyInstall: number;
}

export class BankDeeplinkService {
    private static instance: BankDeeplinkService;
    private bankApps: BankApp[] = [];

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

            console.log(`Loaded ${this.bankApps.length} bank apps for deeplinks`);
        } catch (error) {
            console.error('Error loading bank apps:', error);
            throw new Error('Failed to load bank apps for deeplinks');
        }
    }

    /**
     * Get all available deeplinks from VietQR API without any filtering
     * @returns Array of all bank deeplink information
     */
    getAllAvailableDeeplinks(): BankDeeplinkInfo[] {
        return this.bankApps.map(app => ({
            appId: app.appId,
            appLogo: app.appLogo,
            appName: app.appName,
            bankName: app.bankName,
            deeplink: app.deeplink,
            hasAutofill: app.autofill === 1,
            monthlyInstall: app.monthlyInstall
        }));
    }

    getAllBankApps(): BankApp[] {
        return [...this.bankApps];
    }
}
