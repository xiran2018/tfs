const puppeteer = require('puppeteer');
const exeJs = require('./exeJs');
const alifunc = require('./alifunc');


async function mouse_slide_getC(page,fang,huaCao){
    await page.waitFor(1000)   //延迟1秒
    try{
        console.log('开始验证滑块...')
        // 等待滑块出现
	    var slide_btn = await page.waitForSelector('#nc_1_n1z', {timeout: 30000})
		// 计算滑块距离
	    const rect = await page.evaluate((slide_btn) => {
	        const {top, left, bottom, right} = slide_btn.getBoundingClientRect();
	        return {top, left, bottom, right}
	    }, slide_btn)
        // console.log(rect)
	    rect.left = rect.left + 10
	    rect.top = rect.top + 10
	    const mouse = page.mouse
	    await mouse.move(rect.left, rect.top,{'delay': 1500})

        // 关键点2
	    await page.touchscreen.tap(rect.left, rect.top) // h5需要手动分发事件 模拟app的事件分发机制。
	    await mouse.down()
	    var start_time = new Date().getTime()
	    await mouse.move(rect.left + 800, rect.top, {steps: 25})
	    await page.touchscreen.tap(rect.left + 800, rect.top,)
	    // console.log(new Date().getTime() - start_time)
	    await mouse.up()

    }
    catch(e){
        console.log(e, ':验证失败')
        return {"flag":false,"page":page}
    }
    await page.waitFor(1000)   //延迟1秒
    // # 判断是否通过  Please slide to verify
    slider_again = await page.$eval('div#nc_1__scale_text > .nc-lang-cnt > b', node => node.textContent)
    console.log("+++++++++++++++++++++++++++++++++slider_again")
    console.log(slider_again)
    if(slider_again != 'Verified')
        return {"flag":false,"page":page}
    else{
        await page.screenshot({'path': './headless-slide-result.png'})
        console.log('验证通过')
        return {"flag":true,"page":page}
    }
}

async function loadBrowser(){
     // # 以下使用await 可以针对耗时的操作进行挂起
    browser = await puppeteer.launch({
        'headless': false,
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

    while(true){
        try {
            page = await browser.newPage(); //# 启动个新的浏览器页面，此会自动下载Chromeium
            await page.goto(url);
            break;
        }catch(e) {
            // console.log(e);
            console.log('1111: I am in while and i catch a exception');
            page.close();
        }
    }




    await page.setViewport({width:1100,height:800});

    await page.waitFor(1000)   //延迟1秒输入

    // console.log(exeJs.js1)
    await page.evaluate(exeJs.js1) //#以下为插入中间js，将淘宝会为了检测浏览器而调用的js修改其结果。
    // await page.evaluate(exeJs.js2)
    // await page.evaluate(exeJs.js3)
    // await page.evaluate(exeJs.js4)

    return page;
}

(async () => {

    username = 'yunzhongzhizi_2007@126.com'
    pwd = '19880202Q'

    // //切换iframe框代码
    // await page.waitFor("#alibaba-login-box")
    browser=await loadBrowser();
    var page;
    url = 'https://login.aliexpress.com';
    while(true){
        try {

            page=await loadPage(browser,url)
            //切换iframe框代码
            await page.waitFor("#alibaba-login-box")
            break;
        }catch(e) {
            // console.log(e);
            if(page!=null && page!="" && page!=undefined )
                page.close();
            console.log('222: I am in while and i catch a exception');
        }
    }


    // const frame = ( await page.frames() )[2]; //使用索引方式切换到iframe 成功
    //使用title方式切换
    //得到ifram里面的title属性，进行对比
      const frames = await page.frames();//得到所有的frame和iframe框架
      for (var i of frames) {	//使用循环取出iframe
        if (await i.title() === 'Login') {var frame = i;} //使用title()函数得到里面的title标题进行对比
      };
    // console.log(frame.title)


    // let iframe = await page.frames().find(f => f.name() === 'qy_r');//找名称为qy_r的子框架

    // # 使用type选定页面元素，并修改其数值，用于输入账号密码，修改的速度仿人类操作，因为有个输入速度的检测机制
    // # 因为 pyppeteer 框架需要转换为js操作，而js和python的类型定义不同，所以写法与参数要用字典，类型导入
    frame.waitFor("#fm-login-id")
    await frame.type('#fm-login-id', username, {'delay': alifunc.input_time_random(100,151) - 50})
    frame.waitFor("#fm-login-password")
    await frame.type('#fm-login-password', pwd, {'delay': alifunc.input_time_random(100,151)})
    // # await page.screenshot({'path': './headless-test-result.png'}) # 截图测试

    //等待3秒后退出浏览器
    await page.waitFor(30);

    try{
        //点击登录按钮
        //  # 监测登录页面是否有滑块。原理是检测页面元素。
        slider = await frame.$eval('#nc_1_n1z', 'node => node.style')  //# 是否有滑块
        console("---------------------------------------")
        console(slider)
    }
    catch (e) {
        slider = false; //说明不需要滑动
    }

    if(slider){
        console.log('出现滑块情况判定');
        flag,page = await mouse_slide_getC(page=page,'nc_1_n1z','nc-lang-cnt');   //# js拉动滑块过去。第二个参数是方框，第三个是槽位
    }

    else{
        // await frame.keyboard.press('Enter')
        await frame.click(".fm-btn button")
        // # console.log("console.log enter")
        // # await page.evaluate('''document.getElementById("J_SubmitStatic").click()''')
        await frame.waitFor(20)
        try{
            // global error    # 检测是否是账号密码错误
            error = await frame.$eval('.login-error-msg', 'node => node.textContent')
            console('++++++++++++++++++++++++++error');
            console(error)
            if(error!="" || error!=null || error!=undefined)
                error = true
        }
        catch(e){ //说明跳转成功了
            error = false
            // console.log('发生错误：检测是否是账号密码错误时')
        }

        finally{
            error=false
            if(error)
                console.log('确保账户正确重新入输入')
            else{
                // #登录成功了
                console.log('登录成功了，现在的页面是：')
                console.log(page.url())

                url = 'https://sellerjoin.aliexpress.com/credential/showcredential.htm?storeNum=3630157'
                while(true){
                    try {
                        // # 切换到一个界面
                        page=await loadPage(browser,url)

                        // 等待滑块出现
	                    slide_btn = await page.waitForSelector('#nc_1_n1z', {timeout: 30000})
                        break;
                    }catch(e) {
                        // console.log(e);
                        if(page!=null && page!="" && page!=undefined )
                            page.close();
                        console.log('222: I am in while and i catch a exception');
                    }
                }


                if(slide_btn){
                    console.log('获取信息页面出现滑块情况判定')
                    await page.screenshot({'path': './headless-login-slide.png'})  //# 截图测试
                    flagJson = await mouse_slide_getC(page=page,'nc_1_n1z','nc-lang-cnt')   //# js拉动滑块过去。
                    page=flagJson["page"];
                    console.log(flagJson["flag"])
                    if(flagJson["flag"]){
                        // await page.screenshot({'path': './companyInfomarin.png'})  //# 截图测试
                        // content = await page.$$eval('#container > div.clearfix > div.fn-left', 'node => node.textContent');
                        content = await page.$$eval('#container > div.clearfix > div.fn-left', nodes => {
                                    return nodes.map(node => {
                                        return {
                                            content: node.textContent
                                        }
                                    });
                                });
                        console.log(content);
                    }
                    else
                        console.log("console.log enter", flagJson["flag"])
                }
            }
        }


    }
    // await browser.close();
})();
