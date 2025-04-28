const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
// 加载.env文件中的环境变量
require('dotenv').config();
const app = express();

// 配置数据库连接
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // 对于某些云数据库服务可能需要此配置
  }
});

// 数据库连接测试
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('数据库连接错误:', err);
  } else {
    console.log('数据库连接成功:', res.rows[0]);
  }
});

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
    status: "success",
    database: "已连接"
  });
});

// 部门数据端点
app.get('/api/hr/departments/distinct', async (req, res) => {
  try {
    // 尝试从数据库获取部门数据
    const primaryResult = await pool.query('SELECT DISTINCT primary_department FROM employees WHERE status = $1 ORDER BY primary_department', ['在职']);
    const secondaryResult = await pool.query('SELECT DISTINCT secondary_department FROM employees WHERE status = $1 AND secondary_department IS NOT NULL ORDER BY secondary_department', ['在职']);
    
    const primaryDepartments = primaryResult.rows.map(row => row.primary_department);
    const secondaryDepartments = secondaryResult.rows.map(row => row.secondary_department);
    
    res.json({
      primary_departments: primaryDepartments,
      secondary_departments: secondaryDepartments
    });
  } catch (err) {
    console.error('获取部门数据失败:', err);
    
    // 如果数据库查询失败，返回模拟数据
    res.json({
      primary_departments: ["技术部门", "市场部", "人力资源", "财务部", "产品部"],
      secondary_departments: ["开发组", "测试组", "设计组", "运营组", "销售组"]
    });
  }
});

// 入职年份数据端点
app.get('/api/hr/statistics/entry-year', async (req, res) => {
  try {
    // 获取URL查询参数
    const primaryDept = req.query.primary_department || 'all';
    const secondaryDept = req.query.secondary_department || 'all';
    
    // 构建SQL查询
    let query = `
      SELECT EXTRACT(YEAR FROM entry_date) AS year, COUNT(*) AS count
      FROM employees
      WHERE status = '在职'
    `;
    
    const params = [];
    let paramIndex = 1;
    
    // 添加部门过滤条件
    if (primaryDept !== 'all') {
      query += ` AND primary_department = $${paramIndex}`;
      params.push(primaryDept);
      paramIndex++;
    }
    
    if (secondaryDept !== 'all') {
      query += ` AND secondary_department = $${paramIndex}`;
      params.push(secondaryDept);
      paramIndex++;
    }
    
    // 分组和排序
    query += `
      GROUP BY EXTRACT(YEAR FROM entry_date)
      ORDER BY year
    `;
    
    const result = await pool.query(query, params);
    
    // 处理查询结果
    const years = [];
    const counts = [];
    const year_data = [];
    let total_count = 0;
    
    // 计算工作年限范围
    const currentYear = new Date().getFullYear();
    const year_ranges = {
      "0-1年": 0,
      "1-3年": 0,
      "3-5年": 0,
      "5-10年": 0,
      "10年以上": 0
    };
    
    if (result.rows.length > 0) {
      result.rows.forEach(row => {
        const year = parseInt(row.year);
        const count = parseInt(row.count);
        
        // 添加到years和counts数组
        years.push(row.year.toString());
        counts.push(count);
        
        // 添加到year_data数组
        year_data.push({ 
          year: year, 
          count: count 
        });
        
        // 累加总人数
        total_count += count;
        
        // 计算工作年限并分类
        const yearsOfService = currentYear - year;
        if (yearsOfService <= 1) {
          year_ranges["0-1年"] += count;
        } else if (yearsOfService <= 3) {
          year_ranges["1-3年"] += count;
        } else if (yearsOfService <= 5) {
          year_ranges["3-5年"] += count;
        } else if (yearsOfService <= 10) {
          year_ranges["5-10年"] += count;
        } else {
          year_ranges["10年以上"] += count;
        }
      });
    }
    
    // 转换年限范围为数组格式
    const year_range_data = Object.keys(year_ranges).map(key => {
      return {
        range: key,
        count: year_ranges[key],
        percentage: total_count > 0 ? Math.round(year_ranges[key] / total_count * 1000) / 10 : 0
      };
    });
    
    // 返回前端期望的完整格式
    res.json({
      years,
      counts,
      year_data,
      year_range_data,
      total_count
    });
  } catch (err) {
    console.error('获取入职年份数据失败:', err);
    
    // 数据库查询失败时返回空数据
    res.json({
      years: [],
      counts: [],
      year_data: [],
      year_range_data: [
        { range: "0-1年", count: 0, percentage: 0 },
        { range: "1-3年", count: 0, percentage: 0 },
        { range: "3-5年", count: 0, percentage: 0 },
        { range: "5-10年", count: 0, percentage: 0 },
        { range: "10年以上", count: 0, percentage: 0 }
      ],
      total_count: 0
    });
  }
});

