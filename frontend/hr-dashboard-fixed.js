// 此脚本依赖于HTML中定义的全局函数getApiUrl
// 确保在页面中的getApiUrl函数定义之后加载此脚本

// 全局变量，存储当前过滤条件
let currentPrimaryDept = 'all';
let currentSecondaryDept = 'all';
// 全局变量，存储图表实例
let entryYearChart = null;
let secondaryDeptChart = null;

// 主题初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化主题
    initTheme();
    
    // 初始化部门筛选器
    initDepartmentFilters();
    
    // 加载所有卡片数据
    loadAllCharts();
});

// 初始化主题函数
function initTheme() {
    // 加载保存的主题
    const isDarkMode = localStorage.getItem('dark-mode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
    
    // 主题切换按钮
    const themeSwitcher = document.getElementById('themeSwitcher');
    if (themeSwitcher) {
        // 设置正确的初始图标
        const icon = themeSwitcher.querySelector('i');
        if (icon) {
            icon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        // 添加点击事件
        themeSwitcher.addEventListener('click', function() {
            toggleTheme();
        });
    }
}

// 切换主题函数
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('dark-mode', isDarkMode);
    
    // 更新所有主题切换按钮的图标
    const icon = document.querySelector('#themeSwitcher i');
    if (icon) {
        icon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
    }
    
    // 重新渲染所有图表以适应新主题
    refreshAllCharts();
}

// 初始化部门筛选器
function initDepartmentFilters() {
    const primarySelect = document.getElementById('primary-department-select');
    const secondarySelect = document.getElementById('secondary-department-select');
    
    // 加载部门数据
    loadDepartments(primarySelect, secondarySelect);
    
    // 为主部门选择添加变更事件
    if (primarySelect) {
        primarySelect.addEventListener('change', function() {
            loadSecondaryDepartments(primarySelect.value, secondarySelect);
            refreshAllCharts();
        });
    }
    
    // 为二级部门选择添加变更事件
    if (secondarySelect) {
        secondarySelect.addEventListener('change', function() {
            refreshAllCharts();
        });
    }
}

// 加载部门数据
function loadDepartments(primarySelect, secondarySelect) {
    const url = getApiUrl('/hr/departments/distinct');
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            // 填充一级部门选项
            if (primarySelect && data.primary_departments) {
                // 清空现有选项，保留"全部"选项
                primarySelect.innerHTML = '<option value="all">全部</option>';
                
                // 添加部门选项
                data.primary_departments.forEach(dept => {
                    const option = document.createElement('option');
                    option.value = dept;
                    option.textContent = dept;
                    primarySelect.appendChild(option);
                });
            }
            
            // 加载二级部门
            loadSecondaryDepartments('all', secondarySelect);
        })
        .catch(error => {
            console.error('加载部门数据失败:', error);
        });
}

// 加载二级部门
function loadSecondaryDepartments(primaryDept, secondarySelect) {
    if (!secondarySelect) return;
    
    // 显示加载指示器
    const loadingIndicator = document.getElementById('secondary-department-loading');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }
    
    // 禁用选择器
    secondarySelect.disabled = true;
    
    // 清空现有选项，保留"全部"选项
    secondarySelect.innerHTML = '<option value="all">全部</option>';
    
    // 如果选择了"全部"，则不需要请求特定二级部门
    if (primaryDept === 'all') {
        // 启用选择器并隐藏加载指示器
        secondarySelect.disabled = false;
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        return;
    }
    
    // 构建请求URL
    const url = getApiUrl(`/hr/departments/secondary?primary=${encodeURIComponent(primaryDept)}`);
    
    // 发送请求
    fetch(url)
        .then(response => response.json())
        .then(data => {
            // 填充二级部门选项
            if (data.departments) {
                data.departments.forEach(dept => {
                    const option = document.createElement('option');
                    option.value = dept;
                    option.textContent = dept;
                    secondarySelect.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('加载二级部门失败:', error);
            // 添加一个错误选项
            const errorOption = document.createElement('option');
            errorOption.value = '';
            errorOption.textContent = '加载失败';
            secondarySelect.appendChild(errorOption);
        })
        .finally(() => {
            // 启用选择器并隐藏加载指示器
            secondarySelect.disabled = false;
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
        });
}

// 加载所有图表
function loadAllCharts() {
    loadEntryYearChart();
    loadDepartmentChart();
    loadSubDeptChart();
    loadEmployeeProfileChart();
    loadEmployeeTurnoverChart();
    loadEmployeeCostChart();
}

// 刷新所有图表
function refreshAllCharts() {
    loadAllCharts();
}

// 获取当前选择的部门
function getSelectedDepartments() {
    const primarySelect = document.getElementById('primary-department-select');
    const secondarySelect = document.getElementById('secondary-department-select');
    
    return {
        primary: primarySelect ? primarySelect.value : 'all',
        secondary: secondarySelect ? secondarySelect.value : 'all'
    };
}

// 加载入职年份分析图表
function loadEntryYearChart() {
    const chartContainer = document.getElementById('entry-year-chart');
    if (!chartContainer) return;
    
    const { primary, secondary } = getSelectedDepartments();
    const url = getApiUrl(`/hr/statistics/entry-year?primary_department=${encodeURIComponent(primary)}&secondary_department=${encodeURIComponent(secondary)}`);
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const chart = echarts.init(chartContainer);
            const option = {
                title: {
                    text: '历年入职人数统计',
                    left: 'center'
                },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow'
                    }
                },
                grid: {
                    top: 80,
                    bottom: 30,
                    left: 40,
                    right: 20,
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    data: data.years || [],
                    axisLabel: {
                        rotate: 30
                    }
                },
                yAxis: {
                    type: 'value',
                    name: '人数'
                },
                series: [
                    {
                        name: '入职人数',
                        type: 'bar',
                        data: data.counts || [],
                        itemStyle: {
                            color: '#3b82f6'
                        }
                    }
                ]
            };
            chart.setOption(option);
            
            // 监听窗口大小变化，重新调整图表大小
            window.addEventListener('resize', function() {
                chart.resize();
            });
        })
        .catch(error => {
            console.error('加载入职年份数据失败:', error);
            chartContainer.innerHTML = '<div class="placeholder-content">加载数据失败</div>';
        });
}

// 加载部门结构图表
function loadDepartmentChart() {
    const chartContainer = document.getElementById('department-structure-chart');
    if (!chartContainer) return;
    
    const { primary, secondary } = getSelectedDepartments();
    const url = getApiUrl(`/hr/statistics/headcount`);
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const chart = echarts.init(chartContainer);
            
            // 从数据中提取部门和人数
            const depts = Object.keys(data.departments || {});
            const counts = depts.map(dept => ({
                name: dept,
                value: data.departments[dept]
            }));
            
            const option = {
                title: {
                    text: '部门分布',
                    left: 'center'
                },
                tooltip: {
                    trigger: 'item',
                    formatter: '{a} <br/>{b}: {c} ({d}%)'
                },
                legend: {
                    orient: 'horizontal',
                    bottom: 10,
                    data: depts
                },
                series: [
                    {
                        name: '部门人数',
                        type: 'pie',
                        radius: ['40%', '70%'],
                        avoidLabelOverlap: false,
                        itemStyle: {
                            borderRadius: 10,
                            borderColor: '#fff',
                            borderWidth: 2
                        },
                        label: {
                            show: false,
                            position: 'center'
                        },
                        emphasis: {
                            label: {
                                show: true,
                                fontSize: '18',
                                fontWeight: 'bold'
                            }
                        },
                        labelLine: {
                            show: false
                        },
                        data: counts
                    }
                ]
            };
            chart.setOption(option);
            
            // 监听窗口大小变化，重新调整图表大小
            window.addEventListener('resize', function() {
                chart.resize();
            });
        })
        .catch(error => {
            console.error('加载部门结构数据失败:', error);
            chartContainer.innerHTML = '<div class="placeholder-content">加载数据失败</div>';
        });
}

