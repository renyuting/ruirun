var hideInfo;

var indexVm = new Vue({
    el:".page",
    data:{
        styleClass:'',  // 换肤颜色
        cartHidden: false,  // 购物车内容是否显示
        specHidden: false,  // 选择规格模态框是否显示
        nowPage: 1,  // 菜品列表默认从第一页开始展示
        pageShow: 10,  // 菜品列表每页展示多少条数据
        hasMore: true,   // 商品列表上拉是否可以加载更多
        noMinus: false,  // 多规格商品不可减提示是否显示
        noMinusTop: 0,  // 多规格商品不可减提示y轴位置
        // 购物车中商品信息初始数据
        cartData: {
            totalNum: 0,   // 购物车内商品数量
            detailList: [],   // 购物车商品列表
            distributionPrice: 0,  // 商户默认配送费用
            distributionPriceNew: 0,  // 商户配送费减免后配送费用
            lunchboxPrice: 0,  // 外卖商品总餐盒费用
            totalPrice: 0,  // 购物车商品总价
			allPrice:0,// 购物车总价
            vendorName: '',  // 商户名称
            vendorUuid: '',  // 商户id
        },
        storeId: '',   // 商户ID
        outStore: false,   // 用户点餐方式 true - 外卖   false - 堂食
        customer: '',  // 用户信息
        customerUuid:'',//会员uuid

        vendorName: '',  // 商户名称
        monthSell: '',  // 商户月售
        storeLogo: '',  // 商户LOGO
        vendorBasic: '',  // 商户外卖设置基础信息
        vendorInfo:'',
        vendorDiscount: '',  // 商户优惠信息

        goodClass:[],  // 商品分类数据
        goodList:[],  // 商品列表数据

        classCurId:'',  // 当前选择的分类ID
        goodList:[],  // 商品列表数据
        
        specData: {},
        newCustomer: false,   // 用户是否是新用户（没有下过单）
				//选择规格弹出框商品
		selectItem: {
			productUuid:'',
			specPdName:'',
			price:'',
			sellOut:'',
			integral:'',
			smallimg:'',
			lunchboxPrice:'',
			specPdUuid:'',
			promotionType:'',
			promotionRate:'',
			showName:'',
			specs:{}
		},
        // 加入购物车飞入小球组件
        balls: [
            {
                show: false
            },{
                show: false
            },{
                show: false
            },{
                show: false
            },{
                show: false
            }
        ],
        dropBalls: []  // 正在执行加入购物车动画组件
    },  
    mounted: function(){
        var that = this;

        // 获取商户皮肤值
        var styleClass = obtain("styleClass")
        // 设置页面皮肤值
        that.styleClass = styleClass

        // 获取商户ID及购买方式
        var storeId = obtain("vendorUuid");  // 商户uuid
        var outStore = obtain("outStore") == 'true' ? true : false;   //  购买方式是否是外卖点餐
        that.storeId = storeId;
        that.outStore = outStore;

        // 获取用户信息
        that.customer = obtain('customer');
        that.customerUuid = obtain("customerUuid");

        // 从本地存储获取购物车的信息，显示到页面中
        // clear('cartData' + storeId + '')
        var cartData = JSON.parse(obtain('cartData' + storeId + ''));
        if (!!cartData) {
            that.cartData = cartData;
            that.flushCart(that.cartData);
        }
        // 获取商户基本信息
        PostData("/vendor/getVendor/" + storeId, '', function (res) {
            that.vendorName = res.returnMessage.vendorName;  // 商户名称
            that.monthSell = res.returnMessage.monthSell;    // 商户月售
            that.storeLogo = res.returnMessage.logoImage || '';    // 商户LOGO
            that.vendorBasic = res.returnMessage.vendorBasic;  // 商户外卖设置基础信息
            that.vendorInfo = res.returnMessage.vendorInfo;
            that.vendorDiscount = res.returnMessage.vendorDiscount; // 商户优惠信息
            that.cartData.vendorUuid = res.returnMessage.uuid;   // 购物车存储商户ID
            that.cartData.vendorName = res.returnMessage.vendorName;    // 购物车存储商户名称
            that.cartData.distributionPrice = res.returnMessage.vendorBasic.distributionPrice;    // 商户配送费用

            //获取商品分类列表
            getProductCategory(that, that.storeId);
        }, "GET")

        //验证是否是新会员state
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
                that.newCustomer = true
            }
        }, "POST")
    },
    computed: {
        getOuterprice: function(){
            var cartData = this.cartData
            var leastPrice = this.vendorBasic.leastPrice
            var goBillStr = "";
            if(!cartData.totalNum>0){
                goBillStr = "￥"+leastPrice+"起送"
            }else if(cartData.allPrice < leastPrice){
                var price = (parseFloat(leastPrice) - parseFloat(cartData.allPrice)).toFixed(2)
                goBillStr = "差￥"+price+"起送"
            }else{
                goBillStr = "去结算"
            }
            return goBillStr;
        }
    },
    methods: {
        //跳转进入会员中心首页
        goUserCenter:function(){
            location.href = '../usercenter/index.html';
        },
        // 点击分类获取分类下商品列表
        showGoods: function (classCurId,classCurName) {
            var that = this
            that.classCurId= classCurId
            that.classCurName= classCurName
            // 点击分类获取相应的商品列表
            getProduct(that, classCurId)
        },

        //刷新购物车信息
        flushCart: function(cartData){
            var that = this;
            PostData("/cart/get", JSON.stringify(cartData), function (res) {
                if (1 == res.returnCode) {
                    var cart = res.returnMessage;  // 购物车对象
                    if(cart){
                        that.cartData = cart;
                    }else{
                        that.cartData = {};
                    }
                    // 将购物车商品信息存储到本地存储中
                    storage('cartData' + that.storeId + '', JSON.stringify(that.cartData));
                }
            },'','1');
        },
		
		//选择规格商品
		selectSpec: function (item) {
            var that = this
            var sellout = item.sellOut   // 商品是否已售罄
            if (!!sellout) return
			that.selectItem = {
				specPdName:'',
				specPdPrice:'',
				sellOut:'',
				integral:'',
				smallimg:'',
				lunchboxPrice:'',
				specPdUuid:'',
				promotionType:'',
				promotionRate:'',
				price:'',
				specs:{}
			};
			
			//获取商品明细
			PostData("/product/get/"+item.uuid, '', function (res) {
            if (1 == res.returnCode) {
				var productUuid = res.returnMessage.uuid;
				var specPdName = res.returnMessage.name; // 商品名称
				var specs = res.returnMessage.productAttrList;// 商品规格属性
				var specPdPrice = res.returnMessage.price   // 商品价格
				var integral = res.returnMessage.integral  //赠送积分
				var smallimg = res.returnMessage.smallimg  // 商品图片
				var lunchboxPrice = res.returnMessage.lunchboxPrice  // 包装费用
				var sellOut = res.returnMessage.sellOut  // 是否售罄
				var specPdUuid = res.returnMessage.uuid   // 商品uuid
				var promotionType = res.returnMessage.promotionType //促销类型 0为不参与 1为折扣
				var promotionRate = res.returnMessage.promotionRate // 折扣比率
				if (1 == promotionType) {
				  specPdPrice = (specPdPrice * promotionRate).toFixed(2);
				}
				that.selectItem.productUuid = productUuid;
				that.selectItem.specPdName = specPdName;
				that.selectItem.price = specPdPrice ;  // 商品价格
				that.selectItem.sellOut = sellOut;
				that.selectItem.integral = integral;
				that.selectItem.smallimg = smallimg;
				that.selectItem.lunchboxPrice = lunchboxPrice;
				that.selectItem.specPdUuid = specPdUuid;
				that.selectItem.promotionType = promotionType;
				that.selectItem.promotionRate = promotionRate;
				if (specs != null && specs.length > 0) {
					//计算规格的折扣价
					for (var i = 0; i < specs.length; i++) {
						//如果是影响价格的规格,默认选中第一个规格值
						var productAttr = specs[i];
						var values = productAttr.productAttrValueList;
						if (productAttr.spec) {
							if (values != null && values.length > 0) {
								for (var j = 0; j < values.length; j++) {
									if (0 == j) {
										values[j].active = "active";
										var defaultPrice = values[j].price;
										//计算折扣价
										if (1 == promotionType) {
											defaultPrice = (defaultPrice * promotionRate).toFixed(2);
										}
										values[j].price = defaultPrice;
										that.selectItem.price = defaultPrice;
										that.selectItem.selectSku = values[j].uuid;
									} else {
										var basicPrice = values[j].price;
										//计算折扣价
										if (1 == promotionType) {
											values[j].price = (basicPrice * promotionRate).toFixed(2);
										}
									}
								}

							}
						} else {
							if (values != null && values.length > 0) {
								for (var j = 0; j < values.length; j++) {
									if (0 == j) {
										values[j].active = "active";
									}
									var basicPrice = values[j].price;
									//计算折扣价
									if (1 == promotionType) {
										basicPrice = (basicPrice * promotionRate).toFixed(2);
									}
									values[j].price = basicPrice;
								}
							}
						}

					}
				}
				that.selectItem.specs = specs;
				that.specHidden = true;
              }
             }, "POST")
		},
		
		//选择规格
		selectAttr: function(e,attr,spec){
			var that = this;
			$(e.target).addClass('active').siblings().removeClass('active');
			if (spec) {
				that.selectItem.selectSku = attr.uuid;
				that.selectItem.price = attr.price;
			}
		},

        // 规格商品减少数量
        selectMinus: function(event){
            var that = this;
            this.noMinus = true;
            this.noMinusTop = event.y
            hideInfo = setTimeout(function () {
                that.noMinus = false
            }, 1500)
        },

        // 规格商品减少数量提示隐藏
        hideInfo: function(){
            clearTimeout(hideInfo)
            this.noMinus = false;
        },
		
		// 规格商品增加数量
        specAddCart: function () {
            var that = this
			var item = that.selectItem;
            var sellout = item.sellOut   // 商品是否已售罄
            if (!!sellout) return
			//获取选中的规格
			var showName = "";
			var names = $(".spec_list").find("span.active");
	        for(var i =0; i<names.length; i++){
				showName += $(names[i]).html();
				if (i != (names.length - 1)) {
					showName += " ";
				}
			}
			item.showName = showName;
			var skuName = item.spec;
			var productUuid = item.productUuid;    // 商品ID
			var productPrice = item.price;  // 商品价格
			var integral = item.integral || 0 ;  // 赠送积分数
			var name = item.specPdName ;  // 商品名称
			var image = item.smallimg;   // 商品图片
			var lunchboxPrice = item.lunchboxPrice;   // 商品外卖餐盒费用
            
            var detailList = that.cartData.detailList || []   // 购物车商品列表
            var totalNum = that.cartData.totalNum || 0   // 购物车商品总数
            var totalIntegral = that.cartData.totalIntegral || 0   // 购物车赠送积分数
            // 购物车中已有数据
            if (detailList.length > 0) {
                if (hasGoods(productUuid, detailList, showName)) {  // 所选商品购物车中已存在
				    for (var dNum = 0; dNum < detailList.length; dNum++) {
						var value = detailList[dNum];
						if (value.productUuid == productUuid && value.showName == showName) {
							value.buyNum++
							value.totalPrice = (parseFloat(value.totalPrice) + parseFloat(value.productPrice)).toFixed(2)
						}
					}
                } else {   // 所选商品购物车中不存在
                    detailList.push({
                        productUuid: productUuid,
                        productName: name,
						skuUuid: item.selectSku,
						showName: showName,
                        buyNum: 1,
                        integral: integral,
                        productPrice:productPrice,
                        totalPrice: productPrice,
                        image:image,
                        lunchboxPrice:lunchboxPrice
                    })
                }
            } else { // 购物车中无数据
                detailList.push({
                    productUuid:productUuid,
                    productName:name,
                    buyNum: 1,
					skuUuid: item.selectSku,
					showName: showName,
                    integral: integral,
                    productPrice:productPrice,
                    totalPrice: productPrice,
                    image:image,
                    lunchboxPrice:lunchboxPrice
                })
            }
            totalNum++
            totalIntegral = parseInt(integral) + parseInt(totalIntegral)
            var goodList = that.goodList
            for (var gNum = 0; gNum<goodList.length; gNum++) {
                var good = goodList[gNum];
                if (good.uuid == productUuid) {
                    good.buyNum++
                }
            }

            that.goodList = goodList
            that.cartData.detailList = detailList
            that.cartData.totalNum = totalNum
            that.cartData.totalIntegral = totalIntegral

            // 获取购物车商品总价格、餐盒费、配送费
            ObtainTotlePrice(that)

            // 将购物车商品信息存储到本地存储中
            storage('cartData' + that.storeId + '', JSON.stringify(that.cartData))
			
			that.specHidden = false;
        },

        // 普通商品增加数量
        addCart: function (item,type,event) {
            var that = this
            var sellout = item.sellOut   // 商品是否已售罄
            if (!!sellout) return
            if (type == 1) {
                var skuName = item.showName
                var productUuid = item.uuid    // 商品ID
                var productPrice = item.promotionType != '0' ? item.promotionPrice : item.price  // 商品价格
                var integral = item.integral || 0   // 赠送积分数
                var name = item.name   // 商品名称
                var image = item.smallimg   // 商品图片
                var lunchboxPrice = item.lunchboxPrice;   // 商品外卖餐盒费用
            }else{
                var skuName = item.showName
                var productUuid = item.productUuid    // 商品ID
                var integral = item.integral || 0   // 赠送积分数
            }
            
            var detailList = that.cartData.detailList || []   // 购物车商品列表
            var totalNum = that.cartData.totalNum || 0   // 购物车商品总数
            var totalIntegral = that.cartData.totalIntegral || 0   // 购物车赠送积分数
            // 购物车中已有数据
            if (detailList.length > 0) {
                if (hasGoods(productUuid, detailList, skuName)) {  // 所选商品购物车中已存在
                    for (var dNum = 0; dNum < detailList.length; dNum++) {
						var value = detailList[dNum];
                        if (!skuName) {
                            if (value.productUuid == productUuid && !value.showName) {
                                value.buyNum++;
                                value.totalPrice = (parseFloat(value.totalPrice) + parseFloat(value.productPrice)).toFixed(2);
                            }
                        } else {
                            if (value.productUuid == productUuid && skuName == value.showName) {
                                value.buyNum++;
                                value.totalPrice = (parseFloat(value.totalPrice) + parseFloat(value.productPrice)).toFixed(2);
                            }
                        }

                    }
                } else {   // 所选商品购物车中不存在
                    detailList.push({
                        productUuid: productUuid,
                        productName: name,
                        buyNum: 1,
                        integral: integral,
                        productPrice:productPrice,
                        totalPrice: productPrice,
                        image:image,
                        lunchboxPrice:lunchboxPrice
                    })
                }
            } else { // 购物车中无数据
                detailList.push({
                    productUuid:productUuid,
                    productName:name,
                    buyNum: 1,
                    integral: integral,
                    productPrice:productPrice,
                    totalPrice: productPrice,
                    image:image,
                    lunchboxPrice:lunchboxPrice
                })
            }
            totalNum++
            totalIntegral = parseInt(integral) + parseInt(totalIntegral)
            var goodList = that.goodList
            for (var gNum = 0; gNum<goodList.length; gNum++) {
				var good = goodList[gNum];
                if (good.uuid == productUuid) {
                    good.buyNum++
                }
            }
            that.goodList = goodList
            that.cartData.detailList = detailList
            that.cartData.totalNum = totalNum
            that.cartData.totalIntegral = totalIntegral

            // 购物车飞入效果，异步执行动画，避免动画卡顿
            this.$nextTick(function(){
                for (var count = 0; count<that.balls.length; count++) {
                    var ball = that.balls[count];
                    if (!ball.show) {
                        ball.el = event.target;
                        ball.show = true;
                        that.dropBalls.push(ball);
                        return;
                    }
                }
            })

            // 获取购物车商品总价格、餐盒费、配送费
            ObtainTotlePrice(that)

            // 将购物车商品信息存储到本地存储中
            storage('cartData' + that.storeId + '', JSON.stringify(that.cartData))
        },

        // 加入购物车飞入动画
        beforeEnter: function(el){
            var count = this.balls.length;
            while(count--){
                var ball = this.balls[count]
                if (ball.show) {
                    var base = this.$refs.ballContain.getBoundingClientRect()
                    var rect = ball.el.getBoundingClientRect();
                    var rectX = rect.left - base.left
                    var rectY = -(base.top - rect.top)
                    el.style.webkitTransform = 'translate3d(0,'+rectY+'px,0)'
                    el.style.transform = 'translate3d(0,'+rectY+'px,0)'
                    var inner = el.getElementsByClassName("inner-hock")[0]
                    inner.style.webkitTransform = 'translate3d('+rectX+'px,0,0)'
                    inner.style.transform = 'translate3d('+rectX+'px,0,0)'
                }
            }
        },
        enter: function(el){
            // 手动触发DOM更新，重置小球位置为初始位置
            var rf = el.offsetHeight;
            this.$nextTick(function(){
                el.style.webkitTransform = 'translate3d(0,0,0)'
                el.style.transform = 'translate3d(0,0,0)'
                var inner = el.getElementsByClassName("inner-hock")[0]
                inner.style.webkitTransform = 'translate3d(0,0,0)'
                inner.style.transform = 'translate3d(0,0,0)'
            })
        },
        afterEnter: function(el) {
            var ball = this.dropBalls.shift();
            if (ball.show) {
                ball.show = false
                el.style.display = "none"
            }

        },

        // 普通商品减少数量
        reduceCart: function (productUuid,skuName,integral) {
            var that = this
            integral = integral || 0    // 赠送积分数
            var detailList = that.cartData.detailList || []
            var totalNum = that.cartData.totalNum || 0
            var totalIntegral = that.cartData.totalIntegral || 0   // 购物车赠送积分数
            // 购物车中已有数据
            if (detailList.length > 0) {
                for (var i = 0; i<detailList.length;i++) {
	                if(undefined == skuName) {
						if (detailList[i].productUuid == productUuid && undefined == detailList[i].showName) {
							var value = detailList[i];
							if (value.buyNum == 1) {
								detailList.splice(i, 1)
							}
							value.buyNum--
							value.totalPrice = (parseFloat(value.totalPrice) - parseFloat(value.productPrice)).toFixed(2)
                      }
					} else {
						if (detailList[i].productUuid == productUuid && detailList[i].showName == skuName) {
                            var value = detailList[i];
                            if (value.buyNum == 1) {
                                detailList.splice(i, 1)
                            }
                            value.buyNum--
                            value.totalPrice = (parseFloat(value.totalPrice) - parseFloat(value.productPrice)).toFixed(2)
                        }
					}
          
                }
            }
            totalNum--
            totalIntegral = parseInt(totalIntegral) - parseInt(integral)
            // 购物车中商品清空
            if (!totalNum > 0) {
                that.cartHidden = false
            }
            var goodList = that.goodList
            for (var gNum = 0; gNum<goodList.length; gNum++) {
				var value = goodList[gNum];
                if (value.uuid == productUuid) {
                    value.buyNum--
                }
            }

            that.goodList = goodList
            that.cartData.detailList = detailList
            that.cartData.totalNum = totalNum
            that.cartData.totalIntegral = totalIntegral

            // 获取购物车商品总价格
            ObtainTotlePrice(that)

            // 将购物车商品信息存储到本地存储中
            storage('cartData' + that.storeId + '', JSON.stringify(that.cartData))
        },

        // 清空购物车
        cleanCart: function () {
            var that = this
            mui.confirm('清空购物车所有商品？', '提示', ['确认','取消'], function(e) {
                if (e.index == 0) {
                    var goodList = that.goodList;
                    for (var gNum = 0; gNum<goodList.length;gNum++) {
                        goodList[gNum].buyNum = 0;
                    }
                    that.cartHidden = false;
                    that.goodList = goodList;
                    that.cartData.detailList = [];
                    that.cartData.totalPrice = 0;
                    that.cartData.totalNum = 0;
                    that.cartData.totalIntegral = 0;

                    // 将购物车商品信息存储到本地存储中
                    storage('cartData' + that.storeId + '', JSON.stringify(that.cartData))
                }
            })
        },

        // 购物车显示隐藏切换
        showHideCart: function () {
            var that = this
            var cartHidden = that.cartHidden
            // 购物车无商品时点击不弹出
            if (!cartHidden && that.cartData.detailList.length < 1) {
                return;
            }
            that.cartHidden = !cartHidden
        },

        // 去结算
        goBill: function(){
            if (!this.cartData.totalNum > 0) return  // 购物车无商品
            if (this.outStore && this.cartData.allPrice < this.vendorBasic.leastPrice) return   // 外卖配送未到起送金额

            session('coverPrice', this.vendorBasic.coverPrice)   // 餐具费用，堂食根据人数计算餐具费用
            session('vendorDiscount', JSON.stringify(this.vendorDiscount))   // 商户优惠活动，计算总价时使用
			session('newCustomer', this.newCustomer + "")    //是否是新用户下单
			session('vendorIntegral', this.vendorInfo.integralNum)  //商户积分换算

            // 移除下单页面本地缓存
            clear('floorName');   // 移除桌台类别
            clear('tableName');   // 移除桌台号
            clear('personNum');   // 移除人数
            clear('payType');     // 移除支付方式
            clear('orderNote');   // 移除订单备注
            clear('address');     // 移除选择的地区
            clear('addressid');   // 移除选择的地区uuid
			clear('tablewarePrice'); // 移除选择的就餐人数
			
            window.location.href = "confirmOrder.html";
        }
    }
})


