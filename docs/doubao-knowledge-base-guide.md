# 豆包知识库（RAG）接入指南

## 📚 什么是 RAG

**RAG（Retrieval-Augmented Generation，检索增强生成）** 是一种结合知识库和大模型的技术：

```
用户问题 → 检索知识库 → 找到相关知识 → 结合大模型 → 生成准确答案
```

### 优势

- ✅ **准确性更高** - 基于你的专业知识库回答
- ✅ **减少幻觉** - 避免 AI 胡说八道
- ✅ **可定制** - 使用你自己的文档和数据
- ✅ **可追溯** - 可以知道答案来源于哪些文档

---

## 🔧 接入步骤

### 第一步：创建知识库

1. **访问火山引擎控制台**
   ```
   https://console.volcengine.com/ark
   ```

2. **进入知识库管理**
    - 点击左侧菜单"知识中心"
    - 点击"创建知识库"

3. **上传文档**
    - 支持格式：PDF、Word、TXT、Markdown 等
    - 系统会自动进行文本分割和向量化
    - 等待处理完成

4. **获取知识库 ID**
    - 创建完成后，复制知识库 ID（如：`kb-123456`）

---

### 第二步：配置项目

#### 1. 修改 `application-local.yml`

```yaml
doubao:
  knowledge:
    # 启用知识库
    enabled: true
    
    # 填写你的知识库 ID
    knowledgeBaseIds: ["kb-123456", "kb-789012"]
    
    # 检索策略
    retrievalStrategy: 0  # 0-自动，1-仅知识库，2-仅模型，3-知识库 + 模型
    
    # 最大引用条数
    topK: 3
    
    # 相似度阈值
    threshold: 0.5
```

#### 2. 配置说明

| 参数                  | 说明        | 可选值                                           |
|---------------------|-----------|-----------------------------------------------|
| `enabled`           | 是否启用知识库   | `true` / `false`                              |
| `knowledgeBaseIds`  | 知识库 ID 列表 | 如 `["kb-123"]`                                |
| `retrievalStrategy` | 检索策略      | `0`-自动<br>`1`-仅知识库<br>`2`-仅模型<br>`3`-知识库 + 模型 |
| `topK`              | 最大引用条数    | 建议 3-5                                        |
| `threshold`         | 相似度阈值     | 0-1，建议 0.5-0.7                                |

---

### 第三步：使用接口

#### 方式 1：使用配置文件中的知识库

```java
@Resource
private DoubaoService doubaoService;

// 直接使用配置文件中配置的知识库
String reply = doubaoService.chatWithKnowledge(
    "公司的报销流程是什么？",  // 用户问题
    "你是一位专业的 HR 助手",  // 系统提示词（可选）
    null  // 使用配置文件中的知识库
);
```

#### 方式 2：动态指定知识库

```java
// 临时指定特定的知识库
String[] kbIds = {"kb-123456", "kb-789012"};
String reply = doubaoService.chatWithKnowledge(
    "产品 A 的技术参数",
    "你是一位技术专家",
    kbIds  // 动态指定的知识库
);
```

#### 方式 3：通过 HTTP 接口调用

```bash
# 使用配置中的知识库
POST http://localhost:8123/api/doubao/chatWithKnowledge
Content-Type: application/x-www-form-urlencoded

message=公司的报销流程&systemPrompt=你是 HR 助手

# 使用指定的知识库
POST http://localhost:8123/api/doubao/chatWithKnowledge
Content-Type: application/x-www-form-urlencoded

message=产品技术参数&knowledgeBaseIds=kb-123,kb-456
```

---

## 💡 实际应用场景

### 场景 1：企业知识库问答

**配置：**

```yaml
doubao:
  knowledge:
    enabled: true
    knowledgeBaseIds: ["kb-hr-policy", "kb-it-support"]
    retrievalStrategy: 3  # 知识库 + 模型
    topK: 5
```

**使用：**

```java
// 员工询问公司政策
String answer = doubaoService.chatWithKnowledge(
    "年假怎么申请？",
    "你是公司 HR 助手，请根据知识库回答"
);
```

---

### 场景 2：产品技术支持

**配置：**

```yaml
doubao:
  knowledge:
    enabled: true
    knowledgeBaseIds: ["kb-product-manual", "kb-faq"]
    topK: 3
    threshold: 0.6  # 提高相似度要求
```

