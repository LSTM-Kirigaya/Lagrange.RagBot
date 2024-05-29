declare module Lagrange {
    export interface HeartBeatStatus {
        app_initialized: boolean,
        app_enabled: boolean,
        app_good: boolean,
        online: boolean,
        good: boolean
    }

    export type MetaEventType = 'heartbeat' | 'lifecycle';

    export interface HeartBeatMessage {
        interval: number,
        status: HeartBeatStatus,
        meta_event_type: 'heartbeat',
        time: number,
        self_id: number,
        post_type: 'meta_event'
    }

    export interface Sender {
        user_id: number,
        nickname: string,
        sex: 'unknown' | 'male' | 'female',
        card?: string,
        age?: number,
        area?: string,
        level?: string,     // 群聊等级，但是是 string
        role?: string,
        title?: string
    }

    export interface MsgText {
        type: 'text',
        data: {
            text: string
        }
    }

    export interface MsgImage {
        type: 'image',
        data: {
            file: string,
            url: string,
            // 在简略窗口可以看到的信息，对于图片来说，这就是 [图片]
            summary: string
        }
    }

    export interface MsgFace {
        type: 'face',
        data: {
            id: string
        }
    }

    export interface MsgAt {
        type: 'at',
        data: {
            qq: string
        }
    }

    export interface MsgFile {
        // 一般是 ''
        id: string,
        // 文件名
        name: string,
        // 文件大小，单位：字节
        size: number,
        // id
        busid: number,
        // 链接 IPv4
        url: string
    }

    export interface MetaMessage {
        post_type: 'meta_event',
        [msg: string]: any
    }

    export interface CommonMessage {
        // 事件类型
        post_type: 'message',
        // 信息来自私聊还是群聊
        message_type?: 'private' | 'group',
        // 发送信息的是朋友还是群友/陌生人
        sub_type?: 'friend' | 'normal',
        // 消息的编号
        message_id?: number,
        // 群号
        group_id?: number,
        // 发消息的人的 QQ 号
        user_id: number,
        // 是否为匿名发言，一般都是 null
        anonymous?: null | boolean,
        // 消息内容（结构化）
        message?: MsgText | MsgImage | MsgFace | MsgAt,
        // 消息内容（纯文本）
        raw_message?: string,
        // 发送的时间戳
        time: number,
        // 自己的 id
        self_id: number,
        // 发送的文件
        // 默认字体大小，一般都是 0
        font?: number
    }

    export interface FileMessage {
        post_type: 'notice',
        user_id: number,
        file: MsgFile,
        notice_type?: 'offline_file',
        time: number,
        self_id: number
    }

    // 加群或者加好友
    export interface AddMessage {
        post_type: 'request',
        sub_type: 'add',
        user_id: number,
        group_id: number,
        // 默认为 0 代表没有邀请者
        invitor_id: number,
        request_type: 'private' | 'group',
        // 群问题和申请者的回答
        comment: string,
        flag: string,
        time: number,
        self_id: number,
    }

    // 同意
    export interface ApproveMessage {
        post_type: 'notice',
        sub_type: 'approve',
        group_id: number,
        operator_id: number,
        user_id: number,
        notice_type: 'group_increase',
        time: number,
        self_id: number,
    }

    export type Message = MetaMessage | CommonMessage | FileMessage | AddMessage | ApproveMessage
}