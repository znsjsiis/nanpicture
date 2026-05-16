# 豆包 API 故障排查指南

## 问题现象

```
java.lang.RuntimeException: 调用豆包 API 失败：豆包 API 响应格式异常
```

## 已修复的问题

### 1. 增强错误处理

已在 `DoubaoService` 中添加以下改进：

- ✅ **打印原始响应**：记录完整的 API 响应内容
- ✅ **错误信息解析**：自动解析 API 返回的错误对象
- ✅ **详细日志**：对每个可能出错的环节都添加了日志
- ✅ **明确的异常信息**：不同错误场景有不同的异常提示

### 2. 新增调试接口

添加了 `/api/doubao/debug` 接口，用于查看详细的 API 交互信息。

## 排查步骤

### 第一步：检查配置文件

确认 `application.yml` 中的配置正确：

```yaml
doubao:
  api:
    apiUrl: https://ark.cn-beijing.volces.com/api/v3  # ✅ 确认地址正确
    apiKey: YOUR_API_KEY_HERE  # ⚠️ 必须替换为真实的 API Key
    modelId: doubao-pro-4k-240515  # ✅ 确认模型 ID 存在
    connectTimeout: 5000
    readTimeout: 30000
```

**常见错误：**

- ❌ 忘记修改 `apiKey`（仍为 `YOUR_API_KEY_HERE`）
- ❌ API Key 复制不完整
- ❌ 使用了错误的 API 地址

### 第二步：启动项目并访问调试接口

1. 启动 Spring Boot 应用
2. 访问：`http://localhost:8123/api/doubao/debug`
3. **查看控制台日志**，找到以下内容：

```
===== 豆包 API 原始响应 =====
{... 完整的 JSON 响应 ...}
===========================
```

### 第三步：分析响应内容

#### 情况 A：API Key 无效

**响应示例：**

```json
{
  "error": {
    "code": "invalid_api_key",
    "message": "无效的 API Key"
  }
}
```

**解决方案：**

1. 登录火山引擎控制台：https://console.volcengine.com/ark
2. 重新获取 API Key
3. 更新配置文件并重启应用

#### 情况 B：余额不足或未开通服务

**响应示例：**

```json
{
  "error": {
    "code": "insufficient_quota",
    "message": "账户余额不足"
  }
}
```

**解决方案：**

1. 前往火山引擎控制台充值
2. 确认已开通豆包大模型服务

#### 情况 C：请求频率超限

**响应示例：**

```json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "请求过于频繁"
  }
}
```

**解决方案：**

1. 降低请求频率
2. 联系火山引擎提升配额

#### 情况 D：模型不存在

**响应示例：**

```json
{
  "error": {
    "code": "model_not_found",
    "message": "模型不存在"
  }
}
```

**解决方案：**

1. 检查 `modelId` 是否正确
2. 确认可用的模型列表：
    - `doubao-lite-4k-240515`
    - `doubao-pro-4k-240515`
    - `doubao-pro-32k-240515`
    - `doubao-pro-128k-240515`

#### 情况 E：网络问题

**现象：**

- 控制台显示连接超时
- 或者没有任何响应

**解决方案：**

1. 检查服务器网络连接
2. 确认能够访问 `https://ark.cn-beijing.volces.com`
3. 检查防火墙设置

### 第四步：使用 Postman 手动测试

如果通过程序仍然无法解决，可以使用 Postman 直接测试 API：

**请求配置：**

```
POST https://ark.cn-beijing.volces.com/api/v3/chat/completions
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "model": "doubao-pro-4k-240515",
  "messages": [
    {
      "role": "user",
      "content": "你好"
    }
  ]
}
```

## 常见问题 FAQ

### Q1: 在哪里获取 API Key？

A: 访问火山引擎方舟大模型控制台：

1. https://console.volcengine.com/ark
2. 登录/注册账号
3. 进入"密钥管理"
4. 创建新的 API Key

### Q2: API Key 有权限限制吗？

A: 是的，需要确保：

- API Key 已启用
- 账户有足够的额度
- API Key 有访问豆包模型的权限

### Q3: 为什么一直返回 401 错误？

A: 401 表示认证失败，可能原因：

- API Key 错误
- API Key 已过期或被禁用
- Authorization 头部格式不正确（应该是 `Bearer YOUR_API_KEY`）

### Q4: 如何查看更详细的日志？

A: 修改 `src/main/resources/logback-spring.xml` 或 `application.yml`：

```yaml
logging:
  level:
    com.zn.nanpicturebackend.service.DoubaoService: DEBUG
    com.zn.nanpicturebackend.config.DoubaoApiConfig: DEBUG
```

### Q5: 测试成功但实际使用失败怎么办？

A: 可能原因：

- 并发量过大触发限流
- 某些特殊字符导致请求失败
- 超时时间设置过短

建议：

1. 添加重试机制
2. 增加超时时间
3. 实现降级策略

## 优化建议

### 1. 添加重试机制

对于网络波动导致的临时失败，可以添加重试：

```java
@Service
public class DoubaoService {
    
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 1000))
    public String chat(String message) {
        // ...
    }
}
```

### 2. 添加缓存

对于相同的请求，可以缓存结果避免重复调用：

```java
@Cacheable(value = "doubao", key = "#message")
public String chat(String message) {
    // ...
}
```

### 3. 异步调用

对于耗时较长的场景，可以使用异步调用：

```java
@Async
public CompletableFuture<String> chatAsync(String message) {
    return CompletableFuture.completedFuture(chat(message));
}
```

## 获取帮助

如果以上方法都无法解决问题：

1. **查看官方文档**：https://www.volcengine.com/docs/82379
2. **联系技术支持**：https://console.volcengine.com/ark/issue
3. **查看社区讨论**：火山引擎开发者社区

## 总结

大多数 API 调用失败都是由于：

1. ❌ API Key 配置错误（占 80%）
2. ❌ 网络问题（占 10%）
3. ❌ 模型参数错误（占 5%）
4. ❌ 其他原因（占 5%）

按照上述步骤逐步排查，基本都能找到问题所在。
