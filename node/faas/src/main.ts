import express, { Request, Response } from 'express';
import { app } from './common';

import "./service/qq-daily-news";
import "./service/web-summary";
import "./service/build-publish-openmcp";
import "./service/qq-group-summary";
import "./service/crawl4ai";
import "./service/pm2-summary";
import "./service/qq-mcp";

import chalk from 'chalk';

// 路由为 localhost:3000
app.get('/', (req: Request, res: Response) => {
    res.send('<h1>Hello, World!</h1><br><img src="https://picx.zhimg.com/v2-b4251de7d2499e942c7ebf447a90d2eb_l.jpg"/>');
});

// 运行在 3000 端口
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(
        chalk.green(`🚀 Server is running on http://localhost:${PORT}`)
    );
});