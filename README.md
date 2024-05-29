![LagrangeRagBot](https://socialify.git.ci/LSTM-Kirigaya/LagrangeRagBot/image?description=1&descriptionEditable=%E7%94%A8%E4%BA%8E%E5%B0%86%20RAG%20%E9%A9%B1%E5%8A%A8%E7%9A%84%E8%BE%85%E5%8A%A9%E6%9C%BA%E5%99%A8%E4%BA%BA%E6%8E%A5%E5%85%A5%20QQ%20%E7%9A%84%E7%B3%BB%E7%BB%9F&font=Jost&forks=1&issues=1&language=1&logo=https%3A%2F%2Fpicx.zhimg.com%2F80%2Fv2-bdae55043d61d7bcfeeabead6e953959_1440w.jpeg&name=1&pattern=Circuit%20Board&stargazers=1&theme=Light)

## 环境搭建

```bash
git clone xxxxxx
npm install pm2 -g
yarn
pip install -r requirements.txt
```

下载最新版本的 Lagrange.core ，并完成初始化。完成后根目录为

```
📁bot
📁rag
📁app
   ├─📁publish
   │  ├─🏷️...
   │  ├─🏷️appsettings.json
   │  └─🪛Lagrange.OneBot
   └─🎗️...
```

---

## 架构

```mermaid
graph LR
a(拉格朗日 NTQQ server) <-->|http,ws| b(onebot layer)

c(vecdb) -->|http| b
d(LLM) -->|http| b
```

---

## 接口规范

http 接口满足 `HttpResponse` 所示。

```typescript
interface HttpResponse<T> {
    code: number,
    data: CommonResponse<T>
}

interface CommonResponse<T> {
    code: number,
    data?: T,
    msg?: string
}
```

---

## 开发须知

- 非必要，请不要随意宣传本项目。
- 虽然曾经无数个 QQ 相关的项目都死了，但是基本的 API 端口算是传承了下来。拉格朗日的返回类型，请参考 [go-cqhttp 帮助中心 - API 篇](https://docs.go-cqhttp.org/api/) 中的内容。

