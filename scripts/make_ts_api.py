import markdown
import re
from bs4 import BeautifulSoup, Tag

"""/**
 * @description 发送私聊消息
 * @param user_id 对方 QQ 号
 * @param message 要发送的内容
 * @param auto_escape 消息内容是否作为纯文本发送（即不解析 CQ 码），只在 message 字段是字符串时有效
 */
function send_private_msg(user_id: number, message: Lagrange.Message, auto_escape: boolean = false) {
    return {
        action: 'send_private_msg',
        params: { user_id, message, auto_escape }
    };
}"""

template = """/**
 * @description %s%s */
export function %s(%s) {
    return {
        action: '%s',
        params: { %s }
    };
}

"""

onebot_document = open('./scripts/onebot.md', 'r', encoding='utf-8').read()
html = markdown.markdown(onebot_document)
soup = BeautifulSoup(html, 'html.parser')

def snake_to_camel(s, capitalize_first_letter=False):  
    components = s.split('_')  
    camel = ''.join(x.capitalize() for x in components)  
    if not capitalize_first_letter:  
        camel = camel[0].lower() + camel[1:]  
      
    return camel

def next_node(el: Tag):
    p = el.next_sibling
    while len(p.text.strip()) == 0:
        p = p.next_sibling
    return p

tss = """/**
 * @author 锦恢
 * @email 1193466151@qq.com
 * @description Lagrange.Core 前端接口
 * @comment 接口调用详细参考文档
 * - https://github.com/botuniverse/onebot-11/blob/master/communication/ws.md
 */

import * as Lagrange from '../type';

"""

for el in soup.find_all('h2'):
    el: Tag
    
    function_name = None
    function_desc = None
    for child in el.children:
        if child.name == 'code':
            function_name = child.text
        elif child.name is None:
            function_desc = child.text
    
    if function_name and function_desc:
        ts_func_name = snake_to_camel(function_name)
    
        title2 = next_node(el)
        table = next_node(title2)

        count = 0
        params = []
        for line in table.text.strip().split('\n'):
            count += 1
            if count >= 3:
                splits = [l for l in line.split('|') if len(l.strip()) > 0]
                print(splits)
                if len(splits) == 4:        
                    param = {
                        'name': splits[0].strip(),
                        'type': splits[1].strip().split()[0],
                        'default': splits[2].strip(),
                        'desc': splits[3].strip()
                    }
                elif len(splits) == 3:
                    param = {
                        'name': splits[0].strip(),
                        'type': splits[1].strip().split()[0],
                        'default': '-',
                        'desc': splits[2].strip()
                    }
                
                if param['type'] == 'message':
                    param['type'] = 'Lagrange.Message'
                
                params.append(param)
        
        t1 = function_desc
        t2 = '\n'
        for param in params:
            t2 += ' * @param {} {}\n'.format(param['name'], param['desc'])
        t3 = ts_func_name
        t4 = []
        for param in params:
            if param['default'] == '-':
                t4.append('{}: {}'.format(param['name'], param['type']))
        for param in params:
            if param['default'] != '-':
                t4.append('{}: {} = {}'.format(param['name'], param['type'], param['default']))
        t4 = ', '.join(t4)
        t5 = function_name
        t6 = [param['name'] for param in params]
        t6 = ', '.join(t6)
        ts_code = template % (t1, t2, t3, t4, t5, t6)

        tss += ts_code

open('./bot/api/onebot.ts', 'w', encoding='utf-8').write(tss)