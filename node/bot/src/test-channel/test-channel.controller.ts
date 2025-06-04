import '../plugins/image';
import * as path from 'path';

import { mapper, plugins, LagrangeContext, PrivateMessage, GroupMessage, Send, logger, ApproveMessage, Message } from 'lagrange.onebot';
import { getNews, publishOpenMCP } from './test-channel.service';
import { es_db, qq_groups, qq_users } from '../global';
import { parseCommand, sendMessageToDiscord } from '../hook/util';
import { walktalk } from './bug-logger.service';
import axios from 'axios';
import { summaryWebsite } from './website-summary.service';

console.log('activate ' + path.basename(__filename));

const visitCache = new Map<string, number>();

export class TestChannel {

    @mapper.onPrivateUser(qq_users.JIN_HUI)
    @plugins.use('echo')
    @plugins.use('pm')
    @plugins.use('wget-image')
    async handleJinhui(c: LagrangeContext<PrivateMessage>) {
        
        const text = c.getRawText();
        console.log('[receive] ' + text);

        if (text.startsWith(':')) {
            const command = text.substring(1);
            switch (command) {
                case 'news':
                    await getNews(c);
                    break;
                
                case 'ping':
                    c.sendMessage('ping');
                    break;

                default:
                    break;
            }
        }

        c.finishSession();
    }

    @mapper.onGroup(qq_groups.TEST_CHANNEL, { memorySize: 100 })
    async handleTestChannel(c: LagrangeContext<GroupMessage>) {
        const text = c.getRawText();

        const commandResult = parseCommand(text);
        if (commandResult !== undefined) {
            // 校验身份
            if (c.message.user_id === qq_users.JIN_HUI) {
                const now = Date.now();
                const lastVisit = visitCache.get(c.message.user_id.toString());
                                
                const info = await c.getGroupMemberInfo(c.message.group_id, c.message.user_id);
                const role = info['data'].role;
                const name = info['data'].nickname;

                if (!lastVisit || (now - lastVisit) > 10 * 60 * 1000) {
                    c.sendMessage('检测到超级管理员，TIP 系统允许访问，正在执行 ' + JSON.stringify(commandResult));
                    visitCache.set(c.message.user_id.toString(), now);
                }
            } else {
                c.sendMessage('非法请求，TIP 系统拒绝访问');
                return;
            }

            const { command, args } = commandResult;
                
            switch (command) {
                case 'news':
                    await getNews(c);
                    break;

                case 'ping':
                    c.sendMessage('ping');
                    break;
                
                case 'file':
                    if (args.length === 0) {
                        c.sendMessage('usage\n:file filename');
                    } else {
                        const filename = args[0];
                        const file = path.join('/home/kirigaya/download/', filename);
                        c.uploadGroupFile(c.message.group_id, file, filename);
                    }
                    
                    break;
                
                case 'notice':
                    c.sendGroupNotice(c.message.group_id, 'hello world');
                    break;

                case 'get-notice':
                    const notice = await c.getGroupNotice(c.message.group_id);
                    c.sendMessage('当前的公告内容为：' + JSON.stringify(notice, null, 2));
                    break;
                
                case 'pub':
                    await publishOpenMCP(c);
                    break;

                case 'discord':
                    await sendMessageToDiscord('hello from qq');
                    break;

                case 'wt':
                    walktalk(c, es_db.WT_TEST_INDEX, args[0]);
                    break;
                
                case 'sum':
                    summaryWebsite(c, args[0]);
                    break;

                default:
                    break;
            }            
        }

    }

    @mapper.onGroupIncrease(qq_groups.TEST_CHANNEL)
    async handleTestChannelIncrease(c: LagrangeContext<ApproveMessage>) {
        console.log(c.message);
        c.setGroupAddRequest('', c.message.sub_type, true, '');
    }

    @mapper.createTimeSchedule('0 40 16 * * *')
    async handleTestChannelSchedule(c: LagrangeContext<Message>) {
        // const res = await axios.post('http://localhost:3000/get-news-from-hack-news');
        // const data = res.data;
        // const message = data.msg;
        // c.sendGroupMsg(qq_groups.TEST_CHANNEL, message);
    }
}
