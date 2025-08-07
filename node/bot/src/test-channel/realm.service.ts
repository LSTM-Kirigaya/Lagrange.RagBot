import { unpackMultiple } from 'msgpackr';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { DecodedMessage, ExportMessage, GroupMessagesExport, MessageEntity, MessageRecord, UserInfo } from './realm.dto';
import { qq_groups, qq_users } from '../global';
import { GroupMessage, LagrangeContext, PrivateMessage } from 'lagrange.onebot';
import axios from 'axios';
import { api } from '../api/faas';

// 动态导入realm，避免在不支持的环境下报错
let Realm: any;
try {
    Realm = (await import('realm')).default;
} catch (e) {
    console.warn('Realm数据库模块未安装或不支持当前环境:', e);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Realm数据库配置
const REALM_CONFIG = {
    // 数据库文件路径
    path: path.join(__dirname, '../../../Lagrange.Core/lagrange-0-db/.realm'),
    // 数据库模式版本
    schemaVersion: 0,
    // 数据库加密密钥（如果需要的话）
    encryptionKey: undefined as undefined | Uint8Array,
};

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

/**
 * 解码消息实体内容
 */
async function decodeEntities(c: LagrangeContext<GroupMessage | PrivateMessage>, buffer: Uint8Array): Promise<DecodedMessage | undefined> {
    try {
        const pkgs = unpackMultiple(buffer);
        let rawText = '';
        let payloadText = '';
        let replyName = '';
        let replyText = '';

        for (const pkg of pkgs) {
            // 如果是 Uint8Array，则递归解码
            if (pkg instanceof Uint8Array) {
                const result = await decodeEntities(c, pkg);
                if (result) {
                    payloadText += result.text;
                }
                continue;
            }

            if (Array.isArray(pkg)) {
                continue;
            }

            const entity = pkg as MessageEntity;
            if (entity.Text && (!entity.Text.includes('�') || entity.Text.includes('\\x'))) {
                rawText += entity.Text + '\n';
            } else if (entity.ImageUrl) {
                
                const type = entity.SubType === 0 ? '图片' : '动画表情';
                rawText += `![${type}](${entity.FilePath})\n`;

            } else if (entity.Payload) {
                rawText += entity.Payload + '\n';
            } else if (entity.Uin && entity.Name) {
                const name = entity.Name as string;
                if (name.startsWith('@')) {
                    replyName = name;
                    replyText = payloadText;
                }
            }
        }

        return {
            replyName: replyName.length === 0 ? undefined : replyName,
            replyText: replyText.length === 0 ? undefined : replyText,
            text: rawText.trim()
        };
    } catch (error) {
        return undefined;
    }
}

/**
 * 只需要返回小时，分钟即可
 */
function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

/**
 * 获取今天的消息并导出为 JSON 格式
 */
export async function exportTodayGroupMessages(c: LagrangeContext<GroupMessage | PrivateMessage>, groupId: number): Promise<GroupMessagesExport | undefined> {
    try {
        const realm = await getRealmInstance();
        const MessageRecord = realm.objects<MessageRecord>("MessageRecord");
        
        // 初始化用户映射
        const userMap = {} as Record<number, UserInfo>;

        // 计算今天的开始和结束时间戳
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1);

        const startTimestamp = Math.floor(startOfToday.getTime());
        const endTimestamp = Math.floor(endOfToday.getTime());

        console.log(`查询时间范围: ${formatTimestamp(startTimestamp)} 至 ${formatTimestamp(endTimestamp)}`);

        const groupMessages = MessageRecord
            .filtered(
                `Type == 0 && ToUin == ${groupId} && Time >= $0 && Time < $1`,
                new Date(startTimestamp),
                new Date(endTimestamp)
            )
            .sorted("Time", false);

        console.log(`找到 ${groupMessages.length} 条消息`);

        // 构建 JSON 数据结构
        const exportData: GroupMessagesExport = {
            groupId,
            exportTime: new Date().toDateString(),
            messageCount: 0,
            wordCount: 0,
            messages: [],
            users: {}
        };

        const groupInfo = await c.getGroupInfo(groupId);
        if (!(groupInfo instanceof Error)) {
            exportData.groupName = groupInfo.data?.group_name;
            exportData.memberCount = groupInfo.data?.member_count;
        }
        
        // 处理每条消息
        let messageCount = 0;
        let wordCount = 0;

        for (let i = 0; i < groupMessages.length; i++) {
            const msg = groupMessages[i];
            const senderUin = msg.FromUin;

            if (!senderUin || senderUin === qq_users.TIP) {
                continue;
            }

            if (userMap[senderUin] === undefined) {
                const user = await c.getGroupMemberInfo(groupId, senderUin);
                userMap[senderUin] = {
                    name: user.data?.card || user.data?.nickname || (senderUin + ''),
                    qq: senderUin,
                    avatar: `https://q1.qlogo.cn/g?b=qq&nk=${senderUin}&s=640`,
                    messageCount: 0,
                    wordCount: 0
                };
            }
            
            const userInfo = userMap[senderUin];

            const payloadBuffer = new Uint8Array(msg.Entities as any);
            const decodeResult = await decodeEntities(c, payloadBuffer);

            if (decodeResult === undefined || decodeResult.text.trim().length === 0) {
                continue;
            }

            if (senderUin === qq_users.JIN_HUI && decodeResult.text.trim().startsWith(':')) {
                continue;
            }
            
            const exportMessage: ExportMessage = {
                sender: userInfo?.name || senderUin + '',
                time: formatTimestamp(msg.Time.getTime()),
                content: decodeResult.text.trim()
            };

            if (decodeResult.replyName) {
                exportMessage.replyName = decodeResult.replyName;
            }

            if (decodeResult.replyText) {
                exportMessage.replyText = decodeResult.replyText;
            }

            userMap[senderUin].messageCount ++;
            if (decodeResult.text.startsWith('![图片]') && decodeResult.text.endsWith(')')) {
                userMap[senderUin].wordCount ++;
                wordCount ++;
            } else {
                userMap[senderUin].wordCount += decodeResult.text.trim().length;
                wordCount += decodeResult.text.trim().length;
            }

            exportData.messages.push(exportMessage);
            messageCount ++;
        }

        realm.close();

        if (!fs.existsSync('log')) {
            fs.mkdirSync('log');
        }

        exportData.users = userMap;
        exportData.messageCount = messageCount;
        exportData.wordCount = wordCount;

        const savePath = path.join('log', `${groupId}_${new Date().toISOString().slice(0, 10)}.json`);
        fs.writeFileSync(savePath, JSON.stringify(exportData, null, 2));

        return exportData;
    } catch (error) {
        console.error('导出消息时出错:', error);
    }
}

export async function exportTodayGroupMessagesPdf(c: LagrangeContext<GroupMessage | PrivateMessage>, groupId: number) {
    const json = await exportTodayGroupMessages(c, groupId);
    const response = await axios.post(api + '/qq-group-summary-to-pdf', { json });
    if (response.data.code === 200) {
        const pdfPath = response.data.msg;
        await c.uploadGroupFile(groupId, pdfPath, path.basename(pdfPath));
    }
}