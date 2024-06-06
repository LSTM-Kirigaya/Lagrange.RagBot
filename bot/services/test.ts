import '../plugins/image';

import { mapper, plugins, LagrangeContext, PrivateMessage, GroupMessage, Send } from 'lagrange.onebot'

import { apiGetIntentRecogition, apiQueryVecdb } from '../api/vecdb';

import { handleGroupIntent } from './intent';

export class Impl {
    @mapper.onPrivateUser(1193466151)
    @plugins.use('echo')
    @plugins.use('pm')
    @plugins.use('wget-image')
    async handleJinhui(c: LagrangeContext<PrivateMessage>) {
        c.sendMessage([{
            type: 'image',
            data: {
                file: 'file:///data/zhelonghuang/project/rag-llm/images/bird.png',
                timeout: 10000
            }
        }])
        c.finishSession();
    }

    @mapper.onGroup(956419963, { at: false })
    async handleTestGroup(c: LagrangeContext<GroupMessage>) {
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
            c.sendMessage(`【意图: ${intentResult.name} 不确定度: ${uncertainty}】`);
            handleGroupIntent(c, intentResult);
        } else {
            c.sendMessage('RAG 系统目前离线');
        }
    }
}
