const puppeteer = require('puppeteer');
const exeJs = require('./exeJs');
const alifunc = require('./alifunc');
const file = require('./file');
const db = require('./dataBase');
const fs = require('fs');

let Ut = require("./sleep");
const level = require('./level');


userAndPassLists = level.userPassLists;

// userAndPassLists=[];
// userAndPassLists.push({'username':'yunzhongzhizi_2007@126.com','pwd':'19880202Q'});
// userAndPassLists.push({'username':'1365986138@qq.com','pwd':'jhy469411'});
// userAndPassLists.push({'username':'965761402@qq.com','pwd':'19880202Q'});

up=0; //初始的时候使用的用户名和密码

mainPage=''; //登录之后的页面
loginUrl = 'https://login.aliexpress.com';

categoryArgsPath = "categoryNumber.txt";
alreadyReadPath = "haveRead.txt";
categoryArgs=''; //系统开始运行的时候，需要从文件里读取aliexpress每一个类别数量的参数
alreadyReadArgs=''; //已经读取的分类信息

firstLevelCateroyNumberStart=1; //获取数据的开始分类
firstLevelCateroyNumberEnd=""; //获取数据的终点分类

pageNumberStart=1; //获取数据从哪一页开始
pageNumberEnd=1000; //获取数据在哪一页结束，默认是在1000行结束，不过命令里面的值，会覆盖这里的值

level1 = level.level1;
level2 = level.level2;
level3 = level.level3;
level4 = level.level4;

// console.log(level1)
// console.log(level2)
// console.log(level3)
// console.log(level4)

headless=true;

function getAlreadPageNumber(){
            // 获取读到了这一页的哪一个链接了
            var temp2 = fs.readFileSync(alreadyReadPath, 'utf8');
            if(temp2!="" && temp2!='' ) {
                let splitArg = temp2.split("#");
                if(splitArg.length>4 && level1==splitArg[0] && level2==splitArg[1] &&  level3==splitArg[2] &&  level4==splitArg[3]){
                    return parseInt(splitArg[4]);
                }
                else{
                    return -1;
                }

            }
            return -1;
}


//4#3#1#3#2#35  node aliExpress.js 1 8 100 200 1

function  biaozhunUrl(linkArgs){


            var  bzurl="";
            var  tempUrl="";
            if(linkArgs.indexOf("http") == 0){
                return linkArgs
            }
            else if(linkArgs.indexOf("https") == 0){
                return linkArgs
            }
            else if(linkArgs.indexOf("//") == 0) {
                tempUrl=linkArgs.split("//");
                bzurl=tempUrl[1];

            }else if(linkArgs.indexOf("/") == 0){
                tempUrl=linkArgs.split("/");
                bzurl=tempUrl[1];

            }
            // if(url.indexOf("www") == -1){
            //     url="www.aliexpress.com/"+url;
            // }
            if(bzurl.indexOf("http") != 0){
                bzurl="http://"+bzurl;

            }

            return bzurl;
}

