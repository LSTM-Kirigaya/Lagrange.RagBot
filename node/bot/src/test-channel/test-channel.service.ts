import '../plugins/image';
import axios, { AxiosResponse } from 'axios';

import { LagrangeContext, PrivateMessage, GroupMessage } from 'lagrange.onebot'
import path from 'path';
import { sendMessageToDiscord, wait } from '../hook/util';

import { OmPipe } from 'ompipe';
import { FAAS_BASE_URL, qq_groups } from '../global';

export async function getNews(c: LagrangeContext<PrivateMessage | GroupMessage>) {
    const res = await axios.post(FAAS_BASE_URL + '/get-news-from-hack-news');
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

export async function publishOpenMCP(c: LagrangeContext<GroupMessage | PrivateMessage>) {

    const res = await axios.post(FAAS_BASE_URL + '/get-version');
    const { code, msg } = res.data;

    if (code !== 200) {
        c.sendGroupMsg(qq_groups.OPENMCP_DEV, '无法拉取最新代码 ❌\n' + msg);
        return;
    }

    const version = msg.trim();
    const pipe = new OmPipe(version);

    pipe.add('build-openmcp', async () => {
        const res = await axios.post(FAAS_BASE_URL + '/build-openmcp');
        if (containError(res)) {
            c.sendGroupMsg(qq_groups.OPENMCP_DEV, '编译失败 ❌\n' + res.data.msg);
            throw new Error('x');
            
        } else {
            c.sendGroupMsg(qq_groups.OPENMCP_DEV, 'openmcp 完成编译');
            return res.data.msg;
        }
    }, { critical: true });


    pipe.add('publish-vscode', async store => {
        const { vsix, content } = store.getTaskResult('build-openmcp');

        const vscodePlatformResult = await axios.post(FAAS_BASE_URL + '/publish-vsix', { tool: 'vsce', vsix });
        if (containError(vscodePlatformResult)) {
            c.sendGroupMsg(qq_groups.OPENMCP_DEV, 'vscode 平台发布失败 ❌\n' + vscodePlatformResult.data.msg);
            throw new Error(vscodePlatformResult.data.msg);

        } else {
            c.sendGroupMsg(qq_groups.OPENMCP_DEV, 'vscode 平台发布成功 ✅ https://marketplace.visualstudio.com/items?itemName=kirigaya.openmcp');
        }
    }, { retryInterval: 200, maxRetryCount: 3 });


    pipe.add('publish-open-vsx', async store => {
        const { vsix, content } = store.getTaskResult('build-openmcp');
        const openvsxPlatformResult = await axios.post(FAAS_BASE_URL + '/publish-vsix', { tool: 'ovsx', vsix });
        if (containError(openvsxPlatformResult)) {
            c.sendGroupMsg(qq_groups.OPENMCP_DEV, 'openvsx 平台发布失败 ❌\n' + openvsxPlatformResult.data.msg);
            throw new Error(openvsxPlatformResult.data.msg);
        } else {
            c.sendGroupMsg(qq_groups.OPENMCP_DEV, 'openvsx 平台发布成功 ✅ https://open-vsx.org/extension/kirigaya/openmcp');
        }    
    }, { retryInterval: 200, maxRetryCount: 3 });    


    pipe.add('publish-github-release', async store => {
        const { vsix, content } = store.getTaskResult('build-openmcp');

        const githubReleaseResult = await axios.post(FAAS_BASE_URL + '/publish-github-release', { vsix });
        if (containError(githubReleaseResult)) {
            c.sendGroupMsg(qq_groups.OPENMCP_DEV, 'github release 发布失败 ❌\n' + githubReleaseResult.data.msg);
            throw new Error(githubReleaseResult.data.msg);
        } else {
            c.sendGroupMsg(qq_groups.OPENMCP_DEV, 'github release 发布成功 ✅ ' + githubReleaseResult.data.msg);
        }

    }, { retryInterval: 200, maxRetryCount: 3 });


    pipe.add('publish-qq', async store => {
        const { vsix, content } = store.getTaskResult('build-openmcp');

        await c.sendGroupNotice(qq_groups.OPENMCP_DEV, content);
        await wait(2000);
        await c.uploadGroupFile(qq_groups.OPENMCP_DEV, vsix, path.basename(vsix));
        await sendMessageToDiscord(content);
    });

    await pipe.start();
}
