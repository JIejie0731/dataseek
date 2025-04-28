from flask import Flask, send_from_directory
from flask_cors import CORS
import os

# 修改导入路径
from config import Config
from database import db
from database.db_manager import init_db
from controllers.hr_controller import hr_bp

# 创建Flask应用
app = Flask(__name__, 
            static_folder=os.path.abspath('../frontend'),
            static_url_path='')

# 配置应用
app.config.from_object(Config)

# 初始化数据库
db.init_app(app)

# 启用CORS
CORS(app, resources={r"/*": {"origins": "*"}})

# 注册蓝图
app.register_blueprint(hr_bp)

@app.route('/')
def index():
    """提供前端首页"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """提供静态文件"""
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        # 处理SPA路由，返回index.html
        return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/test')
def test_api():
    """测试API是否正常工作"""
    return {"message": "API工作正常!", "status": "success"}

@app.before_first_request
def create_tables():
    """首次请求前创建数据表（如果不存在）"""
    db.create_all()
    
    # 检查数据库是否需要初始化数据
    from models.employee import Employee
    if Employee.query.count() == 0:
        try:
            # 导入并运行数据初始化
            from database.init_data import generate_mock_data
            generate_mock_data()
            print("已初始化测试数据")
        except Exception as e:
            print(f"初始化数据错误: {str(e)}")

if __name__ == '__main__':
    # 初始化数据库
    with app.app_context():
        init_db(app)
    
    # 启动应用服务器，使用端口3000
    app.run(debug=True, host='0.0.0.0', port=3000) 