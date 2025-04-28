from app import app
from database import db
import os
import logging
from datetime import datetime

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 初始化应用和数据库
with app.app_context():
    try:
        # 创建所有表
        logger.info(f"[{datetime.now()}] 开始创建表结构...")
        db.create_all()
        
        # 检查表是否创建成功
        tables = db.engine.table_names()
        logger.info(f"[{datetime.now()}] 已创建的表: {', '.join(tables)}")
        
        # 如果员工表存在但没有数据，初始化测试数据
        from models.employee import Employee
        if Employee.query.count() == 0:
            logger.info(f"[{datetime.now()}] 开始初始化测试数据...")
            try:
                from database.init_data import generate_mock_data
                generate_mock_data()
                
                # 验证数据
                emp_count = Employee.query.count()
                primary_count = db.session.query(db.func.count(db.distinct(Employee.primary_department))).scalar()
                secondary_count = db.session.query(db.func.count(db.distinct(Employee.secondary_department))).scalar()
                logger.info(f"[{datetime.now()}] 数据初始化成功: {emp_count}名员工, {primary_count}个一级部门, {secondary_count}个二级部门")
            except Exception as e:
                logger.error(f"[{datetime.now()}] 初始化测试数据时出错: {str(e)}")
        else:
            logger.info(f"[{datetime.now()}] 数据库已有数据，跳过初始化")
    except Exception as e:
        logger.error(f"[{datetime.now()}] 数据库初始化失败: {str(e)}")
        
    logger.info(f"[{datetime.now()}] 应用初始化完成") 