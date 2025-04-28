# Vercel部署指南

## 已完成的配置

1. **数据库迁移**
   - 后端配置已从MySQL迁移到Neon PostgreSQL
   - 添加了必要的适配代码和依赖项

2. **Vercel配置文件**
   - 根目录`vercel.json`: 配置了前后端部署方式
   - `backend/vercel_app.py`: 作为Vercel入口点，初始化应用和数据库

## 部署步骤

1. **登录Vercel**
   - 前往 https://vercel.com/
   - 使用GitHub账号登录

2. **导入项目**
   - 点击"Add New..." → "Project"
   - 从GitHub选择您的仓库

3. **配置项目**
   - 项目名称：默认或自定义
   - 构建设置：系统已自动检测根目录的`vercel.json`
   - 环境变量：已在`vercel.json`中配置，无需额外添加

4. **点击"Deploy"**
   - 等待部署完成
   - 成功后，Vercel会提供一个可访问的URL

## 部署后测试

1. **验证前端访问**
   - 访问部署后的URL (如 https://your-project.vercel.app)
   - 前端应正常加载HR大屏

2. **验证API连接**
   - 测试API端点 (如 https://your-project.vercel.app/api/test)
   - 查看Vercel日志，确认数据库初始化成功

## 常见问题排查

1. **数据库连接问题**
   - 检查Vercel日志，查找数据库错误
   - 确认Neon数据库连接字符串是否正确

2. **数据初始化失败**
   - 在Vercel项目设置中查看Build和Runtime日志
   - 检查`vercel_app.py`中的数据初始化逻辑

3. **前端无法加载API数据**
   - 检查浏览器Console中是否有CORS错误
   - 确认API URL是否正确（无需修改，已配置好路由）

## 升级建议

1. **自定义域名**
   - 在Vercel项目设置的"Domains"部分添加自定义域名

2. **数据库管理**
   - 访问Neon控制台进行数据库管理和监控
   - URL: https://console.neon.tech/

如有任何问题，请查看Vercel和Neon的官方文档。 