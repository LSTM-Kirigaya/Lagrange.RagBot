import * as fs from 'fs';

import WebSocket from 'ws';

import { apiQueryVecdb } from './api/vecdb';

const lagrangeBuffer = fs.readFileSync('./app/publish/appsettings.json', 'utf-8');
const lagrangeConfig = JSON.parse(lagrangeBuffer);
const impl = lagrangeConfig.Implementations[0];
const connectionParam = {
    host: impl.Host,
    port: impl.Port,
    path: impl.Suffix
};

const socket = new WebSocket.Server(connectionParam);

socket.on('connection', (ws: WebSocket) => {
    console.log('完成 ws 连接，启动参数如下');
    console.table(connectionParam);
    
    ws.on('message', (event: Buffer) => {
        const messageBuffer = event.toString('utf-8');
        const messageJson = JSON.parse(messageBuffer);
        if (messageJson.post_type === 'meta_event') {
            return;
        }
        console.info(messageJson);

        for (const item of messageJson.message) {
            console.log(item.type);
            console.log(item.data);
        }
    });

    ws.on('close', () => {
        console.log('服务器连接关闭');
    });
});

