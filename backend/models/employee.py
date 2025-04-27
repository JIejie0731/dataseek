from datetime import datetime
from database import db

class Employee(db.Model):
    """员工模型"""
    __tablename__ = 'employees'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'))
    position = db.Column(db.String(100))  # 职位
    entry_date = db.Column(db.Date, default=datetime.now)  # 入职日期
    salary = db.Column(db.Float)  # 薪资
    performance = db.Column(db.Float)  # 绩效评分 (1-5分)
    status = db.Column(db.String(20), default='在职')  # 状态：在职/离职
    
    # 新增字段
    primary_department = db.Column(db.String(100))  # 一级部门
    secondary_department = db.Column(db.String(100))  # 二级部门
    
    # 时间戳
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    def __repr__(self):
        return f'<Employee {self.name}>'
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'name': self.name,
            'department_id': self.department_id,
            'department_name': self.department.name if self.department else None,
            'primary_department': self.primary_department,
            'secondary_department': self.secondary_department,
            'position': self.position,
            'entry_date': self.entry_date.strftime('%Y-%m-%d') if self.entry_date else None,
            'salary': self.salary,
            'performance': self.performance,
            'status': self.status
        } 