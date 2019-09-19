#coding:utf-8
#user
from flask import Blueprint,request, render_template,session, redirect
from .models.userInfo import *

user = Blueprint('user',__name__)
# user = Blueprint('user', __name__, template_folder='../templates/user')

@user.route('/loginHtml')
def index():
    # print("在user的login方法中了")
    return render_template('login.html')

@user.route('/login', methods=['GET', 'POST'])
def userlogin():
    userName = request.form.get('userName')
    inputPassword = request.form.get('inputPassword')
    print("userName：{}".format(userName))
    print("inputPassword：{}".format(inputPassword))
    userInfo = UserInfo.query.filter(UserInfo.username==userName).first()
    if(userInfo!=None):  # 有这个用户
        password = userInfo.userpassword
        if(inputPassword==password): # 如果密码相等
            userId = userInfo.id
            status = userInfo.status
            session["userId"]=userId
            session["type"] = status
            session["realname"] = userInfo.realname
            return redirect("/p/home")
        else:
            return redirect("/user/loginHtml")
    else:  # 没有这个用户
        return redirect("/user/loginHtml")

@user.route('/logout', methods=['GET', 'POST'])
def userlogout():
    session.pop("userId")
    session.pop("type")
    return redirect("/user/loginHtml")

@user.route('/add')
def add():
    return 'user_add'

@user.route('/show')
def show():
    return 'user_show'
