from datetime import datetime
from database import db

class Employee(db.Model):
    """员工模型"""
    __tablename__ = 'employees'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    
    # 移除外键，使用字符串字段直接存储部门信息
    # department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    
    # 直接存储部门信息
    primary_department = db.Column(db.String(100), nullable=False)  # 一级部门
    secondary_department = db.Column(db.String(100), nullable=False)  # 二级部门
    
    position = db.Column(db.String(100), nullable=False)  # 职位
    entry_date = db.Column(db.Date, nullable=False)  # 入职日期
    salary = db.Column(db.Float, nullable=False)  # 薪资
    performance = db.Column(db.Float, nullable=False)  # 绩效评分 (1-5分)
    status = db.Column(db.String(20), nullable=False, default='在职')  # 状态：在职/离职
    
    # 时间戳
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.now)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)
    
    def __repr__(self):
        return f'<Employee {self.name}>'
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'name': self.name,
            'primary_department': self.primary_department,
            'secondary_department': self.secondary_department,
            'position': self.position,
            'entry_date': self.entry_date.strftime('%Y-%m-%d') if self.entry_date else None,
            'salary': self.salary,
            'performance': self.performance,
            'status': self.status
        } 