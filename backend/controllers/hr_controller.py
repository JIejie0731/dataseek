from flask import Blueprint, jsonify, request
from models.employee import Employee
from models.department import Department
from database import db
from sqlalchemy import func, distinct, extract
import datetime

# 创建蓝图
hr_bp = Blueprint('hr', __name__, url_prefix='/api/hr')

@hr_bp.route('/employees', methods=['GET'])
def get_employees():
    """获取员工列表"""
    employees = Employee.query.all()
    return jsonify([emp.to_dict() for emp in employees])

@hr_bp.route('/departments', methods=['GET'])
def get_departments():
    """获取部门结构（树状）"""
    # 只获取一级部门作为树的根节点
    departments = Department.query.filter_by(parent_id=None).all()
    return jsonify([dept.to_tree() for dept in departments])

@hr_bp.route('/statistics/headcount', methods=['GET'])
def get_headcount():
    """获取员工总数和部门分布"""
    # 总人数
    total_count = Employee.query.filter_by(status='在职').count()
    
    # 部门人数分布
    dept_stats = db.session.query(
        Department.name,
        func.count(Employee.id).label('count')
    ).join(Employee, Department.id == Employee.department_id)\
    .filter(Employee.status == '在职')\
    .group_by(Department.name).all()
    
    dept_data = [{'name': name, 'value': count} for name, count in dept_stats]
    
    return jsonify({
        'totalCount': total_count,
        'departmentDistribution': dept_data
    })

@hr_bp.route('/statistics/turnover', methods=['GET'])
def get_turnover():
    """获取员工流动情况（入职/离职）"""
    now = datetime.datetime.now()
    one_year_ago = now - datetime.timedelta(days=365)
    
    # 计算近一年离职率
    entry_count = Employee.query.filter(Employee.entry_date >= one_year_ago).count()
    exit_count = Employee.query.filter(
        Employee.status == '离职',
        Employee.updated_at >= one_year_ago
    ).count()
    
    turnover_rate = round((exit_count / entry_count * 100), 2) if entry_count > 0 else 0
    
    # 获取月度离职人数
    monthly_data = db.session.query(
        func.date_format(Employee.updated_at, '%Y-%m').label('month'),
        func.count().label('count')
    ).filter(
        Employee.status == '离职',
        Employee.updated_at >= one_year_ago
    ).group_by('month').all()
    
    return jsonify({
        'turnoverRate': turnover_rate,
        'monthlyData': [{'month': month, 'count': count} for month, count in monthly_data]
    })

@hr_bp.route('/statistics/performance', methods=['GET'])
def get_performance():
    """获取员工绩效分布"""
    # 绩效分级：1-1.9分，2-2.9分，3-3.9分，4-4.9分，5分
    performance_levels = {
        '1分': [1, 1.9],
        '2分': [2, 2.9],
        '3分': [3, 3.9],
        '4分': [4, 4.9],
        '5分': [5, 5]
    }
    
    performance_data = []
    for level, range_val in performance_levels.items():
        count = Employee.query.filter(
            Employee.status == '在职',
            Employee.performance >= range_val[0],
            Employee.performance <= range_val[1]
        ).count()
        performance_data.append({
            'level': level,
            'count': count
        })
    
    # 计算平均绩效
    avg_performance = db.session.query(
        func.avg(Employee.performance)
    ).filter(Employee.status == '在职').scalar() or 0
    
    return jsonify({
        'averagePerformance': round(avg_performance, 2),
        'distributionData': performance_data
    })

@hr_bp.route('/statistics/salary', methods=['GET'])
def get_salary():
    """获取薪资统计分析"""
    # 平均薪资
    avg_salary = db.session.query(
        func.avg(Employee.salary)
    ).filter(Employee.status == '在职').scalar() or 0
    
    # 按部门统计平均薪资
    dept_salary = db.session.query(
        Department.name,
        func.avg(Employee.salary).label('avg_salary')
    ).join(Department, Department.id == Employee.department_id)\
    .filter(Employee.status == '在职')\
    .group_by(Department.name).all()
    
    # 薪资区间分布
    salary_ranges = {
        '0-5k': [0, 5000],
        '5k-10k': [5000, 10000],
        '10k-15k': [10000, 15000],
        '15k-20k': [15000, 20000],
        '20k+': [20000, 999999]
    }
    
    salary_distribution = []
    for range_name, range_val in salary_ranges.items():
        count = Employee.query.filter(
            Employee.status == '在职',
            Employee.salary >= range_val[0],
            Employee.salary < range_val[1]
        ).count()
        salary_distribution.append({
            'range': range_name,
            'count': count
        })
    
    return jsonify({
        'averageSalary': round(avg_salary, 2),
        'departmentSalary': [
            {'department': dept, 'avgSalary': round(avg, 2)} 
            for dept, avg in dept_salary
        ],
        'salaryDistribution': salary_distribution
    })

