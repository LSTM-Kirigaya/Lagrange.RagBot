import { TaskLoop } from 'openmcp-sdk/task-loop';
import { TaskLoopAdapter } from 'openmcp-sdk/service';

async function main() {
    // 创建适配器，负责通信和 mcp 连接
    const adapter = new TaskLoopAdapter();

    // 连接 mcp 服务器
    adapter.addMcp({
        connectionType: 'STDIO',
        commandString: 'node browser.js',
        cwd: '~/project/Lagrange.RagBot/node/servers/my-browser/dist'
    });

    // 创建事件循环驱动器
    const taskLoop = new TaskLoop({ adapter, verbose: 1 });

    // // 获取工具列表
    const tools = await taskLoop.listTools();

    // 配置该次事件循环使用的大模型
    taskLoop.setLlmConfig({
        id: 'deepseek',
        baseUrl: 'https://api.deepseek.com/v1',
        userToken: process.env['DEEPSEEK_API_TOKEN'],
        userModel: 'deepseek-chat'
    });

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
    // 打印最终回答
    const answer = storage.messages.at(-1) as any;
    console.log(JSON.stringify(answer.content, null, 2));
}

main();