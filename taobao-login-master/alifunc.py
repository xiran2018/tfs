from retrying import retry
import time, asyncio, random


def retry_if_result_none(result):
    return result is None


@retry(retry_on_result=retry_if_result_none,)
async def mouse_slide(page=None):
    await asyncio.sleep(3)
    try:
        print('开始验证...')
        # 鼠标移动到滑块，按下，滑动到头（然后延时处理），松开按键
        await page.hover('#nc_1_n1z') # 不同场景的验证码模块能名字不同。
        await page.mouse.down()

        await page.mouse.move(2000, 0, {'delay': random.randint(1000, 2000)})
        await page.mouse.up()
    except Exception as e:
        print(e, ':验证失败')
        return None
    else:
        await asyncio.sleep(3)
        # 判断是否通过
        slider_again = await page.Jeval('.nc-lang-cnt', 'node => node.textContent')
        if slider_again != '验证通过':
            return None
        else:
            await page.screenshot({'path': './headless-slide-result.png'})
            print('验证通过')
            return 1


def input_time_random():
    return random.randint(100, 151)
