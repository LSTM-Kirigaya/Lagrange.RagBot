import requests as r
import json

payload = json.dumps({
    'query': '一键生成 requirements.txt ',
    'k': 3
})

res = r.post('http://localhost:8081/vecdb/similarity_search_with_score', data=payload)

print(res.status_code)

if res.status_code == 200:
    print(res.json())