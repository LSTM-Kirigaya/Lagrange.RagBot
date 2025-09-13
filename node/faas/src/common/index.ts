import express, { Request, Response } from 'express';
import morgan from 'morgan';
import cors from 'cors';

const corsOptions = {
    // 一些旧版浏览器（如 IE11、各种 SmartTV）在 204 状态下会有问题
    optionsSuccessStatus: 200
};

export const app = express();
export const testRouter = express.Router();

app.use(express.json());
app.use(cors(corsOptions));
app.use(express.json({ limit: '20mb' }));
app.use(morgan('dev'));
app.use('/test', testRouter);