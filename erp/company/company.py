from flask import Blueprint, render_template, jsonify,redirect, request

import sys
sys.path.append("..")
from db import db
from .models.companyInfo import *

import json

company = Blueprint('company', __name__)


@company.route('/home')
def index():
    return render_template('company/home.html')


# @company.route('/add/', methods=['GET', 'POST'])
# def add():
#     if request.method == 'POST':
#         p_company = request.form.get('companyname', None)
#         p_email = request.form.get('email', None)
#         p_password = request.form.get('password', None)
#
#         if not p_company or not p_email or not p_password:
#             return 'input error'
#
#         newobj = User(companyname=p_company, email=p_email, password=p_password)
#         db.session.add(newobj)
#         db.session.commit()
#         companys = User.query.all()
#         return render_template('company/add.html', companys=companys)
#     companys = User.query.all()
#     return render_template('company/add.html', companys=companys)

@company.route('/show',methods=['GET','POST'])
def show():
    # print(request.get_data())
    # print("###################")
    a = request.get_data() # 得到JavaScript发送的字符串流
    # print(type(a)) # bytes
    s1 = str(a, encoding='utf-8') # 解码为string
    # print(type(s1))
    # print(s1)
    dict1 = json.loads(s1) # 将string变成dict

    # data = json.loads(request.get_data('data'))
    pageNum = dict1['pagenum']
    companyName = dict1['companyName']
    storeName = dict1['storeName']
    bianhao = dict1['bianhao']
    belongTo = dict1['belongTo']
    startTime = dict1['startTime']
    endTime = dict1['endTime']

    # print(companyName)
    # print(daibiaoren)

    # print(page)
    # 分页查询, 每页3个, 查询第2页的数据
    pn = CompanyInfo.query.filter(
        CompanyInfo.companyName.like("%" + companyName + "%") if companyName is not None and companyName!="" else "",
        CompanyInfo.storeName.like("%" + storeName + "%") if storeName is not None and storeName!=""  else "",
        CompanyInfo.customBianHao.like("%" + bianhao + "%") if bianhao is not None and bianhao!=""  else "",
        CompanyInfo.belongTo.like("%" + belongTo + "%") if belongTo is not None and belongTo != "" else "",
        CompanyInfo.createtime.between(startTime,endTime) if startTime is not None and startTime!="" and endTime is not None and endTime!=""   else "",
        # CompanyInfo.createtime>startTime if startTime is not None and startTime != "" and (endTime is  None or endTime == "") else ""
    ).order_by(CompanyInfo.id.desc()).paginate(page=pageNum, per_page=50)
    # pn.items
    # # 获取该页的数据
    # pn.page
    # # 获取当前的页码
    # pn.pages
    # 获取总页数
    dict = {}

    dict["errCode"] = 200
    dict["errMessage"] = "请刷新页面重新试一次"

    cis = CompanyInfoScheme(many=True)
    result = cis.dump(pn.items)
    dict["info"]= result
    dict["totalNumberPage"] = pn.pages
    return jsonify(dict)


@company.route('/getComById',methods=['GET','POST'])
def getComById():
    a = request.get_data()  # 得到JavaScript发送的字符串流

    s1 = str(a, encoding='utf-8')  # 解码为string

    dict1 = json.loads(s1)  # 将string变成dict
    idn = int(dict1['id'])
    # print(type(idn))
    # print(idn)
    cif=CompanyInfo.query.filter_by(id=idn).first()
    cis = CompanyInfoScheme()
    result = cis.dump(cif)
    return jsonify(result)

@company.route('/testById',methods=['GET','POST'])
def testById():

    idargs = request.args.get("id")
    idn = int(idargs)
    print(type(idargs))
    print(idn)
    cif=CompanyInfo.query.filter_by(id=idn).first()
    cis = CompanyInfoScheme()
    result = cis.dump(cif)
    return jsonify(result)


@company.route('/deleteCompany',methods=['GET','POST'])
def deleteCompany():
    a = request.get_data()  # 得到JavaScript发送的字符串流

    s1 = str(a, encoding='utf-8')  # 解码为string

    dict1 = json.loads(s1)  # 将string变成dict
    idn = int(dict1['id'])
    # print(type(idn))
    # print(idn)
    CompanyInfo.query.filter_by(id=idn).delete()
    db.session.commit()
    return jsonify({"flag":1})


@company.route('/showAll',methods=['GET','POST'])
def showAll():
    # dict = {}
    companyInfo = CompanyInfo.query.all()
    cis = CompanyInfoScheme(many=True)
    result = cis.dump(companyInfo)
    # print(result)
    # for i in companyInfo:
    #     print(i.companyName)
    #     dict[i.id] = json.dumps(obj=i.__dict__,ensure_ascii=False)
    return jsonify(result)
