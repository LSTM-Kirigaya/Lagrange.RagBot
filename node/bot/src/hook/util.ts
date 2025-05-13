import axios from "axios";

export function parseCommand(text: string) {
    if (text.startsWith(':')) {
        text = text.substring(1);
    } else {
        return;
    }

    const command = text.split(' ')[0];
    const args = text.split(' ').slice(1);
    return {
        command,
        args
    }
}

export function wait(timeout: number) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(void 0);
        }, timeout);
    })
}


export async function sendMessageToDiscord(message: string) {
    const ip = process.env['OMCP_DISCORD_SERVER_IP'];
    const port = process.env['OMCP_DISCORD_SERVER_PORT'];
    const token = process.env['OMCP_DISCORD_TOKEN'];
    try {
        const response = await axios({
            method: 'post',
            url: `http://${ip}:${port}/api/message`,
            headers: {
                'Authorization': token,
                'User-Agent': 'Apifox/1.0.0 (https://apifox.com)',
                'Content-Type': 'application/json',
                'Accept': '*/*',
                'Host': `${ip}:${port}`,
                'Connection': 'keep-alive'
            },
            data: {
                content: message,
                channel: '1368185363549651107'
            }
        });

        console.log('Response:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}