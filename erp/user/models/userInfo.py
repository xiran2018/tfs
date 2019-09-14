import sys
sys.path.append("../..")
from db import db
from datetime import datetime
from marshmallow import Schema, fields, pprint

class UserInfo(db.Model):
    '''员工'''
    __tablename__ = 'user'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String)
    userpassword = db.Column(db.String)
    mail = db.Column(db.String)
    status = db.Column(db.String)
    realname = db.Column(db.String)
    createtime = db.Column(db.DateTime)
    lasttime  = db.Column(db.DateTime)


    def __init__(self, username, userpassword, mail, status,realname, createtime, lasttime):
        self.username = username
        self.userpassword = userpassword
        self.mail = mail
        self.status = status
        self.realname = realname
        self.createtime = createtime
        self.lasttime = lasttime
        # self.release_time = release_time if release_time else datetime.now()

    # def __repr__(self):
    #     return '<员工{},{},{},{}>'.format(self.id, self.categoryName, self.companyName, self.storeName)

class UserInfoScheme(Schema):
    '''员工'''
    id = fields.Int()
    username = fields.Str()
    userpassword = fields.Str()
    mail = fields.Str()
    status = fields.Int()
    realname = fields.Str()
    createtime = fields.Str()
    lasttime = fields.Str()