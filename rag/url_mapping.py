from typing import Callable

SourceMappingFunction = Callable[[str], str]

class UrlMappingRegister:
    def __init__(self) -> None:
        self.startsWith_patterns: dict[str, SourceMappingFunction] = {}

    def startsWith(self, start: str) -> Callable[[SourceMappingFunction], SourceMappingFunction]:
        def register(start_name: str, func: SourceMappingFunction) -> SourceMappingFunction:
            self.startsWith_patterns[start_name] = func
            return func
        return lambda func: register(start, func)
    
    def url_from_mapping(self, source: str) -> str:
        for pattern in self.startsWith_patterns:
            func = self.startsWith_patterns[pattern]
            if source.startswith(pattern):
                try:
                    return func(source)
                except Exception as e:
                    return ''

urlmapping = UrlMappingRegister()

# 样例： docs/kirigaya.cn/129.md
# 目标： https://kirigaya.cn/blog/article?seq=129
@urlmapping.startsWith('docs/kirigaya.cn')
def kirigaya_cn(source: str) -> str:
    markdown_name = source.replace('docs/kirigaya.cn/', '')
    article_id = int(markdown_name.split('.')[0])
    template = f'https://kirigaya.cn/blog/article?seq={article_id}'
    return template

# 样例： docs/digital-document/guide/quick-start.md
# 目标： https://sterben.nitcloud.cn/zh/guide/quick-start.html
@urlmapping.startsWith('docs/digital-document')
def digital_document(source: str) -> str:
    router = source.replace('docs/digital-document', 'https://sterben.nitcloud.cn/zh')
    if router.endswith('.md'):
        router = router.replace('.md', '.html')
    return router


if __name__ == '__main__':
    print(kirigaya_cn('docs/kirigaya.cn/129.md'))
    print(kirigaya_cn('docs/kirigaya.cn/21.md'))
    
    print(digital_document('docs/digital-document/guide/quick-start.md'))
    print(digital_document('docs/digital-document/guide/pm-project-building.md'))
    