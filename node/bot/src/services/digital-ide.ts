import '../plugins/image';

import { mapper, plugins, LagrangeContext, PrivateMessage, GroupMessage, Send } from 'lagrange.onebot'

import { apiGetIntentRecogition, apiQueryVecdb } from '../api/vecdb';

import { handleGroupIntent } from './intent';

let lastCall = undefined;

console.log('activate ' + __filename);

export class Impl {
    @mapper.onGroup(932987873, { at: false })
    async handleDigitalGroup(c: LagrangeContext<GroupMessage>) {
        const texts = [];
        const message = c.message;
        for (const msg of message.message) {
            if (msg.type === 'text') {
                texts.push(msg.data.text);
            }
        }
        const reply: Send.Default[] = [];
        const axiosRes = await apiGetIntentRecogition({ query: texts.join('\n') });
        const res = axiosRes.data;

        if (res.code == 200) {
            const intentResult = res.data;
            // 如果 不确定性 太高，就将意图修改为 
            if (intentResult.uncertainty >= 0.33) {
                intentResult.name = 'others';
            }
            const uncertainty = Math.round(intentResult.uncertainty * 1000) / 1000;
            const intentDebug = `【意图: ${intentResult.name} 不确定度: ${uncertainty}】`;
            const anwser = await handleGroupIntent(c, intentResult);
            if (anwser !== undefined) {
                c.sendMessage(anwser + '\n' + intentDebug);
            }

        } else {
            const now = Date.now();
            if (lastCall === undefined || (now - lastCall) >= 60 * 10 * 1000) {
                c.sendMessage('RAG 系统目前离线');
            }
            lastCall = Date.now();
        }
    }
}
