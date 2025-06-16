import { app } from "../common";
import axios from 'axios';
import { Request, Response } from "express";

app.post('/crawl4ai/html2markdown', async (req: Request, res: Response) => {
    try {
        // 从请求体中获取 html
        const html = req.body.html;
        
        // 验证输入
        if (!html || typeof html !== 'string') {
            res.status(400).json({ 
                error: 'Invalid input: html content is required and must be a string' 
            });
            return;
        }
        
        // 调用现有的html2markdown服务
        const response = await axios.post('http://localhost:3002/html2markdown', {
            html: html
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // 返回结果
        res.json(response.data);
        
    } catch (error) {
        console.error('Error calling html2markdown service:', error);
        res.status(500).json({ 
            error: 'An error occurred while calling html2markdown service',
            details: error.response?.data || error.message 
        });
    }
});