import * as path from 'path';
import { FAAS_BASE_URL } from '../global';
import { GroupMessage, LagrangeContext, PrivateMessage } from 'lagrange.onebot';
import axios from 'axios';
import fs from 'fs';
export async function exportTodayGroupMessagesPdf(
    c: LagrangeContext<GroupMessage | PrivateMessage>,
    sourceGroupId: number,
    targetGroupId: number
) {
    const json = await c.realmService.getGroupMessagesByDate(c, sourceGroupId);

    if (!json) {
        c.sendMessage('无法从 realm 数据库中获取信息，请求技术支持');
        return;
    }

    const date = new Date();
    const formatted = date.toISOString().split('T')[0];
    fs.writeFileSync(`./log/${sourceGroupId}_${formatted}.json`, JSON.stringify(json, null, 2));

    const response = await axios.post(`${FAAS_BASE_URL}/qq-group-summary-to-pdf`, { json });

    if (response.data.code === 200) {
        const { pdfPath, imagePath } = response.data.msg;

        await new Promise(resolve => setTimeout(resolve, 1500));
        await c.uploadGroupFile(targetGroupId, pdfPath, path.basename(pdfPath));
        await new Promise(resolve => setTimeout(resolve, 1500));
        await c.sendGroupMsg(targetGroupId, [{
            type: 'image',
            data: {
                file: 'file://' + imagePath
            }
        }]);
    }
}