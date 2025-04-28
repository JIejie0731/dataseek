import os
from dotenv import load_dotenv

# 尝试加载.env文件（如果存在）
try:
    load_dotenv()
except:
    pass

class Config:
    # Flask配置
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-for-data-quest'
    DEBUG = os.environ.get('FLASK_DEBUG', 'True') == 'True'
    
    # 数据库配置 - Neon PostgreSQL
    DATABASE_URL = os.environ.get('DATABASE_URL') or 'postgresql://neondb_owner:npg_Rd4T5NcfHVie@ep-billowing-morning-a1zikan5-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
    
    # 修复postgres://前缀问题
    if DATABASE_URL.startswith('postgres://'):
        DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
    
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # CORS配置
    CORS_HEADERS = 'Content-Type' 