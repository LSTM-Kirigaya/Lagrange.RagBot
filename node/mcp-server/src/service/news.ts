import { Request, Response } from 'express';
import { app } from "../common";
import { createTaskContext } from "./common";

export async function getNewsFromTowardsScience() {
    const { taskLoop, adapter } = await createTaskContext();

    const tools = await adapter.listTools();

    // 创建当前事件循环对应的上下文，并且配置当前上下文的设置
    const storage = {
        messages: [],
        settings: {
            temperature: 0.7,
            enableTools: tools,
            systemPrompt: 'you are a clever bot',
            contextLength: 20
        }
    };

    // 本次发出的问题
    const message = `
    请通过 headless 的方式帮我搜集 https://towardsdatascience.com/tag/editors-pick/ 最热门的前三条信息，这些信息大概率在 <main> 元素的 ul li 下面。然后帮我进入这些网站后总结相关信息，文章通常也在 <main> 中，并且整理成一个简单的咨询，返回翻译好的简体中文。比如
    
    K1 标题
    简介 {简介}
    原文链接 {原文链接}
    
    简介请按照科技推广文的标准进行撰写，尽量能够体现出文章的亮点。`.trim();


    // 开启事件循环
    await taskLoop.start(storage, message);

    // 打印上下文，最终的回答在 messages.at(-1) 中
    console.log(storage.messages);

    const lastMessage = storage.messages.at(-1);
    if (lastMessage?.role === 'assistant') {
        return lastMessage.content;
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