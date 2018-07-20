//全部
//全局变量
window.domain = "https://foods.ryskoo.com/";
window.basePath = window.domain;
window.upLoadPath = window.domain + "userfront/fastdfs/uploadFile?vendorUuid="+sessionObtain('vendorId');

WebUrlIp = window.location.protocol + "//" + window.location.host;

//静默登录
function silentLogin(){
	var loginName = obtain('loginName');
	var password = obtain('password');
	var vendorName = obtain('vendorName');
	var comeAddress = obtain("comeAddress");
	if(loginName == ''||loginName == null ||loginName == undefined 
			||password == ''||password == null ||password == undefined 
			||vendorName == ''||vendorName == null ||vendorName == undefined ){
		window.location.href = 'Login.html';
	}else{
		$.axs(
			'userfront/login',
			{
				vendorName: vendorName,
				loginName: loginName,
				password: password,
				deviceId: obtain('deviceId')||'12121'
			},
			function (result) {
				if (result.returnCode === 1) {
					var data = result.data.result;
					session('loginName', loginName);
					// 会话存储
					session('accessToken', data.accessToken);
					session('deviceId', data.deviceId);
					session('userId', data.managerUuid);
					session('vendorId', data.vendorUuid);
					// 本地存储登录信息，第二次进入app时，则不需要登录
					storage('accessToken', data.accessToken);
					storage('deviceId', data.deviceId);
					storage('userId', data.managerUuid);
					storage('vendorId', data.vendorUuid);
					storage('loginName', loginName);
					storage('password', password);
					// 本地存储，登录页用
					storage('vendorName', data.vendorName);
					session('vendorName', data.vendorName);
					session('vendorLogo', data.vendorLogo);
					session('vendorAddress', data.vendorAddress);
					//window.location.href = 'index.html';
					window.location.href = comeAddress;
				} else {
					mui.toast(result.message);
				}
			}
		);
	}
}

//判断是微信进入 还是浏览器进入
function isWeiXin() {
    var ua = window.navigator.userAgent.toLowerCase();
    if (ua.match(/MicroMessenger/i) == 'micromessenger') {
        return true;
    } else {
        return false;
    }
}

//判断ios 是不是无痕模式，如果是提示
function isStorageSupported() {
    if (typeof localStorage === 'object') {
        try {
            localStorage.setItem('localStorage', 1);
            localStorage.removeItem('localStorage');
            return true;
        } catch (e) {
            Storage.prototype._setItem = Storage.prototype.setItem;
            Storage.prototype.setItem;
        }
        return false;
    }
}

//判断浏览器支不支持本地存储，如果不支持就用cookie存储
//存储公共方法 storage
// storage("key","value"); 存储使用方法
//storage("neme","nima",7); 设置7天过期{ expires: 7 }
// var obtain = obtain("key");    获取使用方法
// //clear("key");             删除使用方法
function storage(key, value, itme) {
    if (!isStorageSupported()) {
        //无痕模式情况下用cookie存储
        $.cookie(key, value, {expires: itme, path: '/'});
    } else {
        //不是无痕模式下用本地存储
        localStorage.setItem(key, value);
    }
}

//取值方法obtain
function obtain(key) {
    //无痕模式情况取cookie存储
    if (!isStorageSupported()) {
        var neme = $.cookie(key);
        return neme;
    } else {
        var neme = localStorage.getItem(key);
        return neme;
    }
}

//清楚本地存储跟cookie
function clear(key) {
	if (!isStorageSupported()) {
        //无痕模式情况下用cookie存储
        $.cookie(key, null, {path: '/'});
    } else {
		localStorage.removeItem(key);
	}
    sessionStorage.removeItem(key);
}

//session储存时
function session(key, value) {
    if (!isStorageSupported()) {
        //无痕模式情况下用cookie存储
        $.cookie(key, value, {path: '/'});
    } else {
        //不是无痕模式下用本地存储
        sessionStorage.setItem(key, value);
    }
}

//session取值时
function sessionObtain(key) {
    if (!isStorageSupported()) {
        var neme = $.cookie(key);
        return neme;
    } else {
        var neme = sessionStorage.getItem(key);
        return neme;
    }
}

// mui.init({
//     swipeBack: true //启用右滑关闭功能
// });

