import { GoogleGenerativeAI } from '@google/generative-ai';

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

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    setBanksList(banks: any[]): void {
        // Create a formatted list of banks for the AI
        this.banksList = banks.map(bank =>
            `- ${bank.name} (${bank.shortName}, ${bank.code}, BIN: ${bank.bin})`
        ).join('\n');
    }

    async parseBankTransferInput(inputText: string): Promise<ParsedBankInfo> {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

        const prompt = `
You are a Vietnamese banking assistant. Parse the following natural language input and extract bank transfer information.

Input: "${inputText}"

SUPPORTED BANKS LIST:
${this.banksList}

Extract the following information:
1. Bank name (match against the supported banks list above)
2. Account holder name (usually in uppercase, Vietnamese name)
3. Amount (convert to VND format, e.g., "250k" = "250000", "1.5tr" = "1500000")
4. Account number (if mentioned in the text, look for numbers that could be account numbers)
5. Transfer message (if any)

Return ONLY a JSON object in this exact format:
{
  "bank": "bank_name_here",
  "accountName": "ACCOUNT_HOLDER_NAME",
  "amount": "amount_in_vnd",
  "accountNumber": "account_number_if_found",
  "message": "transfer_message_if_any"
}

Rules:
- Bank name should match one of the supported banks from the list above (use the shortName or code)
- Account name should be in uppercase
- Amount should be a string with only numbers (no commas, spaces, or currency symbols)
- Account number should be a string of digits (6-19 characters, typical for Vietnamese bank accounts)
- If no message is provided, use empty string
- If amount is not specified, use "0"
- If bank is not found in the supported list, use "unknown"
- If account name is not found or cannot be determined, use "UNKNOWN"
- If account number is not found, use null

Example:
Input: "vpbank NGUYEN TRUONG GIANG 250k tai so 1234567890"
Output: {"bank": "vpbank", "accountName": "NGUYEN TRUONG GIANG", "amount": "250000", "accountNumber": "1234567890", "message": ""}

Input: "chuyen 500k cho NGUYEN VAN A tai techcombank so 9876543210"
Output: {"bank": "techcombank", "accountName": "NGUYEN VAN A", "amount": "500000", "accountNumber": "9876543210", "message": ""}

Input: "vpbank NGUYEN TRUONG GIANG 250k"
Output: {"bank": "vpbank", "accountName": "NGUYEN TRUONG GIANG", "amount": "250000", "accountNumber": null, "message": ""}

Input: "vpbank 250k tai so 1234567890"
Output: {"bank": "vpbank", "accountName": "UNKNOWN", "amount": "250000", "accountNumber": "1234567890", "message": ""}

Now parse this input: "${inputText}"
`;

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