//打开分类列表，并且跳转到指定的页面
async function openLinkAndGetInfomation(browser,linkargsonc,pageNumberArgs,categoryName){

        // console.log("*************接收到页面1*******:",linkargsonc);

        urlforonc = biaozhunUrl(linkargsonc);
        //这是点击的方式，不如goto的方式方便
        // mainPage.waitForNavigation(); // The promise resolves after navigation has finished
        //  // 点击该链接将间接导致导航(跳转)
        // mainPage.click(clickUrl);
        // console.log("*************接收到页面5*******:",urlforonc);
            //这里通过获取url然后跳转的方式，比较方便
            while(true){
                console.log("*************打开类别页面*******:",urlforonc);

                // process.exit();

                try {

                    // page = await browser.newPage(); //# 启动个新的浏览器页面，此会自动下载Chromeium
                    // await page.goto(urlToGetInfo);

                    pageOfCategory=await loadPage(browser,urlforonc)

                    // await page.waitFor("#alibaba-login-box")
                    // await getCompanyInfo(browser,page)
                    // 滚动到最后，要不然不会出现跳转的元素
                    let preScrollHeight = 0;
                    let scrollHeight = -1;
                    // let step=400;
                    // h1=0;
                    while(preScrollHeight !== scrollHeight) {
                        // 详情信息是根据滚动异步加载，所以需要让页面滚动到屏幕最下方，通过延迟等待的方式进行多次滚动
                        let scrollH1 = await pageOfCategory.evaluate(async () => {
                            let h1 = document.body.scrollHeight;
                            window.scrollTo(0, h1);
                            return h1;
                        });
                        await pageOfCategory.waitFor(500);
                        let scrollH2 = await pageOfCategory.evaluate(async () => {
                            return document.body.scrollHeight;
                        });
                        let scrollResult = [scrollH1, scrollH2];
                        preScrollHeight = scrollResult[0];
                        scrollHeight = scrollResult[1];
                    }

                    await  newPageLoadAfterOperation(pageOfCategory); //登录成功之后，关闭促销等页面

                    //在跳转框中填写数值
                    await pageOfCategory.waitFor(".jump-aera .next-input input");
                    console.log("pageNUmber:",pageNumberArgs)
                    var pageNumber = ""+pageNumberArgs;
                    await pageOfCategory.type('.jump-aera .next-input input', pageNumber, {'delay': alifunc.input_time_random(100,151) - 50})

                    await pageOfCategory.waitFor(".jump-aera  .jump-btn");

                    if(!(pageNumber==="1")){
                        console.log("开始跳转到指定的页数:",pageNumber);
                        await pageOfCategory.click(".jump-aera .jump-btn") ; //跳转到指定的页面
                    }



                    // 获取读到了这一页的哪一个链接了
                    ipn = 0
                    temp2 = fs.readFileSync(alreadyReadPath, 'utf8');
                    if(temp2!="" && temp2!='' ){
                        splitArg = temp2.split("#");
                        if(splitArg.length==6 && level1==splitArg[0] && level2==splitArg[1] &&  level3==splitArg[2] &&  level4==splitArg[3]  && splitArg[4]==pageNumber){
                            console.log('匹配成功，商品地址：',splitArg[5]);
                            ipn = parseInt(splitArg[5]);
                        }
                    }

                    // {"flag":1,"links":links,"page":mainPageArgs};
                    LinksDict=await getAllProductLinks(pageOfCategory); //获取所有的商品列表
                    productLinks=LinksDict["links"];
                    pageOfCategory=LinksDict["page"];


                    console.log("ipn:",ipn);
                    console.log("productLinks.length:",productLinks.length);

                    for(;ipn<productLinks.length;ipn++){
                        product=productLinks[ipn];
                        let productUrl = biaozhunUrl(product)
                        // console.log("href:",productUrl);
                        let storeInfo = await openProductAndGetInfomation(browser,productUrl); //打开商品列表
                        let flag = storeInfo["flag"];
                        let info = storeInfo["info"];

                        console.log(storeInfo["info"]);

                        if(flag==1 && info.length>2 && info!="" && info !=null && info!=undefined && info !=''){
                            let comInfo=await getInfoByCompany(info[0]["content"]); //验证公司是否在数据库中，如果有的话会返回该公司注册的数量
                            let countindb = comInfo["count"];
                            let indbFlag = comInfo["flag"];
                            if(indbFlag){//更新就可以了
                                let id = comInfo["id"];
                                let isHaveHaiCang =comInfo["isHaveHaiCang"];
                                let storeName = comInfo["storeName"];
                                storeName = storeName +"|#|"+info[8]["content"]; //把这个店铺的名称加上，用|#分割即可
                                if(isHaveHaiCang == 0 || isHaveHaiCang == null){ //已经存储的是没有海外仓
                                    isHaveHaiCang=info[10]["content"];
                                }
                                let url = comInfo["url"];
                                url = url+"|"+productUrl;
                                countindb = countindb + 1;
                                let modSql = 'UPDATE companyinfo SET storeName=?, countNumber = ?,isHaveHaiCang=?,url = ? WHERE id = ?';
                                let modSqlParams = [storeName,countindb,isHaveHaiCang, url,id];
                                console.log("----------------准备更新消息-----------");
                                let updateflagInDB=0
                                while(updateflagInDB==0){
                                    try{
                                        await db.syncQuery(modSql,modSqlParams);
                                        console.log("----------------更新消息成功-----------");
                                        updateflagInDB=1
                                    }catch (e) {
                                        console.log(e);
                                        console.log("--------------更新消息失败,重新更新-----------");
                                        // process.exit();
                                    }
                               }
                            }
                            else{//需要插入一条
                                try{
                                    var  addSqlParams = [];
                                    addSqlParams.push(info[0]["content"]);
                                    addSqlParams.push(categoryName);
                                    addSqlParams.push(info[8]["content"]);
                                    addSqlParams.push(info[1]["content"]);
                                    addSqlParams.push(info[2]["content"]);
                                    addSqlParams.push(info[3]["content"]);
                                    addSqlParams.push(info[4]["content"]);
                                    addSqlParams.push(info[5]["content"]);
                                    addSqlParams.push(info[6]["content"]);
                                    addSqlParams.push(info[7]["content"]);
                                    addSqlParams.push(info[9]["content"]);
                                    addSqlParams.push(countindb);
                                    addSqlParams.push(info[10]["content"]);

                                    // url，包含
                                    var  addSql = 'INSERT INTO companyinfo(companyName,categoryName,storeName,shehuixinyongma,yingyezhizhao,registeraddress,daibiaoren,jiyingfanwei,createtime,dengjijiguan,url,countNumber,isHaveHaiCang) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)';


                                    let insertflag=0
                                    while(insertflag==0){
                                        try{
                                            await db.syncQuery(addSql,addSqlParams);
                                            // await db.insert(addSql,addSqlParams);
                                            console.log("----------------插入消息成功-----------");
                                            insertflag=1
                                        }catch (e) {
                                            console.log(e);
                                            console.log("--------------插入消息失败,重新插入-----------");
                                            // process.exit();
                                        }
                                   }
                                }
                                catch(e){
                                    console.log("获取商家信息出错，商家url:",product);

                                    console.log("错误详情如下所示(偶尔一次，不用管)：");
                                    console.log(e);
                                    console.log("--------------------(偶尔一次，不用管)-----------");
                                }
                            } //end of else
                        }//end of if
                        else if(flag == 9){ //说明要重新启动浏览器
                             console.log("需要重新启动浏览器");
                             return {"flag":9,"info":""}; //说明要重新启动浏览器
                        }
                        else if(flag==0){
                            console.log("数据库已经该店家信息了，更新海外仓信息就可以了^^^^^");
                            let isHaiFlag = storeInfo["isHaiFlag"]; //新打开的页面是否有海外仓
                            let haiCangIndb = storeInfo["haiCangIndb"]; //数据库中是否海外仓
                            let id = storeInfo["id"]; //数据库中该条目的id
                            if(haiCangIndb==0 && isHaiFlag==1){
                                //说明页面有海外仓信息，但是数据库里面没有，所以需要更新数据库
                                let modSql = 'UPDATE companyinfo SET isHaveHaiCang=? WHERE id = ?';
                                let modSqlParams = [isHaveHaiCang, id];
                                console.log("----------准备更新海外仓id=",id);
                                let updateflag=0
                                while(updateflag==0){
                                   try{
                                        await db.syncQuery(modSql,modSqlParams);
                                        console.log("----------------更新消息成功-----------");
                                        updateflag = 1;
                                    }catch (e) {
                                        // console.log(e);
                                        console.log("--------------更新消息失败，重新更新-----------");
                                    }
                                }

                            }//END of if
                        }//END OF ELSE IF
                        else if(flag==1 &&(info=="" || info==null || info==undefined  || info =='')){
                            console.log("该店家还没有上传信息<:<:<:<:<:<:<:<:<:");
                        }
                        else if(flag==1){
                            console.log("该店家还没有上传信息<:<:<:<:<:<:<:<:<:");
                        }

                        console.log("处理完了一个链接，写入文件");

                        changeHaveReadFile(pageNumber,ipn+1);

                    } //end of for
                    return {"flag":1,"info":""};
                }catch(e) {
                    // console.log(e);

                    console.log('打开三级，也就是商品列表分类页面出错');
                 }
                 finally {
                    if(pageOfCategory!=null && pageOfCategory!="" && pageOfCategory!=undefined )
                       await pageOfCategory.close();
                }
            } //end of while

}

function  changeHaveReadFile(pageNumber,productNumberInCtory){
    let alreadyReadArgs = fs.readFileSync(alreadyReadPath, 'utf8');
    let pageNumberforReal = pageNumber;
    // if(alreadyReadArgs!="" && alreadyReadArgs!=''){
    //     let splitArgs = alreadyReadArgs.split("#");
    //     if(splitArg.length>4 && level1==splitArg[0] && level2==splitArg[1] &&  level3==splitArg[2] &&  level4==splitArg[3] && pageNumber==splitArgs[4]){
    //         // console.log('：',splitArg[5]);
    //         // let newArgs = level1+"#"+level2+"#"+level3+"#"+level4+"#"+splitArgs[4]+"#"+productNumberInCtory;
    //         pageNumberforReal = splitArgs[4];
    //     }else{
    //         pageNumberforReal = pageNumberStart;
    //     }
    // }
    let newArgs = level1+"#"+level2+"#"+level3+"#"+level4+"#"+pageNumberforReal+"#"+productNumberInCtory;
    file.writeFileSync(alreadyReadPath,newArgs);

}

async function getInfoByCompany(companyName){
    var  sql = 'SELECT * FROM companyinfo where companyName=?';
    var  addSqlParams = [];
    addSqlParams.push(companyName);
    console.log("开始根据公司名称查找：",companyName);
    let flag=0
    while(flag==0){
        try{
            var  result =await db.syncQuery(sql,addSqlParams)
            // console.log('--------------------------result----------------------------');
            // console.log(result.length);
            flag=1;
        }
        catch (e) {
            console.log(e);
            console.log("从数据库中查找是否有这个公司出错,重新查找");
        }
    }

    // console.log('--------------------------result----------------------------');
    // console.log(result.length);
    if(result.length>0){
        let deleteResult = await deleteInfo(result); //删除多余的公司信息
        let count = result[0].countNumber;
        let url= result[0].url;
        let isHaveHai = result[0].isHaveHaiCang;
        if(deleteResult["flag"]){
            count = count + deleteResult["count"];
            url = url +"|"+ deleteResult["url"];
            if(isHaveHai == 0)
                isHaveHai = deleteResult["isHaiCang"];
        }
        return {"flag":true,"count":count,"storeName":result[0].storeName,"isHaveHaiCang":isHaveHai,"id":result[0].id,"url":url};

    }
    else{
         return {"flag":false,"count":1};
    }

}

