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
from models.department import Department
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
        
        # 创建一级部门
        dept_tech = Department(name='技术中心', level=1)
        dept_sales = Department(name='销售中心', level=1)
        dept_ops = Department(name='运营中心', level=1)
        dept_product = Department(name='产品中心', level=1)
        dept_finance = Department(name='财务中心', level=1)
        
        db.session.add_all([dept_tech, dept_sales, dept_ops, dept_product, dept_finance])
        db.session.commit()
        
        print("已创建一级部门")
        
        # 创建二级部门
        tech_depts = [
            Department(name='研发部', parent_id=dept_tech.id, level=2),
            Department(name='测试部', parent_id=dept_tech.id, level=2),
            Department(name='运维部', parent_id=dept_tech.id, level=2),
            Department(name='数据部', parent_id=dept_tech.id, level=2),
            Department(name='架构部', parent_id=dept_tech.id, level=2)
        ]
        
        sales_depts = [
            Department(name='国内销售', parent_id=dept_sales.id, level=2),
            Department(name='海外销售', parent_id=dept_sales.id, level=2),
            Department(name='电话销售', parent_id=dept_sales.id, level=2),
            Department(name='渠道销售', parent_id=dept_sales.id, level=2)
        ]
        
        ops_depts = [
            Department(name='市场运营', parent_id=dept_ops.id, level=2),
            Department(name='客户运营', parent_id=dept_ops.id, level=2),
            Department(name='内容运营', parent_id=dept_ops.id, level=2),
            Department(name='活动运营', parent_id=dept_ops.id, level=2)
        ]
        
        product_depts = [
            Department(name='产品设计', parent_id=dept_product.id, level=2),
            Department(name='用户体验', parent_id=dept_product.id, level=2),
            Department(name='产品运营', parent_id=dept_product.id, level=2),
            Department(name='产品分析', parent_id=dept_product.id, level=2)
        ]
        
        finance_depts = [
            Department(name='财务核算', parent_id=dept_finance.id, level=2),
            Department(name='资金管理', parent_id=dept_finance.id, level=2),
            Department(name='税务管理', parent_id=dept_finance.id, level=2),
            Department(name='预算管理', parent_id=dept_finance.id, level=2)
        ]
        
        all_depts = tech_depts + sales_depts + ops_depts + product_depts + finance_depts
        db.session.add_all(all_depts)
        db.session.commit()
        
        print("已创建二级部门")
        
        # 生成员工数据
        employees = []
        positions = ['初级', '中级', '高级', '资深', '专家']
        now = datetime.now()
        
        print("开始生成员工数据...")
        
        for dept in all_depts:
            # 每个部门生成5-15名员工
            for _ in range(random.randint(5, 15)):
                # 随机入职日期，1-5年内
                days_ago = random.randint(30, 5*365)
                entry_date = now - timedelta(days=days_ago)
                
                # 随机薪资，根据职级
                position_level = random.randint(0, 4)
                position = f"{positions[position_level]}{dept.name.replace('部','').replace('中心','')}工程师"
                base_salary = 8000 + position_level * 3000
                salary = base_salary * (1 + random.random() * 0.5)
                
                # 随机绩效，3-5之间
                performance = 3 + random.random() * 2
                
                # 状态，90%在职，10%离职
                status = '在职' if random.random() < 0.9 else '离职'
                
                # 创建员工
                emp = Employee(
                    name=generate_chinese_name(),
                    department_id=dept.id,
                    position=position,
                    entry_date=entry_date,
                    salary=round(salary, 2),
                    performance=round(performance, 1),
                    status=status
                )
                employees.append(emp)
        
        db.session.add_all(employees)
        db.session.commit()
        
        print(f"已生成 {len(all_depts)} 个部门和 {len(employees)} 名员工的模拟数据")

if __name__ == '__main__':
    generate_mock_data() 