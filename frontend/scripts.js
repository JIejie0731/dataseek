// DOM 元素引用
const themeSwitcher = document.getElementById('theme-switcher');
const loginModal = document.getElementById('login-modal');
const dashboardLink = document.getElementById('dashboard-link');
const closeModalBtn = document.querySelector('.close-modal');
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

// 模态框功能
function openModal() {
    loginModal.classList.add('active');
    document.body.style.overflow = 'hidden'; // 防止背景滚动
}

function closeModal() {
    loginModal.classList.remove('active');
    document.body.style.overflow = '';
}

// 切换登录/注册标签
function switchTab(e) {
    const tabId = e.target.dataset.tab;
    
    // 更新标签状态
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    e.target.classList.add('active');
    
    // 更新内容区域
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');
}

// 导航高亮函数
function highlightNavigation() {
    const currentLocation = window.location.pathname;
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (currentLocation.includes(href) && href !== '#') {
            item.classList.add('active');
        } else if (currentLocation === '/' && href === 'index.html') {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// 监听滚动事件添加导航栏阴影
function handleScroll() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 10) {
        navbar.style.boxShadow = '0 4px 20px var(--shadow-color)';
    } else {
        navbar.style.boxShadow = '0 1px 15px var(--shadow-color)';
    }
}

// 表单提交处理
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    // 这里添加登录逻辑
    console.log('登录尝试:', { username, password });
    
    // 模拟登录成功
    alert('登录成功！即将跳转到数据大屏页面');
    window.location.href = 'dashboard.html';
}

function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    // 这里添加注册逻辑
    console.log('注册尝试:', { username, email, password });
    
    // 模拟注册成功
    alert('注册成功！请登录');
    
    // 切换到登录标签
    tabs[0].click();
}

// 事件监听器
document.addEventListener('DOMContentLoaded', () => {
    // 初始化主题
    checkThemePreference();
    
    // 初始化导航高亮
    highlightNavigation();
    
    // 绑定事件
    if (themeSwitcher) {
        themeSwitcher.addEventListener('click', toggleTheme);
    }
    
    if (dashboardLink) {
        dashboardLink.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    
    // 点击模态框外部关闭
    loginModal?.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            closeModal();
        }
    });
    
    // 标签切换
    tabs.forEach(tab => {
        tab.addEventListener('click', switchTab);
    });
    
    // 表单提交
    loginForm?.addEventListener('submit', handleLogin);
    registerForm?.addEventListener('submit', handleRegister);
    
    // 滚动事件
    window.addEventListener('scroll', handleScroll);
});

// 切换暗色模式
document.addEventListener('DOMContentLoaded', function() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const body = document.body;
    
    // 检查本地存储中的暗色模式设置
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    
    // 应用保存的设置
    if (isDarkMode) {
        body.classList.add('dark-mode');
    }
    
    // 切换暗色模式
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', function() {
            body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', body.classList.contains('dark-mode'));
        });
    }
    
    // 数据大屏图表初始化
    initDashboardCharts();
    
    // 导航项点击事件
    const navItems = document.querySelectorAll('.nav-link');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            if (this.getAttribute('data-page') === 'dashboard') {
                e.preventDefault();
                showLoginModal();
            }
        });
    });
});

// 显示登录/注册模态框
function showLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.style.display = 'block';
    } else {
        createLoginModal();
    }
}

