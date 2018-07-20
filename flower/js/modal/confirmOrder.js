var vm = new Vue({
    el: ".page",
    data: {
        styleClass: '',  // 换肤颜色
        address: {},  // 配送地址
        addressid: '',  // 外卖配送地址id
        orderNote: '',  // 订单祝福语
        payType: 'wx',  // 支付方式
        isUseIntegral: false, // 是否使用积分抵扣
        showIntegral: false,//是否显示积分抵扣模块
        usableIntegral: 0,//可用积分
        deductionIntegral: 0,//抵扣积分数
        canFree: 0,//积分抵扣金额
		mjPrice: 0, //满减金额
		ljPrice: 0, //新用户下单立减金额
        customerUuid: '',//会员uuid
        storeId: '', //商户uuid
        newCustomer: false, //是否新用户
        // 购物车（包括所有商品）
        initCart: {},
		//购物车（只包括被选中的商品）
		cartData: {
			totalNum: 0,   // 购物车内商品数量
			detailList: [],   // 购物车商品列表
			distributionPrice: 0,  // 商户默认配送费用
			reachPrice: 0,
			distributionPriceNew: 0,  // 商户配送费减免后配送费用
			totalPrice: 0,  // 购物车商品总价
			allPrice:0,// 购物车总价
			vendorName: '',  // 商户名称
			vendorUuid: '',  // 商户id
		},
        vendorDiscount: {},
        totalPrice: 0,
        payPrice: 0,
        freePrice: 0,
        allPrice: 0,
		sendType: 1,   // 配送方式  1-快递   2-上门自提
		sendTime: '',  // 是否选择了送达时间
		vendorInfo: {}, //商户基础信息
		vendorDiscount: {}, //商户优惠信息
		vendorIntegral: 0, //商户积分换算
		freeDistribution: false, //是否免运费
    },
    mounted: function () {
        var that = this;
		  //初始化登录信息
		 initLoginInfo();
		 
        // 获取商户皮肤值
        var styleClass = obtain("styleClass");
        // 设置页面皮肤值
        that.styleClass = styleClass;

        var customerUuid = obtain("customerUuid");
		
        // 获取商户ID
        var storeId = obtain("vendorUuid");  // 商户uuid
        that.customerUuid = customerUuid;
        that.storeId = storeId;

		that.sendType = sessionObtain('sendType') || 1;
		that.sendTime = sessionObtain('sendTime') || '';
        that.payType = sessionObtain('payType') || 'wx';
        that.orderNote = sessionObtain('orderNote') || '';
		
		
        // 从本地存储获取购物车的信息
        var cartData = obtain('cartData' + storeId + '');
		that.initCart = JSON.parse(cartData);
		

		//验证是否是新会员下单
        var param = {
            "queryParams": {
                "customerUuid": {
                    "operation": "EQ",
                    "value": that.customerUuid
                },
                "state": {
                    "operation": "NE",
                    "value": 7
                }
            }
        }
        PostData("/ordermain/getOrderCount", JSON.stringify(param), function (res) {
            if (1 == res.returnCode && res.returnMessage <= 0) {
                that.newCustomer = true;
            } else {
				that.newCustomer = false;
			}
			// 获取商户基本信息
			PostData("/vendor/getVendor/" + storeId, '', function (res) {
				that.vendorInfo = res.returnMessage.vendorInfo;
				that.vendorDiscount = res.returnMessage.vendorDiscount; // 商户优惠信息
				that.vendorIntegral = res.returnMessage.vendorInfo.integralNum; //商户积分换算
				that.rebuildCart();
				
				//刷新购物车，计算优惠
				if (that.cartData && that.cartData.detailList.length > 0) {
					console.log(that.cartData);
					that.cartData.distributionPrice = res.returnMessage.vendorBasic.distributionPrice;    // 商户配送费用
					that.cartData.reachPrice = res.returnMessage.vendorBasic.reachPrice;   //满额免运费
					that.flushCart(that.cartData);
			   }
			}, "GET")
        }, "POST",'','',false)
		

        // 获取收货地址
        setDefaultAdress(that);

    },
    computed: {},
    methods: {
		//生成购物车
		rebuildCart: function() {
		  var that = this;
		  if (that.initCart && that.initCart.detailList.length > 0) {
				 //剔除未选中的商品，生成新的购物车
				 var totalNum = 0;//商品总数量
				 var totalPrice = 0;  // 商品总价格
				 var detailList = [];   // 购物车商品列表
				 for (var i = 0;i<that.initCart.detailList.length;i++) {
					var value = that.initCart.detailList[i];
					if(value.checked){
						totalPrice = (parseFloat(totalPrice) + parseFloat(value.totalPrice)).toFixed(2);
						totalNum = parseInt(totalNum) + parseInt(value.buyNum);
						detailList.push({
								productUuid:value.productUuid,
								productName:value.productName,
								buyNum: value.buyNum,
								integral: value.integral,
								productPrice:value.productPrice,
								nativePrice:value.nativePrice,
								totalPrice: value.totalPrice,
								image:value.image,
								checked:true //是否选中
                        });
					}
				}
				that.cartData.vendorName = that.initCart.vendorName;
				that.cartData.vendorUuid = that.initCart.vendorUuid;
				that.cartData.detailList = detailList;
				that.cartData.totalNum = parseInt(totalNum);
				that.cartData.totalPrice = parseFloat(totalPrice).toFixed(2);
				that.cartData.allPrice = that.cartData.totalPrice;
			}
		},
		//刷新购物车信息
		flushCart: function(cartData){
			var reachPrice = cartData.reachPrice;
			var that = this;
			PostData("/flower/cart/get", JSON.stringify(cartData), function (res) {
				if (1 == res.returnCode) {
					var cart = res.returnMessage;  // 购物车对象
					if(cart){
						that.cartData = cart;
					}else{
						that.cartData.detailList = [];
						that.cartData.totalPrice = 0;
						that.cartData.totalNum = 0;
					}
					that.cartData.reachPrice = reachPrice;
				}
				// 获取页面商品总价格
				setTotlePrice(that);
				//获取会员积分，计算可抵扣金额
				getCustomerIntegral(that);
			},'','1');
		},
		//选择配送方式
        chooseType: function (sendType) {
            var that = this;
            that.sendType = sendType;
            session('sendType', sendType);
			setTotlePrice(that);
        },
        //选择支付方式
        changePayType: function (payType) {
            var that = this;
            that.payType = payType;
            session('payType', payType);
        },
        //使用积分事件
        useIntegral: function () {
            var that = this;
            that.isUseIntegral = !that.isUseIntegral;

            setTotlePrice(that);
        },

		clearCart: function () {
			var that = this;
			var allCart = that.initCart;
			var checkCart = that.cartData;
			var totalNum = 0;//商品总数量
			var totalPrice = 0;  // 商品总价格

            var needDetailList = allCart.detailList.minus(checkCart.detailList);
            for(var i = 0; i < needDetailList.length; i++){
                var product = needDetailList[i];
                totalPrice = (parseFloat(totalPrice) + parseFloat(product.totalPrice)).toFixed(2);
                totalNum = parseInt(totalNum) + parseInt(product.buyNum);
            }

		   allCart.detailList = needDetailList;
		   allCart.distributionPriceNew = 0;
		   allCart.distributionPrice = 0;
		   allCart.totalNum = parseInt(totalNum);
		   allCart.totalPrice = parseFloat(totalPrice).toFixed(2);
		   allCart.allPrice = allCart.totalPrice;
		   // 将购物车商品信息存储到本地存储中
           storage('cartData' + that.storeId, JSON.stringify(allCart));
		},

        // 确认下单
        confirmOrder: function () {
            var that = this;
            //如果使用了积分抵扣，需要把使用的积分和抵扣金额保存下来
            var integralFree = 0;
            var useIntegral = 0;
            if (that.isUseIntegral) {
                integralFree = that.canFree;
                useIntegral = that.deductionIntegral;
            }
            // 提交订单

			var param = {
				"vendorUuid": that.storeId,
				"customerUuid": that.customerUuid,
				"sendType": that.sendType,
				"sendTime": that.sendTime,
				"productPrice": that.cartData.totalPrice,
				"deliveryPrice": that.cartData.distributionPriceNew,   // 配送费
				"giveIntegral": that.cartData.totalIntegral, //赠送积分
				"useIntegral": useIntegral, //使用积分
				"integralFree": integralFree, //积分抵扣金额
				"totalPrice": that.totalPrice,
				"payPrice": that.payPrice,
				"freePrice": that.freePrice,  // 优惠总金额
				"mjPrice": that.mjPrice,  // 满减金额
				"ljPrice": that.ljPrice,  // 新用户下单立减金额
				"addressUuid": that.addressid,  // 会员收货地址ID
				"note": that.orderNote,  // 订单备注
				"detailList": that.cartData.detailList,
				"payType": that.payType == "wx" ? "3" : "1",
			}

            PostData("/ordermain/save", JSON.stringify(param), function (res) {
                if (1 === res.returnCode) {
                    var orderUuid = res.returnMessage;  // 订单ID
                    // 下单成功，清除数据缓存
					that.clearCart(); //移除购物车中的商品
					clear('sendType'); // 移除配送方式
                    clear('payType');     // 移除支付方式
                    clear('orderNote');   // 移除订单备注
                    clear('address');     // 移除选择的地区
                    clear('addressid');   // 移除选择的地区uuid
                    clear('sendTime')    // 移除送达时间
					clear('sentTimeType')    // 移除送达时间
					clear('sentTime')    // 移除送达时间
					clear('sentData')    // 移除送达时间
					clear('customeTime')    // 移除送达时间
                    if (that.payType == "wx") {
                        // 如果是微信支付，则先调微信预下单接口下单
                        var data = {
                            "orderUuid": orderUuid,
                            "wxplat": obtain("wxplat")
                        };
                        PostData("/wxpay/order", JSON.stringify(data), function (result) {
                            if (result.returnCode === 1) {
                                // 预下单成功，根据返回参数唤起微信支付
                                if (typeof WeixinJSBridge == "undefined") {
                                    if (document.addEventListener) {
                                        document.addEventListener('WeixinJSBridgeReady', onBridgeReady, false);
                                    } else if (document.attachEvent) {
                                        document.attachEvent('WeixinJSBridgeReady', onBridgeReady);
                                        document.attachEvent('onWeixinJSBridgeReady', onBridgeReady);
                                    }
                                } else {
                                    onBridgeReady(result, orderUuid);
                                }
                            } else {
                                mui.alert('微信支付失败，请稍后再试');
                                location.href = '../usercenter/orderDetail.html?uuid=' + orderUuid + '&from=saveOrder';
                            }
                        });
                    } else {  // 线下支付
                        mui.toast('下单成功');
                        location.href = '../usercenter/orderDetail.html?uuid=' + orderUuid + '&from=saveOrder';
                    }
                } else {
                    mui.toast('下单失败');
                }
            })
        },
    }
});

