/*
”^\\d+$” //非负整数（正整数 + 0）
“^[0-9]*[1-9][0-9]*$” //正整数
“^((-\\d+)|(0+))$” //非正整数（负整数 + 0）
“^-[0-9]*[1-9][0-9]*$” //负整数
“^-?\\d+$” //整数
“^\\d+(\\.\\d+)?$” //非负浮点数（正浮点数 + 0）
“^(([0-9]+\\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\\.[0-9]+)|([0-9]*[1-9][0-9]*))$” //正浮点数
“^((-\\d+(\\.\\d+)?)|(0+(\\.0+)?))$” //非正浮点数（负浮点数 + 0）
“^(-?\\d+)(\\.\\d+)?$” //浮点数
*/


//验证手机号
function validatePhone(phone) {
	var reg = /^(0|86|17951)?(13[0-9]|15[012356789]|17[15678]|18[0-9]|14[579])[0-9]{8}$/;
	if (!reg.test(phone)) {
		return false;
	}
	return true;
}

//验证正整数
function validateInteger(number) {
	var reg = /(^[1-9]\d*$)/;
	if (!reg.test(number)) {
		return false;
	}
	return true;
}


//验证非负整数整数
function validateIntegerAndZero(number) {
	var reg = /^(0|[1-9]\d*)$/;
	if (!reg.test(number)) {
		return false;
	}
	return true;
}


//验证数字（最多保留两位小数）
function validateFloat(number) {
	var reg = /^(([1-9][0-9]*)|(([0]\.\d{1,2}|[1-9][0-9]*\.\d{1,2})))$/;
	if (!reg.test(number)) {
		return false;
	}
	return true;
}


//验证数字（最多保留两位小数）包含0
function validateFloatAndZero(number) {
	var reg = /^((0|[1-9]*)|(([0]\.\d{1,2}|[1-9][0-9]*\.\d{1,2})))$/;
	if (!reg.test(number)) {
		return false;
	}
	return true;
}

//验证是否为空
function validateEmpty(str){
	var reg = /\S/;
	if (!reg.test(str)) {
		return false;
	}
	return true;
}
