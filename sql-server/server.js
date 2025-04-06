const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 3000;

// 启用CORS
app.use(cors());
app.use(express.json());

// 创建数据库连接池
let pool = null;

// 连接数据库
app.post('/api/connect-db', (req, res) => {
    const { host, port, user, password, database } = req.body;

    try {
        // 如果已存在连接池，先关闭
        if (pool) {
            pool.end();
        }

        // 创建新的连接池
        pool = mysql.createPool({
            host: host || 'localhost',
            port: port || 3306,
            user: user,
            password: password,
            database: database,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        // 测试连接
        pool.getConnection((err, connection) => {
            if (err) {
                console.error('数据库连接失败:', err);
                res.status(500).json({ error: '数据库连接失败: ' + err.message });
                return;
            }
            connection.release();
            res.json({ message: '数据库连接成功' });
        });
    } catch (error) {
        console.error('创建连接池失败:', error);
        res.status(500).json({ error: '创建连接池失败: ' + error.message });
    }
});

// 执行SQL查询
app.post('/api/execute-query', (req, res) => {
    if (!pool) {
        return res.status(400).json({ error: '请先连接数据库' });
    }

    const { query } = req.body;

    pool.query(query, (err, results) => {
        if (err) {
            console.error('查询执行失败:', err);
            res.status(500).json({ error: '查询执行失败: ' + err.message });
            return;
        }
        res.json(results);
    });
});

// 启动服务器
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
}); 