from flask import Flask, request, jsonify,render_template,session

import os

from datetime import timedelta

app = Flask("my-app")

app.config['SECRET_KEY']=os.urandom(24)   #设置为24位的字符,每次运行服务器都是不同的，所以服务器启动一次上次的session就清除。
app.config['PERMANENT_SESSION_LIFETIME']=timedelta(days=7) #设置session的保存时间。
#添加数据到session
#操作的时候更操作字典是一样的

@app.before_request
def print_request_info():
    if 'username' in session:
        # return '已登录'
        pass
    else:
        # return '未登录'
        pass

    # print("请求地址：" + str(request.path))
    # print("请求方法：" + str(request.method))
    # print("---请求headers--start--")
    # print(str(request.headers).rstrip())
    # print("---请求headers--end----")
    # print("GET参数：" + str(request.args))
    # print("POST参数：" + str(request.form))


@app.route('/')
def home():
    # return 'Hello World!'
    return render_template('home.html')  #比如127.0.0.1:5000/index


@app.route('/login')
def login():
    # return 'Hello World!'
    session['username'] = "111"
    # return render_template('login.html')
    return render_template('home.html')

@app.route('/add', methods=['POST'])
def add():
    result = {'sum': request.json['a'] + request.json['b']}
    return jsonify(result)


if __name__ == '__main__':
    # app.run()
    # app.run(debug=True)
    # app.run(host='0.0.0.0', port=80, debug=True)

    # a= "0755-33048316#0|微信; 18138426123; 15813702599; 0755-8935819"


    # try:
    #     a = "0755-8935819"
    #     b = a.split("; ")
    #     if (a != ""):
    #         print(b)
    # except Exception as e:
    #     print(e)

    for i in range(1,1):
        print(i)