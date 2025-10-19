import axios from 'axios';
import { LagrangeContext, PrivateMessage, GroupMessage } from 'lagrange.onebot';
import { FAAS_BASE_URL } from '../global';

export async function summaryWebsite(c: LagrangeContext<PrivateMessage | GroupMessage>, url?: string) {
    if (!url || (typeof url === 'string' && !url.startsWith('http'))) {
        c.sendMessage('拒绝执行 summaryWebsite ❌，原因：为给出有效的 http 连接');
        return;
    }

    const res = await axios.post(FAAS_BASE_URL + '/summary-website', { url });
    const { code, msg } = res.data;
    if (code !== 200) {
        c.sendMessage('消息聚合失败 ❌\n' + msg);
    } else {
        c.sendMessage('消息聚合成功 ✅\n' + msg);
    }
}
