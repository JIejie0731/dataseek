// 全局变量，存储当前过滤条件
let currentPrimaryDept = 'all';
let currentSecondaryDept = 'all';
let entryYearChart = null;

// 初始化部门筛选联动
function initDepartmentFilters() {
    const level1Select = document.getElementById('department-level-1');
    const level2Select = document.getElementById('department-level-2');
    
    // 从API获取部门数据
    fetch(getApiUrl('/api/hr/departments/distinct'))
        .then(response => response.json())
        .then(data => {
            // 保存二级部门数据到全局变量
            window.secondaryDepartments = data.secondary_departments || [];
            
            // 填充一级部门下拉框
            const primaryDepts = data.primary_departments || [];
            let optionsHtml = '<option value="all">一级部门</option>';
            
            primaryDepts.forEach(dept => {
                optionsHtml += `<option value="${dept}">${dept}</option>`;
            });
            
            level1Select.innerHTML = optionsHtml;
            
            // 监听一级部门选择变化
            level1Select.addEventListener('change', function() {
                currentPrimaryDept = this.value;
                updateSecondaryDepartments(this.value);
                applyFilter();
            });
            
            // 监听二级部门选择变化
            level2Select.addEventListener('change', function() {
                currentSecondaryDept = this.value;
                applyFilter();
            });
            
            // 初始加载数据
            loadEntryYearData('all', 'all');
        })
        .catch(error => {
            console.error('获取部门数据失败:', error);
        });
    
    // 更新二级部门下拉框
    function updateSecondaryDepartments(primaryDept) {
        // 重置二级部门下拉框
        level2Select.innerHTML = '<option value="all">二级部门</option>';
        
        // 如果选择了特定的一级部门，筛选相关的二级部门
        if (primaryDept !== 'all' && window.secondaryDepartments) {
            // 获取员工数据以找出与一级部门相关的二级部门
            fetch(getApiUrl(`/api/hr/employees`))
                .then(response => response.json())
                .then(data => {
                    const relatedDepts = new Set();
                    
                    // 筛选与选中一级部门相关的二级部门
                    data.forEach(employee => {
                        if (employee.primary_department === primaryDept && employee.secondary_department) {
                            relatedDepts.add(employee.secondary_department);
                        }
                    });
                    
                    // 填充二级部门下拉框
                    Array.from(relatedDepts).sort().forEach(dept => {
                        level2Select.innerHTML += `<option value="${dept}">${dept}</option>`;
                    });
                })
                .catch(error => {
                    console.error('获取员工数据失败:', error);
                });
        } else if (primaryDept === 'all' && window.secondaryDepartments) {
            // 如果选择"全部"，显示所有二级部门
            window.secondaryDepartments.forEach(dept => {
                level2Select.innerHTML += `<option value="${dept}">${dept}</option>`;
            });
        }
    }
}

// 应用部门筛选
function applyFilter() {
    // 获取筛选条件
    const primaryDept = currentPrimaryDept;
    const secondaryDept = currentSecondaryDept;
    
    // 加载入职年份数据
    loadEntryYearData(primaryDept, secondaryDept);
}

// 加载员工入职年份数据
function loadEntryYearData(primaryDept, secondaryDept) {
    // 显示加载指示器
    document.getElementById('card-1-loading').style.display = 'flex';
    document.getElementById('entry-year-chart').style.display = 'none';
    
    // 构建API请求URL
    const url = getApiUrl(`/api/hr/statistics/entry-year?primary_department=${primaryDept}&secondary_department=${secondaryDept}`);
    
    // 获取数据
    fetch(url)
        .then(response => response.json())
        .then(data => {
            // 隐藏加载指示器，显示图表
            document.getElementById('card-1-loading').style.display = 'none';
            document.getElementById('entry-year-chart').style.display = 'block';
            
            // 渲染图表
            renderEntryYearChart(data);
        })
        .catch(error => {
            console.error('获取入职年份数据失败:', error);
            document.getElementById('card-1-loading').style.display = 'none';
            document.getElementById('entry-year-chart').innerHTML = '<div class="chart-error">加载数据失败</div>';
            document.getElementById('entry-year-chart').style.display = 'flex';
        });
}

