#coding:utf-8

import argparse
from xpinyin import Pinyin
import xlrd
from .models.companyInfo import *
from .models.jiyingStatus import *
from .models.qiyeType import *
from .models.fileInfo import *
from user.models.userInfo import *
from .models.telAndMail import *
sys.path.append("..")
sys.path.append("../..")
from db import db


from openpyxl import Workbook
from openpyxl.writer.excel import ExcelWriter
from openpyxl.styles import Color, Fill, Font, Alignment, PatternFill, Border, Side
from openpyxl.cell import Cell
import datetime
import string

import os, sys
import random

import pymysql

# 执行命令
# python main.py -s 32 -e 49 -f "22"


parser = argparse.ArgumentParser(description='从数据库中excel')
# General options



parser.add_argument('-s','--start', required = False,default=-1, type=int,
                    help='开始行位置。')

parser.add_argument('-e','--end',required = False,default=-1,type=int, help='结束行位置。')

parser.add_argument('-f','--file_name', required = True,default='', type=str, help='name of the  file.')

def isdigit(aString):
    try:
        x = float(aString)
        return True
    except ValueError as e:
        # print('input is not a number!')
        return False

def getData(start,end):
    print("=================start=================={}".format(start))
    print("=================end=================={}".format(end))
    pn = CompanyInfo.query.filter(
        CompanyInfo.id.between(start,end) if start is not None and start != -1 and end is not None and end != -1 else "",
        CompanyInfo.id>start if start is not None and start != -1 and end==-1 else ""
    ).all()
    # pn = CompanyInfo.query.filter(CompanyInfo.id > 10052).all()
    # print("================长度如下===================")
    # print(len(pn))
    return pn


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

def updateTelAndMailIDInDB(baoliuId,delId):
# 因为要删除这些信息，所以需要先把待删除TelandMail表中的companyid改为留下来的id
    print("==================baoliuId:{}".format(baoliuId))
    dataInDb = TelAndMailInfo.query.filter(TelAndMailInfo.companyid == delId).all()
    for ele in dataInDb:
        ele.companyid = baoliuId
        try:
            db.session.commit()
        except Exception as e:
            # return False
            return {"flag": False}  # 错误
    return{"flag":True}

def updateDB(content,isUseNewUser): # content是从excel读取出来的每一行

    companyName = content[9]
    print("=======companyName:{}".format(companyName))
    pn = CompanyInfo.query.filter(CompanyInfo.companyName==companyName).all()

    storeName = "";
    storeCount = 0;
    url = "";
    companyLink = ""
    # print("=======companyLen:{}".format(len(pn)))
    rangList = range(1,len(pn))
    for i in rangList:
        ele = pn[i];

        tempstoreName = ele.storeName
        if tempstoreName != None and tempstoreName != "":
            if storeName=="" :
                storeName = tempstoreName
            elif tempstoreName not in storeName:
                storeName = storeName+"|#|"+tempstoreName

        tempstoreCount = ele.countNumber
        if tempstoreCount != None and tempstoreCount != "":
            if(storeCount==0):
                storeCount = int(tempstoreCount)
            elif tempstoreName not in storeName:
                storeCount = storeCount+int(tempstoreCount)

        tempurl = ele.url
        if tempurl != None and tempurl != "":
            if(url==""):
                url = tempurl
            else:
                tempurlList = tempurl.split("|")
                for urlOne in tempurlList:
                     if urlOne not in url:
                        url = url+"|"+urlOne

        tempLink = ele.companyLink
        if tempLink!=None and tempLink!="":
            if(companyLink==""):
                companyLink = tempLink
            elif tempLink not in companyLink:
                companyLink = companyLink+"|"+tempLink

        baoliuId= pn[0].id
        upResult=updateTelAndMailIDInDB(baoliuId,ele.id)
        # 因为要删除这些信息，所以需要先把待删除TelandMail表中的companyid改为留下来的id
        if(upResult["flag"]):
            print("删除一个条目，条目id={}".format(ele.id))
            db.session.delete(ele)

    if(len(pn)>0): #说明有元素
        ele = pn[0]
        isHaveCompany = True
        print("hohohohohohoho有公司信息,长度为：{}".format(len(pn)))
    else:
        print("没有公司信息")
        isHaveCompany = False
        ele = ""
    # print("=================1111==========oldUserID:".format(pn[0].id))
    result1=updateUser(ele,content,isUseNewUser)    # 更新所属人员表,isUseNewUser=0，表示不使用新的用户
    # print("================result1====userid:{}".format(result1["id"]))
    if(result1["flag"]!=0):
        userid = result1["id"]
    else:
        return {"flag":0,"tips":"更新用户失败"}
    result2=updateJYStatus(ele,content) # 更新经营状态表
    if(result2["flag"]!=0):
        jingyingid = result2["id"]
    else:
        return {"flag":0,"tips":"更新经营状态失败"}
    result3=updateQiYeType(ele,content) # 更新企业类型表
    if (result3["flag"] != 0):
        qiyeTypeid = result3["id"]
    else:
        return {"flag": 0, "tips": "更新企业类型失败"}

    reslut4=updateCompany(ele,content,storeName,storeCount,url,companyLink,userid,jingyingid,qiyeTypeid) # 更新企业基本信息
    # {"flag": 1, "id": id}
    if(reslut4["flag"]==1): #说明是新加入的公司
        id = reslut4["id"]
    else:
        id = pn[0].id
    reslut5=updateTelAndMail(id,content) #更新电话和邮箱等信息

    if isHaveCompany:  # 说明有元素
        return {"flag": 1}
    else:
        return {"flag": 2}



