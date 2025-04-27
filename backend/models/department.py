from database import db

class Department(db.Model):
    """部门模型"""
    __tablename__ = 'departments'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('departments.id'))
    level = db.Column(db.Integer, default=1)  # 部门级别：1=一级部门，2=二级部门，以此类推
    
    # 关系
    employees = db.relationship('Employee', backref='department', lazy='dynamic')
    children = db.relationship('Department', 
                              backref=db.backref('parent', remote_side=[id]),
                              lazy='dynamic')
    
    def __repr__(self):
        return f'<Department {self.name}>'
    
    def to_dict(self):
        """转换为字典（基本信息）"""
        return {
            'id': self.id,
            'name': self.name,
            'parent_id': self.parent_id,
            'level': self.level,
            'employee_count': self.employees.filter_by(status='在职').count()
        }
    
    def to_tree(self):
        """转换为树状结构（包含子部门）"""
        result = self.to_dict()
        children = [child.to_tree() for child in self.children]
        if children:
            result['children'] = children
        return result 