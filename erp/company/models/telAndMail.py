import sys
sys.path.append("../..")
from user.models.userInfo import *
from .companyInfo import *
from db import db
from datetime import datetime
from marshmallow import Schema, fields, pprint

class TelAndMailInfo(db.Model):
    '''员工'''
    __tablename__ = 'telandmail'

    id = db.Column(db.Integer, primary_key=True)

    companyid = db.Column(db.Integer,db.ForeignKey('companyinfo.id'))
    # 第一个参数为你要关系到哪个模型的名字,也就是类名
    # db.backref('companys')第一个参数companys为要反向引用的名字,也可以用其他名字
    # 正向引用是companys访问user,反向引用是从User访问表companys
    # companyinfo = db.relationship('CompanyInfo', backref=db.backref('TelAndMailInfos'))
    # ！！！ 不在这里设置了，因为在一对多关系中的一的一方设置了

    type = db.Column(db.SmallInteger) #1: 手机  2：电话  3：qq 4: 邮箱
    value = db.Column(db.String)
    status = db.Column(db.SmallInteger) # 0 无用，1，有用
    beizhu = db.Column(db.String)
    createtime  = db.Column(db.DateTime)
    updatetime = db.Column(db.DateTime)


    def __init__(self, companyid, type, value, status,beizhu, createtime, updatetime):
        self.companyid = companyid
        self.type = type
        self.value = value
        self.status = status
        self.beizhu = beizhu
        self.createtime = createtime
        self.updatetime = updatetime
    #     self.daibiaoren = daibiaoren
    #     self.jiyingfanwei = jiyingfanwei
    #     self.createtime = createtime
    #     self.dengjijiguan = dengjijiguan
    #     self.url = url
    #     # self.release_time = release_time if release_time else datetime.now()


class TelAndMailInfoScheme(Schema):
    '''员工'''
    id = fields.Int()

    companyid = fields.Int()

    # 如果field是多个对象的集合, 定义时可以使用many参数:
    #
    # collaborators = fields.Nested(UserSchema, many=True)

    type = fields.Int()
    value = fields.Str()
    status = fields.Int()  # 0 无用，1，有用
    beizhu = fields.Str()
    createtime  = fields.Str()
    updatetime = fields.Str()
