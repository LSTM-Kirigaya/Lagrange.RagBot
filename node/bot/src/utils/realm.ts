import * as path from 'path';
import { FAAS_BASE_URL } from '../global';
import { GroupMessage, LagrangeContext, PrivateMessage } from 'lagrange.onebot';
import axios from 'axios';

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

    const response = await axios.post(`${FAAS_BASE_URL}/qq-group-summary-to-pdf`, { json });
    console.log(response);

    if (response.data.code === 200) {
        const { pdfPath, imagePath } = response.data.msg;

        setTimeout(async () => {
            await c.uploadGroupFile(targetGroupId, pdfPath, path.basename(pdfPath));        
        }, 100);

        setTimeout(async () => {
            c.sendGroupMsg(targetGroupId, [{
                type: 'image',
                data: {
                    file: 'file://' + imagePath
                }
            }]);
        }, 1100);
    }
}