// var slider = mui(".sub-banner");
// slider.slider({interval: 5000});


//登录跳转
function toLogin(url) {
    var userId = obtain('userId');
    var token = obtain('token');
    var sessionId = obtain('sessionId');
    if (userId != null && userId != "") {
        window.location.href = url;
    } else {
        window.location.href = '../../../h5/templet/login/login.html';
    }
}

//获取当前页面url，存入缓存
function setAgoPageUrl() {
    session("setCurrentPageForGetPreviousPage", location.href);
}

//获取当前页面的来源，获取不到就默认首页。
//备注：在微信公众号上，当某个页面选择从浏览器打开时，是获取不到session的值的，会显示404错误，故设置默认值
function getAgoPageUrl() {
    var urlNowPage = sessionObtain("setCurrentPageForPreviousPage") || homePageUrl;
    console.log("需要返回页是: " + urlNowPage);
    var backurl = urlNowPage == '' ? homePageUrl : urlNowPage;
    session("setCurrentPageForPreviousPage", ''); // 重置
    window.location.href = backurl;
}

//跳转到之前的页面
function jumpTOBeforPage() {
    var ref = "";
    if (document.referrer.length > 0) {
        ref = document.referrer;
    }
    try {
        if (ref.length == 0 && opener.location.href.length > 0) {
            ref = opener.location.href;
        }
    } catch (e) {
        location.href = homePageUrl;
    }
    if (ref != "") {
        location.href = ref;
    } else {
        location.href = homePageUrl;
    }
}

// 判断字符串是否为空   为空则返回true;否则返回false; add by jt 20160909
function isEmptyStr(str) {
    var reg = /\S/;
    var v = true;
    (!reg.test(str)) ? v : v = false;
    return v;
}


//获取url参数的值，传的是参数名称(类型：String)，此方法在多个参数时比较好用
// 例如获取商品的uuid--var productUuid = getQueryString(productUuid);
function getQueryString(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) {
        return unescape(r[2]);
    }
    return null;
}

//公共空判断
function isEmpty(strVal) {
    if (strVal == '' || strVal == null || strVal == undefined) {
        return true;
    } else {
        return false;
    }
}

// 判断用户是否已登录
function preIsLogin() {
    var userId = obtain('userId');
    if (userId == null || userId == "") {
        return false;
    }
    return true;
}

// 判断是否未登录
function isLogin(return_code) {
    if (return_code == -1 || return_code == 49 ||
        return_code == 50 ||
        return_code == 51) {
        return true;
    }
}

// 定义函数解决移动端滚动穿透问题
var ModalHelper = (function (bodyCls) {
    var scrollTop;
    return {
        afterOpen: function () {
            scrollTop = document.scrollingElement.scrollTop;
            document.body.classList.add(bodyCls);
            document.body.style.top = -scrollTop + 'px';
        },
        beforeClose: function () {
            document.body.classList.remove(bodyCls);
            document.scrollingElement.scrollTop = scrollTop;
        }
    };
})('modal-open');


//去掉空格
function removeAllSpace(str) {
	return str.replace(/\s+/g, "");
}

// 全屏侧滑浮出展示事件
function fullslide_show(obj){
    $(obj).addClass("active");
    // ModalHelper.afterOpen();
}

// 全屏侧滑浮出隐藏事件
function fullslide_hide(obj){
    $(obj).removeClass("active");
    // ModalHelper.beforeClose();
}


// 页面公共JS
$(function(){
    // 全屏侧滑浮出、modal触发事件
    $(document).on("click","[data-fullslide='miss']",function(){
        var obj = $(this).parents(".full_slide")[0] || $(this).parents(".modal")[0];
        fullslide_hide(obj);
    });
    // 全屏侧滑浮出、modal触发事件
    $(document).on("click","[data-fullslide='show']",function(){
        var obj = $(this).attr("data-target");
        fullslide_show(obj);
    });
    // 头部搜索框显示、隐藏触发事件
    // $(document).on("click",".ico_search",function(){
    //     $(this).parents(".common-header").addClass("active").find(".common_search input").focus();
    // });
    // $(document).on("click",".common-header .mask",function(){
    //     $(this).parents(".common-header").removeClass("active");
    // });
})
