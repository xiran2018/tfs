var mysql      = require('mysql');

let Ut = require("./sleep");

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '123456',
  database : 'tfs'
});



function getConnect(){
    return new Promise(( resolve, reject ) => {

        connection = mysql.createConnection({
          host     : 'localhost',
          user     : 'root',
          password : '123456',
          database : 'tfss'
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
                reject(-1) //错误提示，需要用try catch 捕获异常
              } else {
                resolve( rows )
              }
              // 结束会话
          connection.end();
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

(async () => {
//     // 同步方式调用
    var  sql = 'SELECT * FROM companyInfo where storeName=?';
    // var  sql = 'SELECT * FROM companyInfo where storeName="Dressing Trends Store"';
    var  addSqlParams = ['Dressing Trends Store'];
    var  result =await syncQuery(sql,addSqlParams)
    console.log('--------------------------result----------------------------');
    console.log(result.length);
})();

//异步方式调用
// var  addSql = 'INSERT INTO companyInfo(storeName,companyName,url) VALUES (?,?,?)';
// var  addSqlParams = ['菜鸟工具', 'https://c.runoob.com','23453'];
// // // INSERT INTO companyInfo(storeName,companyName,url) VALUES('菜鸟工具','https://c.runoob.com','23453'
// // insert(addSql,addSqlParams)
// insert(addSql,addSqlParams)


module.exports = {
    insert,
    syncQuery,
    select,
}
