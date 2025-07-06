import { Request, Response } from 'express';
import { app } from "../common";
import * as fs from 'fs';
import * as path from 'path';
import { OmAgent } from 'openmcp-sdk/service/sdk';

import { markdownToPlainText, getFormatedTime } from '../util';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


export async function getNewsFromHackNews() {

    const agent = new OmAgent();

    agent.loadMcpConfig('./openmcp/crawl4ai.mcp.json');
    const prompt = await agent.getPrompt('hacknews', { topn: '3' });
    const result = await agent.ainvoke({ messages: prompt });    

    console.log('lastMessage', result);
    return markdownToPlainText(result.toString());
}


app.post('/get-news-from-hack-news', async (req: Request, res: Response) => {
    try {
        const news = await getNewsFromHackNews();
        res.send({
            code: 200,
            msg: news
        });

    } catch (error) {
        console.error(error);        
        res.send(error);
    }
});
