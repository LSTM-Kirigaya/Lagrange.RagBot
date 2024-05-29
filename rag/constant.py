from enum import Enum

class StatusCode(Enum):
    success = 200
    user_error = 4001
    server_error = 4002
    resource_not_found = 4003
    timeout = 4004
    
class MsgCode(Enum):
    success = '请求处理成功'
    query_not_empty = '参数 query 不能为空'