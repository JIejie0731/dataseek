import sys
import os
import random
from datetime import datetime, timedelta

# 确保能够导入项目模块
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

# 修改导入路径
from app import app
from database import db
from models.employee import Employee
from database.db_manager import reset_db

# 中文名字生成辅助函数
def generate_chinese_name():
    """生成随机中文姓名"""
    first_names = ['张', '王', '李', '赵', '陈', '刘', '杨', '黄', '周', '吴', 
                   '徐', '孙', '马', '朱', '胡', '林', '郭', '何', '高', '罗']
    
    last_names = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '洋',
                  '艳', '勇', '军', '杰', '娟', '涛', '明', '超', '秀兰', '霞',
                  '平', '刚', '桂英', '文', '云', '洁', '峰', '辉', '健']
    
    return random.choice(first_names) + random.choice(last_names)

def generate_mock_data():
    """生成模拟数据"""
    with app.app_context():
        # 重置数据库
        reset_db(app)
        
        print("开始生成模拟数据...")
        
        # 定义部门结构 - 不再创建部门表，只在内存中定义结构
        primary_departments = {
            '技术中心': ['研发部', '测试部', '运维部', '数据部', '架构部'],
            '销售中心': ['国内销售', '海外销售', '电话销售', '渠道销售'],
            '运营中心': ['市场运营', '客户运营', '内容运营', '活动运营'],
            '产品中心': ['产品设计', '用户体验', '产品运营', '产品分析'],
            '财务中心': ['财务核算', '资金管理', '税务管理', '预算管理']
        }
        
        print("已定义部门结构")
        
        # 生成员工数据
        employees = []
        positions = ['初级', '中级', '高级', '资深', '专家']
        now = datetime.now()
        
        print("开始生成员工数据...")
        
        # 为每个部门创建员工
        for primary_dept, secondary_depts in primary_departments.items():
            for secondary_dept in secondary_depts:
                # 每个部门生成5-15名员工
                for _ in range(random.randint(5, 15)):
                    # 随机入职日期，1-5年内
                    days_ago = random.randint(30, 5*365)
                    entry_date = now - timedelta(days=days_ago)
                    
                    # 随机薪资，根据职级
                    position_level = random.randint(0, 4)
                    position = f"{positions[position_level]}{secondary_dept.replace('部','').replace('中心','')}工程师"
                    base_salary = 8000 + position_level * 3000
                    salary = base_salary * (1 + random.random() * 0.5)
                    
                    # 随机绩效，3-5之间
                    performance = 3 + random.random() * 2
                    
                    # 状态，90%在职，10%离职
                    status = '在职' if random.random() < 0.9 else '离职'
                    
                    # 创建员工，直接存储部门名称
                    emp = Employee(
                        name=generate_chinese_name(),
                        primary_department=primary_dept,
                        secondary_department=secondary_dept,
                        position=position,
                        entry_date=entry_date,
                        salary=round(salary, 2),
                        performance=round(performance, 1),
                        status=status
                    )
                    employees.append(emp)
        
        db.session.add_all(employees)
        db.session.commit()
        
        # 验证数据
        emp_count = Employee.query.count()
        primary_count = db.session.query(db.func.count(db.distinct(Employee.primary_department))).scalar()
        secondary_count = db.session.query(db.func.count(db.distinct(Employee.secondary_department))).scalar()
        
        print(f"已生成 {emp_count} 名员工数据，覆盖 {primary_count} 个一级部门和 {secondary_count} 个二级部门")

if __name__ == '__main__':
    generate_mock_data() 