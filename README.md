# 人力资源数据分析系统

这是一个基于Flask和现代前端技术构建的人力资源数据分析系统，旨在提供直观、易用的HR数据可视化和管理功能。

## 项目特点

- **清晰的前后端分离架构**：后端使用Flask提供API服务，前端采用原生HTML/CSS/JS实现
- **响应式数据展示**：使用ECharts实现丰富的数据可视化图表
- **灵活的筛选和分析功能**：支持多维度筛选和深度数据钻取
- **明暗主题切换**：支持浅色/深色主题切换，提供舒适的视觉体验
- **交互优化**：卡片缩放功能、数据明细查看、Excel导出等

## 功能模块

- **用户认证**：登录界面，用户角色管理
- **人员数据分析**：员工入职年份、部门结构、人员分布等多维度数据展示
- **数据导出**：支持将表格数据导出为Excel格式
- **部门数据钻取**：从一级部门下钻到二级部门的数据分析
- **响应式布局**：适配不同屏幕尺寸，提供最佳视觉体验

## 技术栈

### 前端
- HTML5 / CSS3 / JavaScript
- ECharts 图表库
- SheetJS (xlsx) Excel导出

### 后端
- Python 3
- Flask 框架
- SQLAlchemy ORM
- SQLite 数据库

## 快速开始

### 项目结构
```
项目根目录
├── backend/              # 后端代码
│   ├── app.py            # 主应用文件
│   ├── config.py         # 配置文件
│   ├── controllers/      # API控制器
│   ├── models/           # 数据模型
│   ├── database/         # 数据库相关
│   └── services/         # 业务逻辑服务
└── frontend/             # 前端代码
    ├── assets/           # 静态资源
    ├── hr-dashboard.html # HR数据大屏
    ├── login.html        # 登录页面
    ├── index.html        # 首页
    └── styles.css        # 全局样式
```

### 安装依赖

```bash
# 进入后端目录
cd backend

# 安装Python依赖
pip install -r requirements.txt
```

### 初始化数据库

```bash
# 在Python交互环境中
python
>>> from database import init_db
>>> init_db()
>>> exit()

# 或使用脚本初始化测试数据
python database/init_data.py
```

### 启动服务

```bash
# 在backend目录中
python app.py
```

访问 http://localhost:3000/ 开始使用应用。

## 项目预览

- 登录界面：支持用户认证，美观的UI设计
- 首页：提供系统各功能入口
- HR数据大屏：多种数据可视化展示，支持数据筛选和深度分析

## 贡献指南

欢迎贡献代码、报告问题或提出新功能建议。

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request 