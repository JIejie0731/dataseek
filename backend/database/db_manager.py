from . import db

def init_db(app):
    """初始化数据库连接"""
    db.init_app(app)
    
    # 创建所有表（如果不存在）
    with app.app_context():
        db.create_all()
        
def drop_all_tables(app):
    """删除所有表（开发/测试环境使用）"""
    with app.app_context():
        db.drop_all()
        
def reset_db(app):
    """重置数据库（开发/测试环境使用）"""
    with app.app_context():
        db.drop_all()
        db.create_all() 