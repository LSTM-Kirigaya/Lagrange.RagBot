import * as path from 'path';
import * as fs from 'fs';
import Realm from 'realm';
import { unpack, unpackMultiple } from 'msgpackr';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Realm 数据库配置
const REALM_CONFIG = {
    path: path.join(__dirname, '../node/Lagrange.Core/lagrange-0-db/.realm'),
    schemaVersion: 0,
    encryptionKey: undefined as undefined | Uint8Array,
};

interface MessageEntity {
    Text?: string;
    ImageUrl?: string;
    Payload?: string;
    Uin?: number;
    Name?: string;
}

interface DecodedMessage {
    replyName?: string;
    replyText?: string;
    text: string;
}

interface MessageRecord {
    FromUin: number;
    Time: Date;
    Entities: ArrayBuffer;
    Type: number;
    ToUin: number;
}

interface ExportMessage {
    id: number;
    sender: number;
    timestamp: string;
    replyName?: string;
    replyText?: string;
    content: string;
}

interface GroupMessagesExport {
    groupId: number;
    exportTime: string;
    messageCount: number;
    messages: ExportMessage[];
}

/**
 * 检查 Realm 数据库文件是否存在
 */
function checkRealmFileExists(): boolean {
    return fs.existsSync(REALM_CONFIG.path);
}

/**
 * 获取 Realm 数据库实例
 */
async function getRealmInstance(): Promise<Realm> {
    if (!Realm) {
        throw new Error('Realm数据库模块不可用');
    }

    if (!checkRealmFileExists()) {
        throw new Error(`Realm数据库文件不存在: ${REALM_CONFIG.path}`);
    }

    try {
        return new Realm({
            path: REALM_CONFIG.path,
            schemaVersion: REALM_CONFIG.schemaVersion,
            encryptionKey: REALM_CONFIG.encryptionKey,
            readOnly: true,
        });
    } catch (error: any) {
        throw new Error(`无法打开Realm数据库: ${error.message}`);
    }
}

// /**
//  * 解码消息实体内容
//  */
// function decodeEntities(buffer: Uint8Array): DecodedMessage | undefined {
//     try {
//         const pkgs = unpackMultiple(buffer);
//         let rawText = '';
//         let payloadText = '';
//         let replyName = '';
//         let replyText = '';

//         for (const pkg of pkgs) {
//             // 如果是 Uint8Array，则递归解码
//             if (pkg instanceof Uint8Array) {
//                 const result = decodeEntities(pkg);
//                 if (result) {
//                     payloadText += result.text;
//                 }
//                 continue;
//             }

//             if (Array.isArray(pkg)) {
//                 continue;
//             }

//             const entity = pkg as MessageEntity;
//             if (entity.Text && (!entity.Text.includes('�') || entity.Text.includes('\\x'))) {
//                 rawText += entity.Text + '\n';
//             } else if (entity.ImageUrl) {
//                 rawText += `[图片] ${entity.ImageUrl}\n`;
//             } else if (entity.Payload) {
//                 rawText += entity.Payload + '\n';
//             } else if (entity.Uin && entity.Name) {
//                 const name = entity.Name as string;
//                 if (name.startsWith('@')) {
//                     replyName = name;
//                     replyText = payloadText;
//                 }
//             }
//         }

//         return {
//             replyName: replyName.length === 0 ? undefined : replyName,
//             replyText: replyText.length === 0 ? undefined : replyText,
//             text: rawText.trim()
//         };
//     } catch (error) {
//         return undefined;
//     }
// }

// /**
//  * 格式化时间戳为 ISO 字符串
//  */
// function formatTimestamp(timestamp: number): string {
//     return new Date(timestamp).toISOString();
// }

// /**
//  * 获取今天的消息并导出为 JSON 格式
//  */
// async function exportTodayGroupMessages(groupId: number): Promise<void> {
//     try {
//         const realm = await getRealmInstance();
//         const MessageRecord = realm.objects<MessageRecord>("MessageRecord");

//         // 计算今天的开始和结束时间戳
//         const now = new Date();
//         const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//         const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1);

//         const startTimestamp = Math.floor(startOfToday.getTime());
//         const endTimestamp = Math.floor(endOfToday.getTime());

//         console.log(`查询时间范围: ${formatTimestamp(startTimestamp)} 至 ${formatTimestamp(endTimestamp)}`);

//         const groupMessages = MessageRecord
//             .filtered(
//                 `Type == 0 && ToUin == ${groupId} && Time >= $0 && Time < $1`,
//                 new Date(startTimestamp),
//                 new Date(endTimestamp)
//             )
//             .sorted("Time", false);

//         console.log(`找到 ${groupMessages.length} 条消息`);

//         // 构建 JSON 数据结构
//         const exportData: GroupMessagesExport = {
//             groupId,
//             exportTime: new Date().toISOString(),
//             messageCount: 0,
//             messages: []
//         };

//         // 处理每条消息
//         let messageCount = 0;
//         for (let i = 0; i < groupMessages.length; i++) {
//             const msg = groupMessages[i];
            
//             // 跳过特定发送者
//             if (msg.FromUin === 1542544558) {
//                 continue;
//             }

//             const payloadBuffer = new Uint8Array(msg.Entities as any);
//             const decodeResult = decodeEntities(payloadBuffer);

//             if (decodeResult === undefined || decodeResult.text.trim().length === 0) {
//                 continue;
//             }

//             const exportMessage: ExportMessage = {
//                 id: messageCount + 1,
//                 sender: msg.FromUin,
//                 timestamp: formatTimestamp(msg.Time.getTime()),
//                 content: decodeResult.text.trim()
//             };

//             if (decodeResult.replyName) {
//                 exportMessage.replyName = decodeResult.replyName;
//             }

//             if (decodeResult.replyText) {
//                 exportMessage.replyText = decodeResult.replyText;
//             }

//             exportData.messages.push(exportMessage);
//             messageCount ++;
//         }

//         exportData.messageCount = messageCount;

//         // 保存到 JSON 文件
//         const fileName = `group-${groupId}-messages-${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}.json`;
//         const filePath = path.join(__dirname, fileName);

//         fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2), 'utf-8');
//         console.log(`消息已导出到: ${filePath}`);

//         realm.close();
//     } catch (error) {
//         console.error('导出消息时出错:', error);
//     }
// }

// // 执行导出函数
// (async () => {
//     const GROUP_ID = 782833642;
//     console.log(`开始导出群 ${GROUP_ID} 的今日消息...`);
//     await exportTodayGroupMessages(GROUP_ID);
//     console.log('导出完成');
// })();