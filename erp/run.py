from db import db
from db import app
from flask import Flask, request, jsonify,render_template,session,redirect

import os

from datetime import timedelta

from admin.admin import admin
from user.user import user
from company.company import company

# app=Flask(__name__)
app.config['JSON_AS_ASCII'] = False
app.config['SECRET_KEY']=os.urandom(24)   #设置为24位的字符,每次运行服务器都是不同的，所以服务器启动一次上次的session就清除。
app.config['PERMANENT_SESSION_LIFETIME']=timedelta(hours=1) #设置session的保存时间。
#添加数据到session
#操作的时候更操作字典是一样的

@app.before_request
def before_request_filter():
    # print("请求地址：" + str(request.path))
    requestPath=str(request.path)
    notfilterURL = ["/user/loginHtml", "/user/login"]
    if requestPath.find("static")>-1: #说明是静态文件
        pass
    # print("===============请求地址：" + str(request.path))
    elif requestPath in notfilterURL:
        # print("===============不需要过滤")
        pass
    else:
        if 'userId' in session and 'type' in session:
            # print('已登录')
            pass
        else:
            # print('未登录,要跳转到登录页面')
            return redirect("/user/loginHtml")


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




if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8088, debug=True)
