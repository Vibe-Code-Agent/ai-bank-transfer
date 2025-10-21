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
            const promptPath = path.join(__dirname, '../prompts/bank-transfer-parser.yaml');
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
