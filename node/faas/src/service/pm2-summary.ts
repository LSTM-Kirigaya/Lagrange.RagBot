import pm2 from 'pm2';
import { app } from '../common';
import fs from 'fs';
import path from 'path';
import os from 'os';

// 接口1：获取指定应用的日志文件列表
app.post('/pm2/logs/list', (req, res) => {
    const { name } = req.body;
    
    if (!name) {
        res.status(400).json({ error: 'Name parameter is required' });
    }

    try {
        const logsDir = path.join(os.homedir(), '.pm2', 'logs');
        const allFiles = fs.readdirSync(logsDir);
        
        // 过滤出指定应用的日志文件并按时间排序
        const logFiles = allFiles
            .filter(file => file.startsWith(`${name}-out`) || file.startsWith(`${name}-error`))
            .sort((a, b) => {
                const statA = fs.statSync(path.join(logsDir, a));
                const statB = fs.statSync(path.join(logsDir, b));
                return statB.mtimeMs - statA.mtimeMs; // 最新的在前
            })
            .map(file => {
                const stat = fs.statSync(path.join(logsDir, file));
                return {
                    filename: file,
                    type: file.includes('-out') ? 'stdout' : 'stderr',
                    size: stat.size,
                    lastModified: stat.mtime,
                    path: path.join(logsDir, file)
                };
            });

        if (logFiles.length === 0) {
            res.status(404).json({ error: 'No logs found for this application' });
        } else {
            res.json({ 
                application: name,
                logFiles 
            });
        }
    } catch (err) {
        console.error('Failed to list log files:', err);
        res.status(500).json({ 
            error: 'Failed to list log files',
            details: err.message 
        });
    }
});

// 接口2：获取特定日志文件的内容
app.post('/pm2/logs/content', (req, res) => {
    const { name, filename, lines = 100 } = req.body;
    
    if (!name || !filename) {
        res.status(400).json({ 
            error: 'Both name and filename parameters are required' 
        });
    }

    try {
        const logsDir = path.join(os.homedir(), '.pm2', 'logs');
        const fullPath = path.join(logsDir, filename);

        // 安全检查：确保请求的文件属于该应用
        if (!filename.startsWith(`${name}-`)) {
            res.status(403).json({ 
                error: 'Access denied - requested log does not belong to this application' 
            });
        }

        // 检查文件是否存在
        if (!fs.existsSync(fullPath)) {
            res.status(404).json({ error: 'Log file not found' });
        }

        // 读取文件内容
        const content = fs.readFileSync(fullPath, 'utf-8');
        const linesArray = content.split('\n').filter(line => line.trim());
        const requestedLines = parseInt(lines) || 100;
        const resultLines = linesArray.slice(-requestedLines);

        res.json({
            application: name,
            filename,
            type: filename.includes('-out') ? 'stdout' : 'stderr',
            totalLines: linesArray.length,
            returnedLines: resultLines.length,
            lines: resultLines
        });
    } catch (err) {
        console.error('Failed to read log file:', err);
        res.status(500).json({ 
            error: 'Failed to read log file',
            details: err.message 
        });
    }
});

// 保留原有的重启服务和摘要接口
app.post('/pm2/restart', (req, res) => {
    const { name } = req.body;
    
    if (!name) {
        res.status(400).json({ error: 'Name parameter is required' });
    }

    pm2.connect((err) => {
        if (err) {
            console.error('Failed to connect to PM2:', err);
            res.status(500).json({ error: 'Failed to connect to PM2' });
        }

        pm2.restart(name, (err, proc) => {
            pm2.disconnect();

            if (err) {
                console.error('Failed to restart process:', err);
                return res.status(500).json({ error: 'Failed to restart process' });
            }

            res.json({ 
                message: 'Process restarted successfully',
                process: {
                    name: proc[0].name,
                    status: proc[0].pm2_env.status,
                    restartTime: proc[0].pm2_env.restart_time
                }
            });
        });
    });
});

app.post('/pm2/summary', (req, res) => {
    pm2.connect((err) => {
        if (err) {
            console.error('Failed to connect to PM2:', err);
            return res.status(500).json({ error: 'Failed to connect to PM2' });
        }

        pm2.list((err, processList) => {
            pm2.disconnect();

            if (err) {
                console.error('Failed to list processes:', err);
                return res.status(500).json({ error: 'Failed to fetch PM2 processes' });
            }

            const summary = processList.map(list => ({
                name: list.name,
                status: list.pm2_env.status,
                memory: list.monit.memory / 1024 / 1024,
                cpu: list.monit.cpu,
                restart: list.pm2_env.restart_time,
                createTime: list.pm2_env.pm_uptime,
            }));

            res.json({ summary });
        });
    });
});