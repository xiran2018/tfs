$(function() {

     registerEventListerAddInPage();//给网页的元素添加注册事件，和分页没有关系，可以根据不同的情况删除该函数
	$('#datetimepicker1').datetimepicker({
			fontAwesome:'font-awesome',//指定
            format: 'YYYY-MM-DD HH:mm:ss',
            locale: 'zh-CN'
        });

		$('#datetimepicker2').datetimepicker({

            format: 'YYYY-MM-DD HH:mm:ss',
            locale: 'zh-CN'
        });
});



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

var postDownLoadFile = function (options) {
    var config = $.extend(true, { method: 'post' }, options);
    var $iframe = $('<iframe id="down-file-iframe" />');
    var $form = $('<form target="down-file-iframe" method="' + config.method + '" />');
    $form.attr('action', config.url);
    for (var key in config.data) {
        $form.append('<input type="hidden" name="' + key + '" value="' + config.data[key] + '" />');
    }
    $iframe.append($form);
    $(document.body).append($iframe);
    $form[0].submit();
    $iframe.remove();
}
// 原文链接：https://blog.csdn.net/Sunny__wei/article/details/70214103

function registerEventListerAddInPage()
{
		$("#search2").click(function(){
	  	var actionUrl="/p/upload"
		var params={};
		var formData = new FormData($('#uploadForm')[0]);
		$.ajax( { // 修改语言
		url : actionUrl,
		type : "post",
		data:formData,
		contentType: false,
        processData: false,
		// dataType : "json",
		error : function(data)
		{
			alert(data.status)
			// alert("下载失败!!!!");
		},
		success : function(data)
		{
			alert(data)
			alert("下载成功！");
		}
	});// end of ajax
	});



	$("#search1").click(function(){
	  	var actionUrl="/p/download"
		var params={};

          postDownLoadFile({
            url:actionUrl,
            data:params,
            method:'post'
          });
	});

}