@hr_bp.route('/departments/distinct', methods=['GET'])
def get_distinct_departments():
    """获取去重后的一级部门和二级部门列表"""
    try:
        # 获取去重后的一级部门
        primary_depts = db.session.query(distinct(Employee.primary_department)).\
            filter(Employee.primary_department != None).\
            order_by(Employee.primary_department).all()
        
        # 获取去重后的二级部门
        secondary_depts = db.session.query(distinct(Employee.secondary_department)).\
            filter(Employee.secondary_department != None).\
            order_by(Employee.secondary_department).all()
        
        # 格式化结果
        result = {
            "primary_departments": [dept[0] for dept in primary_depts],
            "secondary_departments": [dept[0] for dept in secondary_depts]
        }
        
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@hr_bp.route('/statistics/entry-year', methods=['GET'])
def get_entry_year_distribution():
    """获取员工入职年份分布"""
    try:
        # 获取筛选参数
        primary_dept = request.args.get('primary_department', 'all')
        secondary_dept = request.args.get('secondary_department', 'all')
        
        # 构建基本查询
        query = db.session.query(
            extract('year', Employee.entry_date).label('year'),
            func.count().label('count')
        )
        
        # 应用筛选条件
        if primary_dept != 'all':
            query = query.filter(Employee.primary_department == primary_dept)
        
        if secondary_dept != 'all':
            query = query.filter(Employee.secondary_department == secondary_dept)
        
        # 只统计在职员工
        query = query.filter(Employee.status == '在职')
        
        # 按年份分组并排序
        result = query.group_by('year').order_by('year').all()
        
        # 计算总人数和入职年限分布
        total_count = sum(item[1] for item in result)
        current_year = datetime.datetime.now().year
        year_ranges = {
            "0-1年": 0,
            "1-3年": 0,
            "3-5年": 0,
            "5-10年": 0,
            "10年以上": 0
        }
        
        # 处理数据
        year_data = []
        for year, count in result:
            year_data.append({"year": int(year), "count": count})
            
            # 计算工作年限并汇总
            years_of_service = current_year - int(year)
            if years_of_service <= 1:
                year_ranges["0-1年"] += count
            elif years_of_service <= 3:
                year_ranges["1-3年"] += count
            elif years_of_service <= 5:
                year_ranges["3-5年"] += count
            elif years_of_service <= 10:
                year_ranges["5-10年"] += count
            else:
                year_ranges["10年以上"] += count
        
        # 转换年限范围为数组格式
        year_range_data = [{"range": key, "count": value, "percentage": round(value/total_count*100, 1) if total_count > 0 else 0} 
                           for key, value in year_ranges.items()]
        
        return jsonify({
            "total_count": total_count,
            "year_data": year_data,
            "year_range_data": year_range_data
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@hr_bp.route('/employees/by-year', methods=['GET'])
def get_employees_by_year():
    """获取指定年份入职的员工明细"""
    try:
        # 获取筛选参数
        year = request.args.get('year')
        primary_dept = request.args.get('primary_department', 'all')
        secondary_dept = request.args.get('secondary_department', 'all')
        
        if not year:
            return jsonify({"error": "缺少年份参数"}), 400
            
        # 构建查询
        query = db.session.query(Employee)
        
        # 应用筛选条件：入职年份
        query = query.filter(extract('year', Employee.entry_date) == year)
        
        # 应用部门筛选
        if primary_dept != 'all':
            query = query.filter(Employee.primary_department == primary_dept)
        
        if secondary_dept != 'all':
            query = query.filter(Employee.secondary_department == secondary_dept)
        
        # 只查询在职员工
        query = query.filter(Employee.status == '在职')
        
        # 执行查询
        employees = query.all()
        
        # 构建结果
        result = []
        for emp in employees:
            result.append({
                "姓名": emp.name,
                "一级部门": emp.primary_department or "",
                "二级部门": emp.secondary_department or "",
                "职位": emp.position or "",
                "入职日期": emp.entry_date.strftime('%Y-%m-%d') if emp.entry_date else "",
                "薪资": f"{emp.salary:.2f}" if emp.salary else "",
                "绩效": f"{emp.performance:.1f}" if emp.performance is not None else "",
                "状态": emp.status or ""
            })
        
        return jsonify({
            "year": year,
            "count": len(result),
            "data": result
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@hr_bp.route('/statistics/entry-year-by-dept', methods=['GET'])
def get_entry_year_by_dept():
    """获取按部门分组的入职年份员工数量统计"""
    try:
        # 获取筛选参数
        start_year = request.args.get('start_year', '2020')
        primary_dept = request.args.get('primary_department', 'all')
        secondary_dept = request.args.get('secondary_department', 'all')
        
        # 构建查询
        query = db.session.query(
            Employee.primary_department.label('department'),
            func.count().label('employee_count')
        )
        
        # 过滤2020年及以后入职的员工
        query = query.filter(extract('year', Employee.entry_date) >= start_year)
        
        # 应用筛选条件
        if primary_dept != 'all':
            query = query.filter(Employee.primary_department == primary_dept)
        
        if secondary_dept != 'all':
            query = query.filter(Employee.secondary_department == secondary_dept)
        
        # 只统计在职员工
        query = query.filter(Employee.status == '在职')
        
        # 按一级部门分组
        query = query.group_by(Employee.primary_department)
        
        # 排序
        query = query.order_by(func.count().desc())
        
        # 执行查询
        result = query.all()
        
        # 格式化结果
        data = []
        total_count = 0
        
        for dept, count in result:
            if dept is None:
                dept_name = "未分配"
            else:
                dept_name = dept
            
            data.append({
                "department": dept_name,
                "count": count
            })
            total_count += count
        
        # 计算百分比
        for item in data:
            item["percentage"] = round(item["count"] / total_count * 100, 2) if total_count > 0 else 0
        
        return jsonify({
            "start_year": start_year,
            "primary_department": primary_dept,
            "secondary_department": secondary_dept,
            "total_count": total_count,
            "data": data
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@hr_bp.route('/statistics/entry-year-by-subdept', methods=['GET'])
def get_entry_year_by_subdept():
    """获取指定一级部门下按二级部门分组的入职年份员工数量统计"""
    try:
        # 获取筛选参数
        start_year = request.args.get('start_year', '2020')
        primary_dept = request.args.get('primary_dept')
        secondary_dept = request.args.get('secondary_department', 'all')
        
        if not primary_dept:
            return jsonify({"error": "缺少一级部门参数"}), 400
            
        # 构建查询
        query = db.session.query(
            Employee.secondary_department.label('department'),
            func.count().label('employee_count')
        )
        
        # 过滤2020年及以后入职的员工
        query = query.filter(extract('year', Employee.entry_date) >= start_year)
        
        # 只统计指定一级部门的员工
        query = query.filter(Employee.primary_department == primary_dept)
        
        # 应用二级部门筛选条件
        if secondary_dept != 'all':
            query = query.filter(Employee.secondary_department == secondary_dept)
        
        # 只统计在职员工
        query = query.filter(Employee.status == '在职')
        
        # 按二级部门分组
        query = query.group_by(Employee.secondary_department)
        
        # 排序
        query = query.order_by(func.count().desc())
        
        # 执行查询
        result = query.all()
        
        # 格式化结果
        data = []
        total_count = 0
        
        for dept, count in result:
            if dept is None:
                dept_name = "未分配"
            else:
                dept_name = dept
            
            data.append({
                "department": dept_name,
                "count": count
            })
            total_count += count
        
        # 计算百分比
        for item in data:
            item["percentage"] = round(item["count"] / total_count * 100, 2) if total_count > 0 else 0
        
        return jsonify({
            "start_year": start_year,
            "primary_dept": primary_dept,
            "secondary_department": secondary_dept,
            "total_count": total_count,
            "data": data
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500 