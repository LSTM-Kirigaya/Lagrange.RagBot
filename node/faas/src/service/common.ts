import { TaskLoop } from 'openmcp-sdk/task-loop';
import { TaskLoopAdapter } from 'openmcp-sdk/service';

export async function createTaskContext() {
    const adapter = new TaskLoopAdapter();

    await adapter.connectMcpServer({
        connectionType: 'STDIO',
        command: 'node',
        args: ['~/project/Lagrange.RagBot/node/servers/my-browser/dist/browser.js']
    });

    const taskLoop = new TaskLoop({ adapter });

    taskLoop.setLlmConfig({
        id: 'deepseek',
        baseUrl: 'https://api.deepseek.com/v1',
        userToken: process.env['DEEPSEEK_API_TOKEN'],
        userModel: 'deepseek-chat'
    });

    return {
        taskLoop, adapter
    }
}