// 加载二级部门分布图表
function loadSubDeptChart() {
    const chartContainer = document.getElementById('employee-distribution-chart');
    if (!chartContainer) return;
    
    const { primary, secondary } = getSelectedDepartments();
    
    // 创建图表实例
    chartContainer.innerHTML = '<div class="placeholder-content">二级部门分布数据暂不可用</div>';
}

// 加载人员画像图表
function loadEmployeeProfileChart() {
    const chartContainer = document.getElementById('employee-profile-chart');
    if (!chartContainer) return;
    
    // 创建图表实例
    chartContainer.innerHTML = '<div class="placeholder-content">人员画像数据暂不可用</div>';
}

// 加载人员流动图表
function loadEmployeeTurnoverChart() {
    const chartContainer = document.getElementById('employee-turnover-chart');
    if (!chartContainer) return;
    
    const { primary, secondary } = getSelectedDepartments();
    const url = getApiUrl(`/hr/statistics/turnover`);
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const chart = echarts.init(chartContainer);
            
            const option = {
                title: {
                    text: '月度人员流动率',
                    left: 'center'
                },
                tooltip: {
                    trigger: 'axis'
                },
                xAxis: {
                    type: 'category',
                    data: data.monthly.months || []
                },
                yAxis: {
                    type: 'value',
                    axisLabel: {
                        formatter: '{value}%'
                    }
                },
                series: [
                    {
                        name: '流动率',
                        type: 'line',
                        data: data.monthly.values ? data.monthly.values.map(v => (v * 100).toFixed(1)) : [],
                        markPoint: {
                            data: [
                                { type: 'max', name: '最大值' },
                                { type: 'min', name: '最小值' }
                            ]
                        }
                    }
                ]
            };
            chart.setOption(option);
            
            // 监听窗口大小变化，重新调整图表大小
            window.addEventListener('resize', function() {
                chart.resize();
            });
        })
        .catch(error => {
            console.error('加载人员流动数据失败:', error);
            chartContainer.innerHTML = '<div class="placeholder-content">加载数据失败</div>';
        });
}

// 加载人员成本图表
function loadEmployeeCostChart() {
    const chartContainer = document.getElementById('employee-cost-chart');
    if (!chartContainer) return;
    
    const { primary, secondary } = getSelectedDepartments();
    const url = getApiUrl(`/hr/statistics/salary`);
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const chart = echarts.init(chartContainer);
            
            // 从数据中提取部门和薪资
            const depts = Object.keys(data.departments || {});
            const salaries = depts.map(dept => data.departments[dept]);
            
            const option = {
                title: {
                    text: '部门平均薪资',
                    left: 'center'
                },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow'
                    }
                },
                grid: {
                    top: 80,
                    bottom: 30,
                    left: 40,
                    right: 20,
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    data: depts,
                    axisLabel: {
                        rotate: 30
                    }
                },
                yAxis: {
                    type: 'value',
                    name: '薪资(元)'
                },
                series: [
                    {
                        name: '平均薪资',
                        type: 'bar',
                        data: salaries,
                        itemStyle: {
                            color: function(params) {
                                // 颜色数组
                                var colorList = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272'];
                                return colorList[params.dataIndex % colorList.length];
                            }
                        }
                    }
                ]
            };
            chart.setOption(option);
            
            // 监听窗口大小变化，重新调整图表大小
            window.addEventListener('resize', function() {
                chart.resize();
            });
        })
        .catch(error => {
            console.error('加载人员成本数据失败:', error);
            chartContainer.innerHTML = '<div class="placeholder-content">加载数据失败</div>';
        });
}

// 更新二级部门数据
function updateSecondaryDeptData() {
    console.log('更新二级部门数据...');
    
    // 获取当前选中的部门
    const primaryDeptSelect = document.getElementById('primary-department-select');
    const secondaryDeptSelect = document.getElementById('secondary-department-select');
    
    const primaryDept = primaryDeptSelect.value;
    const secondaryDept = secondaryDeptSelect.value;
    
    console.log(`当前选中一级部门：${primaryDept}，二级部门：${secondaryDept}`);
    
    // 构建API URL
    const apiUrl = getApiUrl(`/api/hr/statistics/entry-year-by-dept?primary_department=${encodeURIComponent(primaryDept)}&secondary_department=${encodeURIComponent(secondaryDept)}`);
    console.log(`请求API: ${apiUrl}`);
    
    // 显示加载状态
    const loadingIndicator = document.getElementById('secondary-dept-data-loading');
    if (loadingIndicator) loadingIndicator.style.display = 'inline-block';
    
    const dataContainer = document.getElementById('secondary-dept-data-container');
    if (dataContainer) dataContainer.innerHTML = '<div class="loading-text">加载数据中...</div>';
    
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`请求失败: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('获取到二级部门数据:', data);
            
            // 处理数据
            if (data && Array.isArray(data.data)) {
                // 在这里可以渲染数据，例如用ECharts绘制图表
                renderSecondaryDeptTable(data.data);
                renderSecondaryDeptEntryYearChart(data.data);
            } else {
                console.error('数据格式不正确:', data);
                if (dataContainer) {
                    dataContainer.innerHTML = '<div class="error-message">数据格式不正确，无法显示</div>';
                }
            }
        })
        .catch(error => {
            console.error('获取二级部门数据失败:', error);
            // 显示错误信息
            if (dataContainer) {
                dataContainer.innerHTML = `<div class="error-message">获取数据失败: ${error.message}</div>`;
            }
        })
        .finally(() => {
            // 隐藏加载指示器
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        });
}

// 应用部门筛选
function applyFilter() {
    // 获取筛选条件
    const primarySelect = document.getElementById('primary-department-select');
    const secondarySelect = document.getElementById('secondary-department-select');
    
    if (primarySelect && secondarySelect) {
        currentPrimaryDept = primarySelect.value;
        currentSecondaryDept = secondarySelect.value;
        
        console.log('应用筛选:', currentPrimaryDept, currentSecondaryDept);
        
        // 更新入职年份统计图表
        loadEntryYearData(currentPrimaryDept, currentSecondaryDept);
        
        // 检查是否有打开的模态框，如果有，刷新相关数据
        const modal = document.getElementById('entry-year-tabs-modal');
        if (modal && modal.classList.contains('active')) {
            // 更新部门维度数据
            loadDepartmentDimensionData();
            
            // 更新二级部门数据
            loadSecondaryDeptEntryYearData();
        }
    }
}

// 初始化所有功能
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成，开始初始化...');
    
    // 首先初始化主题切换，确保界面风格一致
    initThemeSwitcher();
    
    // 初始化部门筛选器
    initDepartmentFilters();
    
    // 初始化用户菜单
    initUserMenu();
    
    // 初始化选项卡弹窗
    initTabsModal();
    
    // 初始化卡片放大功能
    initCardExpansion();
    
    // 绑定详情弹窗关闭按钮事件
    const detailClose = document.getElementById('detail-close');
    if (detailClose) {
        detailClose.addEventListener('click', function() {
            document.getElementById('detail-modal').classList.remove('active');
        });
    }
    
    // 绑定导出Excel按钮事件
    const exportExcelBtn = document.getElementById('export-excel-btn');
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', function() {
            const detailData = window.currentDetailData;
            if (detailData && detailData.length > 0) {
                exportToExcel(detailData);
            }
        });
    }
    
    // 加载入职年份图表数据
    loadEntryYearData(currentPrimaryDept, currentSecondaryDept);
});

// 初始化主题切换
function initThemeSwitcher() {
    const themeSwitcher = document.getElementById('themeSwitcher');
    if (!themeSwitcher) {
        console.error('找不到主题切换按钮');
        return;
    }
    
    const themeIcon = themeSwitcher.querySelector('i');
    if (!themeIcon) {
        console.error('找不到主题图标');
        return;
    }
    
    // 检查本地存储中的主题设置
    const darkMode = localStorage.getItem('dark-mode') === 'true';
    
    // 应用保存的主题设置
    if (darkMode) {
        document.body.classList.add('dark-mode');
        themeIcon.className = 'fas fa-sun';
    } else {
        document.body.classList.remove('dark-mode');
        themeIcon.className = 'fas fa-moon';
    }
    
    // 绑定点击事件
    themeSwitcher.addEventListener('click', function() {
        // 切换暗色模式类
        document.body.classList.toggle('dark-mode');
        
        // 获取切换后的状态
        const isDarkMode = document.body.classList.contains('dark-mode');
        
        // 更新图标
        themeIcon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
        
        // 保存到本地存储
        localStorage.setItem('dark-mode', isDarkMode);
        
        // 如果入职年份图表已初始化，刷新它的颜色
        if (entryYearChart) {
            // 重新加载数据以更新图表颜色
            loadEntryYearData(currentPrimaryDept, currentSecondaryDept);
        }
        
        // 刷新图表数据
        refreshCharts();
    });
}

// 获取特定年份入职的员工明细
function fetchEmployeesByYear(year, primaryDept, secondaryDept) {
    // 构建API请求URL
    const url = getApiUrl(`/api/hr/employees/by-year?year=${year}&primary_department=${primaryDept}&secondary_department=${secondaryDept}`);
    
    // 存储当前明细数据，用于导出
    window.currentDetailData = null;
    
    // 显示明细弹框
    document.getElementById('detail-modal').classList.add('active');
    document.getElementById('detail-title').textContent = `${year}年入职员工明细`;
    document.getElementById('detail-loading').style.display = 'flex';
    document.getElementById('detail-table').style.display = 'none';
    document.getElementById('table-footer').style.display = 'none';
    
    console.log('获取员工明细数据，URL:', url);
    
    // 获取数据
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP错误状态码: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('获取到员工明细数据:', data);
            
            // 存储当前数据用于导出
            window.currentDetailData = data;
            
            // 渲染表格
            renderDetailTable(data);
        })
        .catch(error => {
            console.error('获取员工明细数据失败:', error);
            document.getElementById('detail-loading').style.display = 'none';
            document.getElementById('detail-table').innerHTML = `<div class="detail-error">加载数据失败: ${error.message}</div>`;
            document.getElementById('detail-table').style.display = 'block';
        });
}

// 渲染明细表格
function renderDetailTable(data) {
    // 隐藏加载中，显示表格
    document.getElementById('detail-loading').style.display = 'none';
    document.getElementById('detail-table').style.display = 'table';
    document.getElementById('table-footer').style.display = 'flex';
    
    const tableBody = document.getElementById('detail-table-body');
    tableBody.innerHTML = '';
    
    // 确保data是数组，如果是对象类型，尝试提取data字段
    let employeeData = data;
    if (data && !Array.isArray(data) && data.data) {
        employeeData = data.data;
    }
    
    // 初始化分页
    const pageSize = 10;
    const totalPages = Math.ceil(employeeData.length / pageSize);
    let currentPage = 1;
    
    // 显示数据总数
    document.getElementById('detail-count').textContent = employeeData.length;
    
    // 渲染页码
    renderPagination(totalPages, currentPage);
    
    // 显示当前页的数据
    showPage(currentPage, employeeData, pageSize);
    
    // 绑定导出按钮事件
    document.getElementById('export-excel-btn').onclick = function() {
        exportToExcel(employeeData);
    };
}

// 显示指定页的数据
function showPage(page, data, pageSize) {
    const tableBody = document.getElementById('detail-table-body');
    tableBody.innerHTML = '';
    
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, data.length);
    
    for (let i = startIndex; i < endIndex; i++) {
        const employee = data[i];
        
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${employee.姓名 || employee.name || '-'}</td>
            <td>${employee.一级部门 || employee.primary_department || '-'}</td>
            <td>${employee.二级部门 || employee.secondary_department || '-'}</td>
            <td>${employee.职位 || employee.position || '-'}</td>
            <td>${employee.入职日期 || employee.entry_date || '-'}</td>
            <td>${employee.薪资 ? '¥' + parseFloat(employee.薪资).toLocaleString() : 
                 employee.salary ? '¥' + employee.salary.toLocaleString() : '-'}</td>
            <td>${employee.绩效 || employee.performance || '-'}</td>
            <td>${getStatusLabel(employee.状态 || employee.status)}</td>
        `;
        
        tableBody.appendChild(row);
    }
    
    // 更新表格信息
    const tableInfo = document.getElementById('table-info');
    tableInfo.textContent = `显示 ${startIndex + 1}-${endIndex} 条，共 ${data.length} 条`;
}

