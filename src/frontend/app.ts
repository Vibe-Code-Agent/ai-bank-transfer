interface GenerateQRRequest {
    inputText: string;
    accountNumber?: string;
}

interface GenerateQRResponse {
    success: boolean;
    data?: {
        qrDataURL: string;
        bankInfo: {
            bankName: string;
            bankCode: string;
            accountName: string;
            amount: string;
            message: string;
        };
        mobileInfo?: {
            isMobile: boolean;
            platform: string;
            bankApp?: {
                appId: string;
                appLogo: string;
                appName: string;
                bankName: string;
                deeplink: string;
                hasAutofill: boolean;
            };
            qrDeeplink?: string;
            availableBankApps?: {
                appId: string;
                appLogo: string;
                appName: string;
                bankName: string;
                deeplink: string;
                hasAutofill: boolean;
                monthlyInstall: number;
            }[];
        };
    };
    error?: string;
}

class QRGenerator {
    private form: HTMLFormElement;
    private generateBtn: HTMLButtonElement;
    private btnLoading: HTMLElement;
    private resultSection: HTMLElement;
    private errorSection: HTMLElement;
    private qrImage: HTMLImageElement;
    private transferInfo: HTMLElement;
    private errorMessage: HTMLElement;
    private downloadBtn: HTMLButtonElement;
    private copyBtn: HTMLButtonElement;
    private retryBtn: HTMLButtonElement;

    constructor() {
        this.initializeElements();
        this.attachEventListeners();
    }

    private initializeElements(): void {
        this.form = document.getElementById('qrForm') as HTMLFormElement;
        this.generateBtn = document.getElementById('generateBtn') as HTMLButtonElement;
        this.btnLoading = document.getElementById('btnLoading') as HTMLElement;
        this.resultSection = document.getElementById('resultSection') as HTMLElement;
        this.errorSection = document.getElementById('errorSection') as HTMLElement;
        this.qrImage = document.getElementById('qrImage') as HTMLImageElement;
        this.transferInfo = document.getElementById('transferInfo') as HTMLElement;
        this.errorMessage = document.getElementById('errorMessage') as HTMLElement;
        this.downloadBtn = document.getElementById('downloadBtn') as HTMLButtonElement;
        this.copyBtn = document.getElementById('copyBtn') as HTMLButtonElement;
        this.retryBtn = document.getElementById('retryBtn') as HTMLButtonElement;
    }

    private attachEventListeners(): void {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.downloadBtn.addEventListener('click', () => this.downloadQR());
        this.copyBtn.addEventListener('click', () => this.copyQR());
        this.retryBtn.addEventListener('click', () => this.retry());
    }

