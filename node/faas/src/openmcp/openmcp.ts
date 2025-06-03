import { Request, Response } from "express";
import { app } from "../common";
import * as fs from 'fs';
import * as path from 'path';
import { execSync, spawnSync } from 'child_process';
import os from 'os';
import { createTaskContext } from "../service/common";

export const OPENMCP_CLIENT = os.homedir() + '/project/openmcp-client';

async function updateOpenMCP() {
    const stashResult = execSync('git stash', { cwd: OPENMCP_CLIENT, env: process.env });
    console.log(stashResult.toString())

    const updateResult = execSync('git pull origin main', { cwd: OPENMCP_CLIENT, env: process.env });
    console.log(updateResult.toString());

    const installResult = execSync('npm i', { cwd: OPENMCP_CLIENT });
    console.log(installResult.toString());
}

async function buildOpenMCP() {
    const buildResult = execSync('npm run build', { cwd: OPENMCP_CLIENT });
    console.log(buildResult.toString());

    const rmResult = execSync('rm *.vsix', { cwd: OPENMCP_CLIENT });
    console.log(rmResult.toString());

    const packageResult = execSync('vsce package', { cwd: OPENMCP_CLIENT });
    console.log(packageResult.toString());

    // 找到 OPENMCP_CLIENT 下的第一个 vsix 文件，返回绝对路径
    const vsixFile = fs.readdirSync(OPENMCP_CLIENT).find(file => file.endsWith('.vsix'));
    const vsixPath = path.join(OPENMCP_CLIENT, vsixFile);

    return vsixPath;
}

function getLastChangeLog() {
    const changelog = fs.readFileSync(path.join(OPENMCP_CLIENT, 'CHANGELOG.md'), { encoding: 'utf-8' });
    const newContent = changelog.split('## [main]')[1];
    const version = newContent.split('\n')[0];
    const updateContent = newContent.split('\n').slice(1).join('\n');
    const content = `✴️ openmcp client ${version} 更新内容\n\n` + updateContent.trim() + '\n\n在 vscode/trae/cursor 等编辑器的插件商城搜索【openmcp】就可以下载最新的版本了！';
    return content;
}

function getVersion() {
    const changelog = fs.readFileSync(path.join(OPENMCP_CLIENT, 'CHANGELOG.md'), { encoding: 'utf-8' });
    const newContent = changelog.split('## [main]')[1];
    const version = newContent.split('\n')[0];
    return version;
}


app.post('/get-version', async (req: Request, res: Response) => {
    try {
        await updateOpenMCP();
        const version = getVersion();

        res.send({
            code: 200,
            msg: version
        })
    } catch (error) {
        console.log(error);
        res.send({
            code: 501,
            msg: error.toString()
        });
    }
});

app.post('/build-openmcp', async (req: Request, res: Response) => {
    try {
        const filePath = await buildOpenMCP();
        const updateContent = getLastChangeLog();
        res.send({
            code: 200,
            msg: {
                vsix: filePath,
                content: updateContent
            }
        })
    } catch (error) {
        console.log(error);
        res.send({
            code: 501,
            msg: error.toString()
        });
    }
});


async function getChangeLogEnglish(updateContent: string) {
    const { taskLoop } = await createTaskContext();

    const storage = {
        messages: [],
        settings: {
            temperature: 0.7,
            enableTools: [],
            systemPrompt: '',
            contextLength: 20
        }
    };

    const message = '请将下面的更新日志翻译成 GitHub release 风格的英文说明，请只返回翻译后的结果，不要出现任何多余的前缀：\n' + updateContent;

    try {
        await taskLoop.start(storage, message);
        const lastMessage = storage.messages.at(-1);
        return lastMessage.content;
    } catch (error) {
        return updateContent;   
    }
}


app.post('/publish-vsix', async (req: Request, res: Response) => {
    try {
        const { vsix, tool }  = req.body;
        
        if (!fs.existsSync(vsix)) {
            res.send({
                code: 501,
                msg: 'vsix 文件不存在'
            });
            return;
        }

        const buffer = execSync(tool + ' publish -i ' + vsix, { cwd: OPENMCP_CLIENT });
        res.send({
            code: 200,
            msg: buffer.toString('utf-8').trim()
        });
    } catch (error) {
        console.log(error);
        res.send({
            code: 501,
            msg: error.toString()
        });
    }
});

app.post('/publish-github-release', async (req: Request, res: Response) => {
    try {
        const { vsix }  = req.body;

        if (!fs.existsSync(vsix)) {
            res.send({
                code: 501,
                msg: 'vsix 文件不存在'
            });
            return;
        }

        // 从 $OPENMCP_CLIENT/changelog.md 中读取 version
        const changelog = fs.readFileSync(path.join(OPENMCP_CLIENT, 'CHANGELOG.md'), { encoding: 'utf-8' });
        const newContent = changelog.split('## [main]')[1];
        const version = newContent.split('\n')[0].trim();
        const tag = 'v' + version;
        const title = 'openmcp client ' + tag;
        const updateContent = newContent.split('\n').slice(1).join('\n');
        const notes = await getChangeLogEnglish(updateContent);
        const escapedNotes = notes
            .replace(/"/g, '\\"')  // 转义双引号
            .replace(/\(/g, '\\(')  // 转义左括号
            .replace(/\)/g, '\\)')  // 转义右括号
            .replace(/`/g, '\\`')   // 转义反引号
            .replace(/\$/g, '\\$');  // 转义美元符号

        const tool = `gh release create ${tag} ${vsix} --title "${title}" --notes "${escapedNotes}"`; // 使用模板字符串和引号

        const buffer = execSync(tool, { cwd: OPENMCP_CLIENT });
        res.send({
            code: 200,
            msg: buffer.toString('utf-8').trim()
        });
    } catch (error) {
        console.log(error);
        res.send({
            code: 501,
            msg: error.toString()
        });
    }
});
