import axios from 'axios';
import { api } from '../api/faas';
import { LagrangeContext, PrivateMessage, GroupMessage } from 'lagrange.onebot';

export async function summaryWebsite(c: LagrangeContext<PrivateMessage | GroupMessage>, url?: string) {
    if (!url || (typeof url === 'string' && !url.startsWith('http'))) {
        c.sendMessage('拒绝执行 summaryWebsite ❌，原因：为给出有效的 http 连接');
        return;
    }

    const res = await axios.post(api + '/summary-website', { url });
    const { code, msg } = res.data;
    if (code !== 200) {
        c.sendMessage('消息聚合失败 ❌\n' + msg);
    } else {
        c.sendMessage('消息聚合成功 ✅\n' + msg);
    }
}
