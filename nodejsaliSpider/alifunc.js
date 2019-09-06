
function  retry_if_result_none(result){
    return result
}

function input_time_random(minNum,maxNum){
    switch(arguments.length){
            case 1:
                return parseInt(Math.random()*minNum+1,10);
                break;
            case 2:
                return parseInt(Math.random()*(maxNum-minNum+1)+minNum,10);
                break;
            default:
                return 0;
                break;
    }
}


async function getInfoByNumber(browser,mainPage,firstLevelCateroyNumber,pageNumber){
    page=mainPage;
    await page.waitFor(1000)   //延迟1秒
    try{
        console.log('开始获取分类信息...');
        page.click('.categories-content-title:first-child');
        // slider_again = await page.$eval('div#nc_1__scale_text > .nc-lang-cnt > b', node => node.textContent)
        // console.log("+++++++++++++++++++++++++++++++++slider_again")
        // console.log(slider_again)
        const mouse = page.mouse
	    // await mouse.move(rect.left, rect.top,{'delay': 1500})

    }
    catch(e){
        console.log(e, ':验证失败')
        return {"flag":false,"page":page}
    }
    await page.waitFor(1000)   //延迟1秒
    //
    // if(slider_again != 'Verified')
    //     return {"flag":false,"page":page}
    // else{
    //     await page.screenshot({'path': './headless-slide-result.png'})
    //     console.log('验证通过')
    //     return {"flag":true,"page":page}
    // }
}


module.exports = {
 retry_if_result_none,
 input_time_random,
 getInfoByNumber,
 // mouse_slide_getC
}

