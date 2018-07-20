/*数字格式化，保留两位小数，可用于价格格式化等*/
Vue.filter('NumberFmt', function(value){
    return parseFloat(value).toFixed(2);
});

/*时间字符串截取 2018-06-26 09:50:23 格式截取为 09:50*/
Vue.filter('timeSubstr', function(value){
    if (null != value) {
        return value.substring(11, 16);
    }
});