function onBridgeReady(result, orderUuid) {
    var data = result.returnMessage.data;
    WeixinJSBridge.invoke(
        'getBrandWCPayRequest', {
            "appId": data.appId,     //公众号名称，由商户传入
            "timeStamp": data.timeStamp,         //时间戳，自1970年以来的秒数
            "nonceStr": data.nonceStr, //随机串
            "package": data.package,
            "signType": data.signType,         //微信签名方式：
            "paySign": data.paySign //微信签名
        },
        function (res) {
            if (res.err_msg == "get_brand_wcpay_request:ok") {
                // 支付成功，直接进入订单详情页
                location.href = '../usercenter/orderDetail.html?uuid=' + orderUuid + '&from=saveOrder';
            } else if (res.err_msg == "get_brand_wcpay_request:cancel") {
                mui.alert('您取消了支付', function () {
                    location.href = '../usercenter/orderDetail.html?uuid=' + orderUuid + '&from=saveOrder';
                });
            } else {
                mui.alert('微信支付失败，请稍后再试', function () {
                    location.href = '../usercenter/orderDetail.html?uuid=' + orderUuid + '&from=saveOrder';
                });
            }
        }
    );
}


function setDefaultAdress(that) {
    var address = obtain('address');
    if (address) {
        that.address = JSON.parse(address);
        that.addressid = obtain('addressid');
    } else {
        var param = {
            "customerId": that.customerUuid,
        };
        PostData("/customeraddress/getDefault", param, function (res) {
            if (1 === res.returnCode && res.returnMessage) {
                that.address = res.returnMessage;
                storage('address', JSON.stringify(res.returnMessage));
                that.addressid = res.returnMessage.uuid;
                storage('addressid', res.returnMessage.uuid);
            }
        }, 'GET');
    }
}

