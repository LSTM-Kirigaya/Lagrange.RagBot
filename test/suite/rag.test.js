const fs = require('fs');
const yaml = require('yaml');
const assert = require('assert');
const axios = require('axios');

const vecdbBuffer = fs.readFileSync('./config/vecdb.yml', 'utf-8');
const vecdbConfig = yaml.parse(vecdbBuffer);
const vecdbBaseURL = `http://${vecdbConfig['addr']}:${vecdbConfig['port']}`;

const vecdbRequests = axios.create({
    baseURL: vecdbBaseURL,
    timeout: 5000    
});

const apiGetIntentRecogition = (req) => vecdbRequests({
    url: '/intent/get-intent-recogition', method: 'POST',
    data: req
});


suite('test intent recogition', () => {
    
    // 也可以事先写好测试集，写在测试程序里或者从静态文件中读入
    const intent_suites = [
        { input: '如何使用 digital ide 这个插件？', expect: 'usage' },
        { input: '我今天打开 vscode，发现 自动补全失效了，我是哪里没有配置好吗？', expect: 'usage,bug' },
        { input: 'path top.v is not a hdlFile 请问报这个错误大概是啥原因啊', expect: 'usage,bug' },
        { input: '我同学在学习强国看到小麦收割了，然后就买相应的股就赚了', expect: 'others' },
        { input: '我平时写代码就喜欢喝茶', expect: 'others' },
    ];

    for (const s of intent_suites) {
        const input = s.input;
        const expects = s.expect.split(',');

        test(`Message: ${input}) => Intent: ${expects.join(',')}`, async () => {
            const axiosRes = await apiGetIntentRecogition({ query: input });
            const res = axiosRes.data;
            const payload = res.data;
            const intentName = payload.name;
            
            assert(expects.includes(intentName), `infer intent "${intentName}" not in expect "${expects}"`);
        });
    }
});