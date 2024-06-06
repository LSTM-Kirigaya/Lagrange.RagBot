from flask import Flask, request, jsonify
from loguru import logger

logger.add(
    sink='./logs/rag.log',
    level='DEBUG',
    rotation='00:00',      
    retention='7 days',     
    compression='zip',        
    encoding='utf-8',  
    enqueue=True,
    format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}"
)

app = Flask(__file__)