// 获取状态标签
function getStatusLabel(status) {
    if (!status) return '-';
    
    switch (status.toLowerCase()) {
        case 'active':
            return '<span class="status-badge active">在职</span>';
        case 'inactive':
            return '<span class="status-badge inactive">离职</span>';
        case 'leave':
            return '<span class="status-badge leave">休假</span>';
        default:
            return status;
    }
}

// 渲染分页按钮
function renderPagination(totalPages, currentPage) {
    const pagination = document.getElementById('table-pagination');
    pagination.innerHTML = '';
    
    // 上一页按钮
    const prevBtn = document.createElement('button');
    prevBtn.className = `page-btn ${currentPage === 1 ? 'disabled' : ''}`;
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = function() {
        if (currentPage > 1) {
            goToPage(currentPage - 1);
        }
    };
    pagination.appendChild(prevBtn);
    
    // 页码按钮
    const maxButtons = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.onclick = function() {
            goToPage(i);
        };
        pagination.appendChild(pageBtn);
    }
    
    // 下一页按钮
    const nextBtn = document.createElement('button');
    nextBtn.className = `page-btn ${currentPage === totalPages ? 'disabled' : ''}`;
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = function() {
        if (currentPage < totalPages) {
            goToPage(currentPage + 1);
        }
    };
    pagination.appendChild(nextBtn);
}

// 跳转到指定页
function goToPage(page) {
    let data = window.currentDetailData || [];
    
    // 处理嵌套结构
    if (data && !Array.isArray(data) && data.data) {
        data = data.data;
    }
    
    const pageSize = 10;
    const totalPages = Math.ceil(data.length / pageSize);
    
    if (page < 1 || page > totalPages) {
        return;
    }
    
    // 显示对应页的数据
    showPage(page, data, pageSize);
    
    // 更新分页
    renderPagination(totalPages, page);
}

// 导出到Excel
function exportToExcel(data) {
    if (!data || data.length === 0) {
        alert('没有数据可导出');
        return;
    }
    
    // 创建工作簿
    const wb = XLSX.utils.book_new();
    
    // 准备表头
    const headers = [
        '姓名', '一级部门', '二级部门', '职位', '入职日期', '薪资', '绩效', '状态'
    ];
    
    // 准备数据
    const excelData = [headers];
    
    data.forEach(employee => {
        const row = [
            employee.姓名 || employee.name || '',
            employee.一级部门 || employee.primary_department || '',
            employee.二级部门 || employee.secondary_department || '',
            employee.职位 || employee.position || '',
            employee.入职日期 || employee.entry_date || '',
            employee.薪资 ? employee.薪资.toString() : 
                employee.salary ? employee.salary.toString() : '',
            employee.绩效 || employee.performance || '',
            employee.状态 || employee.status || ''
        ];
        
        excelData.push(row);
    });
    
    // 创建工作表
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    
    // 将工作表添加到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '员工入职明细');
    
    // 导出文件
    const year = document.getElementById('detail-title').textContent.replace(/[^0-9]/g, '');
    const fileName = `${year}年入职员工明细.xlsx`;
    
    XLSX.writeFile(wb, fileName);
}

