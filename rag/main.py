import os

from admin import app, logger
from intent import *
from vecdb import *
from configs import necessary_files

def assert_resource(path: str):
    assert os.path.exists(path), '{} 不存在'.format(file)

for file in necessary_files.values():
    assert_resource(file)

if __name__ == '__main__':
    from gevent import pywsgi
    import yaml
    config: dict = yaml.load(open('./config/vecdb.yml'), Loader=yaml.Loader)
    addr = config.get('addr', '127.0.0.1')
    port = int(config.get('port', 8081))
    server = pywsgi.WSGIServer((addr, port), app)
    logger.info('RAG 系统运行在 http://{}:{}'.format(addr, port))
    server.serve_forever()