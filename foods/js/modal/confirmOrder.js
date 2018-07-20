var vm = new Vue({
    el: ".page",
    data: {
        styleClass: '',  // 换肤颜色
        floorName: '',//台桌类别
        tableName: '',  // 桌台号
        personNum: '',   // 就餐人数
        tablewarePrice: 0,  // 堂食总餐具费
        address: {},  // 外卖配送地址
        addressid: '',  // 外卖配送地址id
        personList: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],  // 就餐人数选择
        personHidden: true,  // 就餐人数模态框选择是否隐藏
        orderNote: '',  // 订单备注
        payType: 'wx',  // 支付方式
        isUseIntegral: false, // 是否使用积分抵扣
        showIntegral: false,//是否显示积分抵扣模块
        usableIntegral: 0,//可用积分
        deductionIntegral: 0,//抵扣积分数
        canFree: 0,//积分抵扣金额
        customerUuid: '',//会员uuid
        storeId: '', //商户uuid
        outStore: false, //是否外卖
        newCustomer: false, //是否新用户
        // 购物车中商品信息初始数据
        cartData: {},
        coverPrice: 0,
        vendorDiscount: {},
        totalPrice: 0,
        payPrice: 0,
        freePrice: 0,
        allPrice: 0
    },
    mounted: function () {
        var that = this;
        // 获取商户皮肤值
        var styleClass = obtain("styleClass");
        // 设置页面皮肤值
        that.styleClass = styleClass;

        var customerUuid = obtain("customerUuid");
        // 获取商户ID及购买方式
        var storeId = obtain("vendorUuid");  // 商户uuid
        var outStore = obtain("outStore") == 'true' ? true : false;   //  购买方式是否是外卖点餐
        var newCustomer = sessionObtain("newCustomer") == 'true' ? true : false;//是否新用户
        var vendorIntegral = sessionObtain("vendorIntegral");//商户设置的积分兑换
        that.customerUuid = customerUuid;
        that.storeId = storeId;
        that.outStore = outStore;
        that.newCustomer = newCustomer;
        that.vendorIntegral = vendorIntegral;

        that.floorName = sessionObtain('floorName') || '';
        that.tableName = sessionObtain('tableName') || '';
        that.personNum = sessionObtain('personNum') || '';
		that.tablewarePrice = sessionObtain('tablewarePrice') || 0;
        that.payType = sessionObtain('payType') || 'wx';
        that.orderNote = sessionObtain('orderNote') || '';
		
		// 堂食就餐，获取餐具费用
        if (!outStore) {
            that.coverPrice = sessionObtain('coverPrice');
        }

        //商户优惠信息
        var vendorDiscount = sessionObtain('vendorDiscount');
        if (vendorDiscount) {
            that.vendorDiscount = JSON.parse(vendorDiscount);
        }

        // 外卖就餐，获取收货地址
        if (outStore) setDefaultAdress(that);

        // 从本地存储获取购物车的信息，显示到页面中
        var cartData = obtain('cartData' + storeId + '');
        if (cartData) {
            that.cartData = JSON.parse(cartData);
            that.flushCart(that.cartData);
        }
    },
    computed: {},
    methods: {
        // 就餐人数选择模态框显示、隐藏切换
        togglePerson: function () {
            var that = this;
            that.personHidden = !that.personHidden;
        },
        // 选择就餐人数
        chosePersonNum: function (num) {
            var that = this;
            if (!num) return;
            that.personHidden = true;
            that.personNum = parseInt(num);
            if (!that.outStore) {  // 堂食
                var coverPrice = that.coverPrice;   // 餐具单人费用
                var tablewarePrice = (parseFloat(coverPrice) * parseInt(num)).toFixed(2) || 0  // 餐具总费用
                that.tablewarePrice = tablewarePrice;
				session('tablewarePrice', tablewarePrice);
                // 获取页面商品总价格
                setTotlePrice(that, "chosePersonNum");
                //重新计算可抵扣金额
                calcIntegral(that);
                setTotlePrice(that);
            }
            session('personNum', num);
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

        //刷新购物车信息
        flushCart: function (cartData) {
            var that = this;
            PostData("/cart/get", JSON.stringify(cartData), function (res) {
                if (1 == res.returnCode) {
                    var cart = res.returnMessage;  // 购物车对象
                    if (cart) {
                        that.cartData = cart;
                    }else{
                        that.cartData = {};
                    }
                    // 将购物车商品信息存储到本地存储中
                    storage('cartData' + that.storeId + '', JSON.stringify(that.cartData))
					// 获取页面商品总价格
					setTotlePrice(that);
                    //获取会员积分，计算可抵扣金额
                    getCustomerIntegral(that);
                }
            }, '', '1', '', false);
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
            if (!!that.outStore) {  // 外卖点餐
                if (!that.personNum) {
                    mui.toast('请输入就餐人数');
                    return;
                }
                if (!that.addressid) {
                    mui.toast('请选择配送地址');
                    return;
                }

                var param = {
                    "vendorUuid": that.storeId,
                    "customerUuid": that.customerUuid,
                    "eatType": that.outStore ? "2" : "1",
                    "personNum": that.personNum,
                    "productPrice": that.cartData.totalPrice,
                    "tablewarePrice": that.cartData.lunchboxPrice,   // 餐盒费
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

            } else {  // 堂食
                if (!that.tableName) {
                    mui.toast('请选择桌台');
                    return;
                }
                if (!that.personNum) {
                    mui.toast('请选择就餐人数');
                    return;
                }
                var param = {
                    "vendorUuid": that.storeId,
                    "customerUuid": that.customerUuid,
                    "eatType": that.outStore ? "2" : "1",
                    "tableNo": that.tableName,
                    "personNum": that.personNum,
                    "productPrice": that.cartData.totalPrice,
                    "tablewarePrice": that.tablewarePrice,
                    "giveIntegral": that.cartData.totalIntegral, //赠送积分
                    "useIntegral": useIntegral, //使用积分
                    "integralFree": integralFree, //积分抵扣金额
                    "totalPrice": that.totalPrice,
                    "payPrice": that.payPrice,
                    "freePrice": that.freePrice,  // 优惠总金额
                    "mjPrice": that.mjPrice,  // 满减金额
                    "ljPrice": that.ljPrice,  // 新用户下单立减金额
                    "note": that.orderNote,  // 订单备注
                    "detailList": that.cartData.detailList,
                    "payType": that.payType == "wx" ? "3" : "1",
                }
            }
            PostData("/ordermain/save", JSON.stringify(param), function (res) {
                if (1 === res.returnCode) {
                    var orderUuid = res.returnMessage;  // 订单ID
                    // 下单成功，清除数据缓存
                    clear('cartData' + that.storeId + '');  // 移除购物车商品信息
                    clear('floorName');   // 移除桌台类别
                    clear('tableName');   // 移除桌台号
                    clear('personNum');   // 移除人数
                    clear('payType');     // 移除支付方式
                    clear('orderNote');   // 移除订单备注
                    clear('address');     // 移除选择的地区
                    clear('addressid');   // 移除选择的地区uuid
					clear('tablewarePrice'); // 移除选择的就餐人数
					clear('newCustomer')    // 移除是否是新用户下单
			        clear('vendorIntegral')  // 移除商户积分换算

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
    var freePrice = 0;
    if (that.outStore) {
        freePrice = calcPromitionPrice(that, that.cartData.allPrice);
    } else {
        freePrice = calcPromitionPrice(that, productPrice);
    }
    var totalPrice = 0;
    if (!!that.outStore) {
        var lunchboxPrice = that.cartData.lunchboxPrice;
        var distributionPriceNew = that.cartData.distributionPriceNew;
        totalPrice = (parseFloat(productPrice) + parseFloat(lunchboxPrice) + parseFloat(distributionPriceNew)).toFixed(2)
    } else {
        totalPrice = (parseFloat(productPrice) + parseFloat(that.tablewarePrice)).toFixed(2)
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

