from flask import Flask, jsonify
from flask_cors import CORS

# 创建简化版Flask应用
app = Flask(__name__)

# 启用CORS
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/')
def home():
    """首页"""
    return jsonify({
        "message": "欢迎使用HR数据分析API",
        "status": "online",
        "version": "1.0"
    })

@app.route('/api/test')
def test_api():
    """测试API是否正常工作"""
    return jsonify({
        "message": "API工作正常!",
        "status": "success"
    })

# Vercel需要这个变量
app = app 