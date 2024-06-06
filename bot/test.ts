import './plugins';

import { mapper, plugins, LagrangeContext, PrivateMessage, GroupMessage, Send } from 'lagrange.onebot'

import { apiQueryVecdb } from './api/vecdb';

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
        console.log(c.message.message);
        console.log(c.message.raw_message);
    }
}
