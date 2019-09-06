var fs = require('fs');
var readLine = require('readline');

/*
* 按行读取文件内容
* 返回：字符串数组
* 参数：fReadName:文件名路径
*      callback:回调函数
* */
function readFileToArr(fReadName, cb) {

    var arr = [];
    var readObj = readLine.createInterface({
        input: fs.createReadStream(fReadName)
    });

    readObj.on('line', function (line) {
        arr.push(line);
    });
    readObj.on('close', function () {
        console.log('readLine close....');
        cb(arr);
    });
}

function writeFileSync(path,content){
    console.log("准备写入文件");
    fs.writeFileSync(path, content,  function(err) {
       if (err) {
           return console.error(err);
       }
       // console.log("数据写入成功！");
       // console.log("--------我是分割线-------------")
       // console.log("读取写入的数据！");
       // fs.readFile(path, function (err, data) {
       //    if (err) {
       //       return console.error(err);
       //    }
       //    console.log("异步读取文件数据: " + data.toString());
       // });
    });
}

//保存字典示例
// content={'a':3,'b':4}
// content=JSON.stringify(content) //存储文件时，需要反序列化

//保存换行示例
// content="333\r\n3333344444"
// writeFile('input.txt',content);

//回调示例
// readFileToArr('input.txt', function (contentForLine) {
//     for(i=0;i<contentForLine.length;i++){
//         console.log(contentForLine[i]);
//         content=JSON.parse(contentForLine[i]) //反序列化 字符串转字典：
//     }
//
// });

// console.log("--------我是分割线-------------");
// console.log("读取写入的数据！");
//
// String.split(/\r?\n/ig)
// var data = fs.readFileSync('input.txt', 'utf8');
// console.log(data);

module.exports = {
    readFileToArr,
    writeFileSync,
}

