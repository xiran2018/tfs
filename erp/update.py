from db import db
from db import app
from flask import Flask, request, jsonify,render_template,session

import os

from datetime import timedelta

from admin.admin import admin
from user.user import user
from company.company import company
from company.export import *
from company.update import *

# app=Flask(__name__)
app.config['JSON_AS_ASCII'] = False
app.config['SECRET_KEY']=os.urandom(24)   #设置为24位的字符,每次运行服务器都是不同的，所以服务器启动一次上次的session就清除。
app.config['PERMANENT_SESSION_LIFETIME']=timedelta(hours=1) #设置session的保存时间。
#添加数据到session
#操作的时候更操作字典是一样的

@app.before_request
def print_request_info():
    print("请求地址：" + str(request.path))
    if 'username' in session:
        print('已登录')
        pass
    else:
        # return '未登录'
        print('未登录')
        pass

    # print("请求地址：" + str(request.path))
    # print("请求方法：" + str(request.method))
    # print("---请求headers--start--")
    # print(str(request.headers).rstrip())
    # print("---请求headers--end----")
    # print("GET参数：" + str(request.args))
    # print("POST参数：" + str(request.form))

app.register_blueprint(admin,url_prefix='/admin')
app.register_blueprint(user, url_prefix='/user')
app.register_blueprint(company, url_prefix='/p')

def exportCompany():
    start = 10362
    end = 10363
    resultExport = export(start,end)  # 返回结果{"flag": True, "tips": "没有从数据库中获取数据，可能行号过大","path":""}
    # target_path = ""
    # if(resultExport["flag"]):
    #     return send_from_directory(target_path, resultExport["path"], as_attachment=True)
    # else:
    #     return jsonify(resultExport)
    print(resultExport)

def updateCompany():
    start =2
    print("==================start==={}".format(start))
    end =100
    print("==================end==={}".format(end))
    filePath = "共99个"
    print("==================filePath==={}".format(filePath))
    if(filePath==""):
        print({"flag": False, "tips": "缺少文件名称选项"})
        return
    elif(filePath.find(".")==-1):
        filePath=filePath+".xlsx"
    sheetName = ""
    if sheetName=="":
        sheetName = "Sheet1"
    result = update(filePath,sheetName,start,end)  # 返回结果{"flag": True, "tips": "更新数据成功","count":""}

    return result
    # return jsonify(result)


if __name__ == '__main__':
    # app.run(host='0.0.0.0', port=80, debug=True)
    updateCompany()
