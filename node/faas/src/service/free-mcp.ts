import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

const CONFIG_PATH = path.join(__dirname, '../../../config.yaml');


interface McpConfig {
    prompt: string;
    mcp: {
        command?: string;
        url?: string;
        oauth?: string;
    };
    settings: {
        systemPrompt?: string;
    };
}

export function getConfig() {
    try {
        const fileContent = fs.readFileSync(CONFIG_PATH, 'utf8');
        return yaml.load(fileContent);
    } catch (error) {
        console.error('Error reading config file:', error);
        throw error;
    }
}

// 使用示例
// const config = getConfig();
// console.log(config.towardsdatascience.prompt);