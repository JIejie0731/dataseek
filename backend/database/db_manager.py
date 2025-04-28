from . import db
from sqlalchemy import text

def init_db(app):
    """初始化数据库连接"""
    db.init_app(app)
    
    # 创建所有表（如果不存在）
    with app.app_context():
        db.create_all()
        
def drop_all_tables(app):
    """删除所有表（开发/测试环境使用）"""
    with app.app_context():
        conn = db.engine.connect()
        # 使用SQL直接删除所有表（绕过外键约束）
        conn.execute(text("DROP TABLE IF EXISTS employees CASCADE;"))
        # 不再需要departments表
        # conn.execute(text("DROP TABLE IF EXISTS departments CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS alembic_version CASCADE;"))
        conn.commit()
        
def reset_db(app):
    """重置数据库（开发/测试环境使用）"""
    with app.app_context():
        drop_all_tables(app)
        db.create_all() 