def updateUser(ele,content,isUseNewUser=0): #isUseNewUser代表是否使用新的用户
    oldUserID =""
    if ele!=None and ele!="":
        oldUserID = ele.belongTo
        # print("===========================oldUserID:{}".format(oldUserID))
    if oldUserID!=None and oldUserID!="" and isUseNewUser==0: #原有元素就有用户，则所属用户不变化

        return  {"flag": 2, "id": oldUserID}  # 数据库有数据

    else: #原有的条目没有用户信息
        belongToUser = content[2]

        print("所属用户：{}".format(belongToUser))

        users = UserInfo.query.filter(UserInfo.realname == belongToUser).all()
        #
        # cis = UserInfoScheme()
        # users = cis.dump(users)

        # print("===========================lenght users:{}".format(len(users)))
        if(len(users)==0): # 说明没有这个用户，需要添加一个
            now_time = datetime.datetime.now().strftime('%Y-%m-%d %H-%M-%S')
            print("需要插入新用户")
            try:
                pin = Pinyin()
                username = pin.get_pinyin(belongToUser,'')
            except Exception as e:
                username = belongToUser
            print("所属用户拼音：{}".format(username))
            userele = UserInfo(username, "123456", "", 1,belongToUser, now_time, now_time)

            try:
                db.session.add(userele)
                db.session.flush()
                # 输出新插入数据的主键
                id = userele.id
                # 此时数据才插入到数据库中
                db.session.commit()
                print("插入新用户成功,id={}".format(id))
                return {"flag": 1, "id": id}  # 插入了新数据
            except Exception as e:
                # return False
                return {"flag": 0}  # 错误

        # print("===========================username:{}".format(users[0].username))
        # print("===========================userid:{}".format(users[0].id))
        return {"flag": 2, "id": users[0].id}  # 数据库有数据


def updateJYStatus(ele,content):

    jingyingstatus = content[17]

    info = JingYingInfo.query.filter(JingYingInfo.name == jingyingstatus).all()
    if (len(info) == 0):  # 说明没有这个用户，需要添加一个
        now_time = datetime.datetime.now().strftime('%Y-%m-%d %H-%M-%S')
        print("需要插入新经营状态")
        ele = JingYingInfo(jingyingstatus, now_time)
        db.session.add(ele)
        try:
            db.session.flush()
            # 输出新插入数据的主键
            id = ele.id
            # 此时数据才插入到数据库中
            db.session.commit()
            print("插入新经营状态成功,状态id={}".format(id))
            return {"flag": 1, "id": id} # 插入了新数据
        except Exception as e:
            # return False
            return {"flag": 0} #错误
    return {"flag": 2,"id":info[0].id} # 数据库有数据

