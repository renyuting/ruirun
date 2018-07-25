//全部
//全局变量
window.domain = "https://foods.ryskoo.com";
window.basePath = window.domain + "/h5";
window.upLoadPath = window.domain + "/userfront/fastdfs/uploadFile";

WebUrlIp = window.location.protocol + "//" + window.location.host;

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
    $.cookie(key, null, {path: '/'});
    localStorage.removeItem(key);
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

//获取商户id
function getVendorId(){
   //先从浏览器参数获取，如果没有值再从缓存获取
   var vendorUuid = getQueryString("vendorUuid");
   if (isEmpty(vendorUuid)) {
	   vendorUuid = obtain("vendorUuid");
   }
   //将商户id放入缓存
   storage('vendorUuid', vendorUuid);
   return vendorUuid;
}

//调用微信登录之后，初始化登录信息
function initLoginInfo(){
   //先从浏览器参数获取，如果没有值再从缓存获取
   var loginCustomerUuid = getQueryString("loginCustomerUuid");
   if (isEmpty(loginCustomerUuid)) {
	   loginCustomerUuid = sessionObtain("loginCustomerUuid");
   }
   
   if (!isEmpty(loginCustomerUuid)) {
	    session('loginCustomerUuid', loginCustomerUuid);
   }
   
   var customerUuid = getQueryString("customerUuid");
   if (isEmpty(customerUuid)) {
	   customerUuid = obtain("customerUuid");
   }
   if (!isEmpty(customerUuid)) {
	   storage('customerUuid', customerUuid);
   }
   
   var nickName = getQueryString("nickName");
   if (isEmpty(nickName)) {
	   nickName = obtain("nickName");
   }
   if (!isEmpty(nickName)) {
	   storage('nickName', nickName);
   }
   
   var avatarUrl = getQueryString("avatarUrl");
   if (isEmpty(avatarUrl)) {
	   avatarUrl = obtain("avatarUrl");
   }
   if (!isEmpty(avatarUrl)) {
	   storage('avatarUrl', avatarUrl);
   }
   
}

//公共空判断
function isEmpty(strVal) {
    if (strVal == '' || strVal == null || strVal == "null" || strVal == undefined) {
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
function fullslide_show(obj) {
    $(obj).addClass("active");
    ModalHelper.afterOpen();
}

// 全屏侧滑浮出隐藏事件
function fullslide_hide(obj) {
    $(obj).removeClass("active");
    // ModalHelper.beforeClose();
}

// 底部下拉弹出框展示事件
function slide_show(obj) {
    if ($(obj).is(".slide_modal")) {
        $(obj).fadeIn(200);
    } else {
        $(obj).slideDown(200);
    }
    if ($(".opacitys").length < 1) {
        $('<div class="opacitys"></div>').appendTo("body").fadeIn(200);
    } else {
        $(".opacitys").fadeIn(200);
    }
    // ModalHelper.afterOpen();
    $(document).on("click", ".opacitys", function () {
        slide_hide(obj);
    });

}

// 底部下拉弹出框隐藏事件
function slide_hide(obj) {
    if ($(obj).is(".slide_modal")) {
        $(obj).fadeOut(200);
    } else {
        $(obj).slideUp(200);
    }
    $(".opacitys").fadeOut(200);
    // ModalHelper.beforeClose();
}

// 页面公共JS
$(function () {
    // 全屏侧滑浮出、modal触发事件
    $(document).on("click", "[data-fullslide='miss']", function () {
        var obj = $(this).parents(".full_slide") || $(this).parents(".modal");
        fullslide_hide(obj);
    });
    // 全屏侧滑浮出、modal触发事件
    $(document).on("click", "[data-fullslide='show']", function () {
        var obj = $(this).attr("data-target");
        fullslide_show(obj);
    });
	
	if (isWeiXin()) {
        // 如果是微信浏览器，则判断是微信公众号网页授权
        storage('wxplat', 'MP');
    } else {
        // 如果是非微信浏览器，则判断是通过开放平台授权
        storage('wxplat', 'OPEN');
    }

});

//判断是微信进入 还是浏览器进入
/*function isWeiXin() {
    var ua = window.navigator.userAgent.toLowerCase();
    return ua.match(/MicroMessenger/i)[0] === 'micromessenger';
}*/


// Vue 注册头部快捷菜单组件
Vue.component('top-nav', {
    data: function () {
        return {
          navShow: false
        }
    },
    template: '<div><span class="top_icon top_right pd_0 top_nav" v-on:click="toggleNav"></span>'+
            '<section class="tag-top" v-show="navShow">'+
                '<div class="mask-transparent" v-on:click="navShow=false"></div>'+
                '<ul>'+
                    '<li><a href="index.html"><span><img src="../../images/topnav_1.png"></span>首页</a></li>'+
                    '<li><a href="class.html"><span><img src="../../images/topnav_2.png"></span>分类</a></li>'+
                    '<li><a href="cart.html"><span><img src="../../images/topnav_3.png"></span>购物车</a></li>'+
                    '<li><a href="##"><span><img src="../../images/topnav_4.png"></span>我的</a></li>'+
                '</ul>'+
            '</section></div>',
    methods: {
        toggleNav: function () {
            this.navShow = !this.navShow;
        }
    }
})