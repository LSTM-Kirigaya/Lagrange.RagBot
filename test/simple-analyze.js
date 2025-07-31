const fs = require('fs');
const path = require('path');

// 检查 Realm 数据库文件是否存在
const realmPath = path.join(__dirname, '../node/Lagrange.Core/lagrange-0-db/.realm');
if (!fs.existsSync(realmPath)) {
    console.log('Realm 数据库文件不存在:', realmPath);
    process.exit(1);
}

console.log('Realm 数据库文件存在:', realmPath);

// 由于 Realm 和 protobuf 依赖可能安装有问题，我们直接分析二进制数据
// 读取一个示例 Entities 数据进行分析
const Realm = await import('realm');

const REALM_CONFIG = {
    path: realmPath,
    schemaVersion: 0,
    encryptionKey: undefined,
};

async function getRealmInstance() {
    try {
        const realm = new Realm.default({
            path: REALM_CONFIG.path,
            schemaVersion: REALM_CONFIG.schemaVersion,
            encryptionKey: REALM_CONFIG.encryptionKey,
            readOnly: true,
        });
        return realm;
    } catch (error) {
        console.error(`无法打开Realm数据库: ${error.message}`);
        process.exit(1);
    }
}

function analyzeEntities(buffer) {
    console.log(`\n=== Entities 数据分析 ===`);
    console.log(`数据总长度: ${buffer.length} 字节`);
    
    // 显示前100字节的十六进制表示
    const hexArray = Array.from(buffer.slice(0, Math.min(100, buffer.length)));
    console.log(`前100字节十六进制:\n${hexArray.map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
    
    // 尝试 UTF-8 解码
    const textDecoder = new TextDecoder('utf-8', { fatal: false });
    const text = textDecoder.decode(buffer);
    console.log(`\nUTF-8解码结果(前200字符):\n${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
    
    // 查找可打印字符
    const printable = [...text].filter(char => {
        const code = char.charCodeAt(0);
        return (code >= 32 && code <= 126) || (code >= 0x4e00 && code <= 0x9fff);
    }).join('');
    console.log(`\n可打印字符(前200个):\n${printable.substring(0, 200)}${printable.length > 200 ? '...' : ''}`);
    
    // 尝试查找常见的 TLV 模式
    // 简单的 TLV 检测: 2字节类型 + 2字节长度 + 数据
    if (buffer.length >= 4) {
        console.log('\n=== TLV 模式检测 ===');
        let offset = 0;
        let tlvCount = 0;
        
        while (offset + 4 <= buffer.length && tlvCount < 5) {
            const type = (buffer[offset] << 8) | buffer[offset + 1];
            const length = (buffer[offset + 2] << 8) | buffer[offset + 3];
            
            console.log(`TLV #${tlvCount + 1}: Type=0x${type.toString(16).padStart(4, '0')}, Length=${length}`);
            
            if (length > 0 && length <= 1000 && offset + 4 + length <= buffer.length) {
                const value = buffer.slice(offset + 4, offset + 4 + length);
                const valueText = textDecoder.decode(value);
                console.log(`  Value文本(前100字符): ${valueText.substring(0, 100)}${valueText.length > 100 ? '...' : ''}`);
                offset += 4 + length;
            } else if (length === 0) {
                console.log('  Value为空');
                offset += 4;
            } else {
                console.log('  无效的长度字段，跳过');
                offset += 1;
            }
            
            tlvCount++;
        }
    }
}

(async () => {
    try {
        const realm = await getRealmInstance();
        const MessageRecord = realm.objects("MessageRecord");
        
        console.log(`数据库中共有 ${MessageRecord.length} 条消息`);
        
        // 获取前几条消息分析 Entities
        const messages = MessageRecord.sorted("Time", true);
        for (let i = 0; i < Math.min(3, messages.length); i++) {
            const msg = messages[i];
            console.log(`\n---------- 消息 #${i + 1} ----------`);
            console.log(`ID: ${msg.Id}`);
            console.log(`类型: ${msg.Type}`);
            console.log(`发送者: ${msg.FromUin}`);
            console.log(`接收者: ${msg.ToUin}`);
            console.log(`时间: ${new Date(msg.Time).toLocaleString()}`);
            
            if (msg.Entities) {
                // 转换为 Uint8Array 进行分析
                const buffer = new Uint8Array(msg.Entities);
                analyzeEntities(buffer);
            } else {
                console.log("Entities 为空");
            }
        }
        
        realm.close();
        console.log('\n分析完成');
    } catch (error) {
        console.error('分析过程中出现错误:', error);
    }
})();