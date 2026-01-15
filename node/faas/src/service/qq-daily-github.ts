import { Request, Response } from 'express';

import OpenAI from 'openai';
import Instructor from '@instructor-ai/instructor';
import { z } from "zod";

import { generateGithubTrendingCard, GithubRepo, GithubRepoSchema } from '../utils/github-og';
import { crawlUrlToMarkdown } from '../utils/crwl';
import { app } from '../common';

const openai = new OpenAI({
    baseURL: process.env.OPENAI_BASE_URL,
    apiKey: process.env.OPENAI_API_KEY,
});

const client = Instructor({ client: openai, mode: "TOOLS" });

/**
 * 核心逻辑：获取 GitHub Trending 并深度总结前三个
 */
export async function getGithubTrendingDetailed(): Promise<GithubRepo[]> {
    const trendingUrl = "https://github.com/trending";
    const finalRepos: GithubRepo[] = [];

    try {
        // 1. 获取热榜主页 Markdown
        const mainMarkdown = await crawlUrlToMarkdown(trendingUrl);

        // 2. 提取索引（前10个）
        const IndexSchema = z.object({
            items: z.array(z.object({
                name: z.string(),
                link: z.string().url(),
                starsToday: z.string()
            })).max(10)
        });

        const indexResult = await client.chat.completions.create({
            model: process.env.OPENAI_MODEL || "gpt-4o",
            messages: [
                { role: "system", content: "你是一个 GitHub 数据分析官。请从 Markdown 中提取今日 Trending 列表的项目名、链接和今日增长星数。" },
                { role: "user", content: mainMarkdown }
            ],
            response_model: { schema: IndexSchema, name: "GithubIndex" }
        });

        // 3. 深度遍历前 3 个仓库
        let successCount = 0;
        for (const item of indexResult.items) {
            if (successCount >= 3) break;

            try {
                // 抓取项目详情页（README + 侧边栏信息）
                const detailMarkdown = await crawlUrlToMarkdown(item.link);

                // 使用 Instructor 提取深度信息
                const repoDetail = await client.chat.completions.create({
                    model: process.env.OPENAI_MODEL || "gpt-4o",
                    messages: [
                        { 
                            role: "system", 
                            content: "请根据提供的 GitHub 仓库详情 Markdown，提取并总结项目信息。注意：务必通过描述或提及的内容推断出编程语言的占比情况。" 
                        },
                        { 
                            role: "user", 
                            content: `项目：${item.name}\n今日增长：${item.starsToday}\n链接：${item.link}\n内容详情：\n${detailMarkdown}` 
                        }
                    ],
                    response_model: { schema: GithubRepoSchema, name: "GithubDetail" },
                    max_retries: 2
                });

                if (repoDetail) {
                    finalRepos.push(repoDetail);
                    successCount++;
                    console.log(`[GITHUB] 已成功处理: ${repoDetail.repoName}`);
                }
            } catch (err) {
                console.warn(`[GITHUB] 抓取项目 ${item.name} 失败，尝试下一个...`);
            }
        }

        return finalRepos;
    } catch (error) {
        console.error("[GITHUB ERROR]", error);
        return [];
    }
}

app.post('/get-github-trending', async (req: Request, res: Response) => {
    try {
        const items = await getGithubTrendingDetailed();
        const imagePath = await generateGithubTrendingCard(items);
        res.send({
            code: 200,
            msg: imagePath
        });

    } catch (error) {
        console.error(error);
        res.send(error);
    }
});
