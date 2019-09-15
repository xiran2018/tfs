import sys
sys.path.append("../..")
from db import db
from marshmallow import Schema, fields, pprint

class QiYeTyleInfo(db.Model):
    '''企业类型'''
    __tablename__ = 'qiyetype'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String)
    createtime  = db.Column(db.DateTime)


    def __init__(self, name, createtime):
        self.name = name
        self.createtime = createtime



class QiYeTyleInfoScheme(Schema):
    '''企业类型'''
    id = fields.Int()
    name = fields.Str()
    createtime = fields.DateTime()