//删除url并且返回店铺数量和url信息
async function deleteInfo(result){
    var count=0;
    var url="";
    var isHaiCang=0;
    if(result.length>1){ //如果多于1个才删除
        for(let i =1;i<result.length;i++){ //从第一个开始删除，第0个需要更新消息
            if(isHaiCang==0) //只要是1就不用管，说明这个公司有海外仓
                isHaiCang = result[i].isHaveHaiCang;
            count=count+result[i].countNumber;
            if(url=="")
                url=result[i].url;
            else
                url=url+"|"+result[i].url;
            //删除这个条目 DELETE FROM websites where id=6
            let id= result[i].id;
            let modSql = 'DELETE FROM  companyinfo WHERE id = ?';
            let modSqlParams = [id];
            console.log("---------------准备删除信息--------------");
            let flag=0
            while(flag==0){
                try{
                    let excuteResult = await db.syncQuery(modSql,modSqlParams);

                    console.log("----------------删除消息成功-----------");
                    flag=1;
                }catch (e) {
                    // console.log(e);
                    console.log("--------------删除消息失败，重新删除一次----------");
                    flag=0;
                }

            }
        }//end of for
        return {"flag":true,"count":count,"url":url,"isHaiCang":isHaiCang};
    }
    else{
        return {"flag":false,"count":count,"url":url};
    }
}

async function checkIsInDb(stroeName){
    var agrs = "%"+stroeName+"%";
    var  sql = 'SELECT * FROM companyinfo where storeName like ?';
    var  addSqlParams = [];
    addSqlParams.push(agrs);
    let flag=0
    while(flag==0){
        try{
            console.log("从数据库中查找是否有这个店铺名称");
            var  result =await db.syncQuery(sql,addSqlParams)
            flag=1;
            // console.log('--------------------------result----------------------------');
            // console.log(result.length);
        }
        catch (e) {
            console.log(e);
            console.log("从数据库中查找是否有这个店铺名称出错");
        }
    }


    if(result.length>0)
        return {"flag":true,"id":result[0].id,"haiCang":result[0].isHaveHaiCang};
    else
        return {"flag":false};

}
//打开具体的商品页面，准确进入商家信息
async function openProductAndGetInfomation(browser,productUrl){
    var successFlag=0; //初始化，没有成功获取数据
    var resultT;
    var successFlag;
    while(true){
        try {
            var pageProduct = await loadPage(browser, productUrl);

            await newPageLoadAfterOperation(pageProduct); //登录成功之后，关闭促销等页面

            console.log("开始等待5秒，请不要着急……");
            await pageProduct.waitFor(5000);//等待10秒

            //首先获取店铺名称，看看是不是已经有了此信息，如果有了就不再获取店铺信息了
            var stroeNameCss = '#store-info-wrap  .store-container .store-name a';
            var stroeName = await pageProduct.$eval(stroeNameCss, node => node.textContent);
            let haveIndb= await  checkIsInDb(stroeName);

            let haveIndbFlag=haveIndb["flag"];


            /////////////////////////海外仓验证功能
            var isHaiFlag=0;
            //查看是否开通海外仓了
            try{
                let isHai = ".sku-property .sku-property-list .sku-property-item .sku-property-text span";

                await pageProduct.waitFor(isHai);

                let isHaiList = await pageProduct.$$eval(isHai,el => el.map(x => x.textContent));

                console.log("++++++++++++isHaiList:",isHaiList);
                for(let ih=0;ih<isHaiList.length;ih++){
                    let country = isHaiList[ih];
                    if(country.indexOf("Russian Federation")>=0){
                        console.log("店铺有海外仓^^^^^^^^^^^^^^^^^ohohohoho");
                        isHaiFlag = 1;
                    }

                }
            }
            catch (e) {
                    console.log("没有等到页面元素出现，店铺没有海外仓");
            }

            if(!haveIndbFlag){
                 //鼠标移到商品页面
                busInfoWrap = '#store-info-wrap  .store-container .store-name';
                rect = await getRectForEle(pageProduct, busInfoWrap);
                console.log(rect)

                await pageProduct.waitFor(busInfoWrap);
                await pageProduct.hover(busInfoWrap);

                const mouse = pageProduct.mouse
                await mouse.move(rect.left + 10, rect.top + 5, {'delay': 10}); //上下偏移10个像素


                //鼠标移到店家页面
                var storeInfo = ".header-store-balloon .store-summary .store-business-info a";

                await pageProduct.waitFor(storeInfo);

                var credUrl = await pageProduct.$eval(storeInfo, node => node.getAttribute('href'));



                credUrl = biaozhunUrl(credUrl);

                var content=await getCompanyInfo(browser, pageProduct, credUrl); //拿到了公司信用凭证url，然后准备打开，获取信息

                if(content==9){
                    resultT={"flag":9,"info":content}; //说明要重新启动浏览器
                }
                else
                {
                    let temp={"content":stroeName}
                    content.push(temp)

                    temp={"content":productUrl}
                    content.push(temp)


                    temp={"content":isHaiFlag}
                    content.push(temp)

                    resultT={"flag":1,"info":content}
                }


                // return resultT;
                // console.log(content);
            }//end of if
            else{ //end of else
                let id=haveIndb["id"];
                let haiCangIndb=haveIndb["haiCang"];
                resultT={"flag":0,"info":"","isHaiFlag":isHaiFlag,"id":id,"haiCangIndb":haiCangIndb} //在数据库中了
                // return resultT;
            }

            successFlag=1; //成功了
        }//end of try
        catch(e) {
                // console.log(e);
                console.log("打开具体的商品页面时出错");
        }
        finally {
                // console.log("ohhohohohohoho");
                if(pageProduct!=null && pageProduct!="" && pageProduct!=undefined ){//关闭商品页面
                    console.log("关闭商品页面");
                    await pageProduct.close();
                }
                if(successFlag===1)
                    break;
        }
    } //end of while


    return resultT;
}

async function getAllProductLinks(mainPageArgs){

    while(true)
    {
        try {

                //如果是商品竖直排列，则变为横排
                displayMode = "div.product-container > .top-container > .top-refine > .sort > .display-mode > svg";
                await mainPageArgs.waitFor(displayMode);

                //这个不能获取svg的class，不知道为什么
                // displayModeClass = await mainPageArgs.$eval(displayMode, node => node.getAttribute('class'));
                // console.log("+++++++++++++++++++++++++++++++++++++++++displayModeClass:",displayModeClass);

                // 可以获取数量
                // const svgNums = await mainPageArgs.$$eval("div.product-container > .top-container > .top-refine > .sort > .display-mode > svg",e=>e.length); //每一行的数量
                // console.log("+++++++++++++++++++++++++++++++++++++++++svgNums:",svgNums);

                displayModeList = await mainPageArgs.$$eval("div.product-container > .top-container > .top-refine > .sort > .display-mode > svg",el => el.map(x => x.getAttribute("class")));

                console.log("+++++++++++++++++++++++++++++++++++++++++displayModeList:",displayModeList);

                displayModeClass = displayModeList[1];


                if(displayModeClass.indexOf("active")>0){//说明是竖排方式
                    displayMode = "div.product-container > .top-container > .top-refine > .sort > .display-mode > .svg-icon:nth-of-type(1)";
                    console.log("需要点击第一个排列方式");
                    await mainPageArgs.click(displayMode);
                }



                regLine="div.product-container > .product-list > ul.list-items > div";
                //得到行数
                await mainPageArgs.waitFor(regLine);
                const lineNums = await mainPageArgs.$$eval(regLine,e=>e.length);
                links=[];
                //根据行数得到link
                for(var i=1;i<lineNums+1;i++){
                    // console.log("i:",i)
                    //
                    hoverstr='.product-container .product-list ul div:nth-child('+i+')';
                    await mainPageArgs.hover(hoverstr);
                    await mainPageArgs.waitFor(200);
                    regLineProducts='.product-container .product-list ul div:nth-child('+i+') li';
                    const lineProductNums = await mainPageArgs.$$eval(regLineProducts,e=>e.length); //每一行的数量
                    for(var j=1;j<lineProductNums+1;j++){
                        product='.product-container .product-list ul div:nth-child('+i+') li:nth-child('+j+') div.product-card div.product-img div.place-container a';
                        urlToOne = await mainPageArgs.$eval(product, node => node.getAttribute('href'));
                        links.push(urlToOne);
                    }
                }
                return {"flag":1,"links":links,"page":mainPageArgs};
                break;
        }
        catch (e) {
            // console.log(e);
            console.log("分类页面载入出错,刷新页面一次");

            await mainPageArgs.reload();
            await  newPageLoadAfterOperation(mainPageArgs); //登录成功之后，关闭促销等页面
        }
        finally {

        }
    } //end of while
}

