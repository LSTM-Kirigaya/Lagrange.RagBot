// src/utils/crawler.ts
import { spawn } from 'child_process';
import { promisify } from 'util';

// Promisify spawn，以便使用 await
const spawnAsync = (command: string, args: string[]) => {
    return new Promise<string>((resolve, reject) => {
        const proc = spawn(command, args, { stdio: ['inherit', 'pipe', 'pipe'] }); // stderr 也 pipe 出来
        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        proc.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        proc.on('close', (code) => {
            if (code === 0) {
                resolve(stdout);
            } else {
                reject(new Error(`Command failed with code ${code}: ${stderr || stdout}`));
            }
        });

        proc.on('error', (err) => {
            reject(err);
        });
    });
};

/**
 * 调用 crwl 命令行工具抓取指定 URL 的 markdown 内容
 * @param url 目标 URL
 * @returns markdown 字符串
 */
export async function crawlUrlToMarkdown(url: string): Promise<string> {
    try {
        console.log(`[CRAWLER] Crawling: ${url}`);
        // 假设 crwl 已经安装并可以在 PATH 中找到
        const markdownContent = await spawnAsync('crwl', [url, '-o', 'markdown']);
        console.log(`[CRAWLER] Finished crawling: ${url}`);
        return markdownContent;
    } catch (error) {
        console.error(`[CRAWLER ERROR] Failed to crawl ${url}:`, error.message);
        throw error; // 重新抛出错误以便上层处理
    }
}