// 加载部门维度下的入职年份数据
function loadEntryYearByDept(primaryDept = 'all', secondaryDept = 'all') {
    // 显示加载状态
    document.getElementById('department-tab').innerHTML = `
        <div class="tab-placeholder">
            <i class="fas fa-spinner fa-spin"></i>
            <p>正在加载部门维度数据...</p>
        </div>
    `;
    
    // 构建查询参数
    const queryParams = new URLSearchParams();
    queryParams.append('primary_department', primaryDept);
    queryParams.append('secondary_department', secondaryDept);
    
    // 调用API获取数据
    fetch(getApiUrl(`/api/hr/statistics/entry-year-by-dept?${queryParams.toString()}`))
        .then(response => response.json())
        .then(data => {
            // 准备表格数据
            renderDeptDimensionTable(data, primaryDept, secondaryDept);
        })
        .catch(error => {
            console.error('获取部门维度数据失败:', error);
            document.getElementById('department-tab').innerHTML = `
                <div class="tab-placeholder">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>加载数据失败</p>
                    <button class="retry-btn">重试</button>
                </div>
            `;
            
            // 添加重试按钮事件
            document.querySelector('#department-tab .retry-btn').onclick = function() {
                loadEntryYearByDept(primaryDept, secondaryDept);
            };
        });
}

