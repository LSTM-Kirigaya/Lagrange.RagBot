import os
import json

import requests as r

from core import TreeIntent, logger


class ErineIntent(TreeIntent):
    api_key: str
    secret_key: str
    access_token: str
    def __init__(self, path: str, api_key: str = None, secret_key: str = None) -> None:
        super().__init__(path)
        self.api_key = api_key or os.environ['BAIDU_API_KEY']
        self.secret_key = secret_key or os.environ['BAIDU_SECRET_KEY']
        
        try:
            self.access_token = self.get_access_token()
        except Exception as e:
            raise ValueError('fail to get access token in initialization')
    
    
    def get_access_token(self):
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        api_key = self.api_key
        secret_key = self.secret_key
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

    def post_message(self, message: list[dict]):
        headers = {
            'Content-Type': 'application/json'
        }
        payload = json.dumps({
            'messages': message,
            'penalty_score': 2.0
        })
        url = 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie-lite-8k?access_token=' + self.access_token
        return r.post(url, headers=headers, data=payload)
        
    def call_llm(self, message: list[dict]) -> str:
        try:
            res = self.post_message(message)
        except Exception:
            self.access_token = self.get_access_token()
            res = self.post_message(message)
        try:
            return res.json()['result']
        except Exception as e:
            logger.error('get error when parse response of wenxinyiyan: ' + str(e))
            logger.debug(res.json())
            return None


if __name__ == '__main__':
    erine = ErineIntent('./config/story.yml')
    result = []
    for i in range(20):
        nodes = erine.inference('那不就是rv芯片往上堆扩展吗')
        if nodes is None:
            print('none -> ohters')
        else:
            node = nodes[0]
            result.append(node.name)
            print(node.name)
    
    from collections import Counter
    print(Counter(result))