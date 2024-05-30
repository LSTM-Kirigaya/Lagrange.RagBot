import * as fs from 'fs';

import WebSocket from 'ws';

import { onMessage, onClose } from './event';
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
    
    ws.on('message', onMessage);
    ws.on('close', onClose);
    
    const testMsg = {
        action: 'send_private_msg',
        params: {
            user_id: 1193466151,
            message: '你好'
        }
    }

    ws.send(JSON.stringify(testMsg));
});
