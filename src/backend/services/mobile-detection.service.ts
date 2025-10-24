export class MobileDetectionService {
    static isMobile(userAgent: string): boolean {
        const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
        return mobileRegex.test(userAgent);
    }

    static isIOS(userAgent: string): boolean {
        return /iPad|iPhone|iPod/.test(userAgent);
    }

    static isAndroid(userAgent: string): boolean {
        return /Android/.test(userAgent);
    }

    static getDeviceInfo(userAgent: string): {
        isMobile: boolean;
        isIOS: boolean;
        isAndroid: boolean;
        platform: string;
    } {
        return {
            isMobile: this.isMobile(userAgent),
            isIOS: this.isIOS(userAgent),
            isAndroid: this.isAndroid(userAgent),
            platform: this.isIOS(userAgent) ? 'ios' : this.isAndroid(userAgent) ? 'android' : 'desktop'
        };
    }
}
