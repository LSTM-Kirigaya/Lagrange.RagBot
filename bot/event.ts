import type * as Lagrange from './type';

import lagrangeMapper from './lagrange-mapping';

function runPipe(message: Lagrange.Message) {
    switch (message.post_type) {
        case 'message': messagePipe(message); break;
        case 'notice': noticePipe(message); break;
        case 'request': requestPipe(message); break;
        default: break;
    }
}

// 处理 message 类型的 post_type 的 
function messagePipe(message: Lagrange.MessagePostType) {
    switch (message.message_type) {
        case 'private':
            
            break;
        case 'group':

            break;
        default:
            break;
    }
}

// 处理 notice 类型的 post_type 消息
function noticePipe(message: Lagrange.NoticePostType) {

}

// 处理 request 类型的 post_type 消息
function requestPipe(message: Lagrange.RequestPostType) {

}

export function onMessage(event: Buffer) {
    const messageBuffer = event.toString('utf-8');
    const messageJson = JSON.parse(messageBuffer) as Lagrange.Message;
    // 忽略系统 message
    if (messageJson.post_type !== 'meta_event') {
        runPipe(messageJson);
    }
}


export function onClose() {
    console.log('服务器连接关闭');
}