def updateQiYeType(ele, content):

    qiyeleixing = content[28]  # 外键

    info = QiYeTyleInfo.query.filter(QiYeTyleInfo.name == qiyeleixing).all()
    if (len(info) == 0):  # 说明没有这个用户，需要添加一个
        now_time = datetime.datetime.now().strftime('%Y-%m-%d %H-%M-%S')
        print("需要插入新企业类型")
        ele = QiYeTyleInfo(qiyeleixing, now_time)
        db.session.add(ele)
        try:
            db.session.flush()
            # 输出新插入数据的主键
            id=ele.id
            # 此时数据才插入到数据库中
            db.session.commit()
            print("插入新企业类型成功,id={}".format(id))
            return {"flag":1,"id":id} # 插入了新数据
        except Exception as e:
            # return False
            print(e)
            id = -1
            return {"flag": 0, "id": id}#错误
    return {"flag": 2,"id":info[0].id} # 数据库有数据


def updateTelAndMailInDB(companyid,dataInDb,elements,type): # type= 1: 手机  2：电话  3：qq 4: 邮箱

    elements=str(elements)
    eleList = elements.split(";") #按照;的方式区分
    if len(eleList)==0:
        return {"flag": 2}  # 数据库更新了
    for ele in eleList: # 遍历元素
        if ele == "":
            continue # 不更新这个元素
        dataInDbWithZero = TelAndMailInfo.query.filter(TelAndMailInfo.status == 0).all()  # 标记为0的电话
        now_time = datetime.datetime.now().strftime('%Y-%m-%d %H-%M-%S')
        status = -1
        beizhu = ""
        value = ""
             #0755-33048316 # 0|微信; 18138426123; 15813702599; 0755-8935819
        jinghaoSplit = ele.split("#")
        value = str(jinghaoSplit[0])
        if(len(jinghaoSplit)>=2): #说明有备注和状态
            sb = jinghaoSplit[1].split("|")
            status = int(sb[0])
            if (len(sb) >= 2):  # 说明状态
                beizhu = sb[1]
        if type ==1 or type ==2: # 1,2 为手机或者电话，混杂起来了
            telFlag = True if ele.find("-") > -1 else False
            if(telFlag): # 说明是电话 type=2
                type = 2
            else: # 说明是手机 type=1
                type =1

        if status==0: # 把数据库中已经有的信息，都转变为状态为0
            dataWithSameTel = TelAndMailInfo.query.filter(TelAndMailInfo.type == type,
                                                          TelAndMailInfo.value == value,
                                                          ).all()  # 标记为0的电话
            if(dataWithSameTel!=None):
                for sameEle in dataWithSameTel:
                    sameEle.status=0
                    if beizhu != "":
                        sameEle.beizhu = beizhu
                    now_time = datetime.datetime.now().strftime('%Y-%m-%d %H-%M-%S')
                    sameEle.updatetime = now_time
                    try:
                        db.session.commit()
                        # print("更新手机或者邮箱信息成功")
                        break
                        # return {"flag": 1, "tips": "更新企业信息成功"}
                    except Exception as e:
                        print(e)


        #查看该手机或者电话是否在其他公司中标记了，如果其他公司已经标记了，且自己没有标注，就按照其他公司的对该信息的标注
        for zeroEle in dataInDbWithZero:
            if zeroEle.type == type and zeroEle.value == value: #说明找到了这个元素
                if status == -1:  # 如果没有状态，就用以前的状态
                    status = zeroEle.status
                if  beizhu !=None and beizhu == "": # 如果没有说明，就用以前的说明
                    beizhu = zeroEle.beizhu
                break;


        isEleINDB = False # 是否在companyid 的电话或者邮件信息中中找到了这个元素
        i = 0
        if value != None and value != "":
            while (not isEleINDB) and i<len(dataInDb):  #dataInDb表示的是从数据库中取出来的外键是companyid的电话或者邮件
            # for eleInDB in dataInDb:
                eleInDB = dataInDb[i]
                i = i+1
                if eleInDB.type == type and eleInDB.value == value: #说明找到了这个元素
                    isEleINDB = True
                    if status!=-1:
                        eleInDB.status = status # 更改元素信息
                    if(beizhu!=None and beizhu!=""):
                        eleInDB.beizhu = beizhu
                    now_time = datetime.datetime.now().strftime('%Y-%m-%d %H-%M-%S')
                    eleInDB.updatetime = now_time
                    try:
                        db.session.commit()
                        # print("更新手机或者邮箱信息成功")
                        break
                        # return {"flag": 1, "tips": "更新企业信息成功"}
                    except Exception as e:
                        print(e)
                        # return False
                        # return {"flag": 0, "tips": "更新企业信息失败"}
                    # return {"flag": 1, "tips": "更新企业信息成功"}
            if not isEleINDB: # 说明没有再数据库中找到该信息，则需要在数据库中增加
                # print("需要插入新的手机或者类型：{}".format(type))
                if status == -1:
                    status = 1
                ele = TelAndMailInfo(companyid, type, value, status,beizhu, now_time, now_time)
                try:
                    db.session.add(ele)
                    db.session.flush()
                    # 输出新插入数据的主键
                    id = ele.id
                    # 此时数据才插入到数据库中
                    db.session.commit()
                    # print("插入插入新的手机或者类型成功：{}".format(type))
                    # return {"flag": 1, "id": id}  # 插入了新数据
                except Exception as e:
                    print(e)
                    # return False
                    # return {"flag": 0, "e": e}  # 错误
    return {"flag": 2}  # 数据库更新了




