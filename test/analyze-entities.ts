import * as path from 'path';
import * as fs from 'fs';

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

// 分析 Entities 数据结构
function analyzeEntities(arrayBuffer: ArrayBuffer): any {
    const buffer = new Uint8Array(arrayBuffer);
    
    console.log(`\n=== Entities 数据分析 ===`);
    console.log(`数据总长度: ${buffer.length} 字节`);
    console.log(`前32字节十六进制: ${Array.from(buffer.slice(0, 32)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
    
    // 尝试查找文本内容
    const textDecoder = new TextDecoder('utf-8', { fatal: false });
    const text = textDecoder.decode(buffer);
    console.log(`UTF-8解码结果(前100字符): ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
    
    // 查找可能的文本标记
    const textMarkers = ["Text", "text", "Content", "content"];
    for (const marker of textMarkers) {
        const index = text.indexOf(marker);
        if (index !== -1) {
            console.log(`找到标记 "${marker}" 在位置 ${index}`);
            const snippet = text.substring(index, Math.min(index + 100, text.length));
            console.log(`标记后内容片段: ${snippet}`);
        }
    }
    
    // 检查是否可能是 TLV 格式 (Type-Length-Value)
    // 常见的 TLV 格式: 2字节类型 + 2字节长度 + 数据
    if (buffer.length >= 4) {
        let offset = 0;
        let tlvCount = 0;
        
        console.log("\n尝试解析 TLV 结构:");
        while (offset + 4 <= buffer.length && tlvCount < 5) { // 限制解析数量
            const type = (buffer[offset] << 8) | buffer[offset + 1];
            const length = (buffer[offset + 2] << 8) | buffer[offset + 3];
            
            console.log(`  TLV #${tlvCount + 1}: Type=0x${type.toString(16)}, Length=${length}`);
            
            // 检查长度是否合理
            if (length >= 0 && offset + 4 + length <= buffer.length) {
                const value = buffer.slice(offset + 4, offset + 4 + length);
                const valueText = textDecoder.decode(value);
                console.log(`    Value前32字节: ${Array.from(value.slice(0, 32)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
                console.log(`    Value文本(前50字符): ${valueText.substring(0, 50)}${valueText.length > 50 ? '...' : ''}`);
                offset += 4 + length;
            } else {
                console.log(`    跳过无效长度`);
                offset += 1; // 移动一个字节继续尝试
            }
            
            tlvCount++;
        }
    }
    
    // 尝试查找可能的键值对结构
    console.log("\n查找可能的键值对:");
    const printableChars = [...text].filter(char => 
        char.charCodeAt(0) >= 32 && char.charCodeAt(0) <= 126 || 
        char.charCodeAt(0) >= 0x4e00 && char.charCodeAt(0) <= 0x9fff
    ).join('');
    console.log(`可打印字符(前100个): ${printableChars.substring(0, 100)}${printableChars.length > 100 ? '...' : ''}`);
    
    return {
        length: buffer.length,
        hexPreview: Array.from(buffer.slice(0, 32)).map(b => b.toString(16).padStart(2, '0')).join(' '),
        textPreview: text.substring(0, 100)
    };
}

(async () => {
    try {
        const realm = await getRealmInstance();
        const MessageRecord = realm.objects("MessageRecord");

        // 获取几条不同类型的消息进行分析
        const messages = MessageRecord.sorted("Time", true);
        
        console.log(`数据库中共有 ${messages.length} 条消息`);
        
        // 分析前3条消息的 Entities
        for (let i = 0; i < Math.min(3, messages.length); i++) {
            const msg = messages[i];
            console.log(`\n---------- 消息 #${i + 1} ----------`);
            console.log(`ID: ${msg.Id}`);
            console.log(`类型: ${msg.Type}`);
            console.log(`发送者: ${msg.FromUin}`);
            console.log(`接收者: ${msg.ToUin}`);
            console.log(`时间: ${new Date(msg.Time).toLocaleString()}`);
            
            if (msg.Entities) {
                analyzeEntities(msg.Entities as any);
            } else {
                console.log("Entities 为空");
            }
        }

        realm.close();
        console.log("\n分析完成");
    } catch (error) {
        console.error('分析过程中出现错误:', error);
    }
})();