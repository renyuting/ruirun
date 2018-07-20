/*****************************************************************
 jQuery Ajax封装通用类
 *****************************************************************/

$(function() {
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
	jQuery.ax = function(name,data, async, type, dataType, successfn) {
		async = (async == null || async === "" || typeof(async) == "undefined") ? true : async;
		type = (type == null || type == "" || typeof(type) == "undefined") ? "post" : type;
		dataType = (dataType == null || dataType == "" || typeof(dataType) == "undefined") ? "json" : dataType;
		data = (data == null || data == "" || typeof(data) == "undefined") ? { "date": new Date().getTime() } : data;
		$.ajax({
			type: type,
			async: async,
			data: data,
			url: window.basePath + name,
			dataType: dataType,
			cache: false,
			success: function(data) {
				console.log(data);
				if(!isEmpty(data)) {
					if(data.returnCode != 1) {
						if(!isLogin(data.returnCode)) {
							//mui.alert('当前用户未登录', '提示', function() {
								//保存当前地址，登陆之后，跳入这个页面
								storage("comeAddress", location.href);
								//alert(localStorage.getItem("comeAddress"));
								//此时是登录失效，不跳转登陆页，而是执行静默登录
								//window.location.href = 'Login.html';
								silentLogin();
							//})
						} else {
							mui.alert(data.message, '提示');
						}

					} else {
						successfn(data);
					}
				}
			}
		});
	};

	/**
	 * ajax封装
	 * url 发送请求的地址
	 * data 发送到服务器的数据，数组存储，如：{"date": new Date().getTime(), "state": 1}
	 * successfn 成功回调函数
	 */
	jQuery.axs = function(url, data, successfn) {
		data = (data == null || data == "" || typeof(data) == "undefined") ? { "date": new Date().getTime() } : data;
		$.ajax({
			type: "post",
			data: data,
			url: window.basePath + url,
			dataType: "json",
			success: function(d) {
				if(!isEmpty(d)) {
					if(d.returnCode != 1) {
						if(!isLogin(d.returnCode)) {
							storage("comeAddress", location.href);
							silentLogin();
						} else {
							mui.alert(d.message, '提示');
						}
					} else {
						successfn(d);
					}
				}
			}
		});
	};

	/**
	 * ajax封装
	 * url 发送请求的地址
	 * data 发送到服务器的数据，数组存储，如：{"date": new Date().getTime(), "state": 1}
	 * dataType 预期服务器返回的数据类型，常用的如：xml、html、json、text
	 * successfn 成功回调函数
	 * errorfn 失败回调函数
	 */
	jQuery.axse = function(url, data, successfn, errorfn) {
		data = (data == null || data == "" || typeof(data) == "undefined") ? { "date": new Date().getTime() } : data;
		$.ajax({
			type: "post",
			data: data,
			url: url,
			dataType: "json",
			success: function(d) {
				successfn(d);
			},
			error: function(e) {
				errorfn(e);
			}
		});
	};

	jQuery.jsonData = function(data) {
		var obj = eval("(" + data + ")");
		return obj;
	}

	/**
	 * 跨域访问 jsonp
	 * url 发送请求的地址
	 * data 发送到服务器的数据，数组存储，如：{"date": new Date().getTime(), "state": 1}
	 * type 请求方式("POST" 或 "GET")， 默认为 "GET"
	 * successfn 成功回调函数
	 * errorfn 失败回调函数
	 *
	 */
	jQuery.axjp = function(url, data, type, successfn, errorfn) {
		data = (data == null || data == "" || typeof(data) == "undefined") ? { "date": new Date().getTime() } : data;
		type = (type == null || type == "" || typeof(type) == "undefined") ? "post" : type;

		$.ajax({
			type: type,
			data: data,
			url: url,
			dataType: "jsonp",
			callback: "jsonpCallback",
			success: function(d) {
				successfn(d);
			},
			error: function(e) {
				errorfn(e);
			}
		});
	};

	/**
	 * ajax封装
	 * url 发送请求的地址
	 * data 发送到服务器的数据，数组存储，如：{"date": new Date().getTime(), "state": 1}
	 * successfn 成功回调函数
	 * errorfn 失败回调函数
	 */
	jQuery.ax_text = function(url, data, successfn, errorfn) {
		data = (data == null || data == "" || typeof(data) == "undefined") ? { "date": new Date().getTime() } : data;
		$.ajax({
			type: 'post',
			data: data,
			url: url,
			dataType: 'text',
			success: function(d) {
				successfn(d);
			},
			error: function(e) {
				errorfn(e);
			}
		});
	};
});

function isLogin(code) {
  return code != 11 &&  code != 12 && code != 13 && code != 14 && code != 15  && code != 17 && code != 18;
}

/**  示例用法
 <script type="text/javascript">
 $(function(){

    $.ax(
        getRootPath()+"/test/ajax.json",
        null,
        null,
        null,
        null, 
        function(data){
            alert(data.code);
        }, 
        function(){
            alert("出错了");
        }
    );

    $.axs(getRootPath()+"/test/ajax.json", null, function(data){
        alert(data.data);
    });
    
    $.axse(getRootPath()+"/test/ajax.json",
        null, 
        function(){
            alert("成功了");
        },
        function(){
            alert("出错了");
    });
});
 </script>
 **/