// 获取页面总商品价格
function setTotlePrice(that, flag) {
    var vendorDiscount = that.vendorDiscount;
    var productPrice = that.cartData.totalPrice;
    // 计算促销优惠金额
    var freePrice = calcPromitionPrice(that, productPrice);
	
    var totalPrice = 0;
    if (1 == that.sendType) {
        var distributionPriceNew = that.cartData.distributionPrice;
		if ((parseFloat(productPrice) - parseFloat(freePrice)).toFixed(2)  >= parseFloat(that.cartData.reachPrice) ) {
			that.freeDistribution = true;
			that.cartData.distributionPriceNew = 0;
		} else {
			that.freeDistribution = false;
			that.cartData.distributionPriceNew = distributionPriceNew;
		}
        totalPrice = (parseFloat(productPrice) + parseFloat(that.cartData.distributionPriceNew)).toFixed(2);
    } else {
		that.cartData.distributionPriceNew = 0;
        totalPrice = parseFloat(productPrice).toFixed(2);
    }
    var payPrice = (totalPrice - freePrice).toFixed(2);
    that.allPrice = payPrice;
    if (undefined == flag) {
        if (that.isUseIntegral) {
            payPrice = (parseFloat(payPrice) - parseInt(that.canFree)).toFixed(2);
            freePrice = (parseFloat(freePrice) + parseInt(that.canFree)).toFixed(2);
        }
    }

    that.totalPrice = totalPrice;
    that.payPrice = payPrice;
    that.freePrice = freePrice;

}

