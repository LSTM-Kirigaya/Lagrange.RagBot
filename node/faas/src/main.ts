import express, { Request, Response } from 'express';
import { app, testRouter } from './common';

import "./service/news";
import "./openmcp/openmcp";

// 路由为 localhost:3000
app.get('/', (req: Request, res: Response) => {
    res.send('<h1>Hello, World!</h1><br><img src="https://picx.zhimg.com/v2-b4251de7d2499e942c7ebf447a90d2eb_l.jpg"/>');
});

// 运行在 3000 端口
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});