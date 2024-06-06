from flask import Flask, request, jsonify
import numpy as np
import joblib
import json
from sklearn.linear_model import LogisticRegression

from embedding import embedding
from constant import StatusCode, MsgCode
from admin import app
from configs import necessary_files

import sys
import os
sys.path.append(os.path.abspath('.'))

from prompt import PromptEngine

class IntentRecogition:
    def __init__(self) -> None:
        self.embed_intent_classificator = joblib.load(necessary_files['intent-classifier'])
        self.engine = PromptEngine(necessary_files['intent-story'])
    
    def get_intent_recogition(self, query: str) -> dict:
        query_embed = embedding.embed_documents([query])
        result_id = self.embed_intent_classificator.predict(query_embed)[0]
        result_id = int(result_id)
        return {
            'id': result_id,
            'name': self.engine.id2intent[result_id]
        }

intent_recogition = IntentRecogition()

@app.route('/intent/reload-embedding-mapping', methods=['post'])
def reload_embedding_mapping():
    try:
        intent_recogition.embed_intent_classificator = joblib.load(necessary_files['intent-classifier'])
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

@app.route('/intent/retrain-embedding-mapping', methods=['post'])
def retrain_embedding_mapping():
    engine = PromptEngine(necessary_files['intent-story'])
    engine.merge_stories_from_yml(necessary_files['issue-story'])
    model = LogisticRegression()
    sentences = []
    labels = []
    for story in engine.stories:
        sentences.append(story.message)
        labels.append(engine.intent2id[story.intent])
    
    try:
        labels = np.array(labels)
        embed = embedding.embed_documents(sentences)
        model.fit(embed, labels)
        
        intent_recogition.engine = engine
        intent_recogition.embed_intent_classificator = model
        joblib.dump(model, necessary_files['intent-classifier'])    
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
    
    response = jsonify({
        'code': StatusCode.success.value,
        'data': result,
        'msg': StatusCode.success.value
    })
    response.status_code = StatusCode.success.value
    return response