//拿到了公司信用凭证url，然后准备打开，获取信息
async function getCompanyInfo(browser,mainPageCi,url){
    //以下是打开某一个界面获取信息的
    //     url = 'https://sellerjoin.aliexpress.com/credential/showcredential.htm?storeNum=3630157'
        var flagJson={"flag":0};
        var tryCount = 0; //5 次之后，开始轮训用户名称和密码
        var lunxun=0; // 轮训两轮用户名和密码
        while(!(flagJson["flag"]==1)){
            console.log("正在尝试获取信息:",url);

            flagJson=await getInformation(browser,mainPageCi,url); //打开凭证页面，获取信息
            if(flagJson["flag"]==0){//没有登录，需要登录
                console.log("没有登录，重新登录");

                await reLogin(false); //用当前账号再次登录

            }
            else if(flagJson["flag"]==1){//成功
                content=flagJson["content"];
                console.log("获取公司信息成功");

                return content;
                // return {"flag":1,"content":content};
            }
            else if(flagJson["flag"]==2){//滑动窗口失败
                console.log("滑动没有成功，所以没有获取内容");
            }
            else if(flagJson["flag"]==3){//滑动窗口失败
                console.log("滑动成功，没有获取内容出现意外");
            }
            else if(flagJson["flag"]==4){//滑动窗口失败
                console.log("滑动成功，获取内容为空");
                content=flagJson["content"];

                return content;

            }
            tryCount++;
            var countlunxun = 3;
            if(tryCount>5){
                let reloginJson= "";
                if(lunxun<countlunxun){
                    while(lunxun<countlunxun){
                        up=up+1;
                        if(up<userAndPassLists.length){ //说明还没有到最后一个账号
                            console.log("=======================================");
                            console.log("貌似被屏蔽了，系统会选择另一个账号登录，您也可以终止程序运行");
                            console.log("=======================================");
                        }
                        else
                        {
                            up=0;//重新开始
                            lunxun++;
                        }

                        reloginJson=await reLogin(true); //账号登录
                        if(reloginJson["flag"])
                            break;

                    } //end of while
                }

                if(lunxun>=countlunxun  && ( reloginJson=="" || !reloginJson["flag"])){
                            console.log("=======================================");
                            console.log("所有的账号轮训完毕，会等待两个小时，然后重新轮训，您也可以终止程序运行");
                            console.log("=======================================");
                            // await mainPageCi.waitFor(2*3600*1000);//等待2个小时
                            // await browser.close();
                            await Ut.sleep(2000); //等待2s

                            return 9;  //返回9,表示重重新启动浏览器

                }

            }//end of if(tryCount>5)
        } //end of while
        //如果成功的话，不会执行到这里，执行到这里，说明可能被屏蔽了，需要用下一个账号登录了
        // process.exit();

}

async function reLogin(useOtherAccoountFlag){
            username = userAndPassLists[up]['username'];
            pwd = userAndPassLists[up]['pwd'];
            var reloginJson=await login(browser,loginUrl,username,pwd,useOtherAccoountFlag);  //登录成功
            if(mainPage!=null && mainPage!="" && mainPage!='' && mainPage!=undefined ){
                //因为重新登录，把以前的主页面关闭即可
                await mainPage.close();
            }
            mainPage = reloginJson["page"];  //登录成功调转到的页面，也就是首页
            await  loginAfterOperation(mainPage); //登录成功之后，关闭促销等页面
            return reloginJson;
}

async function moveMouseOnCategory(mainPageCg,firstLevelCateroyNumber){

     //获取首页是通过哪个方式显示的，两个的方式
        try {
                //获取分类列表的表头是有几个
            await mainPageCg.waitFor(".categories-content-title > span")

            categoriesLength = await mainPageCg.$$eval('.categories-content-title > span',e=>e.length);
            console.log("categoriesLength的数量：",categoriesLength);
        }
        catch (e) {
            //获取一个的方式
            try {
                    //获取分类列表的表头是有几个
                await mainPageCg.waitFor(".categories-content-title > a")

                categoriesLength = await mainPageCg.$$eval('.categories-content-title > a',e=>e.length);
                console.log("categoriesLength的数量：",categoriesLength);
            }
            catch (e) {

            }
        }

        if(categoriesLength==2){ //如果是有2个，则有分类和促销内容
            //点击分类标签
            mainPageCg.click('.categories-content-title > span:nth-child(1)'); //点击进入商品列表目录

            mouseMoveStr='.categories-content-title > span:nth-child(1)';
        }
        else{
            mouseMoveStr='.categories-content-title > a';
        }
         //鼠标移动到商品分类上
        var frameSel = await mainPageCg.waitForSelector(mouseMoveStr, {timeout: 1000});
        rect = await mainPageCg.evaluate((frameSelx) => {
        const {top, left, bottom, right} = frameSelx.getBoundingClientRect();
        return {top, left, bottom, right}
        } , frameSel)
        // console.log(rect)

        const mouse = mainPageCg.mouse
	    await mouse.move(rect.left+5, rect.top+5,{'delay': 1000}); //移到商品分类标签，上下偏移5个像素

            //鼠标移动到第N个元素上
        // firstLevelCateroyNumber=1; //从哪一个分类 获取数据
        row='.categories-list-box  >  dl:nth-child('+firstLevelCateroyNumber+') > dt';
        rect = await getRectForEle(mainPageCg,row);
        await mouse.move(rect.left+10, rect.top+10,{'delay': 1000}); //上下偏移10个像素
}


