import * as fs from 'fs';

import { server } from 'lagrange.onebot';

import { TestChannel } from './test-channel/test-channel.controller';
import { OpenMcpChannel } from './openmcp-dev/openmcp-dev.controller';
import { qq_users } from './global';
import { registerTipHttpServer } from './hook/http-server';

// 注册的模块
export const InstallChannels = [
    TestChannel,
    OpenMcpChannel
];

server.onMounted(c => {
    c.sendPrivateMsg(qq_users.JIN_HUI, '成功上线');
    registerTipHttpServer(c);
});

server.onUnmounted(c => {
    c.sendPrivateMsg(qq_users.JIN_HUI, '成功下线');
});


const buffer = fs.readFileSync('../Lagrange.Core/appsettings.json', 'utf-8');
const config = JSON.parse(buffer);
const impl = config.Implementations[0];

server.run({
    host: impl.Host,
    port: impl.Port,
    path: impl.Suffix,
    qq: 1542544558
});

InstallChannels.forEach(channel => {
    console.log('上线模块：' + channel.name);
});