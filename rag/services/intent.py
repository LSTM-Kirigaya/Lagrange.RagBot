from flask import Flask, request, jsonify
import numpy as np
import joblib
import json
import torch


from rag.db.embedding import embedding
from rag.api.constant import StatusCode, MsgCode
from rag.api.admin import app
from rag.api.admin import logger
from rag.api.config import necessary_files
from rag.model.enn import LinearEnn, train_enn

import sys
import os
sys.path.append(os.path.abspath('.'))

from prompt import PromptEngine

class IntentRecogition:
    def __init__(self) -> None:
        self.engine = PromptEngine(necessary_files['intent-story'])
        self.classifier = LinearEnn(in_dim=768, out_dim=7, focal=0, alpha_kl=0)
        self.classifier.load_state_dict(torch.load(necessary_files['intent-classifier']))
    
    def get_intent_recogition(self, query: str) -> dict:
        query_embed = embedding.embed_documents([query])
        prob, u = self.classifier.predict(query_embed)
        
        result_id = prob.argmax(dim=1)
        u = u.item()
        
        result_id = int(result_id.item())
        return {
            'id': int(result_id),
            'name': self.engine.id2intent[result_id],
            'uncertainty': float(u)
        }

intent_recogition = IntentRecogition()

@app.route('/intent/reload-embedding-mapping', methods=['post'])
def reload_embedding_mapping():
    try:
        intent_recogition.classifier.load_state_dict(torch.load(necessary_files['intent-classifier']))
    except Exception as e:
        response = jsonify({
            'code': StatusCode.process_error.value,
            'data': str(e),
            'msg': MsgCode.query_not_empty.value
        })
        response.status_code = StatusCode.success.value
        return response
    
    response = jsonify({
        'code': StatusCode.success.value,
        'data': 'load model from ' + necessary_files['intent-classifier'],
        'msg': StatusCode.success.value
    })
    response.status_code = StatusCode.success.value
    return response

# TODO: 删除该接口
@app.route('/intent/retrain-embedding-mapping', methods=['post'])
def retrain_embedding_mapping():
    # engine = PromptEngine(necessary_files['intent-story'])
    # engine.merge_stories_from_yml(necessary_files['issue-story'])
    # sentences = []
    # labels = []
    # for story in engine.stories:
    #     sentences.append(story.message)
    #     labels.append(engine.intent2id[story.intent])
    # try:
    #     labels = np.array(labels)
    #     embed = embedding.embed_documents(sentences)
    #     enn_model = intent_recogition.classifier
    #     train_enn(enn_model, embed, labels, bs=64, lr=1e-3, epoch=100)
    #     torch.save(enn_model.state_dict(), necessary_files['intent-classifier'])
        
    # except Exception as e:
    #     response = jsonify({
    #         'code': StatusCode.process_error.value,
    #         'data': str(e),
    #         'msg': MsgCode.query_not_empty.value
    #     })
    #     response.status_code = StatusCode.success.value
    #     return response

    response = jsonify({
        'code': StatusCode.success.value,
        'data': 'save data to ' + necessary_files['intent-classifier'],
        'msg': StatusCode.success.value
    })
    response.status_code = StatusCode.success.value
    return response



@app.route('/intent/get-intent-recogition', methods=['post'])
def get_intent_recogition():
    params = request.data.decode('utf-8')
    params: dict = json.loads(params)
    result_data = {}
    
    query = params.get('query', None)
    if query is None:
        response = jsonify({
            'code': StatusCode.user_error.value,
            'data': result_data,
            'msg': MsgCode.query_not_empty.value
        })
        response.status_code = StatusCode.success.value
        return response
        
    result = intent_recogition.get_intent_recogition(query)
    
    logger_chunk = json.dumps({
        'query': query,
        'intent': result
    }, ensure_ascii=False)
    logger.debug(logger_chunk)
    
    response = jsonify({
        'code': StatusCode.success.value,
        'data': result,
        'msg': StatusCode.success.value
    })
    response.status_code = StatusCode.success.value
    return response
