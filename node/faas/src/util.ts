import { spawn, SpawnOptions, execSync } from 'child_process';

export function executeCommand(
    command: string,
    cwd?: string
): Promise<{ stdout: string; stderr: string; code: number | null }> {
    return new Promise((resolve, reject) => {
        // 自动拆分命令和参数（支持带引号的参数）
        const [cmd, ...args] = command.match(/(?:[^\s"']+|['"][^'"]*['"])+/g) || [];

        if (!cmd) {
            reject(new Error('Empty command'));
            return;
        }

        // 移除参数中的引号（如果存在）
        const processedArgs = args.map(arg =>
            arg.replace(/^['"](.*)['"]$/, '$1')
        );

        // 将 cwd 的 ~ 替换为用户的 home 目录
        if (cwd && cwd.startsWith('~')) {
            cwd = cwd.replace('~', process.env.HOME || '');
        }

        const options: SpawnOptions = {
            cwd,
            stdio: 'pipe',
            shell: process.platform === 'win32',
            env: {
                ...process.env, // 继承父进程所有环境变量
            }
        };

        const child = spawn(cmd, processedArgs, options);

        let stdout = '';
        let stderr = '';

        child.stdout?.on('data', (data) => {
            stdout += data.toString();
        });

        child.stderr?.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('close', (code) => {
            resolve({
                stdout: stdout.trim(),
                stderr: stderr.trim(),
                code,
            });
        });

        child.on('error', (error) => {
            reject(error);
        });
    });
}

export function markdownToPlainText(markdown: string): string {
    // 移除 Markdown 标题符号
    let plainText = markdown.replace(/^#+\s*/gm, '');

    // 移除 Markdown 链接格式
    plainText = plainText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // 移除 Markdown 加粗和斜体符号
    plainText = plainText.replace(/\*\*([^*]+)\*\*/g, '$1');
    plainText = plainText.replace(/\*([^*]+)\*/g, '$1');

    // 移除 Markdown 代码块符号
    plainText = plainText.replace(/`([^`]+)`/g, '$1');

    // 移除 Markdown 分割线
    plainText = plainText.replace(/^-{3,}/gm, '');

    // 移除多余的空行
    plainText = plainText.replace(/\n{3,}/g, '\n\n');

    return plainText.trim();
}

export function getFormatedTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}_${month}_${day}_${hours}_${minutes}_${seconds}`;
}
