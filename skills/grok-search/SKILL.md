---
name: grok-search
description: 使用自定义 Grok API 端点进行网络搜索、新闻摘要、股票和加密货币价格查询。当用户需要搜索最新信息、查看新闻动态、获取股票行情（如 AAPL、TSLA）、查询加密货币价格（如 BTC、ETH、SOL）时使用。端点：http://grok.rainboxs.com，模型：grok-4.20-beta。
---

# Grok Search Skill

自定义 Grok API 搜索工具。通过 HTTP 调用 `http://grok.rainboxs.com` 完成搜索和信息获取。

## 配置

- **Base URL**: `http://grok.rainboxs.com`
- **API Key**: `xiaxiaocao`
- **Model**: `grok-4.20-beta`
- **API 格式**: OpenAI 兼容（`/v1/chat/completions`）

## 搜索方式

使用 `web_fetch` 或 `exec` 调用 curl，向 Grok API 发送带搜索意图的 prompt，让模型返回实时信息。

### 通用搜索

```bash
curl -s -X POST http://grok.rainboxs.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer xiaxiaocao" \
  -d '{
    "model": "grok-4.20-beta",
    "messages": [{"role": "user", "content": "搜索：<用户问题>，请给出最新、准确的信息"}],
    "stream": false
  }' | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['choices'][0]['message']['content'])"
```

### 加密货币 / 股票价格

```bash
curl -s -X POST http://grok.rainboxs.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer xiaxiaocao" \
  -d '{
    "model": "grok-4.20-beta",
    "messages": [{"role": "user", "content": "请给出 BTC、ETH 的当前价格、24h涨跌幅，以及市场简要分析"}],
    "stream": false
  }' | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['choices'][0]['message']['content'])"
```

### 新闻摘要

```bash
curl -s -X POST http://grok.rainboxs.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer xiaxiaocao" \
  -d '{
    "model": "grok-4.20-beta",
    "messages": [{"role": "user", "content": "总结今天最重要的5条科技/财经新闻，每条一句话"}],
    "stream": false
  }' | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['choices'][0]['message']['content'])"
```

## 输出格式

- **价格查询**：币种/股票 + 当前价 + 涨跌幅 + 简短分析
- **新闻摘要**：标题 + 一句话摘要，最多 5 条
- **通用搜索**：直接返回 Grok 的回答，加上信息来源说明

## 错误处理

- 如果返回 401：key 失效，告知用户更新
- 如果返回 503/timeout：端点不可用，切换用 `web_fetch` 直接抓取信息源
- 解析失败时打印原始响应供调试
