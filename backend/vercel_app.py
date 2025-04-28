from app import app
from database import db
import os

# 初始化应用和数据库
with app.app_context():
    # 创建所有表
    db.create_all()
    
    # 如果数据库为空，初始化测试数据
    try:
        from database.db_manager import init_db
        init_db(app)
        print("数据库初始化成功")
    except Exception as e:
        print(f"初始化测试数据时出错: {str(e)}") 