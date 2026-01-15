import { Request, Response } from 'express';
import { z } from "zod";

import { app } from "../common";
import { OmAgent } from 'openmcp-sdk/service/sdk';

import OpenAI from 'openai';

import { markdownToPlainText, getFormatedTime } from '../util';
import { generatePremiumCard } from '../utils/daily-og';
import Instructor from "@instructor-ai/instructor"
import { NewsItem, NewsItemSchema } from '../utils/daily-og';
import { crawlUrlToMarkdown } from '../utils/crwl';

const openai = new OpenAI({
    baseURL: process.env.OPENAI_BASE_URL,
    apiKey: process.env.OPENAI_API_KEY,
});

// 初始化 Instructor 客户端
const client = Instructor({
    client: openai,
    mode: "TOOLS",
});

/**
 * 从 markdown 内容中提取前 N 条新闻的标题和链接。
 * 由于原始 markdown 结构不固定，这里用 LLM 来辅助提取。
 * @param markdownContent 原始 markdown 内容
 * @param count 提取新闻的数量
 * @returns 包含标题和链接的简要新闻列表
 */
async function extractTopNewsHeadlines(markdownContent: string, count: number = 10): Promise<{ title?: string; link?: string }[]> {
    const HeadlineSchema = z.object({
        headlines: z.array(z.object({
            title: z.string().describe("新闻标题"),
            link: z.string().url().describe("新闻链接")
        })).max(count).describe(`从文本中提取前 ${count} 条新闻的标题和链接`)
    });

    try {
        const result = await client.chat.completions.create({
            model: process.env.OPENAI_MODEL || "gpt-4o", // 确保模型名称
            messages: [
                {
                    role: "system",
                    content: `你是一个智能新闻提取助手。请从用户提供的Markdown文本中，识别并提取前${count}条最重要的新闻标题和对应的URL链接。请确保链接是完整的、可访问的URL。`
                },
                {
                    role: "user",
                    content: `请从以下文本中提取前${count}条新闻的标题和链接：\n\n${markdownContent}`
                }
            ],
            response_model: { schema: HeadlineSchema, name: "NewsHeadlines" },
            max_retries: 2
        });
        return result.headlines;
    } catch (error) {
        console.error("[INSTRUCTOR ERROR] Failed to extract headlines:", error);
        return []; // 提取失败返回空数组
    }
}

/**
 * 总结单篇文章的 markdown 内容为 NewsItem 格式。
 * @param markdownContent 单篇文章的 markdown
 * @param originalLink 原始链接，用于填充 NewsItem.link
 * @returns 结构化的 NewsItem
 */
async function summarizeArticle(markdownContent: string, originalLink: string): Promise<NewsItem | null> {
    try {
        const result = await client.chat.completions.create({
            model: process.env.OPENAI_MODEL || "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `你是一个专业的文章总结和分类助手。请根据用户提供的Markdown文章内容，提取文章的标题、摘要（约100字）、作者、最相关的分类标签，并结合原始链接，以JSON格式返回一个结构化的NewsItem。摘要应精准概括文章核心，标签要精炼。`
                },
                {
                    role: "user",
                    content: `请总结这篇文章并提供分类信息：\n\n${markdownContent}\n\n原始链接为: ${originalLink}`
                }
            ],
            response_model: { schema: NewsItemSchema, name: "NewsItem" },
            max_retries: 3
        });
        return result;
    } catch (error) {
        console.error(`[INSTRUCTOR ERROR] Failed to summarize article from ${originalLink}:`, error);
        return null; // 总结失败返回 null
    }
}

/**
 * 主流程：获取 Hacker News 最新资讯，提取前三条详情并总结。
 * @param hackNewsUrl Hacker News 的 URL
 * @returns 结构化的 NewsItem 数组
 */
export async function getStructuredNewsFeed(hackNewsUrl: string = "https://hn.aimaker.dev/category/top"): Promise<NewsItem[]> {
    const finalNewsItems: NewsItem[] = [];

    try {
        // 1. 获取 Hacker News 页面 markdown
        const topNewsMarkdown = await crawlUrlToMarkdown(hackNewsUrl);

        // 2. 从 markdown 中提取前 10 条新闻的标题和链接
        const topHeadlines = await extractTopNewsHeadlines(topNewsMarkdown, 10);
        console.log(`[NEWS FEED] Extracted ${topHeadlines.length} top headlines.`);

        // 3. 遍历前 10 条新闻，尝试获取前 3 条的详细内容并总结
        let successfulSummaries = 0;
        for (const headline of topHeadlines) {
            if (successfulSummaries >= 3) {
                break; // 已经成功总结了3篇，提前退出
            }

            try {
                // 获取单篇文章的 markdown
                const articleMarkdown = await crawlUrlToMarkdown(headline.link);
                // 总结文章
                const summarizedItem = await summarizeArticle(articleMarkdown, headline.link);

                if (summarizedItem) {
                    finalNewsItems.push(summarizedItem);
                    successfulSummaries++;
                    console.log(`[NEWS FEED] Successfully summarized: ${summarizedItem.title}`);
                } else {
                    console.warn(`[NEWS FEED] Failed to summarize article from ${headline.link}, trying next...`);
                }
            } catch (innerError) {
                console.warn(`[NEWS FEED] Failed to fetch or summarize ${headline.link}, trying next:`, innerError.message);
            }
        }

        console.log(`[NEWS FEED] Final collected news items: ${finalNewsItems.length}`);
        return finalNewsItems;

    } catch (error) {
        console.error("[NEWS FEED ERROR] Failed to get structured news feed:", error);
        return [];
    }
}

async function getNewsFromHackNews() {
    const items = await getStructuredNewsFeed();
    const imagePath = await generatePremiumCard(items);
    return imagePath;
}

app.post('/get-news-from-hack-news', async (req: Request, res: Response) => {
    try {
        const items = await getStructuredNewsFeed();
        const imagePath = await generatePremiumCard(items);
        res.send({
            code: 200,
            msg: imagePath
        });

    } catch (error) {
        console.error(error);
        res.send(error);
    }
});
