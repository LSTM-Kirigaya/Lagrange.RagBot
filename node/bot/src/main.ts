import { LagrangeFactory } from 'lagrange.onebot';

import { TestChannel } from './test-channel/test-channel.controller';
import { OpenMcpChannel } from './openmcp-dev/openmcp-dev.controller';
import { qq_users } from './global';
import { registerTipHttpServer } from './hook/http-server';

// 注册的模块
const server = LagrangeFactory.create([
    TestChannel,
    OpenMcpChannel
]);

server.onMounted(c => {    
    c.sendPrivateMsg(qq_users.JIN_HUI, 'Successfully Login, TIP online');
    registerTipHttpServer(c);
});

server.launch({
    configPath: '/home/kirigaya/project/Lagrange.RagBot/node/Lagrange.Core/appsettings.json',
    mcp: true,
    mcpOption: {
        enableMemory: true,
        enableWebsearch: true,
        host: '0.0.0.0',
        port: 3010
    }
});