const fs = require('fs');
const yaml = require('yaml');
const assert = require('assert');
const axios = require('axios');

const vecdbBuffer = fs.readFileSync('./config/vecdb.yml', 'utf-8');
const vecdbConfig = yaml.parse(vecdbBuffer);
const vecdbBaseURL = `http://${vecdbConfig['addr']}:${vecdbConfig['port']}`;

console.log(vecdbBaseURL);

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
        { input: '请问报这个错误大概是啥原因啊', expect: 'usage,bug' },
        { input: '感觉现在啥都在往AI靠', expect: 'others' },
        { input: '别人设置的肯定有点不合适自己的', expect: 'others' },
        { input: '在企业里面最大的问题是碰见傻逼怎么办？', expect: 'others' },
        { input: '几乎完全不喝牛奶2333', expect: 'others' },
        { input: 'command not found: python', expect: 'usage,bug,others' },
        { input: '兄弟们有没有C语言绘图库推荐', expect: 'usage' },
        { input: '我早上开着机去打论文 回来发现我电脑切换到Linux了', expect: 'usage,bug,others' },
        { input: '我在Windows下遇到的只要问题就是对于C程序，包管理和编译管理器偶尔会不认识彼此但除此之外，都很安稳（win11除外）', expect: 'usage,others' },
        { input: '我的反撤回还能用', expect: 'others' },
        { input: '因为这是养蛊的虚拟机，放了些国产垃圾软件，得用国产流氓之王才能镇得住他们', expect: 'others' },
        { input: '你咋装了个360', expect: 'others' },
        { input: '？？？', expect: 'others' },
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