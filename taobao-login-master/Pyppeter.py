import asyncio
import pyppeteer
import os

pyppeteer.DEBUG = True


async def main():
    print("in main ")
    browser = await pyppeteer.launch({
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
    })
    page = await browser.newPage()
    await page.goto('http://www.baidu.com')

    content = await page.content()
    cookies = await page.cookies()
    # await page.screenshot({'path': 'example.png'})
    await browser.close()
    return {'content': content, 'cookies': cookies}


loop = asyncio.get_event_loop()
task = asyncio.ensure_future(main())
loop.run_until_complete(task)
