import sys
import os
import random
from datetime import datetime, timedelta

# 确保能够导入项目模块
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

from app import app
from database import db
from models.department import Department
from models.employee import Employee
from sqlalchemy import text

def add_department_fields():
    """添加一级部门和二级部门字段，并更新数据"""
    with app.app_context():
        # 检查字段是否已存在并添加
        try:
            # 检查列是否存在
            result = db.session.execute(text("SHOW COLUMNS FROM employees LIKE 'primary_department'"))
            if not result.fetchone():
                db.session.execute(text("ALTER TABLE employees ADD COLUMN primary_department VARCHAR(100)"))
                print("成功添加一级部门字段")
            
            result = db.session.execute(text("SHOW COLUMNS FROM employees LIKE 'secondary_department'"))
            if not result.fetchone():
                db.session.execute(text("ALTER TABLE employees ADD COLUMN secondary_department VARCHAR(100)"))
                print("成功添加二级部门字段")
                
            db.session.commit()
        except Exception as e:
            print(f"添加字段时出错: {e}")
            db.session.rollback()
            return
        
        # 更新员工的一级和二级部门信息
        print("开始更新员工部门信息...")
        employees = db.session.query(Employee).all()
        updated_count = 0
        
        for emp in employees:
            # 获取员工所在部门
            dept = db.session.query(Department).get(emp.department_id)
            if not dept:
                continue
                
            # 如果是二级部门
            if dept.parent_id:
                # 获取一级部门
                primary_dept = db.session.query(Department).get(dept.parent_id)
                if primary_dept:
                    emp.primary_department = primary_dept.name
                    emp.secondary_department = dept.name
            else:
                # 如果是一级部门
                emp.primary_department = dept.name
                emp.secondary_department = None
            
            updated_count += 1
        
        # 提交更改
        db.session.commit()
        print(f"已更新 {updated_count} 名员工的部门信息")

if __name__ == '__main__':
    add_department_fields() 