// 加载子部门数据
function loadSubDeptData(primaryDept, rowIndex, secondaryDept = 'all') {
    // 展开行ID
    const expandRowId = `expand-row-${rowIndex}`;
    const expandRow = document.getElementById(expandRowId);
    
    // 如果展开行已存在，则切换显示状态
    if (expandRow) {
        const isVisible = expandRow.style.display !== 'none';
        expandRow.style.display = isVisible ? 'none' : 'table-row';
        return;
    }
    
    // 构建查询参数
    const queryParams = new URLSearchParams();
    queryParams.append('primary_department', primaryDept);
    queryParams.append('secondary_department', secondaryDept);
    
    // 显示加载行
    const table = document.querySelector('#department-tab table');
    const loadingRow = document.createElement('tr');
    loadingRow.id = expandRowId;
    loadingRow.className = 'expand-row';
    loadingRow.innerHTML = `
        <td colspan="10" class="expand-cell">
            <div class="loading-indicator">
                <i class="fas fa-spinner"></i> 正在加载子部门数据...
            </div>
        </td>
    `;
    
    // 插入到对应行之后
    const rows = table.querySelectorAll('tbody tr:not(.expand-row)');
    if (rows[rowIndex]) {
        rows[rowIndex].after(loadingRow);
    } else {
        table.querySelector('tbody').appendChild(loadingRow);
    }
    
    // 调用API获取二级部门数据
    fetch(getApiUrl(`/api/hr/statistics/entry-year-by-subdept?${queryParams.toString()}`))
        .then(response => response.json())
        .then(data => {
            // 准备子部门表格
            const subDeptTable = document.createElement('table');
            subDeptTable.className = 'sub-dept-table';
            
            // 创建表头
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            headerRow.innerHTML = `
                <th>二级部门</th>
                <th>2018</th>
                <th>2019</th>
                <th>2020</th>
                <th>2021</th>
                <th>2022</th>
                <th>2023</th>
                <th>合计</th>
            `;
            thead.appendChild(headerRow);
            subDeptTable.appendChild(thead);
            
            // 创建表体
            const tbody = document.createElement('tbody');
            
            // 添加行数据
            data.data.forEach(item => {
                const row = document.createElement('tr');
                
                // 部门名称
                const deptCell = document.createElement('td');
                deptCell.className = 'dept-name';
                deptCell.textContent = item.department || '-';
                row.appendChild(deptCell);
                
                // 各年份数据
                const years = ['2018', '2019', '2020', '2021', '2022', '2023'];
                let total = 0;
                
                years.forEach(year => {
                    const cell = document.createElement('td');
                    const count = item.years[year] || 0;
                    cell.textContent = count;
                    total += count;
                    row.appendChild(cell);
                });
                
                // 合计
                const totalCell = document.createElement('td');
                totalCell.className = 'total-cell';
                totalCell.textContent = total;
                row.appendChild(totalCell);
                
                tbody.appendChild(row);
            });
            
            subDeptTable.appendChild(tbody);
            
            // 更新展开行内容
            loadingRow.querySelector('td').innerHTML = '';
            loadingRow.querySelector('td').appendChild(subDeptTable);
        })
        .catch(error => {
            console.error('获取子部门数据失败:', error);
            loadingRow.querySelector('td').innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i> 加载子部门数据失败
                    <button class="retry-btn">重试</button>
                </div>
            `;
            
            // 添加重试按钮事件
            loadingRow.querySelector('.retry-btn').onclick = function() {
                // 移除当前行
                loadingRow.remove();
                // 重新加载
                loadSubDeptData(primaryDept, rowIndex, secondaryDept);
            };
        });
}

// 导出部门维度数据到Excel
function exportDeptDataToExcel(data, primaryDept, secondaryDept) {
    if (!data || !data.data || data.data.length === 0) {
        alert('没有数据可导出');
        return;
    }
    
    // 创建工作簿
    const wb = XLSX.utils.book_new();
    
    // 准备主表数据
    const mainHeaders = ['部门', '2018', '2019', '2020', '2021', '2022', '2023', '合计'];
    const mainData = [mainHeaders];
    
    // 子部门数据的Promise数组
    const subDeptPromises = [];
    const subDeptData = {};
    
    data.data.forEach(item => {
        // 添加主表行
        const mainRow = [
            item.department || '',
            item.years['2018'] || 0,
            item.years['2019'] || 0,
            item.years['2020'] || 0,
            item.years['2021'] || 0,
            item.years['2022'] || 0,
            item.years['2023'] || 0,
            item.total || 0
        ];
        mainData.push(mainRow);
        
        // 创建加载二级部门数据的Promise
        const loadPromise = new Promise((resolve, reject) => {
            const queryParams = new URLSearchParams();
            queryParams.append('primary_department', item.department);
            queryParams.append('secondary_department', secondaryDept);
            
            fetch(getApiUrl(`/api/hr/statistics/entry-year-by-subdept?${queryParams.toString()}`))
                .then(response => response.json())
                .then(subData => {
                    subDeptData[item.department] = subData.data;
                    resolve();
                })
                .catch(error => {
                    console.error(`获取${item.department}子部门数据失败:`, error);
                    resolve(); // 即使失败也继续
                });
        });
        
        subDeptPromises.push(loadPromise);
    });
    
    // 等待所有子部门数据加载完成
    Promise.all(subDeptPromises).then(() => {
        // 创建主表工作表
        const mainWs = XLSX.utils.aoa_to_sheet(mainData);
        XLSX.utils.book_append_sheet(wb, mainWs, '部门入职年份分布');
        
        // 为每个一级部门创建单独的子部门工作表
        for (const [dept, subDepts] of Object.entries(subDeptData)) {
            if (subDepts && subDepts.length > 0) {
                const subHeaders = ['二级部门', '2018', '2019', '2020', '2021', '2022', '2023', '合计'];
                const subTableData = [subHeaders];
                
                subDepts.forEach(subDept => {
                    const total = Object.values(subDept.years).reduce((sum, count) => sum + count, 0);
                    
                    const subRow = [
                        subDept.department || '',
                        subDept.years['2018'] || 0,
                        subDept.years['2019'] || 0,
                        subDept.years['2020'] || 0,
                        subDept.years['2021'] || 0,
                        subDept.years['2022'] || 0,
                        subDept.years['2023'] || 0,
                        total
                    ];
                    
                    subTableData.push(subRow);
                });
                
                const subWs = XLSX.utils.aoa_to_sheet(subTableData);
                const sheetName = dept.length > 20 ? dept.substring(0, 20) : dept;
                XLSX.utils.book_append_sheet(wb, subWs, sheetName);
            }
        }
        
        // 导出文件
        const fileName = `部门入职年份分布.xlsx`;
        XLSX.writeFile(wb, fileName);
    });
}

// 初始化用户菜单
function initUserMenu() {
    const userAvatar = document.getElementById('userAvatar');
    const userMenu = document.getElementById('userMenu');
    
    // 设置模拟用户数据
    document.getElementById('userInitials').textContent = 'A';
    document.getElementById('userName').textContent = '管理员';
    document.getElementById('userRole').textContent = '系统管理员';
    
    // 绑定用户头像点击事件
    userAvatar.addEventListener('click', function(e) {
        e.stopPropagation();
        userMenu.classList.toggle('active');
    });
    
    // 点击其他区域关闭菜单
    document.addEventListener('click', function(e) {
        if (!userAvatar.contains(e.target) && !userMenu.contains(e.target)) {
            userMenu.classList.remove('active');
        }
    });
    
    // 绑定退出登录按钮
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        alert('退出登录功能暂未实现');
    });
}

// 初始化选项卡弹窗
function initTabsModal() {
    // 绑定card-1标题点击事件
    const card1Title = document.querySelector('#card-1 .hr-card-title');
    card1Title.classList.add('clickable-title');
    card1Title.addEventListener('click', function() {
        // 激活模态框
        const modal = document.getElementById('entry-year-tabs-modal');
        modal.classList.add('active');
        // 加载默认数据（按年份统计）
        loadEntryYearData();
        
        // 加载部门维度数据
        loadDepartmentDimensionData();
        
        // 加载二级部门维度数据
        loadSecondaryDeptEntryYearData();
        
        // 绑定关闭事件
        const closeBtn = modal.querySelector('.close-button');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                modal.classList.remove('active');
            });
        }
        
        // 绑定标签切换事件 - 修复标签切换逻辑
        bindTabEvents(modal);
    });
    
    // 绑定card-1模态框中的标签切换事件
    const card1Modal = document.getElementById('card-1-modal');
    if (card1Modal) {
        bindModalTabEvents(card1Modal);
    }
}

// 绑定标签切换事件
function bindTabEvents(modal) {
    const tabs = modal.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // 移除所有标签的active类
            tabs.forEach(t => t.classList.remove('active'));
            // 给当前标签添加active类
            this.classList.add('active');
            
            // 隐藏所有内容区域
            const contentAreas = modal.querySelectorAll('.tab-content');
            contentAreas.forEach(area => area.classList.remove('active'));
            
            // 显示对应的内容区域
            const targetId = this.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
            
            // 根据选中的标签加载数据
            if (targetId === 'year-tab-content') {
                loadEntryYearData();
            } else if (targetId === 'department-tab-content') {
                loadDepartmentDimensionData();
            } else if (targetId === 'secondary-tab-content') {
                // 加载二级部门数据
                loadSecondaryDeptEntryYearData();
            }
        });
    });
}

// 为card-1-modal中的标签添加点击事件
function bindModalTabEvents(modal) {
    const tabLinks = modal.querySelectorAll('.tab-link');
    tabLinks.forEach(tab => {
        tab.addEventListener('click', function() {
            // 移除所有标签的active类
            tabLinks.forEach(t => t.classList.remove('active'));
            // 给当前标签添加active类
            this.classList.add('active');
            
            // 隐藏所有内容区域
            const contentAreas = modal.querySelectorAll('.tab-content');
            contentAreas.forEach(area => area.classList.remove('active'));
            
            // 显示对应的内容区域
            const targetId = this.getAttribute('data-target').substring(1); // 移除#前缀
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.classList.add('active');
                
                // 根据选中的标签加载数据
                if (targetId === 'entry-year-tab') {
                    loadEntryYearData(currentPrimaryDept, currentSecondaryDept);
                } else if (targetId === 'department-tab') {
                    loadDepartmentDimensionData(); 
                } else if (targetId === 'secondary-dept-tab') {
                    // 加载二级部门数据
                    loadSecondaryDeptEntryYearData();
                }
            }
        });
    });
}

// 渲染部门维度表格
function renderDeptDimensionTable(data, primaryDept, secondaryDept) {
    const departmentTab = document.getElementById('department-tab');
    
    if (!data || !data.data || data.data.length === 0) {
        departmentTab.innerHTML = `
            <div class="tab-placeholder">
                <i class="fas fa-building"></i>
                <p>暂无部门数据</p>
            </div>
        `;
        return;
    }
    
    // 创建表格容器
    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-container';
    
    // 创建导出按钮
    const exportBtn = document.createElement('button');
    exportBtn.className = 'export-btn';
    exportBtn.innerHTML = '<i class="fas fa-file-excel"></i> 导出Excel';
    exportBtn.onclick = function() {
        exportDeptDataToExcel(data, primaryDept, secondaryDept);
    };
    
    // 创建表格
    const table = document.createElement('table');
    table.className = 'detail-table';
    
    // 创建表头
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    // 表头单元格
    const headers = ['部门', '2018', '2019', '2020', '2021', '2022', '2023', '合计', ''];
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        if (header === '') {
            th.style.width = '50px';
        }
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // 创建表体
    const tbody = document.createElement('tbody');
    
    // 添加行数据
    data.data.forEach((item, index) => {
        const row = document.createElement('tr');
        
        // 部门名称
        const deptCell = document.createElement('td');
        deptCell.className = 'dept-name';
        deptCell.textContent = item.department || '-';
        row.appendChild(deptCell);
        
        // 各年份数据
        const years = ['2018', '2019', '2020', '2021', '2022', '2023'];
        years.forEach(year => {
            const cell = document.createElement('td');
            cell.textContent = item.years[year] || 0;
            row.appendChild(cell);
        });
        
        // 合计
        const totalCell = document.createElement('td');
        totalCell.className = 'total-cell';
        totalCell.textContent = item.total || 0;
        row.appendChild(totalCell);
        
        // 展开按钮
        const expandCell = document.createElement('td');
        expandCell.className = 'action-cell';
        
        const expandBtn = document.createElement('button');
        expandBtn.className = 'expand-btn';
        expandBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
        expandBtn.onclick = function() {
            // 加载子部门数据
            loadSubDeptData(item.department, index, secondaryDept);
            
            // 切换图标
            const icon = this.querySelector('i');
            if (icon.classList.contains('fa-chevron-down')) {
                icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
            } else {
                icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
            }
        };
        
        expandCell.appendChild(expandBtn);
        row.appendChild(expandCell);
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    
    // 清空并添加内容
    departmentTab.innerHTML = '';
    tableContainer.appendChild(table);
    
    // 添加导出按钮和表格
    const headerDiv = document.createElement('div');
    headerDiv.className = 'tab-header-actions';
    headerDiv.appendChild(exportBtn);
    
    departmentTab.appendChild(headerDiv);
    departmentTab.appendChild(tableContainer);
}

// 初始化卡片放大功能
function initCardExpansion() {
    const expandButtons = document.querySelectorAll('.card-expand-btn');
    const cardOverlay = document.getElementById('card-overlay');
    
    // 绑定放大按钮点击事件
    expandButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const card = this.closest('.hr-card');
            
            if (card.classList.contains('expanded')) {
                // 收起卡片
                collapseCard(card);
            } else {
                // 展开卡片
                expandCard(card);
            }
        });
    });
    
    // 点击遮罩层关闭展开的卡片
    if (cardOverlay) {
        cardOverlay.addEventListener('click', function() {
            const expandedCard = document.querySelector('.hr-card.expanded');
            if (expandedCard) {
                collapseCard(expandedCard);
            }
        });
    }
    
    // 展开卡片函数
    function expandCard(card) {
        // 保存卡片原始位置，用于后续恢复
        const rect = card.getBoundingClientRect();
        card.originalRect = {
            top: rect.top + window.scrollY,
            left: rect.left,
            width: rect.width,
            height: rect.height
        };
        
        // 在原位置创建占位符，保持页面布局不变
        const placeholder = document.createElement('div');
        placeholder.id = `placeholder-${card.id}`;
        placeholder.style.width = `${rect.width}px`;
        placeholder.style.height = `${rect.height}px`;
        placeholder.style.margin = '0';
        placeholder.style.padding = '0';
        placeholder.style.visibility = 'hidden';
        
        // 插入占位符
        card.parentNode.insertBefore(placeholder, card);
        
        // 先收起其他已展开的卡片
        const expandedCards = document.querySelectorAll('.hr-card.expanded');
        expandedCards.forEach(expandedCard => {
            if (expandedCard !== card) {
                collapseCard(expandedCard);
            }
        });
        
        // 设置卡片为绝对定位，脱离文档流
        card.style.position = 'fixed';
        card.style.top = '10vh';
        card.style.left = '10vw';
        card.style.width = '80vw';
        card.style.height = '80vh';
        card.style.zIndex = '1000';
        
        // 显示遮罩层
        if (cardOverlay) {
            cardOverlay.style.display = 'block';
            setTimeout(() => {
                cardOverlay.classList.add('active');
            }, 10);
        }
        
        // 保存当前滚动位置
        window.cardScrollPosition = window.scrollY;
        
        // 添加展开类
        card.classList.add('expanded');
        
        // 切换按钮图标
        const icon = card.querySelector('.card-expand-btn i');
        if (icon) {
            icon.classList.replace('fa-expand-arrows-alt', 'fa-compress');
        }
        
        // 调整图表大小
        setTimeout(() => {
            if (card.id === 'card-1' && entryYearChart) {
                try {
                    entryYearChart.resize();
                } catch (e) {
                    console.error('展开时调整图表大小失败:', e);
                    // 尝试重新初始化图表
                    try {
                        loadEntryYearData(currentPrimaryDept, currentSecondaryDept);
                    } catch (err) {
                        console.error('重新加载图表失败:', err);
                    }
                }
            }
            // 可以添加其他图表的调整
        }, 300);
    }
    
    // 收起卡片函数
    function collapseCard(card) {
        // 找到对应的占位符
        const placeholder = document.getElementById(`placeholder-${card.id}`);
        
        // 确保originalRect存在
        if (!card.originalRect) {
            console.error('找不到卡片的原始位置信息');
            // 创建默认值以防止错误
            card.originalRect = {
                top: 0,
                left: 0,
                width: 300,
                height: 200
            };
        }
        
        // 首先记录下当前的scrollY，因为后续的DOM操作可能会影响滚动位置
        const currentScrollY = window.scrollY;
        
        // 先切换按钮图标 - 在其他样式变化前先执行视觉反馈
        const icon = card.querySelector('.card-expand-btn i');
        if (icon) {
            icon.classList.replace('fa-compress', 'fa-expand-arrows-alt');
        }
        
        // 准备回到原位 - 使用绝对定位临时设置
        card.style.top = `${card.originalRect.top}px`;
        card.style.left = `${card.originalRect.left}px`;
        card.style.width = `${card.originalRect.width}px`;
        card.style.height = `${card.originalRect.height}px`;
        
        // 移除展开类标记
        card.classList.remove('expanded');
        
        // 处理图表尺寸 - 在位置变化之前调整
        if (card.id === 'card-1' && entryYearChart) {
            try {
                // 预设置图表尺寸为原始尺寸
                entryYearChart.resize({
                    width: card.originalRect.width - 40, // 减去内边距
                    height: card.originalRect.height - 80 // 减去标题和内边距
                });
            } catch(e) {
                console.error('预调整图表尺寸失败:', e);
            }
        }
        
        // 隐藏遮罩层
        if (cardOverlay) {
            cardOverlay.classList.remove('active');
            setTimeout(() => {
                cardOverlay.style.display = 'none';
            }, 300);
        }
        
        // 恢复卡片原始样式和位置 - 必须在占位符删除前完成
        setTimeout(() => {
            card.style.transition = 'none'; // 暂时禁用过渡效果
            card.style.position = '';
            card.style.top = '';
            card.style.left = '';
            card.style.width = '';
            card.style.height = '';
            card.style.zIndex = '';
            card.style.transform = '';
            
            // 移除占位符
            if (placeholder) {
                placeholder.parentNode.removeChild(placeholder);
            }
            
            // 强制重绘
            card.offsetHeight;
            
            // 恢复过渡效果
            setTimeout(() => {
                card.style.transition = '';
            }, 50);
            
            // 恢复滚动位置
            window.scrollTo({
                top: currentScrollY,
                behavior: 'auto'
            });
            
            // 再次调整图表大小适应当前容器
            setTimeout(() => {
                if (card.id === 'card-1' && entryYearChart) {
                    try {
                        entryYearChart.resize();
                    } catch (e) {
                        console.error('收起时调整图表大小失败:', e);
                        // 尝试重新初始化图表
                        try {
                            loadEntryYearData(currentPrimaryDept, currentSecondaryDept);
                        } catch (err) {
                            console.error('重新加载图表失败:', err);
                        }
                    }
                }
            }, 200);
        }, 50);
    }
}

// 加载入职年份统计数据
function loadEntryYearData(primaryDept = 'all', secondaryDept = 'all') {
    // 显示加载状态
    const cardContent = document.querySelector('#card-1 .hr-card-content');
    const placeholderContent = cardContent.querySelector('.placeholder-content');
    const chartContainer = cardContent.querySelector('#entry-year-chart');
    
    placeholderContent.style.display = 'flex';
    placeholderContent.innerHTML = '正在加载数据...';
    chartContainer.style.display = 'none';
    
    // 构建查询参数
    const queryParams = new URLSearchParams();
    if (primaryDept !== 'all') {
        queryParams.append('primary_department', primaryDept);
    }
    if (secondaryDept !== 'all') {
        queryParams.append('secondary_department', secondaryDept);
    }
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    
    // 调用API获取数据
    fetch(getApiUrl(`/api/hr/statistics/entry-year${queryString}`))
        .then(response => response.json())
        .then(data => {
            // 隐藏占位符，显示图表容器
            placeholderContent.style.display = 'none';
            chartContainer.style.display = 'block';
            
            // 渲染图表
            renderEntryYearChart(data, chartContainer);
        })
        .catch(error => {
            console.error('获取入职年份数据失败:', error);
            placeholderContent.innerHTML = '加载数据失败，请刷新重试';
            placeholderContent.style.display = 'flex';
            chartContainer.style.display = 'none';
        });
}

// 渲染入职年份图表
function renderEntryYearChart(data, container) {
    // 如果图表实例已存在，销毁它
    if (entryYearChart) {
        entryYearChart.dispose();
    }
    
    // 创建新的图表实例
    entryYearChart = echarts.init(container);
    
    // 构建图表数据
    const years = data.year_data.map(item => item.year);
    const counts = data.year_data.map(item => item.count);
    
    // 计算Y轴最大值，确保有足够的空间显示标签
    const maxCount = Math.max(...counts, 1);
    // 根据最大值确定合适的Y轴上限
    let yMax = Math.ceil(maxCount * 1.2);
    // 确保Y轴上限是10的倍数，以便显示更美观的刻度
    yMax = Math.ceil(yMax / 10) * 10;
    // 设置最小值为0，确保从0开始显示
    const yMin = 0;
    
    // 图表配置
    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            formatter: '{b}年: {c}人'
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: '20px',
            containLabel: true
        },
        xAxis: [{
            type: 'category',
            data: years,
            axisTick: {
                alignWithLabel: true
            },
            axisLabel: {
                color: document.body.classList.contains('dark-mode') ? 'rgba(255, 255, 255, 0.7)' : '#666'
            }
        }],
        yAxis: [{
            type: 'value',
            min: yMin,
            max: yMax,
            // 设置间隔为10，使刻度更合理
            interval: 10,
            axisLabel: {
                color: document.body.classList.contains('dark-mode') ? 'rgba(255, 255, 255, 0.7)' : '#666',
                formatter: '{value}人'
            }
        }],
        series: [{
            name: '入职人数',
            type: 'bar',
            barWidth: '60%',
            data: counts.map((count, index) => {
                return {
                    value: count,
                    itemStyle: {
                        // 使用不同的颜色来区分不同的年份
                        color: getBarColor(index, document.body.classList.contains('dark-mode'))
                    }
                };
            }),
            label: {
                show: true,
                position: 'top',
                formatter: '{c}人',
                color: document.body.classList.contains('dark-mode') ? 'rgba(255, 255, 255, 0.9)' : '#333'
            }
        }]
    };
    
    // 设置图表选项并渲染
    entryYearChart.setOption(option);
    
    // 标记图表已经有数据
    container.dataset.hasData = true;
    
    // 处理窗口大小变化
    window.addEventListener('resize', function() {
        if (entryYearChart) {
            entryYearChart.resize();
        }
    });
    
    // 给图表添加点击事件，点击柱状图显示该年的详细数据
    entryYearChart.on('click', function(params) {
        const year = params.name;
        fetchEmployeesByYear(year, currentPrimaryDept, currentSecondaryDept);
    });
}

// 获取柱状图颜色
function getBarColor(index, isDarkMode) {
    // 浅色模式颜色数组
    const lightColors = [
        '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
        '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'
    ];
    
    // 深色模式颜色数组 - 稍微亮一些
    const darkColors = [
        '#7d9ef8', '#a4e283', '#ffd572', '#ff7e7e', '#90d9eb',
        '#4fdbaa', '#ffac78', '#b883d2', '#f89fd3'
    ];
    
    const colors = isDarkMode ? darkColors : lightColors;
    return colors[index % colors.length];
}

// 添加新函数用于加载二级部门入职年份数据
function loadSecondaryDeptEntryYearData() {
    // 获取当前选择的主部门
    const primaryDept = currentPrimaryDept;
    
    console.log('加载二级部门数据，使用一级部门:', primaryDept);
    
    // 首先尝试获取card-1-modal中的元素
    let secondaryTabLoading = document.getElementById('secondary-dept-tab-loading');
    let secondaryTabContent = document.getElementById('secondary-dept-tab-content');
    let secondaryTabError = document.getElementById('secondary-dept-tab');
    let chartContainer = document.getElementById('secondary-dept-chart');
    let tableContainer = document.getElementById('secondary-dept-table');
    
    // 如果找不到元素，尝试在其他模态框中查找
    if (!chartContainer || !tableContainer) {
        console.log('在card-1-modal中找不到图表容器，尝试在其他模态框中查找');
        
        // 尝试查找其他可能的元素ID
        const modalContent = document.querySelector('.tab-content[data-tab="secondary"]');
        if (modalContent) {
            secondaryTabLoading = modalContent.querySelector('.loading-indicator');
            chartContainer = modalContent.querySelector('.chart-container');
            tableContainer = modalContent.querySelector('.table-container');
            secondaryTabError = modalContent.querySelector('.error-message');
        }
    }
    
    // 显示加载状态
    if (secondaryTabLoading) secondaryTabLoading.style.display = 'flex';
    if (secondaryTabContent) secondaryTabContent.classList.add('loading');
    
    // 如果仍然找不到容器，则无法继续
    if (!chartContainer && !tableContainer) {
        console.error('在所有可能的位置都找不到二级部门图表或表格容器');
        return;
    }
    
    // 使用存在的容器
    const actualChartContainer = chartContainer || document.createElement('div');
    const actualTableContainer = tableContainer || document.createElement('div');
    
    // 清除错误信息
    if (secondaryTabError) secondaryTabError.style.display = 'none';
    
    // 如果一级部门是"全部"，显示提示信息
    if (primaryDept === 'all') {
        // 隐藏加载状态
        if (secondaryTabLoading) secondaryTabLoading.style.display = 'none';
        if (secondaryTabContent) secondaryTabContent.classList.remove('loading');
        
        // 显示提示信息
        if (actualChartContainer) actualChartContainer.innerHTML = '<div class="info-message">请先选择一级部门以查看对应的二级部门数据</div>';
        if (actualTableContainer) actualTableContainer.innerHTML = '';
        return;
    }
    
    // 请求数据 - 更新API路径以匹配后端路由
    fetch(getApiUrl(`/api/hr/statistics/entry-year-by-subdept?primary_department=${encodeURIComponent(primaryDept)}`))
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP错误状态码: ${response.status}`);
            }
            return response.json();
        })
        .then(result => {
            // 隐藏加载状态
            if (secondaryTabLoading) secondaryTabLoading.style.display = 'none';
            if (secondaryTabContent) secondaryTabContent.classList.remove('loading');
            
            // 处理数据
            const data = result.data || [];
            
            if (data.length === 0) {
                // 无数据情况处理
                if (actualChartContainer) actualChartContainer.innerHTML = '<div class="no-data">没有找到相关数据</div>';
                if (actualTableContainer) actualTableContainer.innerHTML = '<div class="no-data">没有找到相关数据</div>';
                return;
            }
            
            // 渲染图表
            if (actualChartContainer === chartContainer) {
                renderSecondaryDeptEntryYearChart(data);
            }
            
            // 渲染表格
            if (actualTableContainer === tableContainer) {
                renderSecondaryDeptTable(data);
            }
            
            // 绑定导出按钮
            const exportBtn = document.getElementById('export-secondary-dept');
            if (exportBtn) {
                exportBtn.onclick = function() {
                    exportSecondaryDeptDataToExcel(data);
                };
            }
        })
        .catch(error => {
            // 隐藏加载状态
            if (secondaryTabLoading) secondaryTabLoading.style.display = 'none';
            if (secondaryTabContent) secondaryTabContent.classList.remove('loading');
            
            // 显示错误
            console.error('加载二级部门入职年份数据失败:', error);
            
            // 显示错误提示
            if (secondaryTabError) {
                secondaryTabError.style.display = 'block';
                const errorElement = secondaryTabError.querySelector('.error-message') || secondaryTabError;
                if (errorElement.textContent) {
                    errorElement.textContent = '网络错误，请稍后重试';
                }
            } else if (actualChartContainer) {
                actualChartContainer.innerHTML = `<div class="error-message">加载数据失败: ${error.message}</div>`;
            }
        });
}

