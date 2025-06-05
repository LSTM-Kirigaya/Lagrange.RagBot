import { TaskLoop } from 'openmcp-sdk/task-loop';
import { TaskLoopAdapter } from 'openmcp-sdk/service';

export async function createTaskContext() {
    const adapter = new TaskLoopAdapter();
    
    adapter.addMcp({
        connectionType: 'STDIO',
        commandString: 'node browser.js',
        cwd: '~/project/Lagrange.RagBot/node/servers/my-browser/dist'
    });

    const taskLoop = new TaskLoop({ adapter, verbose: 1 });

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