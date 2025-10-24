import { Request, Response } from 'express';
import { VietQRService } from '../services/vietqr.service';
import { GeminiService } from '../services/gemini.service';

export interface GenerateQRRequest {
    inputText: string;
    accountNumber?: string;
}

export interface GenerateQRResponse {
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
    };
    error?: string;
}

export class QRController {
    private vietQRService: VietQRService;
    private geminiService: GeminiService;

    constructor(vietQRService: VietQRService, geminiService: GeminiService) {
        this.vietQRService = vietQRService;
        this.geminiService = geminiService;
    }

    async generateQR(req: Request, res: Response): Promise<void> {
        try {
            const { inputText, accountNumber }: GenerateQRRequest = req.body;

            if (!inputText) {
                res.status(400).json({
                    success: false,
                    error: 'inputText is required'
                } as GenerateQRResponse);
                return;
            }

            // Check if API keys are configured
            const missingVars = [];
            if (!process.env.VIETQR_CLIENT_ID || process.env.VIETQR_CLIENT_ID === 'your_vietqr_client_id_here') {
                missingVars.push('VIETQR_CLIENT_ID');
            }
            if (!process.env.VIETQR_API_KEY || process.env.VIETQR_API_KEY === 'your_vietqr_api_key_here') {
                missingVars.push('VIETQR_API_KEY');
            }
            if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
                missingVars.push('GEMINI_API_KEY');
            }

            if (missingVars.length > 0) {
                res.status(500).json({
                    success: false,
                    error: `Missing or invalid API keys: ${missingVars.join(', ')}. Please configure your .env file with valid API keys.`
                } as GenerateQRResponse);
                return;
            }

            // Step 1: Get banks list and provide to Gemini AI
            console.log('Fetching banks list from VietQR...');
            const banks = await this.vietQRService.getBanks();
            console.log(`Found ${banks.length} supported banks`);

            // Provide banks list to Gemini for better accuracy
            this.geminiService.setBanksList(banks);

            // Step 2: Parse input with Gemini AI
            console.log('Parsing input with Gemini AI...');
            const parsedInfo = await this.geminiService.parseBankTransferInput(inputText);
            console.log('Parsed info:', parsedInfo);

            // Use account number from parsed info if not provided separately
            const finalAccountNumber = parsedInfo.accountNumber || accountNumber;

            if (!finalAccountNumber) {
                res.status(400).json({
                    success: false,
                    error: 'Account number is required. Please provide it in the input text or as a separate field.'
                } as GenerateQRResponse);
                return;
            }

            // Step 3: Find matching bank
            console.log('Finding matching bank...');
            const bank = await this.vietQRService.findBank(parsedInfo.bank);

            if (!bank) {
                res.status(400).json({
                    success: false,
                    error: `Bank "${parsedInfo.bank}" not found in VietQR supported banks`
                } as GenerateQRResponse);
                return;
            }

            console.log('Found bank:', bank);

            // Step 4: If account name is not parsed or is "UNKNOWN", try to lookup via VietQR API
            let finalAccountName = parsedInfo.accountName;

            if (!parsedInfo.accountName || parsedInfo.accountName === 'UNKNOWN' || parsedInfo.accountName === 'unknown') {
                console.log('Account name not found in input, attempting VietQR lookup...');
                try {
                    const lookedUpName = await this.vietQRService.lookupAccount(bank.bin, finalAccountNumber);
                    if (lookedUpName) {
                        finalAccountName = lookedUpName;
                        console.log('Successfully looked up account name:', lookedUpName);
                    } else {
                        console.log('VietQR lookup failed, using fallback name');
                        finalAccountName = 'ACCOUNT HOLDER'; // Fallback name
                    }
                } catch (error) {
                    console.warn('Account lookup failed, using fallback name:', error);
                    finalAccountName = 'ACCOUNT HOLDER'; // Fallback name
                }
            }

            // Step 5: Generate QR code
            console.log('Generating QR code...');
            const qrRequest = {
                accountNo: finalAccountNumber,
                accountName: finalAccountName,
                acqId: bank.bin,
                addInfo: parsedInfo.message,
                amount: parsedInfo.amount !== '0' ? parseInt(parsedInfo.amount) : undefined,
                format: 'compact' as const
            };

            const qrResponse = await this.vietQRService.generateQR(qrRequest);

            // Step 4: Return success response
            const response: GenerateQRResponse = {
                success: true,
                data: {
                    qrDataURL: qrResponse.data.qrDataURL,
                    bankInfo: {
                        bankName: bank.name,
                        bankCode: bank.code,
                        accountName: finalAccountName,
                        amount: parsedInfo.amount,
                        message: parsedInfo.message || ''
                    }
                }
            };

            res.json(response);
        } catch (error) {
            console.error('Error generating QR code:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            } as GenerateQRResponse);
        }
    }

    async getBanks(req: Request, res: Response): Promise<void> {
        try {
            const banks = await this.vietQRService.getBanks();
            res.json({
                success: true,
                data: banks
            });
        } catch (error) {
            console.error('Error fetching banks:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch banks'
            });
        }
    }
}
