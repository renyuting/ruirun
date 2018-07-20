
var vm = new Vue({
    el:".page",
	data:{
		showDetial: false,
		styleClass: '',  // 换肤颜色
		loadingHidden: false,  // 页面加载中状态是否隐藏
		vendorName: '',  // 商户名称
		monthSell: '',    // 商户月售
		storeLogo: '',    // 商户LOGO
		storeId: '',    // 商户ID
		vendorBasic: '',  // 商户外卖设置基础信息
		vendorDiscount: '', // 商户优惠信息
		vendorMobile: '',      // 商户店铺联系电话
		vendorAddress: '',    // 商户店铺地址
		longitude: '',     // 商户店铺经度
		latitude: '',       //商户店铺纬度
		businessTime: '',   // 营业时间
		commentCategory: [], //推荐分类
		modulList:[]  //首页推荐商品模块
	},
	mounted: function(){
		 this.getVendorInfo();
		 //初始化登录信息
		 initLoginInfo();
		 
		//首页轮播
		var swiper = new Swiper('.store-banner', {
		  pagination: '.y_qhdiv',
		  autoplay: 3000,//可选选项，自动滑动
		  paginationClickable: true,
		  observer: true
		});
	},
	methods: {
            // 加载首页数据
            getVendorInfo: function () {
                var vendorUuid = getVendorId();
                PostData("/vendor/getVendor/" + vendorUuid, null, function (res) {
                    var vendor = res.returnMessage;
                    // 获取商户皮肤
                    var storeStyle = vendor.vendorStyle;
                    var styleClass = storeStyle == "1" && "red" || storeStyle == "2" && "yellow" || storeStyle == "3" && "green" || "orange";
                    var NavBgColor = storeStyle == "1" && "#D80602" || storeStyle == "2" && "#FFB914" || storeStyle == "3" && "#70B303" || "#FF9F3D";
					storage('styleClass', styleClass)  // 商户皮肤值
                    vm.vendorName = vendor.vendorName;  // 商户名称
                    vm.monthSell = vendor.monthSell;   // 商户月售
                    vm.storeLogo = vendor.logoImage || '';    // 商户LOGO
                    vm.storeId = vendor.uuid;    // 商户ID
                    vm.styleClass = styleClass;    // 商户皮肤
                    vm.vendorBasic = vendor.vendorBasic;  // 商户外卖设置基础信息
                    vm.vendorDiscount = vendor.vendorDiscount; // 商户优惠信息
                    vm.vendorMobile = vendor.vendorInfo.contactMobile;      // 商户店铺联系电话
                    vm.vendorAddress = vendor.vendorInfo.contactAddress;    // 商户店铺地址
                    vm.longitude = parseFloat(vendor.vendorInfo.longitude);     // 商户店铺经度
                    vm.latitude = parseFloat(vendor.vendorInfo.latitude);       //商户店铺纬度
                    vm.businessTime = vendor.vendorInfo.beginTime + " - " + vendor.vendorInfo.endTime;   // 营业时间
					$("#showAdvert").removeClass("has-more");
					vm.modulList.push({"moudelName":vendor.vendorBasic.productName1,"isShow":vendor.vendorBasic.showProducts1,"commentProduct":[]});
					vm.modulList.push({"moudelName":vendor.vendorBasic.productName2,"isShow":vendor.vendorBasic.showProducts2,"commentProduct":[]});
					vm.modulList.push({"moudelName":vendor.vendorBasic.productName3,"isShow":vendor.vendorBasic.showProducts3,"commentProduct":[]});
					//获取首页推荐分类
					getCommendCategory(vendor.vendorBasic.commendCategorys);
					//获取首页推荐商品
					if(vendor.vendorBasic.showProducts1){
						getCommendProduct("0",vendor.vendorBasic.commendProducts1);
					}
					if(vendor.vendorBasic.showProducts2){
						getCommendProduct("1",vendor.vendorBasic.commendProducts2);			
					}
					if(vendor.vendorBasic.showProducts3){
						getCommendProduct("2",vendor.vendorBasic.commendProducts3);
					}
                }, "GET");
            },
            toProduct(uuid) {
            	window.location.href = "detail.html?productUuid="+uuid;
            },
			toList: function(id) {
				window.location.href = "productList.html?categoryId="+id;
			},
			 /**
             * 显示地图
             */
            showMap: function (e) {
                var address = vm.vendorAddress;
                var lng = vm.longitude;
                var lat = vm.latitude;
                var titleName = vm.vendorName;
                var content = address;
                window.location.href = "http://api.map.baidu.com/marker?location=" + lat + "," + lng + "&title=" + titleName + "&content=" + content + "&output=html"
          	},
			//跳转到用户中心，并授权
        	toUserCenter:function () {
                if (sessionObtain('loginCustomerUuid')) {
                    window.location.href = "../usercenter/index.html";
                } else {
                    window.location.href = "../login/wechat.html?page=usercenter";
                }
            }
	}
})

function getCommendCategory (categoryIds) {
	var params = {categoryId:categoryIds};
	PostData("/productcate/getCommentCategory",params, function (res) {
	// 获取商品分类
	var commentCategorys = res.returnMessage;
	vm.commentCategory = commentCategorys;
	vm.showCategory = false;
	$("#showCategory").removeClass("has-more");
  },"post",null,"application/x-www-form-urlencoded")
}


function getCommendProduct (type,productId) {
	var params = {productId:productId};
	PostData("/product/getCommentProduct",params, function (res) {
	// 获取商品
	vm.modulList[type].commentProduct = res.returnMessage;
	$("#"+type).removeClass("has-more");
  },"post",null,"application/x-www-form-urlencoded")
}

$(function(){
    // 上拉加载更多
    $(".store_good").scroll(function(){
        var scrollTop = $(this).scrollTop();
        var scrollHeight = $(".index_good_list").outerHeight();
        var windowHeight = $(this).height();
        if(scrollTop + windowHeight >= scrollHeight){
            if (indexVm.hasMore == true) {
                indexVm.getProduct("scroll")
            }
        }
    });
})