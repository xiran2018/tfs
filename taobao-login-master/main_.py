import asyncio
import time
from pyppeteer.launcher import launch
from alifunc import mouse_slide, input_time_random
from exe_js import js1, js3, js4, js5


async def main(username, pwd, url):
    # 以下使用await 可以针对耗时的操作进行挂起
    browser = await launch({
        'headless': False,
        'dumpio': True,
        'args': [
            '--disable-extensions',
            '--hide-scrollbars',
            '--disable-bundled-ppapi-flash',
            '--mute-audio',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',
        ],
    })  # 启动pyppeteer 属于内存中实现交互的模拟器

    page = await browser.newPage() # 启动个新的浏览器页面，此会自动下载Chromeium
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36 Edge/16.16299')

    await page.goto(url)# 访问登录页面
    # 替换淘宝在检测浏览时采集的一些参数。
    # 就是在浏览器运行的时候，始终让window.navigator.webdriver=false
    # navigator是windiw对象的一个属性，同时修改plugins，languages，navigator 且让

    await page.evaluate(js1) #以下为插入中间js，将淘宝会为了检测浏览器而调用的js修改其结果。
    await page.evaluate(js3)
    await page.evaluate(js4)
    await page.evaluate(js5)
    # 使用type选定页面元素，并修改其数值，用于输入账号密码，修改的速度仿人类操作，因为有个输入速度的检测机制
    # 因为 pyppeteer 框架需要转换为js操作，而js和python的类型定义不同，所以写法与参数要用字典，类型导入
    await page.type('.J_UserName', username, {'delay': input_time_random() - 50})
    await page.type('#J_StandardPwd input', pwd, {'delay': input_time_random()})
    # await page.screenshot({'path': './headless-test-result.png'}) # 截图测试
    time.sleep(2)

    # 检测页面是否有滑块。原理是检测页面元素。
    slider = await page.Jeval('#nocaptcha', 'node => node.style')  # 是否有滑块

    if slider:
        print('出现滑块情况判定')
        # await page.screenshot({'path': './headless-login-slide.png'}) # 截图测试
        flag = await mouse_slide(page=page) #js拉动滑块过去。
        if flag:
            # await page.keyboard.press('Enter')  # 确保内容输入完毕，少数页面会自动完成按钮点击
            # print("print enter", flag)
            # await page.evaluate('''document.getElementById("J_SubmitStatic").click()''')  # 如果无法通过回车键完成点击，就调用js模拟点击登录按钮。

            # time.sleep(2)
            # cookies_list = await page.cookies() # 这个和下面这句用一个就可以了
            cookies = await get_cookie(page)  # 导出cookie 完成登陆后就可以拿着cookie玩各种各样的事情了。
        else:
            print("print enter", flag)
    else:
        await page.keyboard.press('Enter')
        # print("print enter")
        # await page.evaluate('''document.getElementById("J_SubmitStatic").click()''')
        await page.waitFor(20)
        await page.waitForNavigation()
        try:
            global error    # 检测是否是账号密码错误
            error = await page.Jeval('.error', 'node => node.textContent')
        except Exception as e:
            error = None
            # print('发生错误：', e) #不用输出信息，意义不大
        finally:
            if error:
                print('确保账户安全重新入输入')
                # 程序退出。
                # loop.close()
            else:
                print(page.url)
                cookies = await get_cookie(page)

    time.sleep(5)
    return cookies

# 获取登录后cookie
async def get_cookie(page):
    res = await page.content()
    cookies_list = await page.cookies()
    cookies = ''
    for cookie in cookies_list:
        str_cookie = '{0}={1};'
        str_cookie = str_cookie.format(cookie.get('name'), cookie.get('value'))
        cookies += str_cookie
    # print(cookies)
    return cookies


if __name__ == '__main__':
    username = 'jingquanliang'
    pwd = '880309jQl'
    # url = 'https://login.taobao.com/member/login.jhtml?style=mini&css_style=b2b&from=b2b&full_redirect=true&redirect_url=https://login.1688.com/member/jump.htm?target=https://login.1688.com/member/marketSigninJump.htm?Done=http://login.1688.com/member/taobaoSellerLoginDispatch.htm&reg= http://member.1688.com/member/join/enterprise_join.htm?lead=http://login.1688.com/member/taobaoSellerLoginDispatch.htm&leadUrl=http://login.1688.com/member/'
    # url = 'https://login.taobao.com/member/login.jhtml?style=mini'
    url = 'https://login.aliexpress.com/'
    loop = asyncio.get_event_loop() #事件循环，开启个无限循环的程序流程，把一些函数注册到事件循环上。当满足事件发生的时候，调用相应的协程函数。
    result = loop.run_until_complete(main(username, pwd, url)) #将协程注册到事件循环，并启动事件循环
    print('登录后cookies:', result)