    private async handleSubmit(e: Event): Promise<void> {
        e.preventDefault();

        const formData = new FormData(this.form);
        const inputText = formData.get('inputText') as string;
        const accountNumber = formData.get('accountNumber') as string;

        if (!inputText.trim()) {
            this.showError('Please enter a transfer description');
            return;
        }

        this.setLoading(true);
        this.hideSections();

        try {
            const response = await this.generateQR({
                inputText: inputText.trim(),
                accountNumber: accountNumber.trim() || undefined
            });

            if (response.success && response.data) {
                this.showResult(response.data);
            } else {
                this.showError(response.error || 'Failed to generate QR code');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError('Network error. Please check your connection and try again.');
        } finally {
            this.setLoading(false);
        }
    }

    private async generateQR(request: GenerateQRRequest): Promise<GenerateQRResponse> {
        const response = await fetch('/api/generate-qr', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    private showResult(data: GenerateQRResponse['data']): void {
        if (!data) return;

        // Set QR image
        this.qrImage.src = data.qrDataURL;
        this.qrImage.alt = 'Generated QR Code';

        // Set transfer info
        this.transferInfo.innerHTML = `
      <div class="info-item">
        <span class="info-label">
          <i class="fas fa-university"></i>
          Bank
        </span>
        <span class="info-value">${data.bankInfo.bankName}</span>
      </div>
      <div class="info-item">
        <span class="info-label">
          <i class="fas fa-user"></i>
          Account Name
        </span>
        <span class="info-value">${data.bankInfo.accountName}</span>
      </div>
      <div class="info-item">
        <span class="info-label">
          <i class="fas fa-money-bill-wave"></i>
          Amount
        </span>
        <span class="info-value">${this.formatAmount(data.bankInfo.amount)} VND</span>
      </div>
      ${data.bankInfo.message ? `
      <div class="info-item">
        <span class="info-label">
          <i class="fas fa-comment"></i>
          Message
        </span>
        <span class="info-value">${data.bankInfo.message}</span>
      </div>
      ` : ''}
      ${data.mobileInfo && data.mobileInfo.isMobile && data.mobileInfo.availableBankApps ? `
      <div class="mobile-app-section">
        <h3><i class="fas fa-mobile-alt"></i> Available Bank Apps</h3>
        <div class="bank-apps-grid">
          ${data.mobileInfo.availableBankApps.map(app => `
            <div class="bank-app-card">
              <div class="bank-app-info">
                <img src="${app.appLogo}" alt="${app.appName}" class="bank-app-logo">
                <div class="bank-app-details">
                  <h4>${app.appName}</h4>
                  <p>${app.bankName}</p>
                  ${app.hasAutofill ? '<span class="autofill-badge">Auto-fill supported</span>' : ''}
                </div>
              </div>
              <button class="btn btn-outline bank-app-btn" onclick="window.open('${app.deeplink}', '_blank')">
                <i class="fas fa-external-link-alt"></i>
                Open App
              </button>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
    `;

        this.resultSection.style.display = 'block';
        this.resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    private showError(message: string): void {
        this.errorMessage.textContent = message;
        this.errorSection.style.display = 'block';
        this.errorSection.scrollIntoView({ behavior: 'smooth' });
    }

    private hideSections(): void {
        this.resultSection.style.display = 'none';
        this.errorSection.style.display = 'none';
    }

    private setLoading(loading: boolean): void {
        this.generateBtn.disabled = loading;
        if (loading) {
            this.generateBtn.classList.add('loading');
        } else {
            this.generateBtn.classList.remove('loading');
        }
    }

    private formatAmount(amount: string): string {
        const num = parseInt(amount);
        if (isNaN(num)) return amount;

        return new Intl.NumberFormat('vi-VN').format(num);
    }

    private downloadQR(): void {
        if (!this.qrImage.src) return;

        const link = document.createElement('a');
        link.href = this.qrImage.src;
        link.download = `qr-code-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    private async copyQR(): Promise<void> {
        if (!this.qrImage.src) return;

        try {
            // Create a more useful text to copy with transfer details
            const currentUrl = window.location.href;
            const transferInfo = this.transferInfo.textContent || '';

            const copyText = `QR Code for Bank Transfer\nGenerated at: ${currentUrl}\n\nTransfer Details:\n${transferInfo}\n\nYou can scan this QR code with any QR scanner app to make the bank transfer.`;

            // Try to copy the text to clipboard
            await navigator.clipboard.writeText(copyText);

            // Show temporary success message
            const originalText = this.copyBtn.innerHTML;
            this.copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            this.copyBtn.style.background = '#28a745';

            setTimeout(() => {
                this.copyBtn.innerHTML = originalText;
                this.copyBtn.style.background = '';
            }, 2000);
        } catch (error) {
            console.error('Failed to copy:', error);

            // Fallback: try to select the text in a temporary input
            try {
                const currentUrl = window.location.href;
                const transferInfo = this.transferInfo.textContent || '';
                const copyText = `QR Code for Bank Transfer\nGenerated at: ${currentUrl}\n\nTransfer Details:\n${transferInfo}\n\nYou can scan this QR code with any QR scanner app to make the bank transfer.`;

                const tempInput = document.createElement('textarea');
                tempInput.value = copyText;
                tempInput.style.position = 'fixed';
                tempInput.style.left = '-999999px';
                tempInput.style.top = '-999999px';
                tempInput.style.opacity = '0';
                document.body.appendChild(tempInput);
                tempInput.focus();
                tempInput.select();

                const successful = document.execCommand('copy');
                document.body.removeChild(tempInput);

                if (successful) {
                    // Show success message
                    const originalText = this.copyBtn.innerHTML;
                    this.copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    this.copyBtn.style.background = '#28a745';

                    setTimeout(() => {
                        this.copyBtn.innerHTML = originalText;
                        this.copyBtn.style.background = '';
                    }, 2000);
                } else {
                    throw new Error('Copy command failed');
                }
            } catch (fallbackError) {
                console.error('Fallback copy failed:', fallbackError);

                // Show error message
                const originalText = this.copyBtn.innerHTML;
                this.copyBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Copy Failed';
                this.copyBtn.style.background = '#dc3545';

                setTimeout(() => {
                    this.copyBtn.innerHTML = originalText;
                    this.copyBtn.style.background = '';
                }, 3000);
            }
        }
    }

    private retry(): void {
        this.hideSections();
        this.form.reset();
        this.form.querySelector('input')?.focus();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new QRGenerator();
});

// Add some example inputs for better UX
document.addEventListener('DOMContentLoaded', () => {
    const inputText = document.getElementById('inputText') as HTMLTextAreaElement;

    // Add example on focus
    inputText.addEventListener('focus', () => {
        if (!inputText.value) {
            inputText.placeholder = 'Examples:\n• vpbank NGUYEN TRUONG GIANG 250k\n• techcombank NGUYEN VAN A 500k\n• chuyen 1tr cho NGUYEN THI B tai bidv';
        }
    });

    inputText.addEventListener('blur', () => {
        if (!inputText.value) {
            inputText.placeholder = 'Example: vpbank NGUYEN TRUONG GIANG 250k';
        }
    });
});
