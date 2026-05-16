# Markdown 知识库使用指南

## 🎯 功能说明

本功能可以**自动读取项目中的 Markdown 文件**，并基于文件内容提供智能问答服务。无需手动复制文本，也无需创建外部知识库！

---

## 📁 文件存放位置

将你的 Markdown 文件放在以下目录：

```
src/main/resources/knowledge/
```

系统会自动扫描该目录下的所有 `.md` 和 `.txt` 文件。

---

## 🚀 快速开始

### 步骤 1：放置 MD 文件

将你的 Markdown 文件复制到 `src/main/resources/knowledge/` 目录。

例如：
- `company.md` - 公司介绍
- `product.md` - 产品手册
- `faq.md` - 常见问题
- `policy.md` - 规章制度

### 步骤 2：启动项目

正常启动 Spring Boot 项目即可。

### 步骤 3：查看可用文件列表

访问接口查看系统中有哪些可用的文件：

```bash
GET http://localhost:8123/api/doubao/markdown/list
```

返回示例：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "files": ["company.md", "product.md"],
    "count": 2
  }
}
```

### 步骤 4：开始问答

#### 方式 1：单个文件问答

```bash
POST http://localhost:8123/api/doubao/markdown/chat
Content-Type: application/x-www-form-urlencoded

question=你的问题&filename=company.md
```

**示例：**
```bash
curl -X POST "http://localhost:8123/api/doubao/markdown/chat" \
  -d "question=公司的主要产品有哪些？" \
  -d "filename=company.md"
```

#### 方式 2：多个文件问答

```bash
POST http://localhost:8123/api/doubao/markdown/chatMulti
Content-Type: application/x-www-form-urlencoded

question=你的问题&filenames=company.md&filenames=product.md
```

**示例：**
```bash
curl -X POST "http://localhost:8123/api/doubao/markdown/chatMulti" \
  -d "question=我们有哪些成功案例？" \
  -d "filenames=company.md"
```

---

## 💡 使用场景

### 场景 1：公司产品介绍

**文件：** `company.md`

**提问示例：**
```bash
# 问产品
curl -X POST "http://localhost:8123/api/doubao/markdown/chat" \
  -d "question=智能客服系统的价格是多少？" \
  -d "filename=company.md"

# 问案例
curl -X POST "http://localhost:8123/api/doubao/markdown/chat" \
  -d "question=有哪些成功案例？" \
  -d "filename=company.md"

# 问联系方式
curl -X POST "http://localhost:8123/api/doubao/markdown/chat" \
  -d "question=销售热线是多少？" \
  -d "filename=company.md"
```

---

### 场景 2：员工手册

**文件：** `employee-handbook.md`

**内容示例：**
```markdown
# 员工手册

## 考勤制度
- 上班时间：9:00-18:00
- 打卡要求：每天两次打卡
- 迟到处理：月累计 3 次扣 100 元

## 休假制度
- 年假：入职满一年 5 天
- 病假：需提供医院证明
- 事假：需提前申请
```

**提问示例：**
```bash
curl -X POST "http://localhost:8123/api/doubao/markdown/chat" \
  -d "question=年假怎么计算？" \
  -d "filename=employee-handbook.md"

curl -X POST "http://localhost:8123/api/doubao/markdown/chat" \
  -d "question=迟到了会怎么处理？" \
  -d "filename=employee-handbook.md"
```

---

### 场景 3：产品技术文档

**文件：** `api-doc.md`

**提问示例：**
```bash
curl -X POST "http://localhost:8123/api/doubao/markdown/chat" \
  -d "question=登录接口的参数有哪些？" \
  -d "filename=api-doc.md"

curl -X POST "http://localhost:8123/api/doubao/markdown/chat" \
  -d "question=如何获取 access_token？" \
  -d "filename=api-doc.md"
```

---

## 🔧 API 接口详解

### 1. 列出所有可用文件

**接口：** `GET /api/doubao/markdown/list`

**说明：** 获取 knowledge 目录下所有的 MD 文件

**返回：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "files": ["company.md", "product.md"],
    "count": 2
  }
}
```

---

### 2. 基于单个文件问答

**接口：** `POST /api/doubao/markdown/chat`