// 渲染二级部门入职年份图表
function renderSecondaryDeptEntryYearChart(data) {
    // 准备数据
    const deptNames = [];
    const series = [];
    
    // 获取所有年份
    const years = new Set();
    data.forEach(dept => {
        Object.keys(dept.years).forEach(year => years.add(parseInt(year)));
    });
    
    // 对年份进行排序
    const sortedYears = Array.from(years).sort();
    
    // 准备每个年份的系列数据
    sortedYears.forEach(year => {
        const yearData = [];
        data.forEach(dept => {
            yearData.push(dept.years[year] || 0);
        });
        
        series.push({
            name: `${year}年`,
            type: 'bar',
            stack: '入职',
            data: yearData
        });
    });
    
    // 准备部门名称
    data.forEach(dept => {
        deptNames.push(dept.department);
    });
    
    // 获取当前主题
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#eee' : '#333';
    const gridLineColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    // 图表配置
    const chartOptions = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        legend: {
            data: sortedYears.map(year => `${year}年`),
            textStyle: {
                color: textColor
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: deptNames,
            axisLine: {
                lineStyle: {
                    color: gridLineColor
                }
            },
            axisLabel: {
                color: textColor,
                interval: 0,
                rotate: 30
            }
        },
        yAxis: {
            type: 'value',
            name: '人数',
            axisLine: {
                lineStyle: {
                    color: gridLineColor
                }
            },
            axisLabel: {
                color: textColor
            },
            splitLine: {
                lineStyle: {
                    color: gridLineColor
                }
            }
        },
        series: series
    };
    
    // 获取容器
    const chartContainer = document.getElementById('secondary-dept-chart');
    
    // 销毁现有图表
    if (secondaryDeptChart) {
        secondaryDeptChart.dispose();
    }
    
    // 创建新图表
    secondaryDeptChart = echarts.init(chartContainer);
    secondaryDeptChart.setOption(chartOptions);
    
    // 处理窗口大小变化
    window.addEventListener('resize', function() {
        if (secondaryDeptChart) {
            secondaryDeptChart.resize();
        }
    });
}

