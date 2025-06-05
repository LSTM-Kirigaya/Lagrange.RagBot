import express, { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { LagrangeContext, Message } from 'lagrange.onebot';
import { authenticate } from './middleware';
import chalk from 'chalk';
import { checkAndKillProcessOnPort } from './util';

const corsOptions = {
    // 一些旧版浏览器（如 IE11、各种 SmartTV）在 204 状态下会有问题
    optionsSuccessStatus: 200
};

export const app = express();
export const testRouter = express.Router();

app.use(express.json());
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use('/test', testRouter);

// 运行在 3021 端口
const PORT = (process.env.PORT || 3021) as number;

export async function registerTipHttpServer(c: LagrangeContext<Message>) {

    app.get('/', async (req: Request, res: Response) => {
        res.send({
            code: 200,
            msg: 'Ciallo, this is TIP'
        });
    });


    app.post('/tip/send-group', authenticate, async (req, res) => {
        try {
            // 业务逻辑
            const { groupId, message } = req.body || {};


            if (!groupId || !message) {
                res.status(400).json({
                    error: 'Invalid Arguments'
                });
                return;
            }
            
            await c.sendGroupMsg(groupId, message);
            
            res.send({
                code: 200,
                msg: 'TIP sends message to QQ Group ' + groupId
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ 
                error: 'Internal Server Error' 
            });
        }
    });
    

    await checkAndKillProcessOnPort(PORT);

    // sleep 1000 ms
    await new Promise(resolve => {
        setTimeout(() => {
            resolve(void 0);
        }, 1000);
    });

    app.listen(PORT, () => {
        console.log(
            chalk.green(`🚀 Server is running on http://localhost:${PORT}`)
        );
    });    
}