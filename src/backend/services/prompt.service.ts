import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface PromptTemplate {
    system_role: string;
    extraction_instructions: string;
    output_format: string;
    rules: string;
    examples: Array<{
        input: string;
        output: string;
    }>;
    template: string;
}

export class PromptService {
    private static instance: PromptService;
    private promptTemplate: PromptTemplate | null = null;

    private constructor() { }

    static getInstance(): PromptService {
        if (!PromptService.instance) {
            PromptService.instance = new PromptService();
        }
        return PromptService.instance;
    }

    private loadPromptTemplate(): PromptTemplate {
        if (this.promptTemplate) {
            return this.promptTemplate;
        }

        try {
            // Try multiple possible paths for the YAML file
            const possiblePaths = [
                path.join(__dirname, '../prompts/bank-transfer-parser.yaml'), // Development
                path.join(__dirname, '../../src/backend/prompts/bank-transfer-parser.yaml'), // Production
                path.join(process.cwd(), 'src/backend/prompts/bank-transfer-parser.yaml'), // Fallback
                path.join(process.cwd(), 'dist/backend/prompts/bank-transfer-parser.yaml') // Build fallback
            ];

            let promptPath: string | null = null;
            for (const testPath of possiblePaths) {
                if (fs.existsSync(testPath)) {
                    promptPath = testPath;
                    break;
                }
            }

            if (!promptPath) {
                throw new Error(`Prompt template not found. Tried paths: ${possiblePaths.join(', ')}`);
            }

            console.log(`Loading prompt template from: ${promptPath}`);
            const fileContents = fs.readFileSync(promptPath, 'utf8');
            this.promptTemplate = yaml.load(fileContents) as PromptTemplate;
            return this.promptTemplate;
        } catch (error) {
            console.error('Error loading prompt template:', error);
            throw new Error('Failed to load prompt template');
        }
    }

    generatePrompt(inputText: string, banksList: string): string {
        const template = this.loadPromptTemplate();

        // Format examples
        const examplesText = template.examples
            .map(example => `Input: "${example.input}"\nOutput: ${example.output}`)
            .join('\n\n');

        // Replace template variables
        return template.template
            .replace('{system_role}', template.system_role)
            .replace('{input_text}', inputText)
            .replace('{banks_list}', banksList)
            .replace('{extraction_instructions}', template.extraction_instructions)
            .replace('{output_format}', template.output_format)
            .replace('{rules}', template.rules)
            .replace('{examples}', examplesText);
    }
}
