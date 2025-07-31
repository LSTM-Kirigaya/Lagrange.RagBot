const fs = require('fs');
const path = require('path');

// Realm 数据库配置
const REALM_CONFIG = {
    path: path.join(__dirname, '../node/Lagrange.Core/lagrange-0-db/.realm'),
};

/**
 * 检查 Realm 数据库文件是否存在
 */
function checkRealmFileExists() {
    return fs.existsSync(REALM_CONFIG.path);
}

/**
 * 获取 Realm 数据库实例
 */
async function getRealmInstance() {
    if (!checkRealmFileExists()) {
        throw new Error(`Realm数据库文件不存在: ${REALM_CONFIG.path}`);
    }

    try {
        const Realm = await import('realm');
        const realm = new Realm.default({
            path: REALM_CONFIG.path,
            readOnly: true,
        });

        return realm;
    } catch (error) {
        throw new Error(`无法打开Realm数据库: ${error.message}`);
    }
}

/**
 * 解析 Realm 数据库中的键值对数据
 */
function parseRealmKV(buf) {
  const text = new TextDecoder("utf-8").decode(buf);
  const result = {};
  
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

/**
 * 解码消息实体内容
 */
function decodeEntities(arrayBuffer) {
    try {
        const buffer = new Uint8Array(arrayBuffer);
        
        // 尝试解析为 UTF-8 字符串
        const text = new TextDecoder('utf-8').decode(buffer);
        
        // 尝试解析为 JSON
        try {
            return JSON.parse(text);
        } catch (e) {
            // 尝试解析键值对
            try {
                const kvResult = parseRealmKV(buffer);
                if (Object.keys(kvResult).length > 0) {
                    return kvResult;
                }
            } catch (e) {
                // 键值对解析也失败了
            }
            
            // 返回原始文本
            return text;
        }
    } catch (error) {
        return '[无法解码消息内容]';
    }
}

/**
 * 格式化时间戳为本地时间字符串
 */
function formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleString('zh-CN');
}

/**
 * 获取今天的消息并导出为 Markdown 格式
 */
async function exportTodayGroupMessages(groupId) {
    try {
        const realm = await getRealmInstance();
        const MessageRecord = realm.objects("MessageRecord");
        
        // 计算今天的开始和结束时间戳
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        
        const startTimestamp = Math.floor(startOfToday.getTime());
        const endTimestamp = Math.floor(endOfToday.getTime());
        
        console.log(`查询时间范围: ${formatTimestamp(startTimestamp)} 至 ${formatTimestamp(endTimestamp)}`);
        
        // 获取今天指定群号的群聊消息
        const groupMessages = MessageRecord
            .filtered(`Type == 0 && ToUin == ${groupId} && Time >= ${startTimestamp} && Time < ${endTimestamp}`)
            .sorted("Time", false); // 按时间正序排列
        
        console.log(`找到 ${groupMessages.length} 条消息`);
        
        // 构建 Markdown 内容
        let markdownContent = `# 群聊消息记录\n\n`;
        markdownContent += `群号: ${groupId}\n`;
        markdownContent += `导出时间: ${new Date().toLocaleString('zh-CN')}\n`;
        markdownContent += `消息数量: ${groupMessages.length}\n\n`;
        markdownContent += `---\n\n`;
        
        // 处理每条消息
        for (let i = 0; i < groupMessages.length; i++) {
            const msg = groupMessages[i];
            const decodedContent = decodeEntities(msg.Entities);
            
            markdownContent += `## 消息 #${i + 1}\n\n`;
            markdownContent += `**发送者**: ${msg.FromUin}\n\n`;
            markdownContent += `**时间**: ${formatTimestamp(msg.Time)}\n\n`;
            markdownContent += `**内容**:\n\n`;
            
            // 根据解码结果的类型处理内容显示
            if (typeof decodedContent === 'string') {
                markdownContent += `${decodedContent}\n\n`;
            } else {
                markdownContent += `\`\`\`json\n${JSON.stringify(decodedContent, null, 2)}\n\`\`\`\n\n`;
            }
            
            markdownContent += `---\n\n`;
        }
        
        // 保存到文件
        const fileName = `group-${groupId}-messages-${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}.md`;
        const filePath = path.join(__dirname, fileName);
        
        fs.writeFileSync(filePath, markdownContent, 'utf-8');
        console.log(`消息已导出到: ${filePath}`);
        
        realm.close();
    } catch (error) {
        console.error('导出消息时出错:', error);
    }
}

// 执行导出函数
(async () => {
    const GROUP_ID = 782833642;
    console.log(`开始导出群 ${GROUP_ID} 的今日消息...`);
    await exportTodayGroupMessages(GROUP_ID);
    console.log('导出完成');
})();