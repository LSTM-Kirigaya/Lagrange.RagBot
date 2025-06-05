import { Request, Response } from 'express';
import { app, testRouter } from "../common";
import { createTaskContext } from "./common";
import * as fs from 'fs';
import * as path from 'path';
import { markdownToPlainText, getFormatedTime } from '../util';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function getNewsFromTowardsScience() {
    const { taskLoop } = await createTaskContext();

    const tools = await taskLoop.listTools();

    // 创建当前事件循环对应的上下文，并且配置当前上下文的设置
    const storage = {
        messages: [],
        settings: {
            temperature: 0.7,
            enableTools: tools,
            systemPrompt: '',
            contextLength: 20
        }
    };

    // 本次发出的问题
    const message = `
请通过 headless 的方式帮我搜集 https://towardsdatascience.com/tag/editors-pick/ 最热门的前三条信息，这些信息大概率在 main 元素的 ul li 下面。

请一步步寻找，先罗列所有元素剔除了 css class 后的 html 源代码，过滤可能是广告的元素后然后再从元素里面找到符合要求数量的有效元素。不要在第一步的时候就盲目获取元素的属性。

然后帮我进入这些网站后总结相关信息，文章通常也在 <main> 中，返回翻译好的简体中文，并且整理成一个简单的资讯。
按以下格式输出（严格禁止添加任何额外引导语或总结句）：

[用一句吸引人的话开头，例如："⌨️ 今日份 AI & CS 技术文章分享"]

📌 [翻译成简体中文的文章标题]
摘要：[文章的核心观点，100字以内]
作者：[若存在]
发布时间：[若存在]
链接：[文章URL]`.trim();


    // 开启事件循环
    await taskLoop.start(storage, message);

    // 保存数据到本地
    const filename = getFormatedTime();
    const savePath = path.join(__dirname, '..', '..', 'runtime-data', 'get-news-from-towards-science', `${filename}.json`);
    if (!fs.existsSync(path.dirname(savePath))) {
        fs.mkdirSync(path.dirname(savePath));
    }
    fs.writeFileSync(savePath, JSON.stringify(
        {
            messages: storage.messages,
            settings: storage.settings,
            mcp: {
                connectionType: 'STDIO',
                command: 'node',
                args: ['~/project/Lagrange.RagBot/node/servers/my-browser/dist/browser.js']
            }
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


export async function getNewsFromHackNews() {
    const { taskLoop } = await createTaskContext();

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
    const message = `
请通过 headless 的方式帮我搜集 https://news.ycombinator.com/ 最热门的前三条信息。

请一步步寻找，先罗列所有元素剔除了 css class 后的 html 源代码，过滤可能是广告的元素后然后再从元素里面找到符合要求数量的有效元素。不要在第一步的时候就盲目获取元素的属性。

然后帮我进入这些网站后总结相关信息，返回翻译好的简体中文，并且整理成一个简单的资讯。
按以下格式输出（严格禁止添加任何额外引导语或总结句）：

[用一句吸引人的话开头，例如："⌨️ 今日份 AI & CS 技术文章分享"]

📌 [翻译成简体中文的文章标题]
摘要：[文章的核心观点，100字以内]
作者：[若存在]
发布时间：[若存在]
链接：[文章URL]`.trim();

    // 开启事件循环
    await taskLoop.start(storage, message);

    console.log('task loop finish');
    console.log(storage.messages.at(-1));
    
    // 保存数据到本地
    const filename = getFormatedTime();
    const savePath = path.join(__dirname, '..', '..', 'runtime-data', 'get-news-from-hack-news', `${filename}.json`);
    if (!fs.existsSync(path.dirname(savePath))) {
        fs.mkdirSync(path.dirname(savePath), { recursive: true });
    }

    console.log('savePath', savePath);

    if (!fs.existsSync(path.dirname(savePath))) {
        fs.mkdirSync(path.dirname(savePath), { recursive: true });
    }

    fs.writeFileSync(savePath, JSON.stringify(
        {
            messages: storage.messages,
            settings: storage.settings,
            mcp: {
                connectionType: 'STDIO',
                command: 'node',
                args: ['~/project/Lagrange.RagBot/node/servers/my-browser/dist/browser.js']
            }
        },
        null, 2
    ));

    console.log('write data to ' + savePath);

    const lastMessage = storage.messages.at(-1);

    console.log('lastMessage', lastMessage);

    if (lastMessage?.role === 'assistant') {
        return markdownToPlainText(lastMessage.content);
    }
    return '';
}


app.post('/get-news-from-towards-science', async (req: Request, res: Response) => {
    try {
        const news = await getNewsFromTowardsScience();
        res.send({
            code: 200,
            msg: news
        });

    } catch (error) {
        res.send(error);
    }
});


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

testRouter.post('/get-news-from-towards-science', async (req: Request, res: Response) => {
    try {
        res.send({
            code: 200,
            msg: `以下是整理好的咨询信息，并已翻译为简体中文：

咨询1：Uh-Uh, Not Guilty
简介：暂无简介（未能成功获取内容）。
原文链接：Uh-Uh, Not Guilty

咨询2：Regression Discontinuity Design: How It Works and When to Use It
简介：从核心概念到实际分析——回归不连续设计（RDD）因果推断的工作原理、如何运行以及如何正确使用。
原文链接：Regression Discontinuity Design

由于技术原因，未能成功获取第一条咨询的详细内容。如果需要进一步帮助，请告诉我！`
        });
    } catch (error) {
        res.send({
            code: 500,
            msg: 'error happen' + JSON.stringify(error.message)
        });
    }
});