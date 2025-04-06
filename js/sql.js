// 密码验证
const CORRECT_PASSWORD = 'kuaile1005'; // 设置密码为kuaile1005

// 显示/隐藏密码功能
document.getElementById('togglePassword').addEventListener('click', function() {
    const passwordInput = document.getElementById('password');
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    this.textContent = type === 'password' ? '��️' : '🔒';
});

// 显示/隐藏数据库密码
document.getElementById('toggleDbPassword').addEventListener('click', function() {
    const passwordInput = document.getElementById('dbPassword');
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    this.textContent = type === 'password' ? '👁️' : '🔒';
});

// 数据库连接配置
let dbConnection = null;

// 切换数据库配置面板
document.getElementById('toggleDbConfig').addEventListener('click', function() {
    const panel = document.getElementById('dbConfigPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
});

// 密码验证
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM加载完成');
    
    // 处理登录按钮点击
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        console.log('找到登录按钮');
        loginButton.addEventListener('click', function() {
            console.log('登录按钮点击');
            const password = document.getElementById('password').value;
            console.log('输入的密码:', password);
            
            if (password === CORRECT_PASSWORD) {
                console.log('密码正确');
                document.getElementById('loginForm').style.display = 'none';
                document.getElementById('sqlContent').style.display = 'block';
                sessionStorage.setItem('sqlLoggedIn', 'true');
            } else {
                console.log('密码错误');
                // 在登录表单中显示错误信息
                const loginForm = document.getElementById('loginForm');
                let errorDiv = loginForm.querySelector('.login-error');
                if (!errorDiv) {
                    errorDiv = document.createElement('div');
                    errorDiv.className = 'login-error';
                    loginForm.insertBefore(errorDiv, loginForm.querySelector('form'));
                }
                errorDiv.textContent = '密码错误，请重试！';
                errorDiv.style.color = 'red';
                errorDiv.style.marginBottom = '10px';
                errorDiv.style.textAlign = 'center';
                
                // 清空密码输入框
                document.getElementById('password').value = '';
            }
        });
    } else {
        console.error('未找到登录按钮');
    }
});

// 检查登录状态
window.addEventListener('load', function() {
    console.log('页面加载完成');
    if (sessionStorage.getItem('sqlLoggedIn') === 'true') {
        console.log('已登录状态');
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('sqlContent').style.display = 'block';
    } else {
        console.log('未登录状态');
    }
});

// 显示SQL错误信息
function showSqlError(message) {
    const sqlErrorContent = document.getElementById('sqlErrorContent');
    if (sqlErrorContent) {
        sqlErrorContent.textContent = message;
        sqlErrorContent.style.display = 'block';
    }
}

// 清除SQL错误信息
function clearSqlError() {
    const sqlErrorContent = document.getElementById('sqlErrorContent');
    if (sqlErrorContent) {
        sqlErrorContent.textContent = '';
    }
}

// 显示错误信息
function showError(message) {
    console.log('显示错误信息:', message);
    const errorContent = document.getElementById('errorContent');
    if (errorContent) {
        errorContent.textContent = message;
        errorContent.style.display = 'block';
        errorContent.classList.add('error-shake');
        
        // 移除抖动动画，以便下次可以再次触发
        setTimeout(() => {
            errorContent.classList.remove('error-shake');
        }, 500);
    } else {
        console.error('未找到错误信息显示区域');
    }
}

// 显示成功信息
function showSuccess(message) {
    console.log('显示成功信息:', message);
    const errorContent = document.getElementById('errorContent');
    if (errorContent) {
        errorContent.textContent = message;
        errorContent.style.display = 'block';
        errorContent.classList.add('success');
        
        // 3秒后自动隐藏成功消息
        setTimeout(() => {
            errorContent.style.display = 'none';
            errorContent.classList.remove('success');
        }, 3000);
    } else {
        console.error('未找到错误信息显示区域');
    }
}

// 清除错误信息
function clearError() {
    console.log('清除错误信息');
    const errorContent = document.getElementById('errorContent');
    if (errorContent) {
        errorContent.textContent = '';
        errorContent.style.display = 'none';
        errorContent.classList.remove('success', 'error-shake');
    } else {
        console.error('未找到错误信息显示区域');
    }
}

// 数据库连接
document.getElementById('dbConnectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        host: document.getElementById('dbHost').value,
        port: document.getElementById('dbPort').value,
        user: document.getElementById('dbUser').value,
        password: document.getElementById('dbPassword').value,
        database: document.getElementById('dbName').value
    };

    try {
        const response = await fetch('http://localhost:3000/api/connect-db', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        
        if (data.error) {
            showError(`数据库连接失败：${data.error}\n\n可能的原因：\n1. 数据库服务未启动\n2. 连接信息不正确\n3. 网络连接问题\n\n建议操作：\n1. 检查数据库服务是否正常运行\n2. 验证连接信息是否正确\n3. 检查网络连接`);
            updateDbStatus(false);
            return;
        }

        showSuccess('数据库连接成功！');
        updateDbStatus(true);
        document.getElementById('dbConfigPanel').style.display = 'none';
        
    } catch (error) {
        showError(`连接请求失败：${error.message}\n\n请检查后端服务是否正常运行。`);
        updateDbStatus(false);
    }
});

