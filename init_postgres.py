import sys
import os
from datetime import datetime
from sqlalchemy import text

# 确保能够导入项目模块
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# 导入应用和模型
from app import app
from database import db
from database.init_data import generate_mock_data
from models.employee import Employee

def init_postgres_db():
    """初始化PostgreSQL数据库"""
    print(f"[{datetime.now()}] 开始初始化PostgreSQL数据库...")
    
    with app.app_context():
        # 获取数据库连接并使用直接SQL删除表
        conn = db.engine.connect()
        trans = conn.begin()
        
        print(f"[{datetime.now()}] 正在删除旧表...")
        conn.execute(text("DROP TABLE IF EXISTS employees CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS alembic_version CASCADE;"))
        trans.commit()
        
        print(f"[{datetime.now()}] 已清除现有表")
        
        # 创建所有表
        db.create_all()
        print(f"[{datetime.now()}] 已创建表结构")
        
        # 检查表是否创建成功
        engine_tables = db.inspect(db.engine).get_table_names()
        print(f"[{datetime.now()}] 已创建的表: {', '.join(engine_tables)}")
        
        # 生成测试数据
        try:
            generate_mock_data()
            print(f"[{datetime.now()}] 已生成测试数据")
            
            # 验证数据
            emp_count = Employee.query.count()
            primary_count = db.session.query(db.func.count(db.distinct(Employee.primary_department))).scalar()
            secondary_count = db.session.query(db.func.count(db.distinct(Employee.secondary_department))).scalar()
            
            print(f"[{datetime.now()}] 验证数据: {emp_count}名员工, {primary_count}个一级部门, {secondary_count}个二级部门")
        except Exception as e:
            print(f"[{datetime.now()}] 生成测试数据时出错: {str(e)}")
    
    print(f"[{datetime.now()}] PostgreSQL数据库初始化完成")

if __name__ == "__main__":
    init_postgres_db() 