import requests as r
import json

api_key = '9J5qFTYr6wPRxkoVoXycnoWf'
secret_key = 'Xa6eJelStx5i7Ft3qQH0NAT6AvOkqhkH'

def get_access_token():
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }

    url = f'https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id={api_key}&client_secret={secret_key}'
    payload = json.dumps("")

    res = r.post(
        url=url,
        data=payload,
        headers=headers
    )

    resJson = res.json()
    access_token = resJson.get('access_token')
    assert isinstance(access_token, str), 'access_token 获取失败，详细信息' + str(resJson)
    return access_token

access_token = get_access_token()

text = open('./template.txt', 'r', encoding='utf-8').read()
t2 = open('./t2.txt', 'r', encoding='utf-8').read()

payload = json.dumps({
    # "messages": [
    #     {
    #         "role": "user",
    #         "content": text
    #     },
    #     {
    #         "role": "assistant",
    #         "content": "{ id: 3 }"
    #     },
    #     {
    #         "role": "user",
    #         "content": "Message: 大佬们，为啥我的digital ide启动之后所有功能都没启动捏？我配置了property文件，然后插件的vivado路经和modelsim路经都加上了\nIntent: "
    #     },
    #     {
    #         "role": "assistant",
    #         "content": "{ id: 0 }"
    #     },
    #     {
    #         "role": "user",
    #         "content": "话说digital-ide打开大的verilog卡死了\nIntent: "
    #     },
    #     {
    #         "role": "assistant",
    #         "content": "{ id: 1 }"
    #     },
    #     {
    #         'role': 'user',
    #         "content": "请问一下，第一次点击对文件仿真可以出波形文件，再次点击的时候就会提示unknown module type了。是哪个配置没配置好？\nIntent: "
    #     },
    # ]
    'messages': [
        # {
        #     'role': 'user',
        #     'content': 'Label a users message from a conversation with an intent. Reply ONLY with the name of the intent.\nThe intent should be one of the following:\n- 1\n- 2\n- 3\n- 4\nMessage: surface了解一下？\nIntent: { id: 4 }\nMessage: Metals一开直接报错\nIntent: { id: 4 }\nMessage: 大佬们，为啥我的digital ide启动之后所有功能都没启动捏？我配置了property文件，然后插件的vivado路经和modelsim路经都加上了\nIntent: { id: 1 }\nMessage: 请问 property.json 如何配置？\nIntent: { id: 1 }\nMessage: 请问一下，第一次点击对文件仿真可以出波形文件，再次点击的时候就会提示unknown module type了。是哪个配置没配置好？\nIntent: '
        # },
        # {
        #     'role': 'assistant',
        #     'content': '{id : 1}'
        # },
        # {
        #     'role': 'user',
        #     'content': 'Message: 话说digital-ide打开大的verilog卡死了\nIntent: { id: 2 }\nMessage: 帮我上传一下这份数据\nIntent: { id: 3 }\nMessage: 我的自动补全无法使用，是不是有bug？\nIntent: { id: 2 }\nMessage: 这群要被chisel夺舍了吗\nIntent: '
        # }, 
        # {
        #     'role': 'assistant', 
        #     'content': '{id : 4}'
        # }, 
        {
            "role": "user",
            "content": "如何解决 digital ide 无法载入配置文件的问题？\nIntent: "
        }
    ]
})

headers = {
    'Content-Type': 'application/json'
}

url = 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie-lite-8k?access_token=' + access_token
res = r.post(url, headers=headers, data=payload)
print(res.json())
# print(res.json()['result'])

# cache = []

# for line in res.iter_lines():
#     line_text: str = line.decode('UTF-8')
#     if line_text.startswith('data:'):
#         iter_json = json.loads(line_text.lstrip('data: '))
#         result: str = iter_json['result']
#         cache.append(result)
#         if result.endswith('。') or result.endswith('.'):
#             sentence = ''.join(cache).strip()
#             print(sentence)
#             cache.clear()

# if len(cache) > 0:
#     print(''.join(cache).strip())