# Neon PostgreSQL 数据库迁移指南

## 已完成的工作

1. **数据库配置调整**
   - 修改了`config.py`，添加了Neon PostgreSQL连接字符串
   - 添加了PostgreSQL驱动到`requirements.txt`
   - 解决了URL前缀兼容性问题(`postgres://` → `postgresql://`)

2. **数据初始化工具**
   - `init_postgres.py`：用于本地PostgreSQL初始化
   - `vercel_app.py`：Vercel部署时的数据库初始化

3. **自动表结构创建**
   - 应用启动时自动检测和创建表结构
   - 支持初次部署时自动生成测试数据

## 本地测试

1. **安装PostgreSQL驱动**
   ```bash
   pip install psycopg2-binary
   ```

2. **初始化数据库**
   ```bash
   # 进入backend目录
   cd backend
   
   # 运行PostgreSQL初始化脚本
   python init_postgres.py
   ```

3. **启动应用**
   ```bash
   python app.py
   ```

## 数据库结构

成功创建的表结构：
- `departments`：部门信息
- `employees`：员工信息

初始化数据包括：
- 5个一级部门
- 21个二级部门
- 约220名随机生成的员工数据

## Neon数据库管理

1. **登录Neon控制台**
   - https://console.neon.tech/

2. **查看项目详情**
   - 数据库名称：neondb
   - 主机：ep-billowing-morning-a1zikan5-pooler.ap-southeast-1.aws.neon.tech
   - 用户：neondb_owner

3. **查询数据**
   - 使用Neon控制台中的SQL编辑器
   - 基本查询：`SELECT * FROM departments;`

## 常见问题

1. **连接问题**
   - 确保网络允许访问Neon服务器
   - 验证连接字符串格式正确

2. **数据初始化错误**
   - 检查日志中的详细错误信息
   - 常见原因包括网络问题和SQL语法差异

3. **PostgreSQL和MySQL区别**
   - PostgreSQL对标识符大小写敏感
   - 某些数据类型和函数有差异

已验证：数据库表结构和测试数据已成功创建在Neon PostgreSQL中。 