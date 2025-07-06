import pm2 from 'pm2';
import { app } from '../common';

app.post('/pm2/summary', (req, res) => {
    pm2.connect((err) => {
        if (err) {
            console.error('Failed to connect to PM2:', err);
            return res.status(500).json({ error: 'Failed to connect to PM2' });
        }

        pm2.list((err, processList) => {
            pm2.disconnect(); // 无论成功与否，都断开连接

            if (err) {
                console.error('Failed to list processes:', err);
                return res.status(500).json({ error: 'Failed to fetch PM2 processes' });
            }

            // 返回进程列表
            const summary = [];
            for (const list of processList) {
                summary.push({
                    name: list.name,
                    status: list.pm2_env.status,
                    memory: list.monit.memory / 1024 / 1024,
                    cpu: list.monit.cpu,
                    restart: list.pm2_env.restart_time,
                    createTime: list.pm2_env.pm_uptime,
                })
            }

            res.json({ summary });
        });
    });
});