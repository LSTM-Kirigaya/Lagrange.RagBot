import React from 'react';
import { z } from "zod";
import path from 'path'; // 导入 path 模块
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'fs';
import { Radio, Link, Copyright } from 'lucide-react'; // 导入 Lucide 图标组件

export const NewsItemSchema = z.object({
    title: z.string().describe("文章的标题，需简炼且吸引人"),
    summary: z.string().describe("文章的核心内容摘要，控制在 100 字左右"),
    author: z.string().describe("原作者姓名或来源机构名称"),
    tag: z.string().describe("文章的分类标签，例如：AI、前端、架构等"),
    link: z.string().url().describe("文章的原始来源 URL 链接")
});
export type NewsItem = z.infer<typeof NewsItemSchema>;

const newsData: NewsItem[] = [
    {
        title: "Tailwind CSS 创始人裁减了75%的工程团队",
        summary: "由于 AI 对业务的严重影响，公司不得不裁减 75% 的工程团队。文档流量下降了 40%，收入下降了近 80%，正在努力维持框架的可持续发展。",
        author: "Adam Wathan",
        tag: "行业趋势",
        link: "https://github.com/tailwindlabs/tailwindcss.com/pull/2388"
    },
    {
        title: "美国发布新版膳食指南：吃真正的食物",
        summary: "强调食用完整的食物，减少高度加工食品。新指南首次明确指出高度加工食品的危害，并将蛋白质、蔬菜和健康脂肪放在优先位置。",
        author: "USDA / HHS",
        tag: "健康生活",
        link: "https://realfood.gov"
    },
    {
        title: "美国将禁止华尔街投资者购买独栋住宅",
        summary: "特朗普宣布将禁止大型机构投资者购买独栋住宅，以解决住房可负担性问题。旨在限制投机行为，让普通家庭能够购买住房。",
        author: "Reuters",
        tag: "政策观察",
        link: "https://reuters.com/world/us/ban-institutional-investors"
    }
];

const getBase64Image = (path: string): string => {
    try {
        const data = readFileSync(path);
        return `data:image/png;base64,${data.toString('base64')}`;
    } catch (e) {
        console.warn(`无法加载图片: ${path}, 将使用占位图`);
        return ""; // 返回空或占位图防止崩溃
    }
};

export async function generatePremiumCard(data: NewsItem[]) {
    try {
        const fontData = readFileSync('./fonts/NotoSansSC-Regular.ttf');
        const qrCodeBase64 = getBase64Image('./assets/openmcp-qq-group.png');
        const date = new Date();
        const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;

        const svg = await satori(
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                width: 800,
                height: 1200,
                backgroundColor: '#1A1D21',
                padding: '60px',
                fontFamily: 'Noto Sans SC',
                color: '#E2E8F0',
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', width: '100%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            {/* 使用 Lucide Radio 图标 */}
                            <Radio size={16} color="#C084FC" />
                            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#9D74B5' }}>ANZULEAF LIVE</span>
                        </div>
                        <h1 style={{ display: 'flex', fontSize: '34px', margin: 0, fontWeight: '900', color: '#FFFFFF' }}>今日份 AI & CS 技术文章分享</h1>
                    </div>
                    <div style={{ display: 'flex', fontSize: '16px', fontWeight: 'bold', color: '#9D74B5' }}>{dateStr}</div>
                </div>

                {/* News List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flexGrow: 1, width: '100%' }}>
                    {data.map((news, i) => (
                        <div key={i} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: '24px',
                            padding: '28px',
                            border: '1px solid rgba(255, 255, 255, 0.04)',
                        }}>
                            <div style={{ display: 'flex', fontSize: '12px', color: '#9D74B5', marginBottom: '8px', fontWeight: 'bold' }}>{news.tag}</div>
                            <div style={{ display: 'flex', fontSize: '22px', fontWeight: 'bold', color: '#F8FAFC', marginBottom: '10px' }}>{news.title}</div>
                            <div style={{ display: 'flex', fontSize: '15px', color: '#94A3B8', marginBottom: '12px', lineHeight: 1.5 }}>{news.summary}</div>
                            <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: '#9D74B5', opacity: 0.6 }}>
                                {/* 使用 Lucide Link 图标 */}
                                <Link size={14} color="#9D74B5" style={{ marginRight: '4px' }} />
                                {news.link}
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
                // Satori 需要指定 lucide-icons 的数据源
                // 如果没有这一行，可能无法正确渲染 Lucide 图标
                // 参考：https://github.com/vercel/satori#using-custom-components
                // 确保你已经安装了 `lucide-icons` 包
                // 或者手动提供图标的 SVG 数据
                // 这里我们假设 lucide-react 已经提供了 Satori 所需的结构
            }
        );

        const resvg = new Resvg(svg, {
            background: '#1A1D21',
            fitTo: { mode: 'width', value: 2400 },
        });

        const fileName = 'anzuleaf.png';
        const pngBuffer = resvg.render().asPng();

        // 1. 写入文件
        writeFileSync(fileName, pngBuffer);

        // 2. 获取绝对路径
        const absolutePath = path.resolve(fileName);

        console.log(`🚀 高清卡片已生成: ${absolutePath}`);

        // 3. 返回路径给调用者
        return absolutePath;

    } catch (err) {
        console.error('生成失败:', err);
        return null;
    }
}

// 模拟数据启动
// generatePremiumCard(newsData);