var mysql      = require('mysql');

let Ut = require("./sleep");

// var connection = mysql.createConnection({
//   host     : 'localhost',
//   user     : 'root',
//   password : '123456',
//   database : 'tfs'
// });

var connection;


function getConnect(){
    return new Promise(( resolve, reject ) => {

        connection = mysql.createConnection({
           // host     : 'localhost',
          host : '13.231.165.68',
          user     : 'root',
           // password : '123456',
          password : '880309jQl',
          port:'33070',
          database : 'tfs'
        });

        connection.connect(function (err) {
                // callback(err,result);
                if(err){
                    // console.log(err);
                    // console.log("connect error！try to connect…………………………");
                    // setTimeout(getConnect,1000);  //经过1秒后尝试重新连接
                    // return 0;
                    // reject(-1) //错误提示，需要用try catch 捕获异常
                    resolve(0)
                }
                else{
                    resolve(1)
                }

                // console.log("oh hahahahahah！！connect to database Success");
            });

  })//end of promise

}

async function handleGetConnect(){
        var flag= await getConnect();

        while(!flag){
            console.log("连接错误，准备重新连接，flag：",flag);
             flag= await getConnect();
             await Ut.sleep(2000); //等待2s

        }
        console.log("连接成功了哈。hohohohohohoho");
}


//同步方式查询
let syncQuery = async function( sql, values ) {

    await handleGetConnect();

  // 返回一个 Promise
  return new Promise(( resolve, reject ) => {


          connection.query(sql, values, ( err, rows) => {
              if ( err ) {
                // reject( err )
                // console.log(err)
                // reject(-1) //错误提示，需要用try catch 捕获异常
                  reject({"flag":-1,"err":err})
              } else {
                resolve( rows )
              }
              // 结束会话
              try{
                  connection.end();
              }
              catch (e) {
                  console.log(e);
                  console.log("出错了");
              }

        }); //end of query

  })//end of promise
}

// 异步方式查询
function select(sql,callback) {
    handleGetConnect()
    // var  sql = 'SELECT * FROM companyInfo';
    //查
    connection.query(sql,function (err, result) {
            if(err){
              console.log('[SELECT ERROR] - ',err.message);
              return 0;
            }

            callback(result)
           console.log('--------------------------SELECT----------------------------');
           // console.log(result[0].storeName);
           console.log(result.length);
           console.log('------------------------------------------------------------\n\n');
    });

    connection.end();
}



async function insert(addSql,addSqlParams) {
        await handleGetConnect();
    // var  addSql = 'INSERT INTO websites(Id,name,url,alexa,country) VALUES(0,?,?,?,?)';
    // var  addSqlParams = ['菜鸟工具', 'https://c.runoob.com','23453', 'CN'];
    //增

        connection.query(addSql,addSqlParams,function (err, result) {
            if(err){
                console.log('[INSERT ERROR] - ',err.message);
                            // console.log(err);
                console.log("try to connect insert the info to db again!");
                setTimeout(insert(addSql,addSqlParams),1000);  //经过1秒后尝试重新连接
                return;
            }
            else {
                console.log('---------插入了一条记录-------INSERT Success---------');
               //console.log('INSERT ID:',result.insertId);
               // console.log('INSERT ID:',result);
               // console.log('-------------------------------------------\n\n');
            }

        }); //end of query

    connection.end();
}

async function getInfoByCompany(companyName){
    var  sql = 'SELECT * FROM companyInfo where companyName=?';
    var  addSqlParams = [];
    addSqlParams.push(companyName);
    var  result =await syncQuery(sql,addSqlParams)
    // console.log('--------------------------result----------------------------');
    console.log(result.length);
    if(result.length>0)
        return {"flag":true,"count":result[0].countNumber,"id":result[0].id,"url":result[0].url};
    else
        return {"flag":false,"count":1};
}

(async () => {
//     // 同步方式调用
//     var  sql = 'SELECT * FROM companyInfo where storeName=?';
//     // var  sql = 'SELECT * FROM companyInfo where storeName="Dressing Trends Store"';
//     var  addSqlParams = ['Dressing Trends Store'];
//     var  result =await syncQuery(sql,addSqlParams);
//     var  result =await getInfoByCompany("厦门喜百斯电子商务有限公司")
//     console.log('--------------------------result----------------------------');
//     console.log(result);

    ///////////////////////////测试更新/////////
    // let comInfo=await getInfoByCompany("杭州好易仓电子商务有限公司"); //验证公司是否在数据库中，如果有的话会返回该公司注册的数量
    // let countindb = comInfo["count"];
    // let indbFlag = comInfo["flag"];
    // if(indbFlag) {//更新就可以了
    //     let id = comInfo["id"];
    //     let url = comInfo["url"];
    //     url = url + "|" + "www.baidu.com";
    //     countindb = countindb + 1;
    //     let modSql = 'UPDATE companyinfo SET countNumber = ?,url = ? WHERE id = ?';
    //     let modSqlParams = [countindb, url, id];
    //     console.log("----------------准备更新消息-----------");
    //     try {
    //         await syncQuery(modSql, modSqlParams);
    //         console.log("----------------更新消息成功-----------");
    //     } catch (e) {
    //         console.log(e);
    //         console.log("--------------更新消息失败------(偶尔一次，不用管)-----------");
    //         process.exit();
    //     }
    // }
})();

var date = new Date();
var year = date.getFullYear();
var month = date.getMonth()+1;
var day = date.getDate();
var hour = date.getHours();
var minute = date.getMinutes();
var second = date.getSeconds();
var date=year+'-'+month+'-'+day+' '+hour+':'+minute+':'+second;
// console.log(year+''+month+''+day+''+hour+''+minute+''+second);

//异步方式调用
// var  addSql = 'INSERT INTO companyInfo(storeName,companyName,url,updatetime) VALUES (?,?,?,?)';
// var  addSqlParams = ['菜鸟工具', 'https://c.runoob.com','23453',date];
// // // // INSERT INTO companyInfo(storeName,companyName,url) VALUES('菜鸟工具','https://c.runoob.com','23453'
// // // insert(addSql,addSqlParams)
// insert(addSql,addSqlParams)


module.exports = {
    insert,
    syncQuery,
    select,
}