def updateTelAndMail(id, content):

    companyid=id
    # print("==================companyid:{}".format(companyid))
    dataInDb = TelAndMailInfo.query.filter(TelAndMailInfo.companyid == companyid).all()
    # print("===========电话等信息===dataInDB lenght:{}".format(len(dataInDb)))

    tel =content[11]
    updateTelAndMailInDB(companyid, dataInDb, tel, 1)
    dianhua = content[12]
    updateTelAndMailInDB(companyid, dataInDb, dianhua, 2)
    qq = content[13]
    updateTelAndMailInDB(companyid, dataInDb, qq, 3)
    mail = content[14]
    # print("---------mail--------{}".format(mail))
    updateTelAndMailInDB(companyid, dataInDb, mail, 4)

def getRealData(new,old,order=0):
    if order==0:
        real = new if  new!=None and new!=""  else old
    else:
        real = old if old != None and old != "" else new
    if real==None:
        real = ""
    return real

def updateCompany(ele,content,storeName,storeCount,url,companyLink,userid,jingyingid,qiyeTypeid):
    now_time = datetime.datetime.now().strftime('%Y-%m-%d %H-%M-%S')
    if ele == None or ele=="": # 说明没有公司信息
        print("导入的公司没有，需要插入新的公司………………………………")

        temp = content[19]
        tempziben = 0
        if (temp != None and temp != ""):
            temp = temp.split("万")
            tempziben = float(temp[0])

        # cuxiaocount, belongTo, customBianHao, qyqudao, beizhu, countNumber, isHaveHaiCang, categoryName, companyName, \
        # storeName, url, companyLink, jingyingstatus, daibiaoren, zhuceziben, createtime, shengfen, city, shehuixinyongma, \
        # nashuishibie, yingyezhizhao, zuzhijigouma, canbaorenshu, qiyeleixing, suoshuhangye, registeraddress, jiyingfanwei, dengjijiguan
        isHaveCang = content[7]
        if isHaveCang==None or isHaveCang == "":
            isHaveCang=0

        storeountNumber = content[6]
        if storeountNumber==None or storeountNumber=="":
            storeountNumber=1

        cuxiaoCount = content[1]
        if cuxiaoCount == None or cuxiaoCount == "":
            cuxiaoCount = 0

        newele = CompanyInfo(cuxiaoCount, userid, content[3], content[4], content[5], storeountNumber, isHaveCang,content[8], \
                          content[9], content[10],  content[15],content[16], \
                          jingyingid, content[18], tempziben, content[20], content[21], content[22], content[23],content[24],
                          content[25], content[26], content[27], qiyeTypeid, content[29], content[30], content[31],
                          content[32],content[33],now_time)

        try:
            db.session.add(newele)
            db.session.flush()
            # 输出新插入数据的主键
            id = newele.id
            # 此时数据才插入到数据库中
            db.session.commit()
            print("插入新的公司成功,id={}".format(id))
            return {"flag": 1, "id": id}  # 插入了新数据
        # return {"flag": 1, "tips": "更新企业信息成功"}  # 1表示新插入
        except Exception as e:
            print(e)
            # return False
            return {"flag": 3, "e": e}  # 插入错误


    else:  # 说明有公司信息,更改即可
        ele.categoryName = getRealData(content[8] , ele.categoryName)

        ele.companyName = getRealData(content[9],ele.companyName)

        tempLink = getRealData(content[16] ,ele.companyLink)
        if companyLink!="" and companyLink!=None and tempLink!="":
            ele.companyLink = tempLink + "|" + companyLink
        else:
            ele.companyLink = tempLink

        tempStore = getRealData(content[10],ele.storeName)
        if storeName!=None and storeName!="" and tempStore!="":
            ele.storeName = tempStore + "|#|" + storeName
        else:
            ele.storeName = tempStore

        ele.belongTo = userid # 外键

        tempCountNumber = getRealData(content[6],ele.countNumber)
        ele.countNumber = int(tempCountNumber) + storeCount
        ele.customBianHao = getRealData(content[3],ele.customBianHao)
        isHaveCang = getRealData(content[7],ele.isHaveHaiCang)
        if isHaveCang==None or isHaveCang == "":
            isHaveCang=0
        ele.isHaveHaiCang = isHaveCang
        temp = str(getRealData(content[19],ele.zhuceziben))
        tempziben = 0
        if(temp!=None and temp!=""):
            temp = temp.split("万")
            tempziben =  float(temp[0])
        ele.zhuceziben = tempziben
        ele.shengfen = getRealData(content[21],ele.shengfen)
        ele.jingyingstatus = jingyingid  # 外键
        ele.nashuishibie = getRealData(content[24],ele.nashuishibie)
        ele.zuzhijigouma = getRealData(content[26],ele.zuzhijigouma)
        cbrenshu = getRealData(content[27],ele.canbaorenshu)
        if(cbrenshu == ""):
            cbrenshu = 0
        ele.canbaorenshu = cbrenshu
        ele.qiyeleixing = qiyeTypeid  # 外键
        ele.suoshuhangye = getRealData(content[29],ele.suoshuhangye)
        ele.city = getRealData(content[22],ele.city)
        ele.shehuixinyongma = getRealData(content[23],ele.shehuixinyongma)
        ele.yingyezhizhao = getRealData(content[25],ele.yingyezhizhao)
        ele.registeraddress = getRealData(content[30],ele.registeraddress)
        ele.daibiaoren = getRealData(content[18],ele.daibiaoren)
        ele.jiyingfanwei = getRealData(content[31],ele.jiyingfanwei)
        ele.createtime = getRealData(content[20],ele.createtime)
        ele.dengjijiguan = getRealData(content[32],ele.dengjijiguan)

        tempUrl =  getRealData(content[15],ele.url)
        # print("===========tempUrl===========")
        # print(tempUrl)
        # print(url)
        if url!=None and url!="" and tempUrl!="":
            ele.url = tempUrl + "|" + url
        else:
            ele.url = tempUrl

        ele.cuxiaocount = getRealData(content[1],ele.cuxiaocount)
        ele.beizhu = getRealData(content[5],ele.beizhu)
        ele.qyqudao = getRealData(content[4],ele.qyqudao)
        ele.datafrom = getRealData(content[33], ele.datafrom)
        ele.updatetime = now_time

        try:

            db.session.commit()
            print("更新企业信息成功")
            return {"flag":2,"tips":"更新企业信息成功"}
        except Exception as e:
            print(e)
            return {"flag": 0, "tips":"更新企业信息失败"}



