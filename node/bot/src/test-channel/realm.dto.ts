export interface MessageEntity {
    Text?: string;
    ImageUrl?: string;
    Payload?: string;
    Uin?: number;
    Name?: string;
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
    id: number;
    sender: number;
    timestamp: string;
    replyName?: string;
    replyText?: string;
    content: string;
}

export interface GroupMessagesExport {
    groupId: number;
    exportTime: string;
    messageCount: number;
    messages: ExportMessage[];
}