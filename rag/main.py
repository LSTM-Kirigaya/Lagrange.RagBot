from flask import Flask, request, jsonify
import json

from embedding import db
from url_mapping import urlmapping
from constant import StatusCode, MsgCode

app = Flask(__file__)

@app.route('/vecdb/similarity_search_with_score', methods=['post'])
def post_similarity_search_with_score():
    params = request.data.decode('utf-8')
    params: dict = json.loads(params)
    result_data = []
    
    query = params.get('query', None)
    if query is None:
        response = jsonify({
            'code': StatusCode.user_error.value,
            'data': result_data,
            'msg': MsgCode.query_not_empty.value
        })
        response.status_code = StatusCode.success.value
        return response
        
    k = int(params.get('k', 3))
    results = db.similarity_search_with_score(query=query, k=k)
    
    for doc, score in results:
        page_content = doc.page_content
        meta = doc.metadata
        source = meta.get('source', '')
        if len(source) > 0:
            source = urlmapping.url_from_mapping(source)
        result_data.append({
            'content': page_content.strip(),
            'meta': meta,
            'source': source,
            'score': float(score)
        })

    response = jsonify({
        'code': StatusCode.success.value,
        'data': result_data,
        'msg': StatusCode.success.value
    })
    response.status_code = StatusCode.success.value
    return response

if __name__ == '__main__':
    from gevent import pywsgi
    import yaml
    config: dict = yaml.load(open('./config/vecdb.yml'), Loader=yaml.Loader)
    addr = config.get('addr', '127.0.0.1')
    port = int(config.get('port', 8081))
    
    server = pywsgi.WSGIServer((addr, port), app)
    server.serve_forever()