import '../plugins/image';
import axios, { AxiosResponse } from 'axios';
import * as fs from 'fs';

import { LagrangeContext, PrivateMessage, GroupMessage } from 'lagrange.onebot'
import path from 'path';
import { sendMessageToDiscord, wait } from '../hook/util';

export async function getNews(c: LagrangeContext<PrivateMessage | GroupMessage>) {
    const res = await axios.post('http://localhost:3000/get-news-from-hack-news');
    const data = res.data;
    const message = data.msg;
    console.log('message', message);
    
    c.sendMessage(message);
}

function containError(axiosResult: AxiosResponse) {
    const msg = axiosResult.data.msg;
    if (typeof msg !== 'string') {
        return false;
    }

    return axiosResult.data.code !== 200 || msg.toLowerCase().startsWith('error');
}

export async function publishOpenMCP(c: LagrangeContext<GroupMessage>) {
    const res = await axios.post('http://localhost:3000/publish-openmcp-client');

    if (containError(res)) {
        c.sendMessage('编译失败 ❌\n' + res.data.msg);
        return;
    } else {
        c.sendMessage('openmcp 完成编译');
    }

    const data = res.data;
    const message = data.msg;

    const { vsix, content } = message;
    
    if (!fs.existsSync(vsix)) {
        c.sendMessage('vsix 文件不存在，需要超级管理员查看后台日志以排错');
        return;
    }

    const vscodePlatformResult = await axios.post('http://localhost:3000/publish-vsix', { tool: 'vsce', vsix });
    if (containError(vscodePlatformResult)) {
        c.sendMessage('vscode 平台发布失败，\n' + vscodePlatformResult.data.msg);
        return;
    } else {
        c.sendMessage('vscode 平台发布成功 ✅ https://marketplace.visualstudio.com/items?itemName=kirigaya.openmcp');
    }

    const openvsxPlatformResult = await axios.post('http://localhost:3000/publish-vsix', { tool: 'ovsx', vsix });
    if (containError(openvsxPlatformResult)) {
        c.sendMessage('openvsx 平台发布失败 ❌\n' + openvsxPlatformResult.data.msg);
        return;
    } else {
        c.sendMessage('openvsx 平台发布成功 ✅ https://open-vsx.org/extension/kirigaya/openmcp');
    }

    const githubReleaseResult = await axios.post('http://localhost:3000/publish-github-release', { vsix });
    if (containError(githubReleaseResult)) {
        c.sendMessage('github release 发布失败 ❌\n' + githubReleaseResult.data.msg);
        return;
    } else {
        c.sendMessage('github release 发布成功 ✅ ' + githubReleaseResult.data.msg);
    }

    await c.sendGroupNotice(c.message.group_id, content);
    await wait(2000);
    await c.uploadGroupFile(c.message.group_id, vsix, path.basename(vsix));

    await sendMessageToDiscord(content);
}