**使用：**

```java
// 客户咨询产品问题
String answer = doubaoService.chatWithKnowledge(
    "设备无法启动怎么办？",
    "你是技术支持工程师，请提供详细的解决步骤"
);
```

---

### 场景 3：教育培训

**配置：**

```yaml
doubao:
  knowledge:
    enabled: true
    knowledgeBaseIds: ["kb-textbook", "kb-exercises"]
    retrievalStrategy: 0  # 自动选择
```

**使用：**

```java
// 学生提问
String answer = doubaoService.chatWithKnowledge(
    "勾股定理是什么？",
    "你是一位数学老师，用易懂的方式解释"
);
```

---

## 🔍 调试技巧

### 1. 查看日志

启用知识库后，日志中会显示：

```
INFO  启用知识库问答，知识库 IDs: [kb-123456, kb-789012]
INFO  豆包 API 原始响应：{...}
INFO  豆包 AI 回复：根据知识库，公司的报销流程如下...
```

### 2. 测试知识库是否生效

```bash
# 问一个只有知识库才知道的问题
GET http://localhost:8123/api/doubao/test

# 查看返回的答案是否包含知识库内容
```

### 3. 调整参数优化效果

**如果答案不准确：**

- 降低 `threshold`（如 0.4）
- 增加 `topK`（如 5-10）
- 检查知识库文档质量

**如果答案太发散：**

- 提高 `threshold`（如 0.7）
- 降低 `topK`（如 2-3）
- 使用 `retrievalStrategy: 1`（仅使用知识库）

---

## ⚠️ 注意事项

### 1. 知识库限制

- **文档大小**：单个文档不超过 10MB
- **文档数量**：每个知识库最多 1000 个文档
- **字符限制**：每次检索最多使用 8000 tokens

### 2. 费用说明

- 知识库存储：免费
- 知识库检索：按次数计费
- 大模型调用：按 tokens 计费

具体价格参考：https://www.volcengine.com/docs/82379/pricing

### 3. 最佳实践

✅ **推荐做法：**

- 文档保持清晰的结构
- 使用标题和段落组织内容
- 定期更新知识库
- 监控检索效果

❌ **避免：**

- 上传过大的文档（建议 < 1MB）
- 文档内容杂乱无章
- 知识库长期不更新

---

## 🎯 快速开始示例

### 最简单的配置

```yaml
doubao:
  api:
    apiKey: 85618def-11b6-4fcb-8720-d5585c1affb4
    modelId: doubao-pro-4k-240515
  
  knowledge:
    enabled: true
    knowledgeBaseIds: ["kb-your-kb-id"]  # 替换为你的知识库 ID
    topK: 3
```

### 测试代码

```java
@RestController
@RequestMapping("/test")
public class TestController {
    
    @Resource
    private DoubaoService doubaoService;
    
    @GetMapping("/kb")
    public String testKnowledgeBase() {
        return doubaoService.chatWithKnowledge(
            "请用知识库中的知识介绍一下公司产品",
            null,
            null
        );
    }
}
```

---

## 📖 参考资料

- **火山引擎方舟大模型**：https://www.volcengine.com/product/ark
- **知识库文档**：https://www.volcengine.com/docs/82379/1099475
- **RAG 技术介绍**：https://jiqizhixin.com/articles/2023-05-18-01

---

## 🆘 常见问题

### Q1: 知识库已创建但无法使用？

**A:**

1. 确认知识库状态为"已完成"
2. 检查知识库 ID 是否正确
3. 确认 API Key 有访问权限

### Q2: 回答没有引用知识库内容？

**A:**

1. 检查 `enabled` 是否为 `true`
2. 确认 `knowledgeBaseIds` 配置正确
3. 查看日志是否有错误信息

### Q3: 如何知道答案来自哪个知识库？

**A:**
豆包 API 会在响应中返回引用来源，可以通过日志查看完整的响应内容。

### Q4: 多个知识库如何使用？

**A:**
在配置文件中列出所有知识库 ID：

```yaml
knowledgeBaseIds: ["kb-1", "kb-2", "kb-3"]
```

系统会自动从所有知识库中检索相关信息。

---

## 📞 技术支持

如有问题，请联系：

- 官方文档：https://www.volcengine.com/docs/82379
- 技术支持：https://console.volcengine.com/ark/issue
- 客服电话：956688

祝你使用愉快！🎉