**参数：**
| 参数 | 必填 | 说明 | 示例 |
|------|------|------|------|
| `question` | ✅ 是 | 用户的问题 | `公司的产品有哪些？` |
| `filename` | ✅ 是 | MD 文件名 | `company.md` |
| `systemPrompt` | ❌ 否 | 系统提示词 | `你是一位产品专家` |

**返回：**
```json
{
  "code": 0,
  "data": "根据文件内容，公司的产品包括...",
  "message": "success",
  "info": {
    "filename": "company.md",
    "contentLength": 1234
  }
}
```

---

### 3. 基于多个文件问答

**接口：** `POST /api/doubao/markdown/chatMulti`

**参数：**
| 参数 | 必填 | 说明 | 示例 |
|------|------|------|------|
| `question` | ✅ 是 | 用户的问题 | `产品的价格和案例` |
| `filenames` | ✅ 是 | 文件名列表（可多个） | `company.md,product.md` |
| `systemPrompt` | ❌ 否 | 系统提示词 | `你是资深顾问` |

**说明：** `filenames` 参数可以传递多次来指定多个文件

**返回：**
```json
{
  "code": 0,
  "data": "综合多个文件的信息...",
  "message": "success",
  "info": {
    "fileCount": 2,
    "filenames": ["company.md", "product.md"],
    "totalLength": 5678
  }
}
```

---

### 4. 读取文件原始内容

**接口：** `GET /api/doubao/markdown/read`

**参数：**
| 参数 | 必填 | 说明 |
|------|------|------|
| `filename` | ✅ 是 | MD 文件名 |

**说明：** 直接读取文件的原始内容，不调用 AI

**返回：**
```json
{
  "code": 0,
  "data": {
    "filename": "company.md",
    "content": "# 公司介绍\n\n...",
    "length": 1234
  },
  "message": "success"
}
```

---

### 5. 清除缓存

**接口：** `POST /api/doubao/markdown/clearCache`

**说明：** 系统会缓存读取的文件内容，使用此接口可以清除缓存

**返回：**
```json
{
  "code": 0,
  "message": "缓存已清除"
}
```

---

## ⚙️ 配置说明

在 `application-local.yml` 中可以添加配置：

```yaml
markdown:
  knowledge:
    # 是否启用
    enabled: true
    
    # 文件存储目录（相对于 resources）
    directory: knowledge
    
    # 支持的文件扩展名
    extensions: [".md", ".txt"]
    
    # 最大文件大小（字节），默认 10MB
    maxFileSize: 10485760
    
    # 是否启用缓存
    cacheEnabled: true
    
    # 缓存过期时间（秒），默认 5 分钟
    cacheExpireSeconds: 300
```

---

## 📊 特性说明

### ✅ 自动扫描

系统启动时会自动扫描 `knowledge` 目录下的所有 MD 文件，并在日志中显示。

### ✅ 文件缓存

为了提高性能，系统会缓存读取的文件内容：
- 默认缓存 5 分钟
- 缓存期间重复读取不会重新加载文件
- 可以通过 `/clearCache` 接口手动清除

### ✅ 安全检查

系统会对文件进行严格验证：
- ✅ 文件必须存在
- ✅ 必须是文件（不能是目录）
- ✅ 文件大小不能超过限制
- ✅ 防止路径遍历攻击

### ✅ 多文件支持

支持同时读取多个文件进行问答：
- 自动合并多个文件的内容
- 保持文件结构清晰
- 适合跨文档查询

---

## 🎯 最佳实践

### 1. 文件组织建议

**按主题分类：**
```
knowledge/
├── company/          # 公司信息
│   ├── introduction.md
│   ├── products.md
│   └── cases.md
├── hr/              # 人力资源
│   ├── policy.md
│   └── benefits.md
└── technical/       # 技术文档
    ├── api.md
    └── guide.md
```

**扁平化管理：**
```
knowledge/
├── company-intro.md
├── product-catalog.md
├── faq.md
└── employee-handbook.md
```

### 2. 文件命名规范

✅ **推荐：**
- 使用小写字母
- 单词间用 `-` 连接
- 有意义的名称

```
company.md          ✅
product-manual.md   ✅
faq-2024.md         ✅
```

❌ **避免：**
- 中文文件名
- 空格
- 特殊字符

```
公司.md             ❌
product manual.md   ❌
file@#$%.md         ❌
```

### 3. 文件内容优化

