import sys
import os
from sqlalchemy import text

# 确保能够导入项目模块
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# 导入应用和数据库
from app import app
from database import db
from database.init_data import generate_mock_data

def reset_database():
    """完全重置数据库，删除所有表并重新创建"""
    with app.app_context():
        # 获取数据库连接
        conn = db.engine.connect()
        
        try:
            # 开始事务
            trans = conn.begin()
            
            # 使用SQL直接删除所有表（绕过外键约束）
            print("正在删除所有表...")
            conn.execute(text("DROP TABLE IF EXISTS employees CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS departments CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS alembic_version CASCADE;")) # 如果有迁移表
            
            # 提交事务
            trans.commit()
            print("表删除成功")
            
            # 重新创建表
            print("正在创建新表结构...")
            db.create_all()
            
            # 生成测试数据
            print("正在生成测试数据...")
            generate_mock_data()
            
            # 验证
            from models.employee import Employee
            emp_count = Employee.query.count()
            primary_depts = db.session.query(db.func.count(db.distinct(Employee.primary_department))).scalar()
            secondary_depts = db.session.query(db.func.count(db.distinct(Employee.secondary_department))).scalar()
            
            print(f"数据库重置完成：已创建 {emp_count} 名员工，覆盖 {primary_depts} 个一级部门和 {secondary_depts} 个二级部门")
        
        except Exception as e:
            print(f"数据库重置过程中出错: {str(e)}")
        finally:
            conn.close()

if __name__ == "__main__":
    reset_database() 