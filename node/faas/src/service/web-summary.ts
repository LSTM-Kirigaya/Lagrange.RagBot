
import { Request, Response } from 'express';
import { app } from "../common";
import * as fs from 'fs';
import * as path from 'path';
import { markdownToPlainText, getFormatedTime } from '../util';
import { TaskLoop } from 'openmcp-sdk/task-loop';
import { TaskLoopAdapter } from 'openmcp-sdk/service';
import { IConnectionArgs } from 'openmcp-sdk/service/hook/adapter';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const mcpOption = {
    connectionType: 'STDIO',
    commandString: 'uv run mcp run main.py',
    cwd: '~/project/openmcp-tutorial/crawl4ai-mcp/'
} as IConnectionArgs;

export async function summaryWebsite(url: string) {
    const adapter = new TaskLoopAdapter();

    adapter.addMcp(mcpOption);

    const taskLoop = new TaskLoop({ adapter });

    taskLoop.setLlmConfig({
        id: 'deepseek',
        baseUrl: 'https://api.deepseek.com/v1',
        userToken: process.env['DEEPSEEK_API_TOKEN'],
        userModel: 'deepseek-chat'
    });


    const tools = await taskLoop.listTools();

    // 创建当前事件循环对应的上下文，并且配置当前上下文的设置
    const storage = {
        messages: [],
        settings: {
            temperature: 0.6,
            enableTools: tools,
            systemPrompt: '',
            contextLength: 20
        }
    };

    // 本次发出的问题
    const message = `总结一下 ${url}`;

    console.log('question: ', message);
    
    // 开启事件循环
    await taskLoop.start(storage, message);

    // 保存数据到本地
    const filename = getFormatedTime();
    const savePath = path.join(__dirname, '..', '..', 'runtime-data', 'summary-website', `${filename}.json`);
    if (!fs.existsSync(path.dirname(savePath))) {
        fs.mkdirSync(path.dirname(savePath));
    }

    fs.writeFileSync(savePath, JSON.stringify(
        {
            messages: storage.messages,
            settings: storage.settings,
            mcp: mcpOption
        },
        null, 2
    ));


    const lastMessage = storage.messages.at(-1);

    console.log('lastMessage', lastMessage);

    if (lastMessage?.role === 'assistant') {
        return markdownToPlainText(lastMessage.content);
    }
    return '';
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

