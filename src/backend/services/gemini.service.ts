import { GoogleGenerativeAI } from '@google/generative-ai';
import { PromptService } from './prompt.service';

export interface ParsedBankInfo {
    bank: string;
    accountName: string;
    amount: string;
    accountNumber?: string;
    message?: string;
}

export class GeminiService {
    private genAI: GoogleGenerativeAI;
    private banksList: string = '';
    private promptService: PromptService;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.promptService = PromptService.getInstance();
    }

    setBanksList(banks: any[]): void {
        // Create a formatted list of banks for the AI
        this.banksList = banks.map(bank =>
            `- ${bank.name} (${bank.shortName}, ${bank.code}, BIN: ${bank.bin})`
        ).join('\n');
    }

    async parseBankTransferInput(inputText: string): Promise<ParsedBankInfo> {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

        // Generate prompt using YAML template
        const prompt = this.promptService.generatePrompt(inputText, this.banksList);

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Extract JSON from the response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in Gemini response');
            }

            const parsedData = JSON.parse(jsonMatch[0]);

            // Validate required fields
            if (!parsedData.bank || !parsedData.accountName || !parsedData.amount) {
                throw new Error('Invalid parsed data: missing required fields');
            }

            return {
                bank: parsedData.bank.toLowerCase(),
                accountName: parsedData.accountName.toUpperCase(),
                amount: parsedData.amount,
                accountNumber: parsedData.accountNumber || undefined,
                message: parsedData.message || ''
            };
        } catch (error) {
            console.error('Error parsing input with Gemini:', error);
            throw new Error('Failed to parse bank transfer information with AI');
        }
    }
}