//计算促销价格
function calcPromitionPrice(that, productPrice) {
    var vendorDiscount = that.vendorDiscount;
    var freeMonry = 0;
    var ljMoney = 0;
    if (vendorDiscount.mjOpen) {
        //计算满足条件的满减金额
        if (productPrice > vendorDiscount.money1) {
            freeMonry = vendorDiscount.free1;
            if (productPrice > vendorDiscount.money2 && vendorDiscount.money2 > vendorDiscount.money1) {
                freeMonry = vendorDiscount.free2;
                if (productPrice > vendorDiscount.money3 && vendorDiscount.money3 > vendorDiscount.money2) {
                    freeMonry = vendorDiscount.free3;
                }
            }
            if (productPrice > vendorDiscount.money3 && vendorDiscount.money3 > vendorDiscount.money1) {
                freeMonry = vendorDiscount.free3;
            }
        } else {
            if (productPrice > vendorDiscount.money2) {
                freeMonry = vendorDiscount.free2;
                if (productPrice > vendorDiscount.money3 && vendorDiscount.money3 > vendorDiscount.money2) {
                    freeMonry = vendorDiscount.free3;
                }
            } else {
                if (productPrice > vendorDiscount.money3) {
                    freeMonry = vendorDiscount.free3;
                }
            }
        }
    }

    that.mjPrice = freeMonry

    if (vendorDiscount.ljOpen && that.newCustomer) {
        ljMoney = vendorDiscount.ljFree;
    }

    that.ljPrice = ljMoney;

    var freePrice = (parseFloat(freeMonry) + parseFloat(ljMoney)).toFixed(2);
    that.freePrice = freePrice;
    return freePrice;
}

//获取会员积分
function getCustomerIntegral(that) {
    PostData("/integral/getIntegral", {"customerUuid": that.customerUuid, "vendorUuid": that.storeId}, function (res) {
        if (1 == res.returnCode && res.returnMessage) {
            var customerIntegral = res.returnMessage.usableIntegral || 0;
            that.usableIntegral = customerIntegral;
            calcIntegral(that);
        }
    }, "POST", "", "application/x-www-form-urlencoded", false)
}

//选择就餐人数后，重新计算可抵扣金额
function calcIntegral(that) {
    var vendorIntegral = parseInt(that.vendorIntegral);
    var customerIntegral = that.usableIntegral;
    if (customerIntegral > 0 && vendorIntegral > 0 && customerIntegral > vendorIntegral) {
        var canFree = parseInt(customerIntegral / vendorIntegral);
        if (canFree > that.payPrice) {
            canFree = parseInt(that.payPrice);
        }
        if (canFree > 0) {
            var deductionIntegral = vendorIntegral * canFree;
            that.canFree = canFree;
            that.deductionIntegral = deductionIntegral;
            that.showIntegral = true;
        }

    }
}

//两个数组取差集
Array.prototype.minus = function (arr) {
    var result = new Array();
    var obj = {};
    for (var i = 0; i < arr.length; i++) {
        obj[arr[i]] = 1;
    }
    for (var j = 0; j < this.length; j++) {
        if (!obj[this[j]])
        {
            obj[this[j]] = 1;
            result.push(this[j]);
        }
    }
    return result;
};


