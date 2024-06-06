import * as fs from 'fs';

import { server } from 'lagrange.onebot';
import './test';
import './digital-ide';

const buffer = fs.readFileSync('./app/publish/appsettings.json', 'utf-8');
const config = JSON.parse(buffer);
const impl = config.Implementations[0];

server.onMounted(c => {
    c.sendPrivateMsg(1193466151, '成功上线');
});

server.onUnmounted(c => {
    c.sendPrivateMsg(1193466151, '成功下线');
});

server.run({
    host: impl.Host,
    port: impl.Port,
    path: impl.Suffix,
    qq: 1542544558
});