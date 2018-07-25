/*****************************************************************
 jQuery Ajax封装通用类
 *****************************************************************/


/**
 * ajax封装
 * url 发送请求的地址
 * data 发送到服务器的数据，数组存储，如：{"date": new Date().getTime(), "state": 1}
 * async 默认值: true。默认设置下，所有请求均为异步请求。如果需要发送同步请求，请将此选项设置为 false。
 *       注意，同步请求将锁住浏览器，用户其它操作必须等待请求完成才可以执行。
 * type 请求方式("POST" 或 "GET")， 默认为 "post"
 * dataType 预期服务器返回的数据类型，常用的如：xml、html、json、text
 * successfn 成功回调函数
 * errorfn 失败回调函数
 */
 PostData = function (name,data, successfn, type, failed, contentType) {
	// async = (async == null || async === "" || typeof(async) == "undefined") ? true : async;
	type = type || "post";
	// dataType = (dataType == null || dataType == "" || typeof(dataType) == "undefined") ? "json" : dataType;
	data = data || { "date": new Date().getTime() };
	contentType = contentType || 'application/json; charset=utf-8';
	$.ajax({
		type: type,
		async: true,
		data: data,
		url: window.basePath + name,
		dataType: "json",
		contentType: contentType,
		cache: false,
		success: function(data) {
			if(!isEmpty(data)) {
				if(data.returnCode != 1) {
					if(!isLogin(data.returnCode)) {
						mui.alert('当前用户未登录', '提示', function() {
							//保存当前地址，登陆之后，跳入这个页面
							storage("comeAddress", location.href);
							//进入登录页
							window.location.href = 'Login.html';
						})
					} else {
						mui.alert(data.returnNote, '提示');
					}
					if (failed == "1") {
                        successfn(data)
                    }
				} else {
					successfn(data);
				}
			}else{
				mui.alert("请求失败，请稍后重试", '提示');
			}
		}
	});
};

function isLogin(code) {
  return code != 11 &&  code != 12 && code != 13 && code != 14 && code != 15  && code != 17 && code != 18;
}