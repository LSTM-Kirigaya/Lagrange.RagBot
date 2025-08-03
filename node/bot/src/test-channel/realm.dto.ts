export interface MessageEntity {
    Text?: string;
    ImageUrl?: string;
    PictureSize?: any;
    FilePath?: string;
    ImageSize?: number;
    ImageUuid?: string;
    Payload?: string;
    Uin?: number;
    Name?: string;
    SubType?: number;
}

export interface DecodedMessage {
    replyName?: string;
    replyText?: string;
    text: string;
}

export interface MessageRecord {
    FromUin: number;
    Time: Date;
    Entities: ArrayBuffer;
    Type: number;
    ToUin: number;
}

export interface ExportMessage {
    sender: string;
    time: string;
    replyName?: string;
    replyText?: string;
    content: string;
}

// 添加用户信息接口
export interface UserInfo {
    name: string;
    qq: number;
    avatar?: string;
}

export interface UserStats {
    qq: number;
    name: string;
    messageCount: number;
    wordCount: number;
}

export interface GroupStats {
    totalMessages: number;
    totalWordCount: number;
    users: UserStats[];
}

export interface GroupMessagesExport {
    groupId: number;
    groupName?: string;
    memberCount?: number;
    exportTime: string;
    messageCount: number;
    messages: ExportMessage[];
    users: Record<number, UserInfo>;
    stats?: GroupStats;
}