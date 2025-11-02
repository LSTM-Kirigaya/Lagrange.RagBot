import { Request, Response } from 'express';
import { app } from "../common";
import { OmAgent } from 'openmcp-sdk/service/sdk';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


export async function qqAgentLoop(
    groupId: number,
    content: string,
    reference: string
) {
    const agent = new OmAgent();

    agent.loadMcpConfig('./openmcp/lagrange.onebot.mcp.json');
    
    const systemPrompt = await agent.getPrompt('at-message', {
        groupId: groupId.toString()
    });

    const queryPrompt = await agent.getPrompt('at-query', {
        content: content.toString(),
        reference: reference.toString(),
    });

    await agent.ainvoke({
        messages: [systemPrompt, queryPrompt].join('\n'),
        reflux: {
            enabled: true,
            saveDir: './dataset/tip'
        }    
    });
}


app.post('/qq-agent-loop', async (req: Request, res: Response) => {
    try {
        if (!req.body['groupId']) {
            res.send({
                code: 400,
                msg: 'groupId is required'
            });
            return;
        }

        const news = await qqAgentLoop(
            req.body['groupId'],
            req.body['content'],
            req.body['reference']
        );
        res.send({
            code: 200,
            msg: news
        });

    } catch (error) {
        console.error(error);        
        res.send(error);
    }
});