// 渲染二级部门表格
function renderSecondaryDeptTable(data) {
    // 获取所有年份
    const years = new Set();
    data.forEach(dept => {
        Object.keys(dept.years).forEach(year => years.add(parseInt(year)));
    });
    
    // 对年份进行排序
    const sortedYears = Array.from(years).sort();
    
    // 创建表头
    let tableHtml = '<table class="detail-table"><thead><tr><th>二级部门</th>';
    
    sortedYears.forEach(year => {
        tableHtml += `<th>${year}年</th>`;
    });
    
    tableHtml += '<th>总计</th></tr></thead><tbody>';
    
    // 创建表格内容
    data.forEach(dept => {
        tableHtml += `<tr><td>${dept.department}</td>`;
        
        sortedYears.forEach(year => {
            tableHtml += `<td>${dept.years[year] || 0}</td>`;
        });
        
        tableHtml += `<td>${dept.total}</td></tr>`;
    });
    
    tableHtml += '</tbody></table>';
    
    // 更新表格容器
    document.getElementById('secondary-dept-table').innerHTML = tableHtml;
}

// 导出二级部门数据到Excel
function exportSecondaryDeptDataToExcel(data) {
    // 获取所有年份
    const years = new Set();
    data.forEach(dept => {
        Object.keys(dept.years).forEach(year => years.add(parseInt(year)));
    });
    
    // 对年份进行排序
    const sortedYears = Array.from(years).sort();
    
    // 创建工作表数据
    const worksheetData = [];
    
    // 添加表头
    const header = ['二级部门'];
    sortedYears.forEach(year => header.push(`${year}年`));
    header.push('总计');
    worksheetData.push(header);
    
    // 添加数据行
    data.forEach(dept => {
        const row = [dept.department];
        
        sortedYears.forEach(year => {
            row.push(dept.years[year] || 0);
        });
        
        row.push(dept.total);
        worksheetData.push(row);
    });
    
    // 获取当前选择的主部门
    const primaryDeptSelect = document.getElementById('primary-dept-filter');
    const primaryDept = primaryDeptSelect ? primaryDeptSelect.value : '全部';
    
    // 获取当前日期
    const today = new Date();
    const dateString = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
    
    // 创建工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '二级部门入职年份分布');
    
    // 导出Excel文件
    XLSX.writeFile(wb, `二级部门入职年份分布_${primaryDept}_${dateString}.xlsx`);
}

