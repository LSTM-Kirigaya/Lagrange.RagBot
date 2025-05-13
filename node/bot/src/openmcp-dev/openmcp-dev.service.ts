import '../plugins/image';
import axios from 'axios';

import { LagrangeContext, PrivateMessage, GroupMessage } from 'lagrange.onebot'
import path from 'path';
import { sendMessageToDiscord, wait } from '../hook/util';

export async function getNews(c: LagrangeContext<PrivateMessage | GroupMessage>) {
    const res = await axios.post('http://localhost:3000/get-news-from-hack-news');
    const data = res.data;
    const message = data.msg;
    console.log('message', message);
    
    c.sendMessage(message);
}

