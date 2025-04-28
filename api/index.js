const express = require('express');
const cors = require('cors');
const app = express();

// 启用CORS
app.use(cors({
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
}));

// JSON解析中间件
app.use(express.json());

// API测试端点
app.get('/api/test', (req, res) => {
  res.json({
    message: "API工作正常!",
    status: "success"
  });
});

// 部门数据端点
app.get('/api/hr/departments/distinct', (req, res) => {
  res.json({
    primary_departments: ["技术部", "市场部", "人力资源", "财务部", "产品部"],
    secondary_departments: ["开发组", "测试组", "设计组", "运营组", "销售组"]
  });
});

// 入职年份数据端点
app.get('/api/hr/statistics/entry-year', (req, res) => {
  res.json({
    years: ["2018", "2019", "2020", "2021", "2022", "2023"],
    counts: [12, 18, 24, 30, 22, 15]
  });
});

// 人数统计端点
app.get('/api/hr/statistics/headcount', (req, res) => {
  res.json({
    total: 120,
    departments: {
      "技术部": 45,
      "市场部": 30,
      "人力资源": 15,
      "财务部": 10,
      "产品部": 20
    }
  });
});

// 绩效分布端点
app.get('/api/hr/statistics/performance', (req, res) => {
  res.json({
    performance: {
      "优秀": 25,
      "良好": 45,
      "一般": 30,
      "需改进": 15,
      "不合格": 5
    }
  });
});

// 薪资分析端点
app.get('/api/hr/statistics/salary', (req, res) => {
  res.json({
    avgSalary: 12000,
    departments: {
      "技术部": 15000,
      "市场部": 12000,
      "人力资源": 10000,
      "财务部": 11000,
      "产品部": 14000
    },
    distribution: {
      "8000以下": 15,
      "8000-12000": 35,
      "12000-15000": 30,
      "15000-20000": 15,
      "20000以上": 5
    }
  });
});

// 员工流动率端点
app.get('/api/hr/statistics/turnover', (req, res) => {
  res.json({
    overall: 0.15,
    departments: {
      "技术部": 0.12,
      "市场部": 0.18,
      "人力资源": 0.10,
      "财务部": 0.08,
      "产品部": 0.15
    },
    monthly: {
      months: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
      values: [0.02, 0.03, 0.01, 0.02, 0.015, 0.01, 0.02, 0.01, 0.025, 0.015, 0.01, 0.02]
    }
  });
});

// 员工列表端点
app.get('/api/hr/employees', (req, res) => {
  // 模拟分页数据
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  const mockEmployees = [];
  for (let i = 1; i <= limit; i++) {
    const id = (page - 1) * limit + i;
    mockEmployees.push({
      id: id,
      name: `员工${id}`,
      primary_department: i % 5 === 0 ? "技术部" : i % 4 === 0 ? "市场部" : i % 3 === 0 ? "人力资源" : i % 2 === 0 ? "财务部" : "产品部",
      secondary_department: i % 5 === 0 ? "开发组" : i % 4 === 0 ? "测试组" : i % 3 === 0 ? "设计组" : i % 2 === 0 ? "运营组" : "销售组",
      position: i % 4 === 0 ? "主管" : i % 3 === 0 ? "经理" : "专员",
      entry_date: `202${Math.floor(i % 3)}-${Math.floor(i % 12) + 1}-${Math.floor(i % 28) + 1}`,
      salary: 8000 + Math.floor(i / 2) * 1000,
      performance: i % 5 === 0 ? "优秀" : i % 4 === 0 ? "良好" : i % 3 === 0 ? "一般" : i % 2 === 0 ? "需改进" : "优秀",
      status: i % 10 === 0 ? "离职" : "在职"
    });
  }
  
  res.json({
    employees: mockEmployees,
    total: 120,
    page: page,
    limit: limit,
    pages: Math.ceil(120 / limit)
  });
});

// 如果在本地开发环境下运行
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`API服务运行在端口 ${PORT}`);
  });
}

// 导出为Vercel函数
module.exports = app; 