// 根据商户ID获取商品分类列表
function getProductCategory(that, storeId) {
    // 获取商品分类信息
    var param = {
        "queryPage": 1,
        "pageShow": 100,
        "queryParams": {
            "vendorUuid": {
                "operation": "EQ",
                "value": storeId
            }
        },
		"sortMap": {
			"position": "asc"
		}
    }

    PostData("/productcate/list", JSON.stringify(param), function (res) {
        // 获取商品分类
        that.goodClass = res.returnMessage

        var classCurId = "";
        var classCurName = "";

        // 如果商户有招牌，则默认显示招牌商品，如果有优惠，则默认显示优惠商品。 否则获取商户首个分类下商品列表，
        classCurId = that.vendorBasic.showSign && "zp" || that.vendorBasic.showPromotion && "yh" || res.returnMessage[0].uuid || ''
        classCurName = that.vendorBasic.showSign && "招牌" || that.vendorBasic.showPromotion && "优惠" || res.returnMessage[0].name || ''

        that.classCurId = classCurId
        that.classCurName = classCurName

        // 获取商品列表
        getProduct(that, classCurId)
    })
}

// 根据商户ID获取商品列表
function getProduct(that, classCurId, scroll) {
    that.nowPage = (scroll == "scroll")? that.nowPage + 1 : 1

    // 获取商品信息
    var param;
    if ("zp" == classCurId) {
        param = {
            "queryPage": that.nowPage,
            "pageShow": that.pageShow,
            "queryParams": {
                "tag": {
                    "operation": "EQ",
                    "value": "zp"
                },
                "vendorUuid": {
                    "operation": "EQ",
                    "value": that.storeId
                }
            }
        }
    } else if ("yh" == classCurId) {
        param = {
            "queryPage": that.nowPage,
            "pageShow": that.pageShow,
            "queryParams": {
                "promotionType": {
                    "operation": "NE",
                    "value": "0"
                },
                "vendorUuid": {
                    "operation": "EQ",
                    "value": that.storeId
                }
            }
        }
    } else {
        param = {
            "queryPage": that.nowPage,
            "pageShow": that.pageShow,
            "queryParams": {
                "categoryUuid": {
                    "operation": "EQ",
                    "value": classCurId
                }
            }
        }
    }

    PostData("/product/list", JSON.stringify(param), function (res) {
        var list = res.returnMessage
        var goodList = scroll == "scroll" ? that.goodList.concat(list) : list;
        var detailList = that.cartData.detailList || []
        // 初始化商品列表购买数量
        if (goodList.length > 0) {
            for (var gNum = 0;gNum<goodList.length;gNum++) {
				var value = goodList[gNum];
                value.buyNum = 0;
                // 设置商品优惠信息
                if (1 == value.promotionType) {
                    value.lastPrice = parseFloat(value.price * value.promotionRate).toFixed(2);
                    value.rebate = value.promotionRate * 10;
                }
            }
        }


        // 根据购物车中商品信息回显商品列表商品数量
        if (goodList.length > 0 && detailList.length > 0) {
            for (var dNum = 0;dNum<detailList.length;dNum++) {
				var cart = detailList[dNum];
                var productUuid = cart.productUuid
                var buyNum = cart.buyNum
                for (var n = 0;n<goodList.length;n++) {
					var good = goodList[n];
                    if (good.uuid == productUuid) {
                        good.buyNum = buyNum;
                    }
                }
            }
        }


        that.goodList = goodList

        if (list.length < that.pageShow) {
            that.hasMore = false
        } else {
            that.hasMore = false
        }
    })
}

