$(function() {

     registerEventListerAddInPage();//给网页的元素添加注册事件，和分页没有关系，可以根据不同的情况删除该函数
	 // loadCompany();

	$('#datetimepicker1').datetimepicker({
			fontAwesome:'font-awesome',//指定
            format: 'YYYY-MM-DD HH:mm:ss',
            locale: 'zh-CN'
        });

		$('#datetimepicker2').datetimepicker({

            format: 'YYYY-MM-DD HH:mm:ss',
            locale: 'zh-CN'
        });

	// $( "#gmtBeginDate" ).datepicker({
	// 	        //showOn: "button",
	// 	        dateFormat:"yy-mm-dd",
	// 	        buttonImage: "images/calendar.gif",
	// 	        buttonImageOnly: true,
	// 	        changeMonth: true,
	// 	        changeYear: true,
	// 	        buttonText: "Select date"
	// 	    });
	//
	// 	    $( "#gmtEndDate" ).datepicker({
	// 	        //showOn: "button",
	// 	        dateFormat:"yy-mm-dd",
	// 	        buttonImage: "images/calendar.gif",
	// 	        buttonImageOnly: true,
	// 	        changeMonth: true,
	// 	        changeYear: true,
	// 	        buttonText: "Select date"
	// 	    });


});

function loadCompany()
{
	var actionUrl = server+"p/show";
	$.ajax( { // 取语言
		url : actionUrl,
		type : "post",
		dataType : "json",
		error : function(data)
		{
			if(data.status=="200")
			{
				alert("请重新刷新");
			}
			else if(data.status=="500")
			{
				alert("请重新刷新");
			}

		},
		success : function(data)
		{
			insertCompanyInPage(data);
		}
	});// end of ajax
}

function insertCompanyInPage(data){
    // console.log(data.length);
    let content="";
    for(let i=0;i<data.length;i++){
        content=content+"<tr>"+
      "<th scope='row'>"+i+"</th>"+
      "<td>"+data[i].companyName+"</td>"+
      "<td>"+data[i].storeName+"</td>"+
      "<td>"+data[i].daibiaoren+"</td>"+
      "<td>"+data[i].categoryName+"</td>"+
      "<td>"+data[i].createtime+"</td>"+
      "<td>"+operate(data[i].id)+"</td>"+
      "</tr>";
    }
    // return content;
    $("#companyInfo").html(content);
}

function operate(id)
{
	html="";
	html+="<a href='javascript:void(0)' onclick='javascript:Edit(this);return false' value="+id+">编辑</a>|";
	html+="<a href='javascript:void(0)' onclick='javascript:ShowXiangQing(this);return false' value="+id+">详情</a>|";
	html+="<a href='javascript:void(0)' onclick='javascript:DeleteElement(this);return false' value="+id+">删除</a>";

	return html;
}

/**
 * 显示用户详情
 * @param element
 */
function ShowXiangQing(element)
{
	editElement=element;//editElement这个变量在shipmanage。js中
	var idvalue=$(element).attr("value");

       	   username=data.username;
    	   userpassword=data.userpassword;
    	   userrealname=paramConvert(data.userrealname);
    	   totalbuycount=paramConvert(data.totalbuycount);
    	   usermail=paramConvert(data.usermail);
    	   usertel=paramConvert(data.usertel);
    	   userlevel=paramConvert(data.userlevel);
    	   createtime=data.createtime;
    	   lasttime=data.lasttime;
    	   statusString=showConvert(data.status);


    	   var html="";
        html+="<div class='xiangqing'>用户名:"+username+"</div>";
        html+="<div class='xiangqing'>密码:"+userpassword+"</div>";
        html+="<div class='xiangqing'>真实姓名:"+userrealname+"</div>";
        html+="<div class='xiangqing'>用户级别:"+userlevel+"</div>";
        html+="<div class='xiangqing'>邮箱:"+usermail+"</div>";
        html+="<div class='xiangqing'>电话:"+usertel+"</div>";
        html+="<div class='xiangqing'>用户状态:"+statusString+"</div>";
        html+="<div class='xiangqing'>用户级别:"+userlevel+"</div>";
        html+="<div class='xiangqing'>购买金额:"+totalbuycount+"</div>";
        html+="<div class='xiangqing'>最后修改时间:"+createtime+"</div>";
        html+="<div class='xiangqing'>创建时间:"+createtime+"</div>";

       $("#xiangxiw").empty();
       $("#xiangxiw").append(html);

       xiangxidialog.dialog('open');
}

function modifyUser()
{
	var actionUrl = "modifyUser.action";

	 var id=$.trim($("#userid").val());
	 var tel=$.trim($("#tel").val());
	 var mail=$.trim($("#mail").val());
	 var status=$('input[name="status"]:checked').val();


	 var params=
	 {
		   "id":id,
           "tel":tel,
           "mail":mail,
           "status":status
	 };

	$.ajax( { // 修改语言
		url : actionUrl,
		type : "post",
		data:params,
		dataType : "json",
		error : function(data)
		{
			alert("修改失败!!!!");
		},
		success : function(data)
		{
			alert("修改成功！");
			updateDateInThePage(tel,mail,status);
			dialog.dialog( "close" );
		}
	});// end of ajax
}

function registerEventListerAddInPage()
{
// 	dialog = $("#modifyw").dialog({
// 	      autoOpen: false,
// 	      closeText: "hide",
// 	      height: "auto",
// 	      width: "500px",
// 	      modal: true,
// 	      buttons: {
// 	       "确定": modifyUser,
// 	       "取消": function() {
// 	          dialog.dialog( "close" );
// 	        }
// 	      },
// 	      close: function() {
// //	        form[ 0 ].reset();
// //	        allFields.removeClass( "ui-state-error" );
// 	      }
// 	    });

	xiangxidialog = $("#xiangxiw").dialog({
	      autoOpen: false,
	      closeText: "hide",
	      height: "auto",
	      width: "500px",
	      modal: true,
//	      buttons: {
//	       "确定": modifyUser,
//	       "取消": function() {
//	          dialog.dialog( "close" );
//	        }
//	      },
	      close: function() {
//	        form[ 0 ].reset();
//	        allFields.removeClass( "ui-state-error" );
	      }
	    });
}