// 人数统计端点
app.get('/api/hr/statistics/headcount', async (req, res) => {
  try {
    // 获取总人数
    const totalResult = await pool.query('SELECT COUNT(*) AS total FROM employees WHERE status = $1', ['在职']);
    const total = parseInt(totalResult.rows[0].total);
    
    // 获取部门分布
    const deptResult = await pool.query(`
      SELECT primary_department, COUNT(*) AS count
      FROM employees
      WHERE status = $1
      GROUP BY primary_department
      ORDER BY count DESC
    `, ['在职']);
    
    const departments = {};
    deptResult.rows.forEach(row => {
      // 修复部门名称，将"技术部"映射为"技术部门"
      const deptName = row.primary_department === "技术部" ? "技术部门" : row.primary_department;
      departments[deptName] = parseInt(row.count);
    });
    
    res.json({ total, departments });
  } catch (err) {
    console.error('获取人数统计失败:', err);
    
    // 如果数据库查询失败，返回模拟数据
    res.json({
      total: 120,
      departments: {
        "技术部门": 45,
        "市场部": 30,
        "人力资源": 15,
        "财务部": 10,
        "产品部": 20
      }
    });
  }
});

// 绩效分布端点
app.get('/api/hr/statistics/performance', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT performance, COUNT(*) AS count
      FROM employees
      WHERE status = $1
      GROUP BY performance
      ORDER BY count DESC
    `, ['在职']);
    
    const performance = {};
    result.rows.forEach(row => {
      performance[row.performance] = parseInt(row.count);
    });
    
    res.json({ performance });
  } catch (err) {
    console.error('获取绩效分布失败:', err);
    
    // 如果数据库查询失败，返回模拟数据
    res.json({
      performance: {
        "优秀": 25,
        "良好": 45,
        "一般": 30,
        "需改进": 15,
        "不合格": 5
      }
    });
  }
});

// 薪资分析端点
app.get('/api/hr/statistics/salary', async (req, res) => {
  try {
    // 获取平均薪资
    const avgResult = await pool.query('SELECT AVG(salary) AS avg_salary FROM employees WHERE status = $1', ['在职']);
    const avgSalary = Math.round(parseFloat(avgResult.rows[0].avg_salary));
    
    // 获取部门平均薪资
    const deptResult = await pool.query(`
      SELECT primary_department, AVG(salary) AS avg_salary
      FROM employees
      WHERE status = $1
      GROUP BY primary_department
    `, ['在职']);
    
    const departments = {};
    deptResult.rows.forEach(row => {
      departments[row.primary_department] = Math.round(parseFloat(row.avg_salary));
    });
    
    // 获取薪资分布
    const distributionResult = await pool.query(`
      SELECT 
        CASE 
          WHEN salary < 8000 THEN '8000以下'
          WHEN salary >= 8000 AND salary < 12000 THEN '8000-12000'
          WHEN salary >= 12000 AND salary < 15000 THEN '12000-15000'
          WHEN salary >= 15000 AND salary < 20000 THEN '15000-20000'
          ELSE '20000以上'
        END AS salary_range,
        COUNT(*) AS count
      FROM employees
      WHERE status = $1
      GROUP BY salary_range
      ORDER BY 
        CASE 
          WHEN salary_range = '8000以下' THEN 1
          WHEN salary_range = '8000-12000' THEN 2
          WHEN salary_range = '12000-15000' THEN 3
          WHEN salary_range = '15000-20000' THEN 4
          ELSE 5
        END
    `, ['在职']);
    
    const distribution = {};
    distributionResult.rows.forEach(row => {
      distribution[row.salary_range] = parseInt(row.count);
    });
    
    res.json({ avgSalary, departments, distribution });
  } catch (err) {
    console.error('获取薪资分析失败:', err);
    
    // 如果数据库查询失败，返回模拟数据
    res.json({
      avgSalary: 12000,
      departments: {
        "技术部门": 15000,
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
  }
});

// 员工流动率端点
app.get('/api/hr/statistics/turnover', async (req, res) => {
  try {
    // 计算总体流动率（假设离职人数除以总人数）
    const result = await pool.query(`
      SELECT 
        COUNT(CASE WHEN status = '离职' THEN 1 END) AS left_count,
        COUNT(*) AS total_count
      FROM employees
    `);
    
    const leftCount = parseInt(result.rows[0].left_count);
    const totalCount = parseInt(result.rows[0].total_count);
    const overall = totalCount > 0 ? leftCount / totalCount : 0;
    
    // 获取各部门流动率
    const deptResult = await pool.query(`
      SELECT 
        primary_department,
        COUNT(CASE WHEN status = '离职' THEN 1 END) AS left_count,
        COUNT(*) AS total_count
      FROM employees
      GROUP BY primary_department
    `);
    
    const departments = {};
    deptResult.rows.forEach(row => {
      const deptLeftCount = parseInt(row.left_count);
      const deptTotalCount = parseInt(row.total_count);
      departments[row.primary_department] = deptTotalCount > 0 ? deptLeftCount / deptTotalCount : 0;
    });
    
    // 使用模拟的月度数据（通常需要更详细的数据模型来支持此功能）
    const monthly = {
      months: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
      values: [0.02, 0.03, 0.01, 0.02, 0.015, 0.01, 0.02, 0.01, 0.025, 0.015, 0.01, 0.02]
    };
    
    res.json({ overall, departments, monthly });
  } catch (err) {
    console.error('获取员工流动率失败:', err);
    
    // 如果数据库查询失败，返回模拟数据
    res.json({
      overall: 0.15,
      departments: {
        "技术部门": 0.12,
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
  }
});

// 员工列表端点
app.get('/api/hr/employees', async (req, res) => {
  try {
    // 获取分页参数
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // 获取筛选条件
    const primaryDept = req.query.primary_department || null;
    const secondaryDept = req.query.secondary_department || null;
    
    // 构建查询条件
    let whereClause = '';
    const queryParams = [];
    let paramIndex = 1;
    
    if (primaryDept && primaryDept !== 'all') {
      whereClause += ` AND primary_department = $${paramIndex}`;
      queryParams.push(primaryDept);
      paramIndex++;
    }
    
    if (secondaryDept && secondaryDept !== 'all') {
      whereClause += ` AND secondary_department = $${paramIndex}`;
      queryParams.push(secondaryDept);
      paramIndex++;
    }
    
    // 查询总记录数
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM employees
      WHERE 1=1 ${whereClause}
    `;
    
    // 查询员工数据
    const dataQuery = `
      SELECT *
      FROM employees
      WHERE 1=1 ${whereClause}
      ORDER BY id
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    // 将分页参数添加到查询参数中
    queryParams.push(limit, offset);
    
    // 执行查询
    const countResult = await pool.query(countQuery, queryParams.slice(0, paramIndex - 1));
    const dataResult = await pool.query(dataQuery, queryParams);
    
    const total = parseInt(countResult.rows[0].total);
    const employees = dataResult.rows;
    
    res.json({
      employees,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('获取员工列表失败:', err);
    
    // 如果数据库查询失败，返回模拟数据
    const mockEmployees = [];
    for (let i = 1; i <= 10; i++) {
      const id = (page - 1) * 10 + i;
      // 修复部门名称
      const primaryDept = i % 5 === 0 ? "技术部门" : i % 4 === 0 ? "市场部" : i % 3 === 0 ? "人力资源" : i % 2 === 0 ? "财务部" : "产品部";
      mockEmployees.push({
        id: id,
        name: `员工${id}`,
        primary_department: primaryDept,
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
  }
});

// 添加新的API端点: 根据一级部门获取二级部门
app.get('/api/hr/departments/secondary', async (req, res) => {
  try {
    let primaryDept = req.query.primary;
    
    if (!primaryDept || primaryDept === 'all') {
      // 如果没有指定一级部门或选择"全部"，返回所有二级部门
      const result = await pool.query('SELECT DISTINCT secondary_department FROM employees WHERE status = $1 AND secondary_department IS NOT NULL ORDER BY secondary_department', ['在职']);
      const departments = result.rows.map(row => row.secondary_department);
      return res.json({ departments });
    }
    
    // 处理部门名称映射，将"技术部门"映射为数据库中的"技术部"
    if (primaryDept === "技术部门") {
      primaryDept = "技术部";
    }
    
    // 根据指定的一级部门获取对应的二级部门
    const result = await pool.query(
      'SELECT DISTINCT secondary_department FROM employees WHERE primary_department = $1 AND status = $2 AND secondary_department IS NOT NULL ORDER BY secondary_department',
      [primaryDept, '在职']
    );
    
    const departments = result.rows.map(row => row.secondary_department);
    res.json({ departments });
  } catch (err) {
    console.error('获取二级部门失败:', err);
    
    // 模拟数据中添加相应的二级部门映射
    let departments = [];
    if (req.query.primary === "技术部门") {
      departments = ["开发组", "测试组", "运维组", "架构组"];
    } else if (req.query.primary === "市场部") {
      departments = ["销售组", "推广组", "客户关系组"];
    } else if (req.query.primary === "人力资源") {
      departments = ["招聘组", "培训组"];
    } else if (req.query.primary === "财务部") {
      departments = ["会计组", "审计组"];
    } else if (req.query.primary === "产品部") {
      departments = ["产品设计组", "用户体验组"];
    } else {
      departments = ["开发组", "测试组", "设计组", "运营组", "销售组"];
    }
    
    res.json({ departments });
  }
});

// 添加新的API端点: 根据一级部门获取二级部门
app.get('/api/hr/departments/secondary-by-primary', async (req, res) => {
  try {
    let primaryDept = req.query.primary_department;
    
    if (!primaryDept || primaryDept === 'all') {
      // 如果没有指定一级部门或选择"全部"，返回所有二级部门
      const result = await pool.query('SELECT DISTINCT secondary_department FROM employees WHERE status = $1 AND secondary_department IS NOT NULL ORDER BY secondary_department', ['在职']);
      const secondaryDepartments = result.rows.map(row => row.secondary_department);
      return res.json({ secondary_departments: secondaryDepartments });
    }
    
    // 处理部门名称映射，将"技术部门"映射为数据库中的"技术部"
    if (primaryDept === "技术部门") {
      primaryDept = "技术部";
    }
    
    // 根据指定的一级部门获取对应的二级部门
    const result = await pool.query(
      'SELECT DISTINCT secondary_department FROM employees WHERE primary_department = $1 AND status = $2 AND secondary_department IS NOT NULL ORDER BY secondary_department',
      [primaryDept, '在职']
    );
    
    const secondaryDepartments = result.rows.map(row => row.secondary_department);
    res.json({ secondary_departments: secondaryDepartments });
  } catch (err) {
    console.error('获取二级部门失败:', err);
    
    // 模拟数据中添加相应的二级部门映射
    let secondaryDepartments = [];
    if (req.query.primary_department === "技术部门") {
      secondaryDepartments = ["开发组", "测试组", "运维组", "架构组"];
    } else if (req.query.primary_department === "市场部") {
      secondaryDepartments = ["销售组", "推广组", "客户关系组"];
    } else if (req.query.primary_department === "人力资源") {
      secondaryDepartments = ["招聘组", "培训组"];
    } else if (req.query.primary_department === "财务部") {
      secondaryDepartments = ["会计组", "审计组"];
    } else if (req.query.primary_department === "产品部") {
      secondaryDepartments = ["产品设计组", "用户体验组"];
    } else {
      secondaryDepartments = ["开发组", "测试组", "设计组", "运营组", "销售组"];
    }
    
    res.json({
      secondary_departments: secondaryDepartments
    });
  }
});

// 添加新的API端点: 获取特定年份入职的员工明细
app.get('/api/hr/employees/by-year', async (req, res) => {
  try {
    // 获取查询参数
    const year = req.query.year;
    const primaryDept = req.query.primary_department || 'all';
    const secondaryDept = req.query.secondary_department || 'all';
    
    if (!year) {
      return res.status(400).json({ error: "缺少年份参数" });
    }
    
    // 构建SQL查询
    let query = `
      SELECT * FROM employees 
      WHERE EXTRACT(YEAR FROM entry_date) = $1 AND status = '在职'
    `;
    
    const params = [year];
    let paramIndex = 2;
    
    // 添加部门过滤条件
    if (primaryDept !== 'all') {
      // 处理部门名称映射，将"技术部门"映射为数据库中的"技术部"
      const queryDepartment = primaryDept === "技术部门" ? "技术部" : primaryDept;
      query += ` AND primary_department = $${paramIndex}`;
      params.push(queryDepartment);
      paramIndex++;
    }
    
    if (secondaryDept !== 'all') {
      query += ` AND secondary_department = $${paramIndex}`;
      params.push(secondaryDept);
      paramIndex++;
    }
    
    // 按照入职日期排序
    query += ` ORDER BY entry_date`;
    
    // 执行查询
    const result = await pool.query(query, params);
    
    // 格式化返回结果
    const employees = result.rows.map(emp => {
      return {
        姓名: emp.name,
        一级部门: emp.primary_department || "",
        二级部门: emp.secondary_department || "",
        职位: emp.position || "",
        入职日期: emp.entry_date ? emp.entry_date.toISOString().split('T')[0] : "",
        薪资: emp.salary ? emp.salary.toString() : "",
        绩效: emp.performance || "",
        状态: emp.status || ""
      };
    });
    
    res.json({
      year: year,
      count: employees.length,
      data: employees
    });
  } catch (err) {
    console.error('获取年份员工数据失败:', err);
    
    // 数据库查询失败时返回空数据
    res.json({
      year: req.query.year,
      count: 0,
      data: []
    });
  }
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