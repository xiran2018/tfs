import sys
sys.path.append("../..")
from db import db
from marshmallow import Schema, fields, pprint

class JingYingInfo(db.Model):
    '''经营状态'''
    __tablename__ = 'jystatus'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String)
    createtime = db.Column(db.DateTime)

    def __init__(self, name, createtime):
        self.name = name
        self.createtime = createtime

class JingYingInfoScheme(Schema):
    '''经营状态'''
    id = fields.Int()
    name = fields.Str()
    createtime = fields.DateTime()