// 判断购物车中是否已有该商品
function hasGoods(productUuid, detailList, specName) {
    for (var dNum = 0; dNum<detailList.length;dNum++) {
		var value = detailList[dNum];
        if (!specName) {
            //如果是加入非规格，判断明细商品uuid相等，并且明细没有规格
            if (value.productUuid == productUuid && !value.showName) {
                return true;
            }
        } else {
            //如果是加入规格，判断明细商品uuid相等，并且明细规格等于加入的规格
            if (value.productUuid == productUuid && value.showName == specName) {
                return true;
            }
        }

    }
    return false;
}

// 获取购物车内商品总价格,外卖餐盒总价格，配送费用
function ObtainTotlePrice(that) {
    var totalPrice = 0  // 商品总价格
    var lunchboxPrice = 0  // 餐盒总价格
    for (var i = 0;i<that.cartData.detailList.length;i++) {
		var value = that.cartData.detailList[i]
        totalPrice = (parseFloat(totalPrice) + parseFloat(value.totalPrice)).toFixed(2)
        lunchboxPrice = (parseFloat(lunchboxPrice) + parseFloat(value.lunchboxPrice) * value.buyNum).toFixed(2)
    }
	var allPrice = (parseFloat(totalPrice) + parseFloat(lunchboxPrice)).toFixed(2)
    var distributionPriceNew = allPrice >= that.vendorBasic.reachPrice ? 0 : that.vendorBasic.distributionPrice;   // 配送费用
    that.cartData.totalPrice = parseFloat(totalPrice).toFixed(2)
    that.cartData.lunchboxPrice = parseFloat(lunchboxPrice).toFixed(2)
    that.cartData.distributionPriceNew = parseFloat(distributionPriceNew).toFixed(2)
	that.cartData.allPrice = allPrice
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