var vm = new Vue({
    el:".page",
    data:{
        styleClass:'',  // 换肤颜色
        addressList: [],  //地址列表
        selectAddressId: '', // 已选择的收货地址ID
        customerUuid:'',
    },
    mounted: function(){
        var that = this;
        // 获取商户皮肤值
        var styleClass = obtain("styleClass");
        // 设置页面皮肤值
        that.styleClass = styleClass;
        var customerUuid = obtain("customerUuid");
        that.customerUuid = customerUuid;
        // 获取已选择的收货地址ID
        var selectAddressId = obtain('addressid');
        that.selectAddressId = selectAddressId;

        this.queryCustomerAddress(that);
    },
    computed: {

    },
    methods: {
        /**
         * 查询会员收货地址列表
         */
        queryCustomerAddress: function (that) {
            var param = {
                "queryPage": 1,
                "pageShow": 100,
                "queryParams": {
                    "customerId": {
                        "operation": "EQ",
                        "value": that.customerUuid
                    }
                }
            };
            PostData("/customeraddress/list", JSON.stringify(param), function (res) {
                if (1 == res.returnCode) {
                    that.addressList= res.returnMessage;
                }
            }, "POST")
        },
        //选择收货地址
        selectAddress:function (index) {
            var address = vm.addressList[index];
            vm.selectAddressId = address.uuid;
            storage('address', JSON.stringify(address));
            storage('addressid', address.uuid);
			window.location.href = "../shop/confirmOrder.html";
        },
        
        //添加地址
        addAddress:function () {
            location.href='../usercenter/customerAddressAdd.html?from=confirmOrder';
        },
        
        //编辑地址
        editAddress:function (index) {
            var editAddress = vm.addressList[index];
            session('editAddress', JSON.stringify(editAddress));
            window.location.href = '../usercenter/customerAddressEdit.html?from=confirmOrder';
        }
    }
});