**结构化内容：**
```markdown
# 主标题

## 章节标题

### 小节标题

- 列表项 1
- 列表项 2
- 列表项 3

**重点内容** 加粗强调
```

**清晰的层次：**
```markdown
# 产品 A

## 功能特点
- 特点 1
- 特点 2

## 价格
- 基础版：999 元
- 专业版：2999 元

## 案例
- 客户 A 使用情况
- 客户 B 使用情况
```

### 4. 提问技巧

**具体问题：**
```
✅ 智能客服系统的价格是多少？
❌ 介绍一下产品
```

**单一主题：**
```
✅ 年假怎么计算？
❌ 年假、病假、考勤都说说
```

**明确范围：**
```
✅ 根据 company.md，产品有哪些？
❌ 产品有哪些？（不指定文件）
```

---

## 🔍 调试技巧

### 1. 查看日志

系统会在日志中记录：
```
INFO  Markdown 知识库初始化成功，路径：/path/to/knowledge
INFO  发现知识库文件：company.md
INFO  发现知识库文件：product.md
INFO  成功读取文件：company.md，大小：1234 bytes
```

### 2. 检查文件是否被识别

```bash
# 先调用 list 接口
GET http://localhost:8123/api/doubao/markdown/list

# 如果看不到你的文件，检查：
# 1. 文件是否在正确的目录
# 2. 文件扩展名是否是 .md 或 .txt
# 3. 重启项目
```

### 3. 测试文件读取

```bash
# 先单独测试文件读取
GET http://localhost:8123/api/doubao/markdown/read?filename=company.md

# 如果成功返回内容，再进行问答测试
```

---

## ⚠️ 注意事项

### 1. 文件大小限制

- **推荐大小：** < 1MB
- **最大限制：** 10MB（可配置）
- **过大处理：** 分割成多个文件

### 2. 文件编码

- 必须使用 **UTF-8** 编码
- 避免使用其他编码（可能导致乱码）

### 3. 内容格式

- 支持标准 Markdown 语法
- 也支持纯文本（.txt）
- HTML 标签会被自动过滤

### 4. 缓存策略

- 开发环境：建议关闭缓存或设置较短时间
- 生产环境：建议启用缓存，提高性能

---

## 🐛 常见问题

### Q1: 为什么找不到我的文件？

**A:** 检查以下几点：
1. 文件是否在 `src/main/resources/knowledge/` 目录
2. 文件扩展名是否是 `.md` 或 `.txt`
3. 重启项目让系统重新扫描
4. 查看启动日志确认文件被识别

### Q2: 文件更新后为什么回答还是旧的？

**A:** 因为系统有缓存机制：
1. 等待缓存过期（默认 5 分钟）
2. 或调用 `/clearCache` 接口手动清除
3. 或重启应用

### Q3: 可以读取子目录的文件吗？

**A:** 当前版本只扫描根目录，如需支持子目录：
1. 将所有文件平铺到根目录
2. 或在配置文件中修改目录结构

### Q4: 支持哪些 Markdown 语法？

**A:** 支持所有标准 Markdown 语法：
- 标题、段落、列表
- 表格、代码块、引用
- 粗体、斜体、链接
- AI 会自动理解并提取信息

---

## 📝 示例集合

### 完整调用示例

```bash
# 1. 查看可用文件
curl http://localhost:8123/api/doubao/markdown/list

# 2. 基于文件问答
curl -X POST "http://localhost:8123/api/doubao/markdown/chat" \
  -d "question=公司的主要产品有哪些？" \
  -d "filename=company.md"

# 3. 多文件问答
curl -X POST "http://localhost:8123/api/doubao/markdown/chatMulti" \
  -d "question=详细介绍产品和案例" \
  -d "filenames=company.md" \
  -d "filenames=product.md"

# 4. 查看文件内容
curl "http://localhost:8123/api/doubao/markdown/read?filename=company.md"

# 5. 清除缓存
curl -X POST "http://localhost:8123/api/doubao/markdown/clearCache"
```

---

## 🎉 总结

通过本功能，你可以：

✅ **零门槛使用** - 只需放置 MD 文件  
✅ **自动读取** - 无需手动复制内容  
✅ **即时生效** - 文件更新后立即使用  
✅ **灵活管理** - 支持单文件和批量  
✅ **高性能** - 内置缓存机制  

**开始使用吧！** 把你的知识整理成 MD 文件，剩下的交给我们！😊
