import '../plugins/image';
import * as path from 'path';

import { mapper, LagrangeContext, GroupMessage, ApproveMessage, Message, PrivateMessage } from 'lagrange.onebot';
import { getNews } from './openmcp-dev.service';
import { es_db, FAAS_BASE_URL, qq_groups, qq_users } from '../global';
import { parseCommand, sendMessageToDiscord } from '../hook/util';
import axios from 'axios';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exportTodayGroupMessagesPdf } from '../utils/historyMessages';
import { getReplyMessage } from '../utils/reply';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
console.log('activate ' + path.basename(__filename));

const visitCache = new Map<string, number>();
let groupIncreaseCache = 0;

export class OpenMcpChannel {

    @mapper.onGroup(qq_groups.OPENMCP_DEV, { memorySize: 50, at: true })
    async handleOpenMcpChannel(c: LagrangeContext<GroupMessage>) {

        // if (c.message.user_id === qq_users.JIN_HUI) {
        //     const now = Date.now();
        //     const lastVisit = visitCache.get(c.message.user_id.toString());

        //     const info = await c.getGroupMemberInfo(c.message.group_id, c.message.user_id);
        //     const role = info['data'].role;
        //     const name = info['data'].nickname;

        //     if (!lastVisit || (now - lastVisit) > 10 * 60 * 1000) {
        //         // c.sendMessage('检测到超级管理员，TIP 系统允许访问，正在执行 ' + JSON.stringify(commandResult));
        //         visitCache.set(c.message.user_id.toString(), now);
        //     }
        // } else {
        //     c.sendMessage('非法请求，TIP 系统拒绝访问');
        //     return;
        // }


        const commonMessages = c.message.message.filter(m => m.type !== 'at' && m.type !== 'reply');
        const groupId = c.message.group_id;
        const content = commonMessages.map(m => JSON.stringify(m.data)).join('');
        const reference = await getReplyMessage(c) || 'none';

        await axios.post(`${FAAS_BASE_URL}/qq-agent-loop`, {
            groupId,
            content,
            reference
        });

    }

    @mapper.onGroupIncrease(qq_groups.OPENMCP_DEV)
    async handleTestChannelIncrease(c: LagrangeContext<ApproveMessage>) {
        console.log('group increase', c.message.group_id, 'new user', c.message.user_id);
        c.setGroupAddRequest('', c.message.sub_type, true, '');
        const now = Date.now();

        // 30s 为间隔
        if ((now - groupIncreaseCache) > 30 * 1000) {
            c.sendGroupMsg(
                c.message.group_id,
                [
                    {
                        type: 'at',
                        data: {
                            qq: c.message.user_id.toString()
                        }
                    },
                    {
                        type: 'text',
                        data: {
                            text: `
<IDENTITY>
欢迎加入 AnzuLeaf，这是一个主打 Agent 前沿技术交流和开放式项目合作的社群，前身是 OpenMCP 开发交流群。任何有关 AI 及其衍生技术的理论、应用、产品、设计都欢迎在本群讨论。
有什么学习资源或者技术上的疑问，欢迎 @我 提问。
</IDENTITY>

<BAD_CASES>
将技术问题饭圈化讨论。
讨论任何和计算机技术完全没有关系的话题。
情绪化讨论问题，就常识性话题展开大范围讨论。
</BAD_CASES>

<RESOURCES>
OpenMCP 官方文档：https://openmcp.kirigaya.cn
求 star 👇
OpenMCP：https://github.com/LSTM-Kirigaya/openmcp-client
SlidevAI： https://github.com/LSTM-Kirigaya/slidev-ai
</RESOURCES>`
                        }
                    }
                ]
            )

            groupIncreaseCache = now;
        }
    }

    @mapper.createTimeSchedule('0 0 10 * * *')
    async publishNewsTimer(c: LagrangeContext<Message>) {
        const res = await axios.post('http://localhost:3000/get-news-from-hack-news');
        const data = res.data;
        const message = data.msg;
        c.sendGroupMsg(qq_groups.OPENMCP_DEV, message);
    }

    @mapper.createTimeSchedule('0 0 23 * * *')
    async groupSummaryTimer(c: LagrangeContext<GroupMessage | PrivateMessage>) {
        await exportTodayGroupMessagesPdf(c, qq_groups.OPENMCP_DEV, qq_groups.OPENMCP_DEV);
    }
}
