import { z } from "zod";


import React from 'react';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { Github, Star, TrendingUp, Copyright, Code2, User } from 'lucide-react';

export const GithubRepoSchema = z.object({
    repoName: z.string().describe("仓库全名，例如 'facebook/react'"),
    description: z.string().describe("用中文总结仓库的核心功能，不超过 80 字"),
    language: z.string().describe("主要编程语言，如 TypeScript, Rust, Go 等"),
    stars: z.string().describe("当前总 Star 数，如 12.5k"),
    starsToday: z.string().describe("今日增长的 Star 数，如 +420 stars today"),
    author: z.string().describe("开发者或组织名称"),
    link: z.string().url().describe("仓库的完整 GitHub URL")
});

export const mockGithubTrendingData: GithubRepo[] = [
    {
        repoName: "vuejs/vue",
        description: "一个渐进式 JavaScript 框架，用于构建用户界面。专注于声明式渲染和组件化。",
        language: "JavaScript",
        stars: "210k",
        starsToday: "+800 stars today",
        author: "Evan You",
        link: "https://github.com/vuejs/vue"
    },
    {
        repoName: "vercel/next.js",
        description: "一个用于 React 的全栈 Web 框架。支持服务器端渲染、静态网站生成等特性。",
        language: "TypeScript",
        stars: "120k",
        starsToday: "+650 stars today",
        author: "Vercel",
        link: "https://github.com/vercel/next.js"
    },
    {
        repoName: "rust-lang/rust",
        description: "一种专注于安全、性能和并发性的系统编程语言。",
        language: "Rust",
        stars: "90k",
        starsToday: "+500 stars today",
        author: "Rust Language Community",
        link: "https://github.com/rust-lang/rust"
    }
];

export type GithubRepo = z.infer<typeof GithubRepoSchema>;

const getBase64Image = (path: string): string => {
    try {
        const data = readFileSync(path);
        return `data:image/png;base64,${data.toString('base64')}`;
    } catch (e) {
        return "";
    }
};

// 预设一些语言对应的颜色
const langColors: Record<string, string> = {
    TypeScript: '#3178c6',
    JavaScript: '#f1e05a',
    Rust: '#dea584',
    Go: '#00ADD8',
    Python: '#3572A5',
    Python3: '#3572A5',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Vue: '#41b883',
    React: '#61dafb'
};

export async function generateGithubTrendingCard(data: GithubRepo[]): Promise<string | null> {
    // 颜色定义 (基于 GitHub Primer Dark 调色板)
    const colors = {
        bg: '#0D1117',
        cardBg: 'rgba(22, 27, 34, 0.8)',
        border: 'rgba(48, 54, 61, 0.8)',
        textMain: '#F0F6FC',
        textMuted: '#8B949E',
        accent: '#58A6FF', // GitHub 品牌蓝
        success: '#3FB950', // 增长绿
        star: '#E3B341',   // 星星金
    };

    try {
        const fontData = readFileSync('./fonts/NotoSansSC-Regular.ttf');
        const qrCodeBase64 = getBase64Image('./assets/openmcp-qq-group.png');
        const dateStr = new Date().toLocaleDateString('zh-CN').replace(/\//g, '.');

        const svg = await satori(
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                width: 800,
                height: 1200,
                backgroundColor: colors.bg,
                padding: '60px',
                fontFamily: 'Noto Sans SC',
                color: colors.textMain,
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '50px', width: '100%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <Github size={28} color={colors.accent} />
                            <span style={{ fontSize: '16px', fontWeight: '600', color: colors.accent, letterSpacing: '2px' }}>GITHUB TRENDING</span>
                        </div>
                        <h1 style={{ display: 'flex', fontSize: '38px', margin: 0, fontWeight: '900', color: colors.textMain }}>今日 GitHub 热门趋势</h1>
                    </div>
                    <div style={{ display: 'flex', fontSize: '18px', fontWeight: '500', color: colors.textMuted }}>{dateStr}</div>
                </div>

                {/* Repo List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flexGrow: 1, width: '100%' }}>
                    {data.map((repo, i) => (
                        <div key={i} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: colors.cardBg,
                            borderRadius: '16px',
                            padding: '24px 30px',
                            border: `1px solid ${colors.border}`,
                        }}>
                            {/* Title and Language */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', fontSize: '24px', fontWeight: 'bold', color: colors.accent }}>
                                    {repo.repoName}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(88, 166, 255, 0.1)', padding: '4px 12px', borderRadius: '20px' }}>
                                    <div style={{ 
                                        width: '8px', 
                                        height: '8px', 
                                        borderRadius: '50%', 
                                        backgroundColor: langColors[repo.language] || colors.textMuted 
                                    }} />
                                    <span style={{ fontSize: '13px', fontWeight: '600', color: colors.accent }}>{repo.language}</span>
                                </div>
                            </div>

                            {/* Description */}
                            <div style={{ 
                                display: 'flex', 
                                fontSize: '15px', 
                                color: colors.textMuted, 
                                marginBottom: '20px', 
                                lineHeight: 1.6,
                                height: '48px', 
                                overflow: 'hidden' 
                            }}>
                                {repo.description}
                            </div>

                            {/* Stats and Author */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: colors.textMain }}>
                                        <Star size={16} style={{ marginRight: '6px', color: colors.star }} />
                                        {repo.stars}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: colors.success, fontWeight: 'bold' }}>
                                        <TrendingUp size={16} style={{ marginRight: '6px' }} />
                                        {repo.starsToday}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: colors.textMuted }}>
                                    <User size={14} style={{ marginRight: '6px' }} />
                                    <span style={{ fontWeight: '500' }}>{repo.author}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    marginTop: '40px',
                    paddingTop: '30px',
                    borderTop: '1px solid rgba(157, 116, 181, 0.1)',
                    width: '100%'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', fontSize: '18px', color: '#D5D5D5', fontWeight: 'bold', marginBottom: '4px' }}>
                            由 OpenMCP 呈现
                        </div>
                        <div style={{ display: 'flex', fontSize: '13px', color: '#9A9A9A', alignItems: 'center' }}>
                            LSTM-Kirigaya/openmcp-tutorial <Copyright size={13} /> 锦恢
                        </div>
                    </div>

                    {qrCodeBase64 && (
                        <img
                            src={qrCodeBase64}
                            style={{
                                width: '90px',
                                height: '90px',
                                borderRadius: '12px',
                                marginLeft: '20px'
                            }}
                        />
                    )}
                </div>
            </div>,
            {
                width: 800,
                height: 1200,
                fonts: [{ name: 'Noto Sans SC', data: fontData, weight: 400 }],
            }
        );

        const resvg = new Resvg(svg, {
            background: '#0D1117',
            fitTo: { mode: 'width', value: 2400 },
        });

        const fileName = 'github-trending.png';
        writeFileSync(fileName, resvg.render().asPng());
        return path.resolve(fileName);

    } catch (err) {
        console.error('生成失败:', err);
        return null;
    }
}

// generateGithubTrendingCard(mockGithubTrendingData);