// 更新数据库连接状态
function updateDbStatus(isConnected) {
    const dbConfigBtn = document.getElementById('toggleDbConfig');
    if (isConnected) {
        dbConfigBtn.classList.add('connected');
        dbConfigBtn.textContent = '数据库已连接';
    } else {
        dbConfigBtn.classList.remove('connected');
        dbConfigBtn.textContent = '配置数据库';
    }
}

// SQL编辑器功能
document.getElementById('formatSql').addEventListener('click', function() {
    const sqlInput = document.getElementById('sqlQuery');
    // 这里可以添加SQL格式化逻辑
    alert('SQL格式化功能待实现');
});

document.getElementById('clearSql').addEventListener('click', function() {
    document.getElementById('sqlQuery').value = '';
});

// 执行SQL查询
document.getElementById('executeQuery').addEventListener('click', async () => {
    const query = document.getElementById('sqlQuery').value.trim();
    if (!query) {
        showSqlError('请输入SQL查询语句');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/execute-query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query })
        });

        const data = await response.json();
        
        if (data.error) {
            showSqlError(data.error);
            return;
        }

        // 清除错误信息
        clearSqlError();
        
        // 显示查询结果
        displayResults(data.results);
        
        // 启用导出按钮
        document.getElementById('exportResults').disabled = false;
    } catch (error) {
        showSqlError('执行查询时发生错误: ' + error.message);
    }
});

// 显示查询结果
function displayResults(results) {
    const table = document.getElementById('resultsTable');
    table.innerHTML = '';
    
    if (results.length === 0) {
        showError('查询没有返回任何结果');
        return;
    }

    // 创建表头
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    Object.keys(results[0]).forEach(key => {
        const th = document.createElement('th');
        th.textContent = key;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // 创建表体
    const tbody = document.createElement('tbody');
    results.forEach(row => {
        const tr = document.createElement('tr');
        Object.values(row).forEach(value => {
            const td = document.createElement('td');
            td.textContent = value;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
}

// 导出结果
document.getElementById('exportResults').addEventListener('click', function() {
    const table = document.querySelector('#resultsTable table');
    if (!table) {
        alert('没有可导出的数据');
        return;
    }

    // 创建CSV内容
    let csv = [];
    const rows = table.querySelectorAll('tr');
    
    for (const row of rows) {
        const rowData = [];
        const cells = row.querySelectorAll('th, td');
        
        for (const cell of cells) {
            rowData.push(cell.textContent);
        }
        
        csv.push(rowData.join(','));
    }

    // 创建下载链接
    const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'query_results.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// 测试数据库连接
document.getElementById('testConnection').addEventListener('click', async function() {
    const testBtn = this;
    const formData = {
        host: document.getElementById('dbHost').value,
        port: document.getElementById('dbPort').value,
        user: document.getElementById('dbUser').value,
        password: document.getElementById('dbPassword').value,
        database: document.getElementById('dbName').value
    };

    // 禁用按钮并显示测试中状态
    testBtn.disabled = true;
    testBtn.textContent = '测试中...';
    testBtn.classList.add('testing');

    try {
        const response = await fetch('http://localhost:3000/api/connect-db', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        
        if (data.error) {
            // 测试失败
            testBtn.classList.remove('testing');
            testBtn.classList.add('error');
            testBtn.textContent = '连接失败';
            showError(`数据库连接测试失败：${data.error}\n\n可能的原因：\n1. 数据库服务未启动\n2. 连接信息不正确\n3. 网络连接问题\n\n建议操作：\n1. 检查数据库服务是否正常运行\n2. 验证连接信息是否正确\n3. 检查网络连接`);
            
            // 3秒后恢复按钮状态
            setTimeout(() => {
                testBtn.disabled = false;
                testBtn.classList.remove('error');
                testBtn.textContent = '测试连接';
            }, 3000);
            return;
        }

        // 测试成功
        testBtn.classList.remove('testing');
        testBtn.classList.add('success');
        testBtn.textContent = '连接成功';
        showSuccess('数据库连接测试成功！');
        
        // 3秒后恢复按钮状态
        setTimeout(() => {
            testBtn.disabled = false;
            testBtn.classList.remove('success');
            testBtn.textContent = '测试连接';
        }, 3000);
        
    } catch (error) {
        // 请求失败
        testBtn.classList.remove('testing');
        testBtn.classList.add('error');
        testBtn.textContent = '连接失败';
        showError(`连接请求失败：${error.message}\n\n请检查后端服务是否正常运行。`);
        
        // 3秒后恢复按钮状态
        setTimeout(() => {
            testBtn.disabled = false;
            testBtn.classList.remove('error');
            testBtn.textContent = '测试连接';
        }, 3000);
    }
}); 