import * as path from 'path';
import * as fs from 'fs';

import protobuf from "protobufjs";
import Realm from 'realm';

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

/**
 * 检查 Realm 数据库文件是否存在
 */
export function checkRealmFileExists(): boolean {
    return fs.existsSync(REALM_CONFIG.path);
}

/**
 * 获取 Realm 数据库实例
 */
export async function getRealmInstance() {
    if (!Realm) {
        throw new Error('Realm数据库模块不可用');
    }

    if (!checkRealmFileExists()) {
        throw new Error(`Realm数据库文件不存在: ${REALM_CONFIG.path}`);
    }

    try {
        const realm = new Realm({
            path: REALM_CONFIG.path,
            schemaVersion: REALM_CONFIG.schemaVersion,
            encryptionKey: REALM_CONFIG.encryptionKey,
            readOnly: true,
        });

        return realm;
    } catch (error: any) {
        throw new Error(`无法打开Realm数据库: ${error.message}`);
    }
}



function parseRealmKV(buf: Uint8Array) {
    const text = new TextDecoder("utf-8").decode(buf);
    const result: Record<string, any> = {};

    // 提取形如 Key 后面跟值的片段
    const regex = /(PictureSize|FilePath|ImageMd5|ImageSize|ImageUrl|ImageUuid|SubType)([^\u0000]+)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
        const key = match[1];
        const val = match[2].replace(/[^\u0020-\u007e\u4e00-\u9fa5]+/g, "").trim();
        result[key] = val;
    }
    return result;
}


import { unpack, unpackMultiple } from 'msgpackr';

// 尝试把 ArrayBuffer 解码成 UTF-8 字符串
function decodeEntities(arrayBuffer: ArrayBuffer): string {
    const buffer = new Uint8Array(arrayBuffer);
    const text = new TextDecoder('utf-8').decode(buffer);
    console.log('decode new data: ');
    console.log(unpackMultiple(buffer));
    

    try {
        // 有些 QQ 消息序列化为 JSON
        try {
            return JSON.parse(text);
        } catch {
            return text;
        }
    } catch {
        return '[无法解码消息内容]';
    }
}


(async () => {
    const realm = await getRealmInstance();
    const MessageRecord = realm.objects("MessageRecord");

    // 获取群号 782833642 的群聊消息
    const groupMessages = MessageRecord
        .filtered("Type == 0 && ToUin == 782833642")
        .sorted("Time", true); // true 表示倒序排列

    const results: any = [];

    for (let msg of groupMessages.slice(0, 20)) {
        results.push({
            SenderUin: msg.FromUin,
            Time: msg.Time,
            Content: decodeEntities(msg.Entities as any)
        });
    }

    // console.log(results);
    realm.close();
})();