import '../plugins/image';
import axios from 'axios';

import { LagrangeContext, PrivateMessage, GroupMessage } from 'lagrange.onebot'
import path from 'path';
import { sendMessageToDiscord, wait } from '../util';

export async function getNews(c: LagrangeContext<PrivateMessage | GroupMessage>) {
    const res = await axios.post('http://localhost:3000/get-news-from-hack-news');
    const data = res.data;
    const message = data.msg;
    console.log('message', message);
    
    c.sendMessage(message);
}


export async function publishOpenMCP(c: LagrangeContext<GroupMessage>) {
    const res = await axios.post('http://localhost:3000/publish-openmcp-client');
    const data = res.data;
    const message = data.msg;
    console.log('message', message);
    
    const { vsix, content } = message;
    
    await c.sendGroupNotice(c.message.group_id, content);
    await wait(2000);
    await c.uploadGroupFile(c.message.group_id, vsix, path.basename(vsix));

    await sendMessageToDiscord(content);
}
