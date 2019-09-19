from flask import Blueprint, render_template, jsonify, redirect, request
from flask import send_from_directory

import sys
from openpyxl import Workbook

sys.path.append("..")
from db import db
from .models.companyInfo import *
from .export import export
from .update import update
from user.models.userInfo import *
from .models.fileInfo import *

import os
import datetime, uuid

from flask import make_response

import json

company = Blueprint('company', __name__)

ALLOWED_EXTENSIONS = set(['txt', 'png', 'jpg', 'xls', 'xlsx', 'JPG', 'PNG', 'gif', 'GIF', 'doc', 'docx'])


# 用于判断文件后缀
def allowe_file(filename):
    '''
    限制上传的文件格式
    :param filename:
    :return:
    '''
    return '.' in filename and filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS


def change_filename(filename):
    '''
    修改文件名称
    :param filename:
    :return:
    '''
    fileinfo = os.path.splitext(filename)
    filename = datetime.datetime.now().strftime("%Y%m%d%H%M%S") + str(uuid.uuid1().hex) + fileinfo[-1]
    return filename


@company.route('/home')
def index():
    return render_template('company/home.html')


@company.route('/show', methods=['GET', 'POST'])
def show():
    # print(request.get_data())
    # print("###################")
    a = request.get_data()  # 得到JavaScript发送的字符串流
    # print(type(a)) # bytes
    s1 = str(a, encoding='utf-8')  # 解码为string
    # print(type(s1))
    # print(s1)
    dict1 = json.loads(s1)  # 将string变成dict

    # data = json.loads(request.get_data('data'))
    pageNum = dict1['pagenum']
    companyName = dict1['companyName']
    storeName = dict1['storeName']
    bianhao = dict1['bianhao']
    belongTo = dict1['belongTo']
    startTime = dict1['startTime']
    endTime = dict1['endTime']

    userId = ""
    if belongTo != None and belongTo != "":
        userInfo = UserInfo.query.filter(UserInfo.realname.like("%" + belongTo + "%")).first()
        userId = userInfo.id

    print("===================userId:{}".format(userId))

    # print(page)
    # 分页查询, 每页3个, 查询第2页的数据
    pn = CompanyInfo.query.filter(
        CompanyInfo.companyName.like("%" + companyName + "%") if companyName is not None and companyName != "" else str(
            ""),
        CompanyInfo.storeName.like("%" + storeName + "%") if storeName is not None and storeName != "" else str(""),
        CompanyInfo.customBianHao.like("%" + bianhao + "%") if bianhao is not None and bianhao != "" else str(""),
        CompanyInfo.belongTo == userId if userId is not None and userId != "" else "",
        CompanyInfo.updatetime.between(startTime,
                                       endTime) if startTime is not None and startTime != "" and endTime is not None and endTime != "" else str(
            ""),
        CompanyInfo.updatetime > startTime if startTime is not None and startTime != "" and (
                    endTime is None or endTime == "") else ""
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
    dict["info"] = result
    dict["totalNumberPage"] = pn.pages
    return jsonify(dict)

@company.route('/fileshow', methods=['GET', 'POST'])
def fileShow():

    a = request.get_data()  # 得到JavaScript发送的字符串流

    s1 = str(a, encoding='utf-8')  # 解码为string

    dict1 = json.loads(s1)  # 将string变成dict

    # data = json.loads(request.get_data('data'))
    pageNum = dict1['pagenum']
    searchName = dict1['searchName']
    belongTo = dict1['belongTo']
    startTime = dict1['startTime']
    endTime = dict1['endTime']

    userId = ""
    if belongTo != None and belongTo != "":
        userInfo = UserInfo.query.filter(UserInfo.realname.like("%" + belongTo + "%")).first()
        userId = userInfo.id

    print("===================userId:{}".format(userId))

    # print(page)
    # 分页查询, 每页3个, 查询第2页的数据
    pn = FileInfo.query.filter(
        FileInfo.name.like("%" + searchName + "%") if searchName is not None and searchName != "" else str(""),
        FileInfo.belongTo == userId if userId is not None and userId != "" else "",
        FileInfo.updatetime.between(startTime,
                                       endTime) if startTime is not None and startTime != "" and endTime is not None and endTime != "" else str(
            ""),
        FileInfo.updatetime > startTime if startTime is not None and startTime != "" and (
                    endTime is None or endTime == "") else ""
    ).order_by(FileInfo.id.desc()).paginate(page=pageNum, per_page=20)
    # pn.items
    # # 获取该页的数据
    # pn.page
    # # 获取当前的页码
    # pn.pages
    # 获取总页数
    dict = {}

    dict["errCode"] = 200
    dict["errMessage"] = "请刷新页面重新试一次"

    cis = FileInfoScheme(many=True)
    # print("===================cis:{}".format(len(pn.items)))
    result = cis.dump(pn.items)
    dict["info"] = result
    dict["totalNumberPage"] = pn.pages
    return jsonify(dict)



@company.route('/getComById', methods=['GET', 'POST'])
def getComById():
    a = request.get_data()  # 得到JavaScript发送的字符串流

    s1 = str(a, encoding='utf-8')  # 解码为string

    dict1 = json.loads(s1)  # 将string变成dict
    idn = int(dict1['id'])
    # print(type(idn))
    # print(idn)
    cif = CompanyInfo.query.filter_by(id=idn).first()

    # summary_schema = UserSchema(only=('name', 'email'))
    # summary_schema.dump(user).data
    # {"name": "Monty Python", "email": "monty@python.org"}

    cis = CompanyInfoScheme()
    result = cis.dump(cif)
    return jsonify(result)


@company.route('/download', methods=['GET', 'POST'])
def download():
    print("在下载函数里执行了")

    id = request.form.get('id')
    fileInformation = FileInfo.query.filter(FileInfo.id == id).first()
    name=fileInformation.quchongFile

    # return jsonify({"描述":"出错了"})
    target_path = "upload"
    FilePath = os.path.join(target_path, name)
    if(os.path.exists(FilePath)):
        return send_from_directory(target_path, name, as_attachment=True)
    else:
        return jsonify(["您下载的文件不存在，已经被删除了！"])
    # file_name = "工作簿1.xlsx"
    # response = make_response(send_from_directory(target_path, "工作簿1.xlsx", as_attachment=True))
    # response.headers["Content-Disposition"] = "attachment; filename={}".format(file_name)
    # return response


@company.route('/uploadhtml', methods=['GET', 'POST'])
def uploadHtml():
    return render_template('upload/upload.html')


def saveCompany(companyListNotInDB, target_path, realfilename):
    # 创建一个工作薄
    wb = Workbook()

    # 创建一个工作表(注意是一个属性) # 激活 worksheet
    table = wb.active

    # excel创建的工作表名默认为sheet1,一下代码实现了给新创建的工作表创建一个新的名字
    table.title = 'ali数据'

    i = 0
    for rowele in companyListNotInDB:
        i = i + 1
        j = 0
        for ele in rowele:
            j = j + 1
            table.cell(row=i, column=j, value=ele)

        # 日期
    now_time = datetime.datetime.now().strftime('%Y-%m-%d %H-%M-%S')
    haveRead = "读取了";
    excelName = "{}-{}-{}-{}条.xlsx".format(realfilename, now_time, haveRead, len(companyListNotInDB))
    # FilePath = target_path + "/" + excelName
    FilePath = os.path.join(target_path, excelName)
    if (delFile(FilePath)):
        wb.save(FilePath)
        print("保存文件成功:{}，数据条数:{}".format(FilePath, len(companyListNotInDB)))
        return {"flag": True, "path": excelName}

def delFile(file):

    try:
        # 判断文件是否存在
        if (os.path.exists(file)):
            os.remove(file)
            # print('移除文件：%s' % file)
        # else:
        #     print("无相同文件不用删除！")
        return True
    except Exception as e:
        print('文件{}删除错误，可能文件被打开了，请关闭重试!'.format(file))
        return False

@company.route('/reupdate', methods=['GET', 'POST'])
def reupdate():

    a = request.get_data()  # 得到JavaScript发送的字符串流

    s1 = str(a, encoding='utf-8')  # 解码为string

    dict1 = json.loads(s1)  # 将string变成dict
    idn = int(dict1['id'])

    fileInformation = FileInfo.query.filter(FileInfo.id == idn).first()
    name = fileInformation.changeName
    realfilename = fileInformation.name

    start = 2
    end = -1
    savePath = "upload"
    sheetName = ""
    isUseNewUser = 1
    isquchong = 1
    reUpdateCompany(idn, start, end, savePath, name, sheetName, isUseNewUser, isquchong, realfilename)

    return jsonify({"flag":1})


def reUpdateCompany(insertId,start,end,savePath,filename,sheetName,isUseNewUser,isquchong,realfilename):

    filePath = os.path.join(savePath, filename)
    if sheetName == "":
        sheetName = "Sheet1"
    resultUpdate = update(insertId,filePath, sheetName, start, end, isUseNewUser, isquchong)

    companyListNotInDB = resultUpdate["companyListNotInDB"]
    resultSave = saveCompany(companyListNotInDB, savePath, realfilename)
    if resultSave["flag"]:
        quchongFileName = resultSave["path"]
        now_time = datetime.datetime.now().strftime('%Y-%m-%d %H-%M-%S')
        # 保存成功了，修改文件
        fileInformation = FileInfo.query.filter(FileInfo.id == insertId).first()
        fileInformation.status = 1  # 修改为了1
        fileInformation.quchongFile = quchongFileName
        fileInformation.updatetime = now_time

        db.session.commit()


@company.route('/upload', methods=['GET', 'POST'])
def upload():
    # print("在这里执行了")
    file = request.files.get('fileName')  # 获取文件

    realfilename = file.filename  # 获取文件名
    filename = change_filename(realfilename)
    # print("fileName:{}".format(filename))
    savePath = "upload"
    file.save(os.path.join(savePath, filename))  # 保存文件,保存到数据库中
    now_time = datetime.datetime.now().strftime('%Y-%m-%d %H-%M-%S')
    fileInformation = FileInfo(1, realfilename, filename, "", 0,0,0,now_time, now_time)
    db.session.add(fileInformation)
    db.session.flush()
    # 输出新插入数据的主键
    insertId = fileInformation.id
    db.session.commit()


    # start = 2
    # end = -1
    # filePath = os.path.join(savePath, filename)
    # # print(filePath)
    # sheetName = ""
    # if sheetName == "":
    #     sheetName = "Sheet1"
    # isUseNewUser = 1
    # isquchong = 1
    # resultUpdate = update(filePath, sheetName, start, end, isUseNewUser, isquchong)
    #
    # companyListNotInDB = resultUpdate["companyListNotInDB"]
    # resultSave = saveCompany(companyListNotInDB, savePath, realfilename)
    #
    # quchongFileName = resultSave["path"]
    # now_time = datetime.datetime.now().strftime('%Y-%m-%d %H-%M-%S')
    # #保存成功了，修改文件
    # fileInformation = FileInfo.query.filter(FileInfo.id==insertId).first()
    # fileInformation.status=1  #修改为了1
    # fileInformation.quchongFile=quchongFileName
    # fileInformation.updatetime = now_time
    #
    # db.session.commit()
    start = 2
    end = -1
    savePath = "upload"
    sheetName = ""
    isUseNewUser = 1
    isquchong = 1
    reUpdateCompany(insertId, start, end, savePath, filename, sheetName, isUseNewUser, isquchong, realfilename)

    return redirect('/p/uploadhtml')
    # return render_template('upload/upload.html')
    # return jsonify({"id":1})


@company.route('/exporthtml', methods=['GET', 'POST'])
def exportHtml():
    return render_template('export/export.html')


@company.route('/export', methods=['GET', 'POST'])
def exportCompany():
    target_path = "generateForDownload"
    # return send_from_directory(target_path, "2个完整-----测试.xlsx", as_attachment=True)

    companyName = request.form.get('companyName')
    storeName = request.form.get('storeName')
    belongTo = request.form.get('belongTo')
    bianhao = request.form.get('bianhao')
    shengfen = request.form.get('shengfen')
    city = request.form.get('city')
    countNumber = request.form.get('countNumber', type=int)
    canbaorenshu = request.form.get('canbaorenshu')
    isHaveCang = request.form.get('isHaveCang', type=int)
    startNumber = request.form.get('startNumber', type=int)
    endNumber = request.form.get('endNumber', type=int)
    yingxiaocount = request.form.get('yingxiaocount')
    startTime = request.form.get('startTime')
    endTime = request.form.get('endTime')
    isFromFileNumber = request.form.get('isFromFileNumber', type=int)

    userId = ""
    if belongTo != None and belongTo != "":
        userInfo = UserInfo.query.filter(UserInfo.realname.like("%" + belongTo + "%")).first()
        userId = userInfo.id

    resultExport = export(companyName, storeName, userId, bianhao, shengfen, city, \
                          countNumber, canbaorenshu, isHaveCang, startNumber, \
                          endNumber, yingxiaocount, startTime, endTime, isFromFileNumber, \
                          target_path)  # 返回结果{"flag": True, "tips": "没有从数据库中获取数据，可能行号过大","path":""}

    if (resultExport["flag"]):
        return send_from_directory(target_path, resultExport["path"], as_attachment=True)
    else:
        return jsonify(resultExport)
    # return jsonify(result)
    # target_path = ""
    # return send_from_directory(target_path, "2个完整-----测试.xlsx", as_attachment=True)


@company.route('/update', methods=['GET', 'POST'])
def updateCompany():
    start = request.args.get("s", default=-1)
    # print("==================start==={}".format(start))
    end = request.args.get("e", default=-1)
    # print("==================end==={}".format(end))
    start = int(start)
    end = int(end)
    filePath = request.args.get("f", default="")
    # print("==================filePath==={}".format(filePath))
    if (filePath == ""):
        return {"flag": False, "tips": "缺少文件名称选项"}
    elif (filePath.find(".") == -1):
        filePath = filePath + ".xlsx"
    sheetName = request.args.get("sheet", default="")
    if sheetName == "":
        sheetName = "Sheet1"
    isUseNewUser = 1
    result = update(filePath, sheetName, start, end, isUseNewUser)  # 返回结果{"flag": True, "tips": "更新数据成功","count":""}

    return jsonify(result)
    # return jsonify(result)


@company.route('/testById', methods=['GET', 'POST'])
def testById():
    idargs = request.args.get("id")
    idn = int(idargs)
    print(type(idargs))
    print(idn)
    cif = CompanyInfo.query.filter_by(id=idn).first()
    cis = CompanyInfoScheme(only=("companyName", "user.id"))  # only=("id",) 一个元素必须带逗号，因为接收的元素只能是元组，不带逗号就是一个字符串
    # exclude ，也可以排除哪些字段显示
    result = cis.dump(cif)
    return jsonify(result)


# http://127.0.0.1:8088/p/testById?id=1004

@company.route('/deleteCompany', methods=['GET', 'POST'])
def deleteCompany():
    a = request.get_data()  # 得到JavaScript发送的字符串流

    s1 = str(a, encoding='utf-8')  # 解码为string

    dict1 = json.loads(s1)  # 将string变成dict
    idn = int(dict1['id'])
    # print(type(idn))
    # print(idn)
    CompanyInfo.query.filter_by(id=idn).delete()
    db.session.commit()
    return jsonify({"flag": 1})


@company.route('/showAll', methods=['GET', 'POST'])
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