async function getTotal(mainPage){
              //获取一级分类数量
        first='.categories-list-box  >  dl';
        await mainPage.waitFor(first);
        const firstLength = await mainPage.$$eval(first,e=>e.length);

        columnLength={};
        for(firstLevelCateroyNumber=1;firstLevelCateroyNumber<firstLength+1;firstLevelCateroyNumber++){
            await moveMouseOnCategory(mainPage,firstLevelCateroyNumber);
            //计算每一个一级分类的列数量
            column='.categories-list-box  >  dl:nth-child('+firstLevelCateroyNumber+')  > dd  >  .sub-cate-main  > .sub-cate-content > .sub-cate-row';
            await mainPage.waitFor(column);
            const columnLen = await mainPage.$$eval(column,e=>e.length);

            columnLength[firstLevelCateroyNumber]={
                "columnLength":columnLen,
            }


            columnLength[firstLevelCateroyNumber]["sendCategoryLength"]={};//存放二级分类数量
            //计算每一个列下2级分类数量
            for(columnNumber=1;columnNumber<columnLen+1;columnNumber++){
                rowContent='.categories-list-box dl:nth-child('+firstLevelCateroyNumber+') dd .sub-cate-main .sub-cate-content .sub-cate-row:nth-child('+columnNumber+') .sub-cate-items';
                await mainPage.waitFor(rowContent)
                const secondCatoryLength = await mainPage.$$eval(rowContent,e=>{return e.length});

                columnLength[firstLevelCateroyNumber]["sendCategoryLength"][columnNumber]={
                    "sendCategoryLength":secondCatoryLength,
                 }

                console.log("console.log(columnLength);");
                console.log(columnLength);
                // thirdCategoryLength=sendCategoryLength[columnNumber]["thirdCategoryLength"];//存放二级分类数量

                columnLength[firstLevelCateroyNumber]["sendCategoryLength"]["thirdCategoryLength"]={}
                for(secondCategoryNumber=1;secondCategoryNumber<secondCatoryLength+1;secondCategoryNumber++){
                     //每一个二级分类下，三级分类的数量
                    clickUrlNumber='.categories-list-box dl:nth-child('+firstLevelCateroyNumber+') dd .sub-cate-main .sub-cate-content .sub-cate-row:nth-child('+columnNumber+') .sub-cate-items:nth-child('+secondCategoryNumber+') dd a';
                    await mainPage.waitFor(clickUrlNumber)
                    const thirdCategoryLength = await mainPage.$$eval(clickUrlNumber,e=>{return e.length});

                    columnLength[firstLevelCateroyNumber]["sendCategoryLength"]["thirdCategoryLength"][secondCategoryNumber]={
                    "thirdCategoryLength":thirdCategoryLength,
                    }
                }

            }
        }
        return columnLength;
}

async function getLinksForOneCategory(mainPageFoc,i,j,p,q){

        try{
            await moveMouseOnCategory(mainPageFoc,i);
            // url="https://www.aliexpress.com";
            // await page.goto(url);
            console.log('开始获取分类的链接信息...');

            let clickUrl='.categories-list-box dl:nth-child('+i+') dd .sub-cate-main .sub-cate-content .sub-cate-row:nth-child('+j+') .sub-cate-items:nth-child('+p+') dd a:nth-child('+q+')'
            await mainPageFoc.waitFor(clickUrl)
            let urlforOnecategory = await mainPageFoc.$eval(clickUrl, node => node.getAttribute('href'));
            let categoryName = await mainPageFoc.$eval(clickUrl, node => node.textContent);
            return {"flag":1,"href":urlforOnecategory,"categoryName":categoryName};
        }
        catch(e)
        {
            // console.log("以下错误是我主动输出调试的");
            // console.log(e);
            return {"flag":0,"href":""};
        }
}

async function getRectForEle(page,ele){
        var frameSel = await page.waitForSelector(ele, {timeout: 30000});
        rect = await page.evaluate((frameSelx) => {
        const {top, left, bottom, right} = frameSelx.getBoundingClientRect();
        return {top, left, bottom, right}
        } , frameSel)
        return rect;
}
//凭证页面，然后获取具体的信息
async function getInformation(browser,mainPageForPu,url){
    while(true){ //这个while的作用是，打开一个信用凭证页面，并且等待滑块出现
            try {
                // # 切换到一个界面
                mainPageToInfo=await loadPage(browser,url);

                console.log("开始等待5秒，请不要着急……");
                await mainPageToInfo.waitFor(5000);//等待20秒

                if(mainPageToInfo.url().indexOf("login") > 0){ //说明没有登录，需要登录
                    await mainPageToInfo.close();
                    return {"flag":0,"page":mainPageToInfo};//没有登录
                }
                // 等待滑块出现
                slide_btn = await mainPageToInfo.waitForSelector('#nc_1_n1z', {timeout: 30000})
                break;
            }catch(e) {
                // console.log(e);
                if(mainPageToInfo!=null && mainPageToInfo!="" && mainPageToInfo!=undefined )
                    await mainPageToInfo.close();
                console.log('222: I am in while and i catch a exception');
                await Ut.sleep(2000); //等待2s
            }
        } //end of while

        //这里是开始滑动滑块
        if(slide_btn){
            // console.log('获取信息页面出现滑块情况判定');
            // await page.screenshot({'path': './headless-login-slide.png'})  //# 截图测试
            flagJson = await mouse_slide_getC(mainPageToInfo,mainPageToInfo,null,'nc_1_n1z','nc-lang-cnt')   //# js拉动滑块过去。
            pageInfunc=flagJson["page"];
            // console.log(flagJson["flag"])
             try{
                if(flagJson["flag"]){
                    // await page.screenshot({'path': './companyInfomarin.png'})  //# 截图测试
                    // content = await page.$$eval('#container > div.clearfix > div.fn-left', 'node => node.textContent');
                    let content ='';
                    content = await pageInfunc.$$eval('#container > div.clearfix > div.fn-left', nodes => {
                                return nodes.map(node => {
                                    return {
                                        content: node.textContent
                                    }
                                });
                            });
                    // console.log(content);
                    if(content!="" && content!=''){
                        return {"flag":1,"page":pageInfunc,"content":content}; //成功获取内容
                    }
                    else{
                        return {"flag":4,"page":pageInfunc,"content":content}; //成功获取内容为空
                    }

                }
                else{
                    // console.log("console.log enter", flagJson["flag"]);
                    return {"flag":2,"page":pageInfunc};//滑动没有成功
                }
            }
            catch(e)
            {
                return {"flag":3,"page":pageInfunc};//滑动成功了，但是没有获取内容
                // console.log("获取内容失败，重新试一次");
            }
            finally {
                    if(pageInfunc!=null && pageInfunc!="" && pageInfunc!=undefined ){
                            await pageInfunc.close();
                    }
            }

        }
        else { //没有滑动滑块，关闭页面即可
                if(mainPageToInfo!=null && mainPageToInfo!="" && mainPageToInfo!=undefined )
                {
                    await mainPageToInfo.close();
                }

        }
}

async function mouse_slide_getC(page,frame,frameId,fang,huaCao){
    originUrl=page.url(); //需要验证滑块的url
    await page.waitFor(1000)   //延迟1秒
    try{
        console.log('开始验证滑块...')
        // 等待滑块出现
        //计算frame的位置
        var iframeRect;
        if(frameId!=null){
            var frameSel = await page.waitForSelector(frameId, {timeout: 30000});
            iframeRect = await page.evaluate((frameSelx) => {
	        const {top, left, bottom, right} = frameSelx.getBoundingClientRect();
	        return {top, left, bottom, right}
	        } , frameSel)
            // console.log(iframeRect);
        }

        //计算frame里面的东西
        id="#"+fang;
	    var slide_btn = await frame.waitForSelector(id, {timeout: 30000})
		// 计算滑块位置
	    const rect = await frame.evaluate((idx) => {
	        const {top, left, bottom, right} = idx.getBoundingClientRect();
	        return {top, left, bottom, right}
	    }, slide_btn)
        // console.log(rect)
        if(frameId!=null){
            rect.left = iframeRect.left+rect.left + 10
	        rect.top = iframeRect.top+rect.top + 10
        }
        else{
            rect.left = rect.left + 10
	        rect.top = rect.top + 10
        }

	    const mouse = page.mouse
        // 下面这两个是随机移动，迷惑对方
        await mouse.move(alifunc.input_time_random(100,151), alifunc.input_time_random(200,851));
        await mouse.move(alifunc.input_time_random(300,651), alifunc.input_time_random(200,751));

        //移到滑动条的左边
	    await mouse.move(rect.left, rect.top,{'delay': 1500})

        // 关键点2
	    await page.touchscreen.tap(rect.left, rect.top) // h5需要手动分发事件 模拟app的事件分发机制。
	    await mouse.down()
	    var start_time = new Date().getTime()
	    await mouse.move(rect.left + 800, rect.top, {steps: alifunc.input_time_random(80,180)});
	    await page.touchscreen.tap(rect.left + 800, rect.top);
	    // console.log(new Date().getTime() - start_time)
	    await mouse.up()

    }
    catch(e){
        // console.log(e);
        console.log('验证失败,准备重新试验');
        return {"flag":false,"page":page};
    }
    await page.waitFor(1000)   //延迟1秒
    // # 判断是否通过  Please slide to verify，每一个页面都有不同的验证方式
    if(originUrl.indexOf("showcredential")>0){ //说明是获取公司信息页面
        try {
            slider_again = await page.$eval('div#nc_1__scale_text > .nc-lang-cnt > b', node => node.textContent)
            // console.log("+++++++++++++++++++++++++++++++++slider_again")
            // console.log(slider_again)
            if(slider_again != 'Verified')
                return {"flag":false,"page":page};
            else{
                // await page.screenshot({'path': './headless-slide-result.png'});
                // console.log('获取公司信息页面滑动窗口验证通过');
                return {"flag":true,"page":page};
            }
        }
        catch{ // 说明没有等到这个元素的出现，所以失败
            return {"flag":false,"page":page};
        }

    }
    else {//说明是登录页面的滑动窗口验证
        console.log('登录页面的滑动窗口验证通过');
        return {"flag":true,"page":page};
    }

}

