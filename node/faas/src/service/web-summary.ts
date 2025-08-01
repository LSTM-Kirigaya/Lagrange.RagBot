
import { Request, Response } from 'express';
import { app } from "../common";
import * as fs from 'fs';
import * as path from 'path';
import { markdownToPlainText, getFormatedTime } from '../util';
import { TaskLoop } from 'openmcp-sdk/task-loop';
import { IConnectionArgs } from 'openmcp-sdk/service/hook/adapter';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { OmAgent } from 'openmcp-sdk/service/sdk';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function summaryWebsite(url: string) {
    const agent = new OmAgent();
    agent.loadMcpConfig('./openmcp/crawl4ai.mcp.json');
    const prompt = await agent.getPrompt('summary-website', { url });
    const result = await agent.ainvoke({ messages: prompt });
    return markdownToPlainText(result.toString());
}


app.post('/summary-website', async (req: Request, res: Response) => {
    try {
        const url = req.body['url'];
        const summary = await summaryWebsite(url);
        res.send({
            code: 200,
            msg: summary
        });

    } catch (error) {
        res.send(error);
    } 
});

