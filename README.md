# Nan Picture 图库系统

Nan Picture 是一个面向图片管理、公共图库浏览和空间协作的全栈图库项目。项目包含 Spring Boot 后端、React Web 前端以及微信小程序端，支持用户登录注册、GitHub 第三方登录、图片上传与审核、公共图库、个人空间、后台管理和图库助手问答。

## 功能特性

- 用户体系：账号注册、登录、退出登录、用户资料维护、GitHub OAuth 登录
- 公共图库：图片搜索、分类与标签筛选、图片详情、点赞、原图查看
- 图片管理：URL/文件上传、批量抓取导入、图片编辑、审核、删除
- 空间管理：个人空间、空间用量统计、空间图片上传、管理员空间管理
- 后台管理：用户管理、图片管理、空间管理
- 图库助手：普通问答、Markdown 知识库问答、指定文件问答
- 对象存储：集成腾讯云 COS，用于图片上传、压缩图和缩略图存储
- 接口文档：集成 Knife4j，便于调试后端接口

## 技术栈

后端：

- Java 8
- Spring Boot 2.7.6
- MyBatis-Plus
- MySQL
- Redis / Spring Session
- Tencent Cloud COS
- Knife4j
- JustAuth
- Hutool

Web 前端：

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- shadcn/ui
- lucide-react

小程序端：

- 微信小程序原生框架
- Vant Weapp

## 项目结构

```text
.
├── fronted/                         # Web 前端项目
├── nan-picture1/                    # 微信小程序端
├── src/main/java/com/zn/...         # 后端 Java 源码
├── src/main/resources/mapper/       # MyBatis XML Mapper
├── src/main/resources/knowledge/    # Markdown 知识库文件
├── sql/                             # 数据库脚本
├── docs/                            # 项目文档
├── examples/                        # 计划与示例材料
└── pom.xml                          # Maven 配置
```

## 环境要求

- JDK 8+
- Maven 3.6+
- MySQL 5.7+ / 8.x
- Redis
- Node.js 20+
- npm

## 后端启动

1. 创建数据库并导入脚本：

```bash
mysql -u root -p < sql/create_table.sql
```

2. 配置环境变量：

```bash
MYSQL_URL=jdbc:mysql://localhost:3306/nan_picture
MYSQL_USERNAME=root
MYSQL_PASSWORD=你的数据库密码
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
DOUBAO_API_KEY=你的豆包APIKey
GITHUB_CLIENT_ID=你的GitHubOAuthClientId
GITHUB_CLIENT_SECRET=你的GitHubOAuthClientSecret
```

如需启用图片上传，还需要在 `application.yml` 或本地配置中补充腾讯云 COS 配置：

```yaml
cos:
  client:
    host: your-cos-host
    secretId: your-secret-id
    secretKey: your-secret-key
    region: your-region
    bucket: your-bucket
```

3. 启动后端：

```bash
mvn spring-boot:run
```

默认服务地址：

```text
http://localhost:8123/api
```

接口文档地址：

```text
http://localhost:8123/api/doc.html
```

## Web 前端启动

```bash
cd fronted
npm install
npm run dev
```

默认访问地址：

```text
http://localhost:5173
```

前端开发代理已指向：

```text
/api -> http://localhost:8123
```

## Web 前端构建

```bash
cd fronted
npm run build
```

## 常用页面

- `/login`：登录
- `/register`：注册
- `/gallery`：公共图库
- `/pictures/:id`：图片详情
- `/spaces/my`：我的空间
- `/spaces/:id`：空间图片
- `/admin/users`：用户管理
- `/admin/pictures`：图片管理
- `/admin/spaces`：空间管理
- `/assistant`：图库助手
- `/profile`：个人资料

## 注意事项

- `application-local.yml`、`.env`、`node_modules`、`target`、`dist`、`out` 等本地配置和生成物不会提交到 Git。
- `application.yml` 中的敏感信息应通过环境变量注入，不建议硬编码真实密钥。
- GitHub OAuth 回调地址默认是 `http://localhost:8123/api/oauth/github/callback`，创建 OAuth App 时需要保持一致。
- Web 前端目录名当前为 `fronted`，启动和构建命令请按该目录名执行。

## License

本项目用于学习与课程实践场景，暂未指定开源许可证。