async function loadBrowser(){
     // # 以下使用await 可以针对耗时的操作进行挂起
    browser = await puppeteer.launch({
        'headless': headless,
        // 'headless': true,
        'timeout': 60000*3, // 默认超时为60秒，设置为0则表示不设置超时
        'dumpio': true,
        'ignoreDefaultArgs': ['--enable-automation'],
        'args': [
            '--disable-extensions',
            '--hide-scrollbars',
            '--disable-bundled-ppapi-flash',
            '--mute-audio',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',
        ],
    })  //# 启动pyppeteer 属于内存中实现交互的模拟器

   return browser;
}

async function loadPage(browser,url){


    // await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36');
    // await page.setExtraHTTPHeaders({
    // 'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8'
    // });
    // await page.setUserAgent(
    //     'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36 Edge/16.16299')
    var page = "";
    while(true){
        try {
            page = await browser.newPage(); //# 启动个新的浏览器页面，此会自动下载Chromeium
            await page.goto(url);
            break;
        }catch(e) {
            // console.log(e);
            console.log('1111: I  catch a exception when loading new page');
            await Ut.sleep(2000); //等待2s
            if(page!=null && page != '' && page!=undefined){
                await page.close();
            }

        }
    } //end of true




    await page.setViewport({width:1100,height:800});

    await page.waitFor(1000)   //延迟1秒输入

    // console.log(exeJs.js1)
    await page.evaluate(exeJs.js1) //#以下为插入中间js，将淘宝会为了检测浏览器而调用的js修改其结果。
    // await page.evaluate(exeJs.js2)
    // await page.evaluate(exeJs.js3)
    // await page.evaluate(exeJs.js4)

    return page;
}

// 新的页面打开后之后关闭促销页面等
async function newPageLoadAfterOperation(page){

    //等待3秒开始操作
    await page.waitFor(300);
    try{
        // console.log('新的页面打开后做一些预处理操作:',page.url());
        await page.waitFor(".next-dialog > a.next-dialog-close");
        page.click('.next-dialog > a.next-dialog-close');

    }catch (e) {
        // console.log(e);
    }
}

// 登录之后关闭促销页面等
async function loginAfterOperation(page){

    //等待3秒开始操作
    await page.waitFor(300);
    try{
        console.log('登录后做一些预处理操作:',page.url());
        await page.waitFor(".close-layer");
        const searchInputs = await page.$(".close-layer");
        // console.log("searchInputs",searchInputs);
        page.click('a.close-layer');

    }catch (e) {
        // console.log(e);
    }
}

async function login(browsr,url,userName,pass,useOtherAccoountFlag){

    var page="";

    loginFlag = false;
    while(!loginFlag){ //如果没有登录成功

        while(true){
            try {
                page=await loadPage(browser,url)
                //切换iframe框代码
                await page.waitFor("#alibaba-login-box")
                break;
            }catch(e) {
                // console.log(e);
                if(page!=null && page!="" && page!=undefined )
                    await page.close();
                console.log('222: I am in while and i catch a exception');
            }
        }

        // console.log(page.url());
        // return;

        // const frame = ( await page.frames() )[2]; //使用索引方式切换到iframe 成功
        //使用title方式切换
        //得到ifram里面的title属性，进行对比
          const frames = await page.frames();//得到所有的frame和iframe框架
          for (var i of frames) {	//使用循环取出iframe
            if (await i.title() === 'Login') {var frame = i;} //使用title()函数得到里面的title标题进行对比
          };

        // console.log(frame.title)
        // let iframe = await page.frames().find(f => f.name() === 'qy_r');//找名称为qy_r的子框架
        try {
            // await frame.waitFor(300);
            // await frame.waitFor(".has-login") //说明页面已经登录了
            // console.log('9999999999999999999999999');
            hasLogin=await frame.$eval(".has-login > .has-login-user",e=>e.textContent);

         }
        catch(err){
                //说明登录页面没有已经登录的提示信息
                hasLogin="";
        } //end of catch
        finally {

            try{

                     // console.log("hasLogin:",hasLogin);
                usernamec = userAndPassLists[up]['username'];
                if(hasLogin!={} && hasLogin!="" && hasLogin!=null && hasLogin!=undefined){//已有账号登录提示
                    if(!useOtherAccoountFlag){//在原有账号登录即可
                        await frame.click(".fm-btn button")
                        loginFlag=true;
                        return {"flag":loginFlag,"page":page};
                    }
                    else if(hasLogin==usernamec){
                        await frame.click(".fm-btn button")
                        loginFlag=true;
                        return {"flag":loginFlag,"page":page};
                    }
                    else{ //用其他账号登录
                        //点击用其他账号登录的按钮
                        await frame.click(".other-account-login-link a");
                    }
                }
                // else if(useOtherAccoountFlag){ //用其他账号登录


                slider = false; //说明不需要滑动

                // # 使用type选定页面元素，并修改其数值，用于输入账号密码，修改的速度仿人类操作，因为有个输入速度的检测机制
                // # 因为 pyppeteer 框架需要转换为js操作，而js和python的类型定义不同，所以写法与参数要用字典，类型导入
                await frame.waitFor("#fm-login-id")
                // await frame.type('#fm-login-id', "", {'delay': alifunc.input_time_random(100,151) - 50}); //这个不能清空
                await frame.$eval('#fm-login-id',input => input.value='' ); //先清空一次
                await frame.type('#fm-login-id', username, {'delay': alifunc.input_time_random(100,151) - 50});
                await  frame.waitFor("#fm-login-password")
                // await frame.type('#fm-login-password', "", {'delay': alifunc.input_time_random(100,151)});//这个不能清空
                await frame.$eval('#fm-login-password',input => input.value='' );
                await frame.type('#fm-login-password', pwd, {'delay': alifunc.input_time_random(100,151)});
                // # await page.screenshot({'path': './headless-test-result.png'}) # 截图测试


                //等待3秒后退出浏览器
                await page.waitFor(300);


                // console.log("-----------------loginFlag----------------------",loginFlag)
                // await frame.click(".fm-btn button") ; //先登录一次再说
                try{
                    //  # 监测登录页面是否有滑块。原理是检测页面元素。
                    // slider = await frame.$eval('#nc_1_n1z', 'node => node.style')  //# 是否有滑块 nocaptcha-password
                    slider = await frame.$eval('#nocaptcha-password', node => node.getAttribute('style'))  //# 是否有滑块
                    // slider = await frame.$('#nocaptcha-password').evaluate(document.querySelector('#nocaptcha-password').style.display;);
                    // slider = await frame.evaluate(() => { document.querySelector('#nocaptcha-password').css.display; });
                    // console.log("---------------------------------------")
                    console.log(slider)
                    if(slider.indexOf("none") > 0 )
                        slider=false;
                    else
                        slider=true;
                        // slider=false;
                }
                catch (e) {
                    // console.log(e)
                    slider = false; //说明不需要滑动
                }

                if(slider){
                    console.log('登录出现滑块');
                    tapJson=false;
                    i=1;
                    while(!tapJson && i<3){ //三次不成功之后不再滑动了
                        console.log("正在尝试解锁登录滑块");
                        flagJson = await mouse_slide_getC(page,frame,"#batman-login-wrap",'nc_1_n1z','nc-lang-cnt');   //# js拉动滑块过去。第二个参数是方框，第三个是槽位
                        i++;
                        tapJson=flagJson["flag"];
                        console.log("tapJson:",tapJson);
                        await page.waitFor(10);
                    }
                }


                // await frame.keyboard.press('Enter')
                await frame.click(".fm-btn button")
                // # console.log("console.log enter")
                // # await page.evaluate('''document.getElementById("J_SubmitStatic").click()''')
                await frame.waitFor(1000)
                try{
                    // global error    # 检测是否是账号密码错误
                    tips = await frame.$eval('.login-error-msg', 'node => node.textContent')
                    // console('++++++++++++++++++++++++++logintips');
                    // console(tips);
                    if(tips!="" &&  tips!=null && tips!=undefined)
                         loginFlag = false;//说明有错误提示信息，没有登录成功
                    else //说明没有错误提示信息，登录成功
                        loginFlag = true;
                }
                catch(e){ //没有找到这个元素，说明登录成功，并且跳转成功了
                    loginFlag = true;
                    // console.log('获取登录是否成功的标志时发生异常');
                }

                finally{
                    if(!loginFlag){
                        await page.close();
                        console.log('账户和密码可能不对，重新输入');
                     }//end of if
                }
            // } //end of else，用其他账号登录

            }
            catch (e) {
                console.log("下面的错误是我主动输出的，不用管");
                console.log(e);

            }


        }//end of finally
    }//end of while

     return {"flag":loginFlag,"page":page};
}//end of function