// 刷新图表函数
function refreshCharts() {
    // 如果有打开的模态框，根据当前活动的标签重新加载数据
    const modal = document.getElementById('entry-year-tabs-modal');
    if (modal && modal.classList.contains('active')) {
        const activeTab = modal.querySelector('.tab.active');
        if (activeTab) {
            const targetId = activeTab.getAttribute('data-target');
            if (targetId === 'year-tab-content') {
                loadEntryYearData();
            } else if (targetId === 'department-tab-content') {
                loadDepartmentDimensionData();
            } else if (targetId === 'secondary-tab-content') {
                loadSecondaryDeptEntryYearData();
            }
        }
    }
}

// 添加loadDepartmentDimensionData函数
function loadDepartmentDimensionData() {
    // 获取当前选择的部门筛选条件
    const primaryDept = currentPrimaryDept;
    const secondaryDept = currentSecondaryDept;
    
    console.log('加载部门维度数据:', primaryDept, secondaryDept);
    
    // 显示加载状态
    document.getElementById('department-tab').innerHTML = `
        <div class="tab-placeholder">
            <i class="fas fa-spinner fa-spin"></i>
            <p>正在加载部门维度数据...</p>
        </div>
    `;
    
    // 构建查询参数
    const queryParams = new URLSearchParams();
    if (primaryDept !== 'all') {
        queryParams.append('primary_department', primaryDept);
    }
    if (secondaryDept !== 'all') {
        queryParams.append('secondary_department', secondaryDept);
    }
    
    // 调用API获取数据
    fetch(getApiUrl(`/api/hr/statistics/entry-year-by-dept?${queryParams.toString()}`))
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP错误状态码: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // 准备表格数据
            renderDeptDimensionTable(data, primaryDept, secondaryDept);
        })
        .catch(error => {
            console.error('获取部门维度数据失败:', error);
            document.getElementById('department-tab').innerHTML = `
                <div class="tab-placeholder">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>加载数据失败</p>
                    <button class="retry-btn">重试</button>
                </div>
            `;
            
            // 添加重试按钮事件
            document.querySelector('#department-tab .retry-btn').onclick = function() {
                loadDepartmentDimensionData();
            };
        });
}

// 按二级部门加载入职年份数据
function loadEntryYearBySubDept(primaryDept, secondaryDept = 'all') {
    if (!primaryDept || primaryDept === 'all') {
        console.error('加载二级部门入职数据需要指定一级部门');
        return;
    }
    
    // 显示加载状态
    const modalContent = document.querySelector('#tabs-modal .tab-content[data-tab="subdept"]');
    const loadingIndicator = modalContent.querySelector('.loading-indicator');
    const dataContainer = modalContent.querySelector('.data-container');
    
    loadingIndicator.style.display = 'flex';
    dataContainer.innerHTML = '';
    
    // 构建查询参数
    const queryParams = new URLSearchParams();
    queryParams.append('primary_dept', primaryDept);
    queryParams.append('start_year', '2020'); // 默认从2020年开始统计
    
    if (secondaryDept !== 'all') {
        queryParams.append('secondary_department', secondaryDept);
    }
    
    // 调用API获取数据
    fetch(getApiUrl(`/api/hr/statistics/entry-year-by-subdept?${queryParams.toString()}`))
        .then(response => response.json())
        .then(data => {
            // 隐藏加载指示器
            loadingIndicator.style.display = 'none';
            
            // 渲染二级部门数据表格
            renderSubDeptTable(data, dataContainer);
        })
        .catch(error => {
            console.error('获取二级部门入职数据失败:', error);
            loadingIndicator.style.display = 'none';
            dataContainer.innerHTML = '<div class="error-message">加载数据失败，请重试</div>';
        });
}

// 渲染二级部门入职数据表格
function renderSubDeptTable(data, container) {
    if (!data.data || data.data.length === 0) {
        container.innerHTML = '<div class="no-data-message">没有找到匹配的数据</div>';
        return;
    }
    
    // 创建表格
    const table = document.createElement('table');
    table.className = 'detail-table';
    
    // 创建表头
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>二级部门</th>
            <th>员工数量</th>
            <th>百分比</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // 创建表体
    const tbody = document.createElement('tbody');
    data.data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.department}</td>
            <td>${item.count}人</td>
            <td>${item.percentage}%</td>
        `;
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    
    // 添加表格到容器
    container.innerHTML = '';
    
    // 添加标题和总计信息
    const header = document.createElement('div');
    header.className = 'table-header';
    header.innerHTML = `
        <h3>${data.primary_dept}部门(${data.start_year}年至今)入职统计</h3>
        <div class="total-info">总计: ${data.total_count}人</div>
    `;
    
    container.appendChild(header);
    container.appendChild(table);
    
    // 添加导出按钮
    const exportBtn = document.createElement('button');
    exportBtn.className = 'export-btn';
    exportBtn.innerHTML = '导出Excel';
    exportBtn.addEventListener('click', () => exportSubDeptDataToExcel(data));
    container.appendChild(exportBtn);
}

// 导出二级部门数据到Excel
function exportSubDeptDataToExcel(data) {
    // 创建工作簿
    const wb = XLSX.utils.book_new();
    
    // 准备数据
    const exportData = data.data.map(item => {
        return {
            '二级部门': item.department,
            '员工数量': item.count,
            '百分比': `${item.percentage}%`
        };
    });
    
    // 创建工作表
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // 设置列宽
    const colWidths = [
        { wch: 20 }, // 二级部门
        { wch: 10 }, // 员工数量
        { wch: 10 }  // 百分比
    ];
    ws['!cols'] = colWidths;
    
    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, `${data.primary_dept}部门入职统计`);
    
    // 导出文件
    XLSX.writeFile(wb, `${data.primary_dept}部门入职统计_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// 添加调试函数，用于验证二级部门数据
function testSecondaryDeptData() {
    // 测试几个不同的一级部门
    const primaryDepts = ['技术中心', '销售部', '市场部', 'all'];
    
    primaryDepts.forEach(dept => {
        console.log(`测试一级部门[${dept}]的二级部门数据...`);
        
        // 构建URL
        const url = getApiUrl(`/api/hr/departments/secondary?primary=${encodeURIComponent(dept)}`);
        
        // 发送请求
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP错误状态码: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log(`一级部门[${dept}]的二级部门数据:`, data);
            })
            .catch(error => {
                console.error(`获取一级部门[${dept}]的二级部门数据失败:`, error);
            });
    });
} 