def readLines(excelName,sheetName,linNumber):

    # print("=======excelName===={}".format(excelName))
    # print("======sheetName====={}".format(sheetName))
    # print("======linNumber====={}".format(linNumber))
    #打开excel文件
    data=xlrd.open_workbook(excelName)
    #获取第一张工作表（通过索引的方式）
    table = data.sheet_by_name(sheetName)
    #data_list用来存放数据
    data_list=[]
    try:
        #将table中第一行的数据读取并添加到data_list中
        data_list.extend(table.row_values(linNumber))
    except IndexError as e:
        return {"flag":0,"data":data_list}
    except Exception as e:
        return {"flag":0,"data":data_list}
    return {"flag":1,"data":data_list}

# flask中的主函数
def update(insertId,filePath,sheet_name,start,end,isUseNewUser,isquchong):
    companyListNotInDB=[]
    if filePath in ["",'',None,'\n','\r\n']:
        print("请输入确切的文件名称，或者确保文件路径正确")
        return {"flag": False, "tips": "请输入确切的文件名称，或者确保文件路径正确","count":""}
    # 更新文件数据库
    fileInformation = FileInfo.query.filter(FileInfo.id == insertId).first()
    if fileInformation != None:
        fileInformation.updateCount = fileInformation.updateCount+1  # 更新次数加1
        now_time = datetime.datetime.now().strftime('%Y-%m-%d %H-%M-%S')
        fileInformation.updatetime = now_time
        db.session.commit()

    try:
        count = 0
        start= start -1
        end = end -1
        lineNumber = 0
        if(start !=-1 and end !=-1 and end>=start):
            rangeLine= range(start,end+1)
            print(rangeLine)
            for lineNumber in rangeLine:
                print("开始读取行{0}\n".format(lineNumber))
                content = readLines(filePath, sheet_name, lineNumber)
                # {"flag": 1, "data": data_list}
                if(content["flag"]==1):
                    companyName = content["data"][9]
                    if companyName!=None and companyName!="":
                        resultUpdate=updateDB(content["data"],isUseNewUser)
                        print("文件1:{0},行{1}处理完毕\n".format(filePath,lineNumber+1))

                        fileInformation = FileInfo.query.filter(FileInfo.id == insertId).first()
                        if fileInformation != None:
                            fileInformation.lineNumber = lineNumber  # 行数加1
                            now_time = datetime.datetime.now().strftime('%Y-%m-%d %H-%M-%S')
                            fileInformation.updatetime = now_time
                            db.session.commit()

                        count = count+1;
                        if(resultUpdate["flag"] == 2): # 说明数据库中没有这个公司
                            companyListNotInDB.append(content["data"])
                elif content["flag"]==0:
                    print("文件处理完毕\n")
                    break
        else:
            lineNumber = start
            while(True): #一直读取数据直到最后一行
                content = readLines(filePath, sheet_name, lineNumber)
                if (content["flag"] == 1):
                    companyName = content["data"][9]
                    if companyName!=None and companyName!="":
                        resultUpdate=updateDB(content["data"],isUseNewUser)
                        print("文件2:{0},行{1}处理完毕\n".format(filePath,lineNumber+1))
                        # print("========insertId:{0}\n".format(insertId))
                        fileInformation = FileInfo.query.filter(FileInfo.id == insertId).first()
                        if fileInformation != None:
                            # print("=======更新行数啦:{0}\n".format(lineNumber))
                            fileInformation.lineNumber = lineNumber  # 行数加1
                            now_time = datetime.datetime.now().strftime('%Y-%m-%d %H-%M-%S')
                            fileInformation.updatetime = now_time
                            db.session.commit()

                        lineNumber = lineNumber + 1
                        count = count + 1
                        if (resultUpdate["flag"] == 2):  # 说明数据库中没有这个公司
                            companyListNotInDB.append(content["data"])
                elif content["flag"]==0:
                    print("文件处理完毕\n")
                    break
    except Exception as e:
        print("这是我输出的信息")
        print(e)
    finally:
        fileInformation = FileInfo.query.filter(FileInfo.id == insertId).first()
        if fileInformation != None:
            fileInformation.lineNumber = lineNumber  # 行数加1
            now_time = datetime.datetime.now().strftime('%Y-%m-%d %H-%M-%S')
            fileInformation.updatetime = now_time
            db.session.commit()
        result = {"flag": False, "tips": "更新完毕", "count": count, "companyListNotInDB": companyListNotInDB}
    result = {"flag": True, "tips": "更新完毕","count":count,"companyListNotInDB":companyListNotInDB}
    return result

def main(opts):

    readStart = ''
    readStart = readFile("pythonLastRead.txt")
    # print(type(readStart))
    # print(readStart in ["",'','\n','\r\n'])
    if readStart in ["",'','\n','\r\n']:
        if opts.start == -1:
            print("请用-s 作为参数，输入行号起始位置")
            exit()
    if opts.start != -1:
        readStart = opts.start
    if opts.file_name == '':
        print("请用-s 作为参数，输入文件名称")
        exit()

    # exit()

    print(opts.end)
    results=getData(readStart,opts.end)
    if(len(results)>0):
        generateExcel(results,opts.file_name)
        print("--> Finished generate excel")
    else:
        print("没有从数据库中获取数据，可能行号过大")




if __name__ == '__main__':
    opts = parser.parse_args()
    main(opts)