// 渲染入职年份图表
function renderEntryYearChart(data) {
    const chartContainer = document.getElementById('entry-year-chart');
    
    // 如果已有图表实例，销毁它
    if (entryYearChart) {
        entryYearChart.dispose();
    }
    
    // 初始化图表
    entryYearChart = echarts.init(chartContainer);
    
    // 准备数据
    const years = data.years || [];
    const counts = data.counts || [];
    
    // 图表配置
    const option = {
        tooltip: {
            trigger: 'axis',
            formatter: '{b}: {c} 人',
            axisPointer: {
                type: 'shadow'
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: years,
            axisLabel: {
                rotate: 45
            }
        },
        yAxis: {
            type: 'value',
            name: '人数'
        },
        series: [{
            name: '入职人数',
            type: 'bar',
            data: counts,
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#3b82f6' },
                    { offset: 1, color: '#93c5fd' }
                ])
            },
            emphasis: {
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#2563eb' },
                        { offset: 1, color: '#60a5fa' }
                    ])
                }
            }
        }]
    };
    
    // 设置图表
    entryYearChart.setOption(option);
    
    // 添加点击事件
    entryYearChart.on('click', function(params) {
        const year = params.name;
        fetchEmployeesByYear(year, currentPrimaryDept, currentSecondaryDept);
    });
    
    // 监听窗口大小改变，调整图表大小
    window.addEventListener('resize', function() {
        entryYearChart.resize();
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
    
    // 获取数据
    fetch(url)
        .then(response => response.json())
        .then(data => {
            // 存储当前数据用于导出
            window.currentDetailData = data;
            
            // 显示数据总数
            document.getElementById('detail-count').textContent = data.length;
            
            // 渲染表格
            renderDetailTable(data);
        })
        .catch(error => {
            console.error('获取员工明细数据失败:', error);
            document.getElementById('detail-loading').style.display = 'none';
            document.getElementById('detail-table').innerHTML = '<div class="detail-error">加载数据失败</div>';
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
    
    // 初始化分页
    const pageSize = 10;
    const totalPages = Math.ceil(data.length / pageSize);
    let currentPage = 1;
    
    // 渲染页码
    renderPagination(totalPages, currentPage);
    
    // 显示当前页的数据
    showPage(currentPage, data, pageSize);
    
    // 绑定导出按钮事件
    document.getElementById('export-excel-btn').onclick = function() {
        exportToExcel(data);
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
            <td>${employee.name || '-'}</td>
            <td>${employee.primary_department || '-'}</td>
            <td>${employee.secondary_department || '-'}</td>
            <td>${employee.position || '-'}</td>
            <td>${employee.entry_date || '-'}</td>
            <td>${employee.salary ? '¥' + employee.salary.toLocaleString() : '-'}</td>
            <td>${employee.performance || '-'}</td>
            <td>${getStatusLabel(employee.status)}</td>
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
    const data = window.currentDetailData || [];
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
            employee.name || '',
            employee.primary_department || '',
            employee.secondary_department || '',
            employee.position || '',
            employee.entry_date || '',
            employee.salary ? employee.salary.toString() : '',
            employee.performance || '',
            employee.status || ''
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

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化主题切换
    initThemeSwitcher();
    
    // 初始化用户菜单
    initUserMenu();
    
    // 初始化部门筛选
    initDepartmentFilters();
    
    // 初始化明细弹框关闭按钮
    document.getElementById('detail-close').addEventListener('click', function() {
        document.getElementById('detail-modal').classList.remove('active');
    });
    
    // 初始化选项卡功能
    initTabsModal();
});

// 初始化主题切换
function initThemeSwitcher() {
    const themeSwitcher = document.getElementById('themeSwitcher');
    const themeIcon = themeSwitcher.querySelector('i');
    
    // 检查本地存储中的主题设置
    const darkMode = localStorage.getItem('darkMode') === 'true';
    
    // 应用保存的主题设置
    if (darkMode) {
        document.body.classList.add('dark-mode');
        themeIcon.className = 'fas fa-sun';
    }
    
    // 绑定点击事件
    themeSwitcher.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        
        // 更新图标
        if (document.body.classList.contains('dark-mode')) {
            themeIcon.className = 'fas fa-sun';
            localStorage.setItem('darkMode', 'true');
        } else {
            themeIcon.className = 'fas fa-moon';
            localStorage.setItem('darkMode', 'false');
        }
        
        // 如果图表已初始化，重新渲染以适应主题
        if (entryYearChart) {
            entryYearChart.dispose();
            const chartData = entryYearChart.getOption();
            renderEntryYearChart({ years: chartData.xAxis[0].data, counts: chartData.series[0].data });
        }
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
    const entryYearTabsModal = document.getElementById('entry-year-tabs-modal');
    const tabsClose = document.getElementById('tabs-close');
    const tabButtons = document.querySelectorAll('.tab-button');
    
    // 绑定卡片1标题点击事件，打开选项卡弹窗
    const card1Title = document.querySelector('#card-1 .hr-card-title');
    card1Title.classList.add('clickable-title');
    card1Title.addEventListener('click', function() {
        entryYearTabsModal.classList.add('active');
        
        // 加载部门维度数据
        loadEntryYearByDept(currentPrimaryDept, currentSecondaryDept);
    });
    
    // 绑定关闭按钮事件
    tabsClose.addEventListener('click', function() {
        entryYearTabsModal.classList.remove('active');
    });
    
    // 绑定选项卡切换事件
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 移除所有选项卡的激活状态
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // 移除所有内容的激活状态
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // 激活当前选项卡和内容
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            
            // 如果是部门维度选项卡，加载数据
            if (tabId === 'department-tab') {
                loadEntryYearByDept(currentPrimaryDept, currentSecondaryDept);
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