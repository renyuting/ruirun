mui.init({
    gestureConfig:{
	   tap: true, //默认为true
	   doubletap: true, //默认为false
	   longtap: true, //默认为false
	   swipe: true, //默认为true
	   drag: true, //默认为true
	   hold:false,//默认为false，不监听
	   release:false//默认为false，不监听
    }
});

var globalThisObj;
var globalOrderDetailUuid;

$(document).on('longtap', '#photoup img', function() {
            
    $(this).parents("#photoup").find("span").show();
    $(".upload_photos").click(function(){
		$("#photoup span").hide();
    })
            
})

function preViewImages(pic){
	var htmlStr = '<p class="changan">'
            +'<a id="previewImage" name="" >'
            +'<img src="'+pic+'" class="uploadImg">'
            +'</a><span class="delete" name="'+pic+'"></span><input id="imgName'+pic+'" type="hidden" value="'+pic+'" /></p>';
			
	var $imgHtml = $(htmlStr);
        $("#photoup").append($imgHtml);

    // 获取当前图片数量
	var currentImageNum = $("#photoup").children().find("img").length;

   if (currentImageNum >= 5) {
		$(".imageHide").hide();
	}
}

var globalCurrentImagesNum = 0;
var limitImageNum = 5;
function imageShowNumHandle(pics){

    if (globalCurrentImagesNum + pics.length > limitImageNum) {
      
        var needShowNum = limitImageNum - globalCurrentImagesNum;
        var picsTmp = new Array();
        for (var i = 0; i < needShowNum; i++) {
           picsTmp[i] = pics[i];
		}

		preViewImages(picsTmp);

		mui.alert("总图片数超过"+limitImageNum+"张");
    }else{
        preViewImages(pics);
   }
}

function ajaxSuccess () {

	console.log(this.responseText);
	var data = JSON.parse(this.responseText);
	var pic = data.data.url;
	$("#upImgs").val("");
	preViewImages(pic);
}

function AJAXSubmit (oFormElement) {
    var oReq = new XMLHttpRequest();
    oReq.onload = ajaxSuccess;
    oReq.open("post", oFormElement.action,true);
    oReq.send(new FormData(oFormElement));
}

function getWapPicsMaps(){

    var showPicsTmp = {};
    var imgNameArray = new Array();
    $("#photo span").each(function(){

        var uuidImg = $(this).attr("name");  //span name
        var uuidImgArray = uuidImg.split("|");

        var orderDetailUuid = uuidImgArray[0];
        var imgName = uuidImgArray[1];
        var imgPath = uuidImgArray[2];
        var tmp = {};
        tmp[imgName] = imgPath;

        if(showPicsTmp[orderDetailUuid] == null || showPicsTmp[orderDetailUuid] == ""){
          showPicsTmp[orderDetailUuid] = new Array();
          showPicsTmp[orderDetailUuid][0] =  tmp;
        }else{
          var len = showPicsTmp[orderDetailUuid].length;
          showPicsTmp[orderDetailUuid][len] = tmp;
        }
    })

    $("#photoup span").each(function(){

        var uuidImg = $(this).attr("name");  //span name
        var uuidImgArray = uuidImg.split("|");

        var orderDetailUuid = uuidImgArray[0];
        var imgName = uuidImgArray[1];
        var imgPath = uuidImgArray[2];
        var tmp = {};
        tmp[imgName] = imgPath;

        if(showPicsTmp[orderDetailUuid] == null || showPicsTmp[orderDetailUuid] == ""){
          showPicsTmp[orderDetailUuid] = new Array();
          showPicsTmp[orderDetailUuid][0] =  tmp;
        }else{
          var len = showPicsTmp[orderDetailUuid].length;
          showPicsTmp[orderDetailUuid][len] = tmp;
        }
    })
    
    return showPicsTmp;
}

function getProductAppsForWap(customerUuid,customerName){

     var contents = new Array();
     var stars_num = new Array();
     var orderDetailUuids = new Array();
     var index = 0;

     $(".evaluat").each(function() {

          orderDetailUuids[index] = $(this).attr("id");
          var tmp = $(this).find("textarea").val();

          contents[index] = tmp;

          var on_nums = $(this).find("i[class='on']");
          stars_num[index] = on_nums.length;

          index++;

     });
	 
     var productApps = new Array();
     var showPics = getWapPicsMaps();
     for (var i = 0; i < index; i++) {
          var orderDetailUuid = orderDetailUuids[i];
          var showPicsTmp = showPics[orderDetailUuid];
          var showPicsSingle = {};
          if (showPicsTmp != null && showPicsTmp != "") {
                for (var j = 0; j < showPicsTmp.length; j++) {
                    for(var key in showPicsTmp[j]){
                        showPicsSingle[key] = showPicsTmp[j][key];      
                        //alert(key+':'+showPicsTmp[i][key]);
                    }
              }
          }

          var productApp = {"orderDetailUuid":orderDetailUuids[i],
                              "appScore":stars_num[i]+"",
                             "content":contents[i],
                              // "content":"XXXX",
                              "customerUuid":customerUuid,
                              "customerName":customerName,
                              "showPics":showPicsSingle}

         // mui.alert(JSON.stringify(productApp));
          productApps[i] = productApp;

     }

     return productApps;
}


function localPictureInfo(){
    var files=$("#upImgs")[0].files;
    for (var i = 0; i < files.length; i++) {
      var file=files[i];
      console.log(file.name);
    }
}
