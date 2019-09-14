import sys
sys.path.append("../..")
from user.models.userInfo import *
from .telAndMail import *
from db import db
from datetime import datetime
from marshmallow import Schema, fields, pprint

class CompanyInfo(db.Model):
    '''员工'''
    __tablename__ = 'companyinfo'

    id = db.Column(db.Integer, primary_key=True)
    categoryName = db.Column(db.String(50))
    companyName = db.Column(db.String)
    companyLink = db.Column(db.String)
    storeName = db.Column(db.String)
    countNumber = db.Column(db.SmallInteger)

    customBianHao = db.Column(db.String)

    # 关联表，这里要与相关联的表的类型一直, user.id 表示关联到user表下的id字段
    belongTo = db.Column(db.Integer,db.ForeignKey('user.id'))
    # 第一个参数为你要关系到哪个模型的名字,也就是类名
    # db.backref('companys')第一个参数companys为要反向引用的名字,也可以用其他名字
    # 正向引用是companys访问user,反向引用是从User访问表companys
    user = db.relationship('UserInfo', backref=db.backref('companys'))

    # ！！ 外键关系已经在TelAndMailInfo类中设置了
    TelAndMailInfos = db.relationship('TelAndMailInfo', backref=db.backref('companyinfo'))

    isHaveHaiCang = db.Column(db.SMALLINT)

    city =  db.Column(db.String)

    shehuixinyongma = db.Column(db.String)
    yingyezhizhao = db.Column(db.String)
    registeraddress = db.Column(db.String)
    daibiaoren = db.Column(db.String)
    jiyingfanwei = db.Column(db.String)
    createtime  = db.Column(db.DateTime)
    dengjijiguan = db.Column(db.String)
    url = db.Column(db.String)
    cuxiaocount =  db.Column(db.Integer)
    beizhu = db.Column(db.String)
    qyqudao = db.Column(db.String)

    def __init__(self, categoryName, companyName, storeName, countNumber,shehuixinyongma, yingyezhizhao, registeraddress, daibiaoren, jiyingfanwei,createtime,dengjijiguan,url):
        self.categoryName = categoryName
        self.companyName = companyName
        self.storeName = storeName
        self.countNumber = countNumber
        self.shehuixinyongma = shehuixinyongma
        self.yingyezhizhao = yingyezhizhao
        self.registeraddress = registeraddress
        self.daibiaoren = daibiaoren
        self.jiyingfanwei = jiyingfanwei
        self.createtime = createtime
        self.dengjijiguan = dengjijiguan
        self.url = url
        # self.release_time = release_time if release_time else datetime.now()

    # def __repr__(self):
    #     return '<员工{},{},{},{}>'.format(self.id, self.categoryName, self.companyName, self.storeName)

class CompanyInfoScheme(Schema):
    '''员工'''
    id = fields.Int()
    categoryName = fields.Str()
    companyName = fields.Str()
    companyLink = fields.Str()
    storeName = fields.Str()
    countNumber = fields.Int()
    belongTo =  fields.Int()
    customBianHao = fields.Str()

    user = fields.Nested(UserInfoScheme)

    # 如果field是多个对象的集合, 定义时可以使用many参数:
    #
    TelAndMailInfos = fields.Nested(TelAndMailInfoScheme, many=True)

    isHaveHaiCang = fields.Int()
    city = fields.Str()
    shehuixinyongma = fields.Str()
    yingyezhizhao = fields.Str()
    registeraddress = fields.Str()
    daibiaoren = fields.Str()
    jiyingfanwei = fields.Str()
    createtime  = fields.Str()
    dengjijiguan = fields.Str()
    url = fields.Str()
    cuxiaocount =  fields.Int()
    beizhu =  fields.Str()
    qyqudao = fields.Str()