async function startWork() {



        //     linkargs="//www.aliexpress.com/category/2118/printers.html";

        // console.log("*************接收到页面1*******:",linkargs);

        // urlToGetInfo = biaozhunUrl(linkargs);

        // urlToGetInfo = biaozhunUrl(linkargs);

        //  console.log("*************接收到页面2*******:",urlToGetInfo);



    // //切换iframe框代码
    // await page.waitFor("#alibaba-login-box")
    var browser=await loadBrowser();


    // loginUrl11 = 'https://sellerjoin.aliexpress.com/credential/showcredential.htm?storeNum=3630157';
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
    username = userAndPassLists[up]['username'];
    pwd = userAndPassLists[up]['pwd'];

    loginJson=await login(browser,loginUrl,username,pwd,false);  //登录成功
    mainPage = loginJson["page"];  //登录成功调转到的页面，也就是首页


    await  loginAfterOperation(mainPage); //登录成功之后，关闭促销等页面

    if(!loginJson["flag"]){
        return;
    }//end of if

/////////////////////////////////////////////////////////////////////////////////////////////////////////

    //while(true){
    //     try {
    //         mainPage=await loadPage(browser,"https://www.aliexpress.com/")
    //         //切换iframe框代码
    //         // await page.waitFor("#alibaba-login-box")
    //         break;
    //     }catch(e) {
    //         // console.log(e);
    //         if(mainPage!=null && mainPage!="" && mainPage!=undefined )
    //             mainPage.close();
    //         console.log('222: I am in while and i catch a exception');
    //     }
    // }
    // await  loginAfterOperation(mainPage); //登录成功之后，关闭促销等页面

/////////////////////////////////////////////////////////////////////////////////////////////////////////
         // #登录成功了
        console.log('登录成功了');

        //首先获取从哪一页开始，从表达的数值开始
        alPageNumber=getAlreadPageNumber();
        if(isInteger(pageNumberStart) && alPageNumber!=-1 && pageNumberStart<alPageNumber)
            pageNumberStart = alPageNumber;  //谁大就用谁


        // argsflag = (categoryArgs==='') || (categoryArgs===null) || (categoryArgs===""); //在main函数里面得到的categoryArgs
        // // console.log(argsflag);
        // if(!argsflag){ //没有分类的信息
        //     //这里暂时不执行，太慢了，生产环境可以执行
        //     console.log("没有分类信息，需要读取，速度会很慢，请耐心等待");
        //     total= await getTotal(mainPage);
        //     nowTime = getNowDate();
        //     var contentToFile={"total":total,"time":nowTime}
        //     content=JSON.stringify(contentToFile) //存储文件时，需要反序列化
        //     file.writeFileSync('categoryNumber.txt',content);
        // }
        // else{//有分类的信息
        //
        //      contentFromFile=JSON.parse(categoryArgs) //反序列化 字符串转字典：
        //
        //      time =  contentFromFile["time"];
        //
        //      nowtime =  getNowDate();
        //      intervelFlag = compareDateBiggerThanNumber(contentFromFile["time"],nowtime,1);
        //      if(intervelFlag){
        //          console.log("有分类信息，但是时间过长，需要重新读取，速度会很慢，请耐心等待");
        //          total= await getTotal(mainPage);
        //         nowTime = getNowDate();
        //         var contentToFile={"total":total,"time":nowTime}
        //         content=JSON.stringify(contentToFile) //存储文件时，需要反序列化
        //         file.writeFileSync('categoryNumber.txt',content);
        //      }
        //      else
        //      {
        //          console.log("恭喜，有分类信息，时间也没有过期");
        //         total = contentFromFile["total"];
        //      }
        // } // end of 有分类信息
        //
        // alreadyReadFlag = (alreadyReadArgs==='') || (alreadyReadArgs===null) || (alreadyReadArgs==="")
        // console.log(alreadyReadFlag);
        // if(!alreadyReadFlag){ //有已经读取的分类信息，也就是上一次遍历的地方
        //     alreadyReadSplitArgs = alreadyReadArgs.split("#");
        //
        //     firstLevelCateroyNumber = parseInt(alreadyReadSplitArgs[0]); //已经读取到哪一个分类了，需要和从开始读的那个数值做一个比较
        //     if(firstLevelCateroyNumberStart>firstLevelCateroyNumber) //新输入的参数比较大，按照新输入的来执行程序即可
        //         firstLevelCateroyNumber = firstLevelCateroyNumberStart;
        //     columnNumber = parseInt(alreadyReadSplitArgs[1]);
        //     secondCategoryNumber = parseInt(alreadyReadSplitArgs[2]);
        //     thirdNumber = parseInt(alreadyReadSplitArgs[3]);
        //     pageNumber = parseInt(alreadyReadSplitArgs[4]);
        //
        // }
        // else{ //没有已经读取到的分类信息，根据输入参数从零开始遍历
        //     firstLevelCateroyNumber = firstLevelCateroyNumberStart;
        //     columnNumber = 1;
        //     secondCategoryNumber = 1;
        //     thirdNumber = 1;
        //     pageNumber = 1;
        // }



        // firstCount=Object.keys(total).length;//第一级别长度
        // console.log("firstCount:",firstCount)

        // if(isInteger(firstLevelCateroyNumberEnd) && firstLevelCateroyNumberEnd<firstCount)
        //     firstCount = firstLevelCateroyNumberEnd;  //采用用户输入的结束位置

        // for(level1=firstLevelCateroyNumber;level1<firstCount+1;level1++){
        //     columnLength=total[level1].columnLength; //列长度
        //     for(level2=columnNumber;level2<columnLength+1;level2++){
        //         sendCategoryLength=total[level1]["sendCategoryLength"][level2]; //列里面二级列表长度
        //         for(level3=secondCategoryNumber;level3<sendCategoryLength+1;level3++){
        //             thirdCategoryLength=total[level1]["sendCategoryLength"]["thirdCategoryLength"][level3]; //三级列表长度
        //             for(level4=thirdNumber;level4<thirdCategoryLength+1;level4++){

                            while(true){
                                try{
                                    await mainPage.bringToFront()
                                    linkJson=await getLinksForOneCategory(mainPage,level1,level2,level3,level4);
                                    sflagForca=linkJson["flag"];
                                    if(sflagForca==1){
                                        categoryLink = linkJson["href"];
                                        categoryLink = biaozhunUrl(categoryLink);  // 全局变量
                                        var categoryName = linkJson["categoryName"]; // 在这个函数中起作用
                                        // console.log("categoryLink:",categoryLink);
                                        break;
                                    }
                                    await mainPage.reload();
                                    await  newPageLoadAfterOperation(mainPage); //关闭促销等页面
                                }
                                catch(e)
                                {
                                    console.log("重新加载……")
                                }

                            }
                            for(t=pageNumberStart;t<pageNumberEnd;t++){
                                console.log("再一次进入分类页面:",categoryLink);
                                let oagt=await openLinkAndGetInfomation(browser,categoryLink,t,categoryName);
                                let flag = oagt["flag"];
                                if(flag == 9){ //说明要重新启动浏览器
                                     console.log("开始重新启动浏览器");
                                     await browser.close();
                                     return resultT={"flag":9,"info":""}; //说明要重新启动浏览器

                                }
                                writeHaveReadToFile(level1,level2,level3,level4,t+1)  //记录的是下次需要读取的位置
                            }//end of for
        //                 writeHaveReadToFile(level1,level2,level3,level4+1,1)
        //             }//end of for
        //             writeHaveReadToFile(level1,level2,level3+1,1,1)
        //         }//end of for
        //         writeHaveReadToFile(level1,level2+1,1,1,1)
        //     }//end of for
        //     writeHaveReadToFile(level1+1,1,1,1,1)
        // }


};