// 创建登录/注册模态框
function createLoginModal() {
    const modal = document.createElement('div');
    modal.id = 'login-modal';
    modal.className = 'modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-btn">&times;</span>
            <div class="modal-tabs">
                <button class="tab-btn active" data-tab="login">登录</button>
                <button class="tab-btn" data-tab="register">注册</button>
            </div>
            <div class="tab-content" id="login-tab">
                <h2>用户登录</h2>
                <form id="login-form">
                    <div class="form-group">
                        <label for="login-username">用户名</label>
                        <input type="text" id="login-username" required>
                    </div>
                    <div class="form-group">
                        <label for="login-password">密码</label>
                        <input type="password" id="login-password" required>
                    </div>
                    <div class="form-group">
                        <button type="submit" class="btn btn-primary">登录</button>
                    </div>
                </form>
            </div>
            <div class="tab-content" id="register-tab" style="display: none;">
                <h2>用户注册</h2>
                <form id="register-form">
                    <div class="form-group">
                        <label for="register-username">用户名</label>
                        <input type="text" id="register-username" required>
                    </div>
                    <div class="form-group">
                        <label for="register-email">邮箱</label>
                        <input type="email" id="register-email" required>
                    </div>
                    <div class="form-group">
                        <label for="register-password">密码</label>
                        <input type="password" id="register-password" required>
                    </div>
                    <div class="form-group">
                        <label for="register-confirm-password">确认密码</label>
                        <input type="password" id="register-confirm-password" required>
                    </div>
                    <div class="form-group">
                        <button type="submit" class="btn btn-primary">注册</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 关闭按钮事件
    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // 切换标签页
    const tabBtns = modal.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // 更新按钮状态
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // 显示对应的表单
            modal.querySelectorAll('.tab-content').forEach(tab => {
                tab.style.display = 'none';
            });
            
            document.getElementById(tabName + '-tab').style.display = 'block';
        });
    });
    
    // 登录表单提交
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        console.log('登录信息:', { username, password });
        // 这里可以添加验证和API调用
        alert('登录成功！');
        modal.style.display = 'none';
        // 登录成功后跳转到数据大屏页面
        window.location.href = 'dashboard.html';
    });
    
    // 注册表单提交
    const registerForm = document.getElementById('register-form');
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        
        if (password !== confirmPassword) {
            alert('两次输入的密码不一致！');
            return;
        }
        
        console.log('注册信息:', { username, email, password });
        // 这里可以添加验证和API调用
        alert('注册成功！');
        
        // 切换到登录标签页
        tabBtns[0].click();
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // 显示模态框
    modal.style.display = 'block';
}

// 初始化数据大屏图表
function initDashboardCharts() {
    if (!document.querySelector('.chart-container')) return;
    
    // 确保ECharts库已加载
    if (typeof echarts === 'undefined') {
        console.error('ECharts库未加载');
        return;
    }
    
    // 初始化各种图表
    initLineChart();
    initPieChart();
    initMapChart();
    initBarChart();
    initRadarChart();
    
    // 窗口大小变化时，重新调整图表大小
    window.addEventListener('resize', function() {
        const charts = document.querySelectorAll('.chart-container');
        charts.forEach(chart => {
            const chartInstance = echarts.getInstanceByDom(chart);
            if (chartInstance) {
                chartInstance.resize();
            }
        });
    });
}

// 初始化折线图
function initLineChart() {
    const chartDom = document.getElementById('line-chart');
    if (!chartDom) return;
    
    const myChart = echarts.init(chartDom);
    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                label: {
                    backgroundColor: '#6a7985'
                }
            }
        },
        legend: {
            data: ['用户访问量', '页面浏览量', '独立访客']
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
        },
        yAxis: {
            type: 'value'
        },
        series: [
            {
                name: '用户访问量',
                type: 'line',
                stack: '总量',
                areaStyle: {},
                emphasis: {
                    focus: 'series'
                },
                data: [120, 132, 101, 134, 90, 230, 210]
            },
            {
                name: '页面浏览量',
                type: 'line',
                stack: '总量',
                areaStyle: {},
                emphasis: {
                    focus: 'series'
                },
                data: [220, 182, 191, 234, 290, 330, 310]
            },
            {
                name: '独立访客',
                type: 'line',
                stack: '总量',
                areaStyle: {},
                emphasis: {
                    focus: 'series'
                },
                data: [150, 232, 201, 154, 190, 330, 410]
            }
        ]
    };
    
    myChart.setOption(option);
}

// 初始化饼图
function initPieChart() {
    const chartDom = document.getElementById('pie-chart');
    if (!chartDom) return;
    
    const myChart = echarts.init(chartDom);
    const option = {
        tooltip: {
            trigger: 'item'
        },
        legend: {
            orient: 'vertical',
            left: 'left'
        },
        series: [
            {
                name: '访问来源',
                type: 'pie',
                radius: '60%',
                data: [
                    { value: 1048, name: '搜索引擎' },
                    { value: 735, name: '直接访问' },
                    { value: 580, name: '邮件营销' },
                    { value: 484, name: '联盟广告' },
                    { value: 300, name: '视频广告' }
                ],
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }
        ]
    };
    
    myChart.setOption(option);
}

