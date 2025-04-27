// DOM 元素引用
const themeSwitcher = document.querySelector('.theme-switcher');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

// 主题切换功能
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    
    // 保存用户主题偏好到本地存储
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('dark-mode', isDarkMode);
    
    // 更新图标
    const icon = themeSwitcher.querySelector('i');
    if (isDarkMode) {
        icon.className = 'fas fa-sun';
    } else {
        icon.className = 'fas fa-moon';
    }
}

// 检查用户之前的主题偏好
function checkThemePreference() {
    const isDarkMode = localStorage.getItem('dark-mode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        themeSwitcher.querySelector('i').className = 'fas fa-sun';
    }
}

// 标签页切换
function switchTab() {
    const tabId = this.getAttribute('data-tab');
    
    // 更新标签状态
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    this.classList.add('active');
    
    // 更新内容区域
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');
}

// 处理登录表单提交
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-me').checked;
    
    // 验证表单
    if (!username || !password) {
        alert('请填写用户名和密码');
        return;
    }
    
    // 这里添加登录API调用
    console.log('登录信息:', { username, password, rememberMe });
    
    // 模拟登录验证 - 实际应用中应该调用后端API
    // 这里为了演示，我们使用简单的模拟登录验证
    if (username === 'admin' && password === 'password') {
        // 登录成功，保存用户信息
        localStorage.setItem('user', JSON.stringify({ 
            username, 
            isLoggedIn: true,
            loginTime: new Date().toISOString()
        }));
        
        // 跳转到数据大屏页面
        window.location.href = 'dashboard.html';
    } else {
        alert('用户名或密码错误，请重试。\n提示：用户名 admin，密码 password');
    }
}

// 处理注册表单提交
function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const agreeTerms = document.getElementById('agree-terms').checked;
    
    // 验证表单
    if (!username || !email || !password || !confirmPassword) {
        alert('请填写所有必填字段');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('两次输入的密码不一致');
        return;
    }
    
    if (!agreeTerms) {
        alert('请阅读并同意服务条款和隐私政策');
        return;
    }
    
    // 这里添加注册API调用
    console.log('注册信息:', { username, email, password });
    
    // 模拟注册成功
    alert('注册成功！请使用新账号登录。');
    
    // 重置表单
    registerForm.reset();
    
    // 切换到登录标签
    tabs[0].click();
}

// 检查用户是否已登录，若已登录则直接跳转到数据大屏
function checkUserLogin() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.isLoggedIn) {
        window.location.href = 'dashboard.html';
    }
}

// 事件监听器
document.addEventListener('DOMContentLoaded', () => {
    // 检查用户登录状态
    checkUserLogin();
    
    // 初始化主题
    checkThemePreference();
    
    // 绑定标签页切换事件
    tabs.forEach(tab => {
        tab.addEventListener('click', switchTab);
    });
    
    // 绑定主题切换事件
    if (themeSwitcher) {
        themeSwitcher.addEventListener('click', toggleTheme);
    }
    
    // 绑定表单提交事件
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // 社交登录按钮事件
    const socialButtons = document.querySelectorAll('.social-btn');
    socialButtons.forEach(button => {
        button.addEventListener('click', function() {
            alert('社交账号登录功能即将上线，敬请期待！');
        });
    });
}); 