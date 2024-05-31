import lagrangeMapper from './lagrange-mapping';

import type * as Lagrange from './type';
import type { LagrangeContext } from './context';

class Pipe {
    context: LagrangeContext | undefined;
    send: Lagrange.SendApi | undefined;
    public injectContext(context: LagrangeContext) {
        this.context = context;
        this.send = context.send.bind(context);
    }

    public run(message: Lagrange.Message) {
        switch (message.post_type) {
            case 'message': this.messagePipe(message); break;
            case 'notice': this.noticePipe(message); break;
            case 'request':this.requestPipe(message); break;
            default: break;
        }
    }
    
    // 处理 message 类型的 post_type 消息
    public messagePipe(message: Lagrange.MessagePostType) {        
        switch (message.message_type) {
            case 'private':
                lagrangeMapper.resolvePrivateUser(message, this.send);
                break;
            case 'group':
                lagrangeMapper.resolveGroup(message, this.send);
                break;
            default:
                break;
        }
    }
    
    // 处理 notice 类型的 post_type 消息
    public noticePipe(message: Lagrange.NoticePostType) {
    
    }
    
    // 处理 request 类型的 post_type 消息
    public requestPipe(message: Lagrange.RequestPostType) {
    
    }
}

export const pipe = new Pipe();

export function onMessage(event: Buffer) {
    const messageBuffer = event.toString('utf-8');
    const messageJson = JSON.parse(messageBuffer) as Lagrange.Message;
    // 忽略系统 message
    if (messageJson.post_type !== 'meta_event') {
        console.log('进入 runPipe');
        pipe.run(messageJson);
    }
}


export function onClose() {
    console.log('服务器连接关闭');
}
