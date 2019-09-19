import sys
sys.path.append("../..")
from user.models.userInfo import *
from .companyInfo import *
from db import db
from datetime import datetime
from marshmallow import Schema, fields, pprint

class FileInfo(db.Model):
    '''去重'''
    __tablename__ = 'fileInfo' # 去重的上传的文件信息

    id = db.Column(db.Integer, primary_key=True)

    userid = db.Column(db.Integer,db.ForeignKey('user.id'))
    # 第一个参数为你要关系到哪个模型的名字,也就是类名
    # db.backref('companys')第一个参数companys为要反向引用的名字,也可以用其他名字
    # 正向引用是companys访问user,反向引用是从User访问表companys
    userinfo = db.relationship('UserInfo', backref=db.backref('fileInfo'))
    # ！！！ 不在这里设置了，因为在一对多关系中的一的一方设置了

    name = db.Column(db.String) # 上传的文件名称
    changeName = db.Column(db.String) # 生成的文件名称，路径不在这里存储，方便后续可以修改
    quchongFile = db.Column(db.String)  # 上传的文件名称
    status = db.Column(db.SmallInteger) # 状态，1： 成功生成了去重文件  0：生成去重文件失败
    updateCount = db.Column(db.Integer) # 更新的次数
    lineNumber = db.Column(db.Integer)  # 更新到的行数
    createtime  = db.Column(db.DateTime)
    updatetime = db.Column(db.DateTime)


    def __init__(self, userid, name, changeName, quchongFile,status, updateCount,lineNumber,createtime, updatetime):
        self.userid = userid
        self.name = name
        self.changeName = changeName
        self.quchongFile = quchongFile
        self.status =status
        self.updateCount = updateCount
        self.lineNumber = lineNumber
        self.createtime = createtime
        self.updatetime = updatetime



class FileInfoScheme(Schema):
    '''员工'''
    id = fields.Int()
    userid = fields.Int()
    # 如果field是多个对象的集合, 定义时可以使用many参数:

    userinfo = fields.Nested(UserInfoScheme)

    name = fields.Str()
    changeName = fields.Str()
    quchongFile = fields.Str()
    status = fields.Int()
    updateCount = fields.Int()  # 更新的次数
    lineNumber = fields.Int()  # 更新到的行数

    createtime  = fields.Str()
    updatetime = fields.Str()