// 初始化地图
function initMapChart() {
    const chartDom = document.getElementById('map-chart');
    if (!chartDom) return;
    
    const myChart = echarts.init(chartDom);
    const option = {
        title: {
            text: '用户地区分布',
            left: 'center'
        },
        tooltip: {
            trigger: 'item'
        },
        visualMap: {
            min: 0,
            max: 2500,
            left: 'left',
            top: 'bottom',
            text: ['高', '低'],
            calculable: true
        },
        series: [
            {
                name: '访问量',
                type: 'map',
                map: 'china',
                roam: true,
                emphasis: {
                    label: {
                        show: true
                    }
                },
                data: [
                    { name: '北京', value: 2000 },
                    { name: '天津', value: 1200 },
                    { name: '上海', value: 2500 },
                    { name: '重庆', value: 1100 },
                    { name: '河北', value: 800 },
                    { name: '河南', value: 1500 },
                    { name: '云南', value: 600 },
                    { name: '辽宁', value: 900 },
                    { name: '黑龙江', value: 700 },
                    { name: '广东', value: 2200 },
                    { name: '山东', value: 1700 },
                    { name: '江苏', value: 1800 },
                    { name: '浙江', value: 1900 },
                    { name: '四川', value: 1600 },
                    { name: '湖北', value: 1400 }
                ]
            }
        ]
    };
    
    myChart.setOption(option);
}

// 初始化柱状图
function initBarChart() {
    const chartDom = document.getElementById('bar-chart');
    if (!chartDom) return;
    
    const myChart = echarts.init(chartDom);
    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        legend: {},
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
        },
        yAxis: {
            type: 'value'
        },
        series: [
            {
                name: '新增用户',
                type: 'bar',
                data: [120, 132, 101, 134, 90, 230, 210]
            },
            {
                name: '活跃用户',
                type: 'bar',
                data: [220, 182, 191, 234, 290, 330, 310]
            }
        ]
    };
    
    myChart.setOption(option);
}

// 初始化雷达图
function initRadarChart() {
    const chartDom = document.getElementById('radar-chart');
    if (!chartDom) return;
    
    const myChart = echarts.init(chartDom);
    const option = {
        title: {
            text: '用户活跃度分析'
        },
        legend: {
            data: ['当前周期', '上一周期']
        },
        radar: {
            indicator: [
                { name: '访问量', max: 10000 },
                { name: '留存率', max: 100 },
                { name: '使用时长', max: 100 },
                { name: '页面跳转率', max: 100 },
                { name: '转化率', max: 100 }
            ]
        },
        series: [
            {
                name: '用户活跃度',
                type: 'radar',
                data: [
                    {
                        value: [4200, 80, 75, 60, 50],
                        name: '当前周期'
                    },
                    {
                        value: [3800, 70, 60, 70, 40],
                        name: '上一周期'
                    }
                ]
            }
        ]
    };
    
    myChart.setOption(option);
}

// 导航栏交互
document.addEventListener('DOMContentLoaded', function() {
    // 获取当前页面URL
    const currentUrl = window.location.pathname;
    const urlParts = currentUrl.split('/');
    const currentPage = urlParts[urlParts.length - 1];
    
    // 设置激活的导航项
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if ((currentPage.includes('hr-dashboard') && item.textContent.includes('人力资源')) ||
            (currentPage.includes('dashboard') && !currentPage.includes('hr') && item.textContent.includes('数据大屏')) ||
            (currentPage === 'index.html' && item.textContent.includes('首页'))) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // 处理面包屑导航
    const breadcrumbContainer = document.querySelector('.breadcrumb');
    if (breadcrumbContainer) {
        if (currentPage.includes('hr-dashboard')) {
            breadcrumbContainer.innerHTML = `
                <a href="index.html">首页</a>
                <i class="fas fa-chevron-right"></i>
                <a href="dashboard.html">数据大屏</a>
                <i class="fas fa-chevron-right"></i>
                <span>人力资源分析大屏</span>
            `;
        } else if (currentPage.includes('dashboard')) {
            breadcrumbContainer.innerHTML = `
                <a href="index.html">首页</a>
                <i class="fas fa-chevron-right"></i>
                <span>数据大屏</span>
            `;
        }
    }
}); 