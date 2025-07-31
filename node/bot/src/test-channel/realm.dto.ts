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