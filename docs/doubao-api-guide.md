# 豆包 API 集成指南

## 一、获取 API Key

1. 访问火山引擎方舟大模型控制台：https://console.volcengine.com/ark
2. 注册/登录账号
3. 进入"密钥管理"页面
4. 创建新的 API Key
5. 复制并保存 API Key（只显示一次）

## 二、配置项目

### 1. 修改 application.yml

在 `src/main/resources/application.yml` 中配置你的 API Key：

```yaml
doubao:
  api:
    apiUrl: https://ark.cn-beijing.volces.com/api/v3
    apiKey: 你的_API_Key_在这里  # ⚠️ 替换为你的 API Key
    modelId: doubao-pro-4k-240515  # 可选，根据需要选择模型
    connectTimeout: 5000
    readTimeout: 30000
```

### 2. 可用模型

- `doubao-lite-4k-240515` - 轻量版
- `doubao-pro-4k-240515` - 专业版（默认）
- `doubao-pro-32k-240515` - 支持 32K 上下文
- `doubao-pro-128k-240515` - 支持 128K 上下文

## 三、使用示例

### 1. 在 Service 中使用

```java
@Resource
private DoubaoService doubaoService;

// 简单对话
String reply = doubaoService.chat("你好");

// 带系统提示词
String reply = doubaoService.chat("请写一首诗", "你是一位诗人");

// 批量对话
List<Map<String, String>> messages = new ArrayList<>();
Map<String, String> msg1 = new HashMap<>();
msg1.put("role", "user");
msg1.put("content", "你好");
messages.add(msg1);

String reply = doubaoService.chatWithMessages(messages);
```

### 2. 通过 HTTP 接口调用

启动项目后，可以通过以下接口调用：

#### 测试连接

```bash
GET http://localhost:8123/api/doubao/test
```

#### 简单对话

```bash
POST http://localhost:8123/api/doubao/chat
Content-Type: application/x-www-form-urlencoded

message=你好
```

#### 带系统提示词的对话

```bash
POST http://localhost:8123/api/doubao/chatWithPrompt
Content-Type: application/x-www-form-urlencoded

message=请写一首诗&systemPrompt=你是一位诗人
```

### 3. 查看接口文档

启动项目后访问：http://localhost:8123/api/doc.html

找到"豆包 AI 接口"分组，可以在线测试所有接口。

## 四、注意事项

### 1. 安全提示

- ⚠️ **不要将 API Key 提交到 Git 仓库**
- 建议使用环境变量或配置文件加密
- 生产环境使用配置中心管理敏感信息

### 2. 错误处理

常见错误及解决方案：

- **401 Unauthorized**: API Key 无效或已过期
- **429 Too Many Requests**: 请求频率超限，需要降低请求频率
- **500 Internal Server Error**: 服务端错误，联系火山引擎支持

### 3. 性能优化建议

- 对于高频调用场景，建议添加缓存层
- 考虑使用连接池优化 HTTP 连接
- 设置合理的超时时间避免长时间等待

## 五、扩展功能

### 1. 添加图片理解功能

豆包支持多模态输入，可以在 DoubaoService 中添加图片处理方法。

### 2. 流式响应

如需实现打字机效果，需要使用 SSE (Server-Sent Events)：

```java
@GetMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public SseEmitter chatStream(@RequestParam String message) {
    SseEmitter emitter = new SseEmitter();
    // 实现流式响应逻辑
    return emitter;
}
```

### 3. 会话历史

添加 Redis 存储会话历史，实现连续对话功能。

## 六、计费说明

请参考火山引擎官方文档了解各模型的计费标准：
https://www.volcengine.com/docs/82379/1099475

## 七、技术支持

- 官方文档：https://www.volcengine.com/docs/82379
- API 文档：https://www.volcengine.com/docs/82379/1099475
- 技术支持：https://console.volcengine.com/ark/issue