function writeHaveReadToFile(i,j,p,q,pageNumberToW){
    haveReadToFile = i+"#"+j+"#"+p+"#"+q+"#"+pageNumberToW;
    file.writeFileSync('haveRead.txt',haveReadToFile)
}

function getNowDate(){
    var date = new Date()
    var year = date.getFullYear()
    var month = date.getMonth()
    var day = date.getDate()
    //月份需要+1，因为月份获取的是0-11
    return `${year}-${(month+1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

//比较日期大小
function compareDateBiggerThanNumber(date1, date2,number) {
    var startTime=Date.parse(new Date(date1));
    var endTime=Date.parse(new Date(date2));
    var cha=(endTime-startTime)/1000/3600/24;
    if(cha>number)
        return true
    else
        return false
}

function isInteger(obj) {
    return Math.floor(obj) === obj
}

//主函数
(async () => {

    //process是一个全局对象，argv返回的是一组包含命令行参数的数组。
    //第一项为”node”，第二项为执行的js的完整路径，后面是附加在命令行后的参数,所以下面是4，而不是2
    var arguments = process.argv.slice(2);    //注意：这个函数不能在下面这个函数之前运行，因为会阶段输入的参数

    console.log('所传递的参数是：', arguments);
    if(arguments.length != 5){
        console.log("请输入5个参数，参数类型为整数,最后一个参数是0或者1，调试用的");
        process.exit();
    }

    val=parseInt(arguments[0])
    if (isInteger(val))
        firstLevelCateroyNumberStart=parseInt(val); //获取数据的开始分类
    else{
        console.log("第一个参数请输入整数");
        process.exit()          //这里需要停止运行
    }

    val=parseInt(arguments[1])
    if (isInteger(val))
        firstLevelCateroyNumberEnd=parseInt(val); //获取数据的终点分类
    else{
        console.log("第二个参数请输入整数");
        process.exit()         //这里需要停止运行
    }

    val=parseInt(arguments[2])
    if (isInteger(val)){
        if(val>0)
            pageNumberStart=parseInt(val); //获取数据从哪一页开始
        else{
            console.log("第3个参数是页数，页数必须大于0");
            process.exit();         //这里需要停止运行
        }

    }
    else{
        console.log("第3个参数请输入整数");
        process.exit()         //这里需要停止运行
    }

    val=parseInt(arguments[3])
    if (isInteger(val))
        pageNumberEnd=parseInt(val); //获取数据在哪一页结束
    else{
        console.log("第4个参数请输入整数");
        process.exit()         //这里需要停止运行
    }

    val=parseInt(arguments[4])
    if (isInteger(val) && val==1)
        headless=false; //打开浏览器，不执行headless
    else if (isInteger(val) && val==0){
        headless=true; //不打开浏览器，执行headless
    }

    // console.log(pageNumberStart)
    // console.log(pageNumberEnd)

    //获取参数，第一个参数是开始分类  第二个参数是结束分类,以下函数可能是异步的，我没有测试
    // print process.argv
    // process.argv.forEach(function (val, index, array) {
    //     console.log(index + ': ' + val);
    //     // var argsCount()
    //     if(index==2){
    //         val=parseInt(val)
    //         if (isInteger(val))
    //             firstLevelCateroyNumberStart=parseInt(val); //获取数据的开始分类
    //         else{
    //             console.log("第一个参数请输入整数");
    //             process.exit()          //这里需要停止运行
    //         }
    //
    //     }
    //     else if(index==3){
    //         val=parseInt(val)
    //         if (isInteger(val))
    //             firstLevelCateroyNumberEnd=parseInt(val); //获取数据的终点分类
    //         else{
    //             console.log("第二个参数请输入整数");
    //             process.exit()         //这里需要停止运行
    //         }
    //     }
    //
    //
    //
    //     categoryArgsPath = "categoryNumber.txt";
    //     categoryArgs  = fs.readFileSync(categoryArgsPath, 'utf8');
    //
    //
    //     alreadyReadPath = "haveRead.txt";
    //     alreadyReadArgs = fs.readFileSync(alreadyReadPath, 'utf8');
    //
    // });


    categoryArgs  = fs.readFileSync(categoryArgsPath, 'utf8');



    alreadyReadArgs = fs.readFileSync(alreadyReadPath, 'utf8');

    let stFlag = 9;
    while(true){
        try{
            let st=await startWork();
            stFlag = st["flag"];
            // if(stFlag == 9){ //说明要重新启动浏览器
            //      console.log("启动浏览器");
            // }

        }
        catch(e){
            console.log("我调试用的");
            console.log(e);
        }

    }



})();
