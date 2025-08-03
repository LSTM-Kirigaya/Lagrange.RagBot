import { app } from "../common";
import * as fs from 'fs';
import { Request, Response } from "express";
import { OmAgent } from 'openmcp-sdk/service/sdk';

export async function qqGroupSummaryPdf(json: any) {
    const agent = new OmAgent();
    agent.loadMcpConfig('./openmcp/qq-group-summary.mcp.json');

    let pdfPath = '';
    const agentLoop = await agent.getLoop();

    agentLoop.registerOnToolCalled(result => {
        console.log('get toolcall', result);
        const text = result.content[0]?.text;
        if (fs.existsSync(text)) {
            pdfPath = text;
            agentLoop.abort();
        }
        return result;
    });

    const prompt = await agent.getPrompt('lead_summary', {});
    json = typeof json === 'string' ? json : JSON.stringify(json);
    await agent.ainvoke({ messages: prompt + json });

    return pdfPath;
}


app.post('/qq-group-summary-to-pdf', async (req: Request, res: Response) => {
    try {
        const json = req.body['json'];
        const pdfPath = await qqGroupSummaryPdf(json);

        res.send({
            code: 200,
            msg: pdfPath
        });
    } catch (error) {
        res.send({
            code: 500,
            msg: error
        });
    }    
});