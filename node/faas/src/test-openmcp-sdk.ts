import { OmAgent } from 'openmcp-sdk/service/sdk';

export async function testMybrowser() {
    const agent = new OmAgent();
    agent.loadMcpConfig('./openmcp/my-browser.mcp.json');

    // 本次发出的问题
    const message = `
请通过 headless 的方式帮我搜集 https://towardsdatascience.com/tag/editors-pick/ 最热门的前三条信息，
这些信息大概率在 <main> 元素的 ul li 下面。
然后帮我进入这些网站后总结相关信息，文章通常也在 <main> 中，并且整理成一个简单的咨询，返回翻译好的简体中文。比如

K1 标题
简介 {简介}
原文链接 {原文链接}

简介请按照科技推广文的标准进行撰写，尽量能够体现出文章的亮点。`.trim();

    const result = await agent.ainvoke({ messages: message });

    console.log(result);
}

export async function summaryWebsite(url: string) {
    const agent = new OmAgent();
    agent.loadMcpConfig('./openmcp/crawl4ai.mcp.json');

    const prompt = await agent.getPrompt('summary-website', { url });

    const result = await agent.ainvoke({ messages: prompt });

    return result;
}

summaryWebsite('https://linux.do/t/topic/740785');