address=new Object();
address.addrNick="";
address.addr="";
address.addr2="";
address.city="";
address.zip="";
address.phone="";
address.state="";
//update this value;
additionalPizzas=new Object();
cardReturnTo="account";
prevSlide=1;
//host="https://speedslice.com/app/Final/";
host="http://pizzadelivery.piecewise.com/Final/";
loader=$("<img src='images/loading.gif' id='loader'>");
lastY=0;
initY=0;
lastSlides=new Array();
scrollBarNmbr=0;
touchStarted=false;
function onLoad() {
	document.addEventListener("deviceready", onDeviceReady, false);
}
function onDeviceReady() {
	checkConnection();
	document.addEventListener("menubutton", onMenuKeyDown, false);
	document.addEventListener("backbutton", onBackButton, false);
	document.addEventListener("offline", checkConnection, false);
}
function checkConnection(){
	if(!navigator.onLine){
		navigator.notification.alert("SpeedSlice requires an active internet connection.",checkConnection,"SpeedSlice","Okay");
	}
	else{
		loadInfo();
	}
}
function loadInfo(){
	$(window).on("resize",function(){
		$("html").css("font-size",($(window).width()/5.12)+"%");
	});
	var sectionEle=document.getElementsByTagName("section");
	var numEle=sectionEle.length;
	var newHeight=window.innerHeight;
	for(i=0; i<numEle; i++){
		sectionEle.item(i).style.minHeight=newHeight+"px";
		sectionEle.item(i).style.height=newHeight+"px";
	}
	$.get(host+"LoginStatus.php",function(data){
		loggedIn=(data==1 ? true:false);
		//setTimeout("navigator.splashscreen.hide()",1000);
		if(loggedIn){
			$("#orderText,#createText").toggle();
			getDeliveryOpts();
			getPizzaList();
			getCardInfo();
			getUserInfo();
			if(localStorage.getItem("LastAddress")!=null){
				address.addrNick=localStorage.LastAddress;//ie placeholder
				$("#addressTo").val(address.addrNick);
			}
		}
	});	
	customScrolling("abtContentWrapper","abtContent","aboutSlider");
	customScrolling("legalContentWrapper","legalContent","legalSlider");
	customScrolling("supportContentWrapper","supportContent","supportSlider");
	checkCustomScrolling();
	$("#facebookLink").on("touchstart",function(e){
		e.preventDefault();
		webpageTimer=setTimeout(function(){window.plugins.childBrowser.showWebPage("https://www.facebook.com/SpeedSlice");},150);
	}).on("touchmove",function(){
		clearTimeout(webpageTimer);
	}).on("click",function(e){
		e.preventDefault();
	});
	$("section").on("blur","input",function(){
		window.scrollTo(0,0);
	});
	$("[src='images/redGear.svg']").on("touchstart",function(e){
		var sctnInd=$(this).parentsUntil("section").parent("section").index();
		if(loggedIn){
			if(sctnInd!=7){
				switchSlides(sctnInd,7);
			}
		}
		else{
			if(sctnInd!=4){
				switchSlides(sctnInd,4);
			}
		}
	});
	$("#menuOptions").on("touchstart","li",function(e){
		e.stopPropagation();
		e.preventDefault();
		var visSctn=$("section:visible").index();
		switch($(this).index()){
			case 0: switchSlides(visSctn,0);
			break;
			case 1: switchSlides(visSctn,7);
			break;
			case 2: switchSlides(visSctn,10);
			break;
			case 3: switchSlides(visSctn,9);
			break;
			case 4: //switchSlides($("section:visible").index(),7);
			break;
		}
		onMenuKeyDown();
	});
	$("#addressTo").on("touchstart focus",function(e){
		e.preventDefault();
		$(this).blur();
		addressToTimer=setTimeout("selectAddress(0); addrRtrnTo='selectPizza';",100);
	}).on("touchmove",function(e){
		clearTimeout(addressToTimer);
	}).on("click",function(e){
		e.preventDefault();
	});
	$(".aChev").on("touchstart",function(e){
		if(lastSlides.length!=0){
			switchSlides($("section:visible").index(),lastSlides.pop(),1);
		}
	});
	$("#pRight").on("touchstart",function(e){
		e.stopPropagation();
		rightPizza();
	});
	$("#pLeft").on("touchstart",function(e){
		e.stopPropagation();
		leftPizza();	
	});
	$(".tip").on("touchstart",function(){
		$(".tipSelected").removeClass("tipSelected");
		$(this).addClass("tipSelected");		
	});
	$("#orderSummary").on("swipe",".removePizza",function(){
		pizzaToDelete=this;
		navigator.notification.confirm(
			"Are you sure you wish to remove "+$(this).children("h4").text().substr(0,$(this).children("h4").text().length-1)+"?",
			deletePizza,        
			'Press "Yes" to delete pizza',
			'No,Yes'
		);
	});
	$("#addPizza.ribbon").on("touchstart",function(){
		//fix bug where pizza can have same name and different toppings
		thePiz=$("#pizzaName");
		//ie
		if($(thePiz).val()=="" || $(thePiz).val=="Custom Pizza"){
			navigator.notification.alert("Please give your pizza a name.",function(){},"No pizza name","Okay");
			$("#pizzaName").addClass("redBrdr");
			return false;
		}
		$(thePiz).removeClass("redBrdr");		
		$("#pizzaID").children("option").each(function(index, element) {
			if($("#pizzaName").val()==$(element).text()){
				if(loggedIn){
					if($("[name=q"+$(element).val()+"]").length!=0){
						$("[name=q"+$(element).val()+"]").val(parseInt($("[name=q"+$(element).val()+"]").val())+1);
					}
					else{
						$("#addressTo").parent("div").before("<div class='removePizza'><h4>"+thePiz.val()+":</h4><input type='number' value='1' name='q"+$(element).val()+"'></div>");
					}
				}
				else{
					$("#orderSummary>.infoWrapper>div>h4").each(function(ind, ele) {//basically, if pizza exists increase num for that pizza		
						if($(ele).text()==($(element).text()+":")){
					//same as $(element).prev("h4").text().substr(0,$(element).prev("h4").text().length-1) might want to change the long one
							$(ele).next("input").val((parseInt($(ele).next("input").val())+1));
							return false;
						}
						else{
							if(ind==$("#orderSummary>.infoWrapper>div>h4").length-1){
								$("#addressTo").parent("div").before("<div class='removePizza'><h4>"+$(element).text()+":</h4><input type='number' value='1' name='"+(parseInt($(element).val())=="NaN" ? "qUpdate":"q"+$(element).val())+"'></div>");
							}
						}
					});	
				}
				return false;	
			}
			else{
				if((index+1)==$("#pizzaID").children("option").length){
					hasPizzaAlready=false;
					$("[name=qUpdate]").each(function(index, element) {
						if($(element).prev("h4").text().substr(0,$(element).prev("h4").text().length-1)==$("#pizzaName").val()){
							$(element).val(parseInt($(element).val())+1);
							hasPizzaAlready=true;
						}
					});
					if(!hasPizzaAlready){
						addUserPizza();
						$("#addressTo").parent("div").before("<div class='removePizza'><h4>"+thePiz.val()+":</h4><input type='number' value='1' name='qUpdate'></div>");
					}
				}
			}
		});
		$("#delTxt").show();
	});
	$("#tapOrder").on("touchstart",function(){
		orderPizzaPage();
	});
	var oldTime;
    $("#pizzaToppings").on("touchstart",".topping:not(#cheeseTopping)",function(e){
		//check this with logged in
		theTopID=$(this).attr("id");
		toppingTouched=setTimeout(function(){
			var removeName=false;
			$("#orderSummary>.infoWrapper>div:not(:first)").each(function(index, element) {
				var theH4=$(element).children("h4").text();
				theH4=theH4.substr(0,theH4.length-1);
				if(theH4.toUpperCase()==$("#pizzaName").val().toUpperCase()){
					removeName=true;
				}
			});
			if(removeName){
				$("#pizzaName").val("").attr("name","");
			}
			addTopping(theTopID);
		},150);
	}).on("touchmove",".topping:not(#cheeseTopping)",function(e){
		clearTimeout(toppingTouched);
	});
	$("#orderOptions").on("touchstart",".orderOpt",function(){
		theSelection=this;
		orderTimer=setTimeout(function(){	
			var restAndPrice=$(theSelection).text().split("$");
			navigator.notification.confirm(
				restAndPrice[0]+" $"+restAndPrice[1],
				finalOrderConfirmation,
				'Press "Confirm" to finalize your order',
				'Cancel,Confirm'
			);
		},150);
	}).on("touchmove",function(){
		clearTimeout(orderTimer);
	});
	$("#delOpts").on("touchstart",".delLoc",function(){
		if($(this).index()==0){
			switchSlides(1,2);	
			$("#deleteAddress").hide();
			clearAddressForm();
		}
		else{
			address.addrNick=$(this).text().substr(4);//ie placeholder
			$("#addressTo").val(address.addrNick).removeClass("redBrdr placeholder");
			switch(addrRtrnTo){
				case "selectPizza":	switchSlides(1,0);
				break;
				case "account": switchSlides(1,7);
				break;
			}
		}
	}).on("mousedown",".editButton",function(){
		$(this).parent().attr("name","editClick");
	}).on("mouseup",".editButton",function(){
		$(this).parent().removeAttr("name");
	}).on("touchstart",".editButton",function(e){
		e.stopPropagation();
		switchSlides(1,2);
		//code for filling in fields
		var addrNick=$(this).parent().text().substr(4);
		$("#addrNick").val(addrNick);
		var loaderClone=$(loader).clone();
		$(loaderClone).addClass("bigLoader");
		var blockChanges="#addr,#addr2,#city,#state,#zip,#phone";
		$(blockChanges).attr("readonly","1");
		$("#deliveryLoc>.infoWrapper").css("opacity","0.5").prepend(loaderClone);
		$.getJSON(host+"DeliveryOpts.php?addrNick="+addrNick,function(data){
			$("#addr").val(data.addr);
			$("#addr2").val(data.addr2);
			$("#city").val(data.city);
			$("#state").children("option").removeAttr("selected").each(function(index, element) {
                if($(element).val()==data.state){
					$(element).attr("selected","selected");	
				}
            });
			$("#zip").val(data.zip);
			$("#phone").val(data.phone);
			$("#deleteAddress").show();
			makeActive("#deliveryLoc>.infoWrapper",blockChanges);
		}).error(function(){
			makeActive("#deliveryLoc>.infoWrapper",blockChanges);
			$("#deleteAddress").show();
		});
	});
	$("body").on("touchstart","#overlay",function(e){
		$("#menuOptions").hide();
		$("#overlay").remove();		
	});
}
function makeActive(cntnrStr,rdOnlyStr){
	$(rdOnlyStr).removeAttr("readonly");
	$(cntnrStr).animate({opacity:1},300);
	$("#loader").remove();
}
function getDeliveryOpts(){
	$.getJSON(host+"DeliveryOpts.php",function(data){
		if(data!=null){
			$(".delLoc:not(:first)").remove();
			$.each(data,function(index,value){
				$("#delOpts").append('<div class="next bigRed delLoc"><div class="editButton">EDIT</div>'+value+'</div>');
			});
			checkCustomScrolling();
		}
	});
}
function deletePizza(indSel){
	if(indSel==2){
		var pizName=$(pizzaToDelete).children("h4").text();
		pizName=pizName.substr(0,pizName.length-1);
		if(typeof additionalPizzas[pizName] != "undefined"){
			delete(additionalPizzas[pizName]);
		}
		$(pizzaToDelete).remove();
		if($(".removePizza").length==0){
			$("#delTxt").hide();	
		}		
	}
}
function orderError(theError){
	$("#orderErrorOccurred").remove();
	$("#orderOptions>.bigRed:first").after("<div id='orderErrorOccurred'><span class='cRed'>"+(typeof theError!="undefined" ? theError:"Order failed. Please try again later.")+"</span></div>");
}
function addTopping(theID){
	switch(theID.substr(0,2)){
		case "pe":
			toppingsOnOff("pe","Pepperoni",theID,2);
		break;
		case "sa":
			toppingsOnOff("sa","Sausage",theID,3);
		break;
		case "p3":
			toppingsOnOff("p3","Peppers",theID,4);
		break;
		case "ol":
			toppingsOnOff("ol","Olives",theID,5);
		break;
		case "on":
			toppingsOnOff("on","Onion",theID,6);
		break;
		case "mu":
			toppingsOnOff("mu","Mushroom",theID,7);
		break;
	}
}
function finalOrderConfirmation(indexSel){
	$("#loader").remove();
	$("#pickSpot").css("opacity",1);
	$("#orderErrorOccurred").remove();
	if(indexSel==2){
		var newLoader=$(loader).clone();
		$("#pickSpot").css("opacity",0.8);
		$("#pickSpot").append($(newLoader).addClass("bigLoader"));
		var pizzaOrderInfo={RestaurantID:$(theSelection).attr("data-restID"),
							TrayOrder:$(theSelection).attr("data-order"),
							AddressName:$("#addressTo").val(),
							Price:$(theSelection).children(".fR").text()};
		if($("#couponCode").val()!=""){
			pizzaOrderInfo.Coupon=$("#couponCode").val();
		}
		$.post(host+"PlaceOrder.php",pizzaOrderInfo,function(data){			
			$("#loader").remove();
			$("#pickSpot").css("opacity",1);
			try{
				data=$.parseJSON(data);
				if(typeof data.error=="undefined"){
					switchSlides(6,8);
					$("#refNum").text(data.refnum);
					$("#successID").text(data.cs_order_id);
					if(typeof data.discAmt!="undefined"){
						$("#discAmt").text(data.discAmt);
						$("#discAmtWrapper").show();	
					}
					else{
						$("#discAmtWrapper").hide();
					}
				}
				else{
					orderError(data.error);
				}
			}
			catch(er){
				orderError();
			}
		}).error(function(){
			orderError();
		});
	}
}
function toppingsOnOff(theSmallID,topping,theID,topID){
	if($("#"+theSmallID).length==0){
		$("#someToppings").append("<li id='"+theSmallID+"' data-topping='"+topID+"'>"+topping+"</li>");
		$("#"+theID).addClass(theSmallID+"Select");
	}
	else{
		if(theSmallID=="ch"){
			return;
		}
		$("#"+theSmallID).remove();
		$("#"+theID).removeClass(theSmallID+"Select");
	}
}
function orderPizzaPage(curSlide){
	$("#noRests").parent().remove();
	$("#noPizzas").remove();
	//ie
	if(address.addrNick!="" && address.addrNick!="ADDRESS"){
		$("#addressTo").removeClass("redBrdr");	
	}
	else{
		navigator.notification.alert("Please select or create a new delivery address.",function(){},"No location set","Okay");
		$("#addressTo").addClass("redBrdr");
		return false;	
	}
	if($("input[name^=q]").length==0){
		navigator.notification.alert("Please add at least 1 pizza to order.",function(){},"No pizza added","Okay");
		$("#addressTo").parent("div").after("<div class='cRed' id='noPizzas'>Please add at least 1 pizza to order</div>");	
		return false;
	}
	if(!loggedIn){
		switchSlides(0,3);	
	}
	else{
		if($("#cNum").val()==""){
			if(typeof curSlide!="undefined"){
				switchSlides(curSlide,5);	
			}
			else{
				switchSlides(0,5);
			}
			cardReturnTo="order";
			return false;	
		}
		if($("#cardInfo").css("display")!="none"){
			switchSlides(5,6);
		}
		else{
			switchSlides(0,6);
		}
		$(".orderOpt").parent("div").remove();
		$("#orderOptions").children("div:first").after($(loader).clone());
		pizzasString="";
		$("[name^=q]").each(function(index, element) {
            pizzasString+=$(element).attr("name").substr(1)+"q"+$(element).val()+",";
        });
		pizzasString=pizzasString.substr(0,(pizzasString.length-1));
		localStorage.setItem("LastAddress",address.addrNick);
		$.getJSON(host+"FindPizzaPlaces.php?PizzaID="+pizzasString+"&AddressName="+address.addrNick,function(data){
			$("#loader").remove();
			if(typeof data.error=="undefined"){				
				$.each(data,function(index,value){
					$("#orderOptions").append("<div><h4 class='orderOpt' data-order='"+value.Tray_Order+"' data-restID='"+value.RestaurantID+"'>"+value.Rest_Name+"<span class='fR pl10'>$"+value.Total_Price+"</span></h4></div>");
				});
				$("#couponCodeDiv").show();
				checkCustomScrolling();
			}
			else{
				$("#couponCodeDiv").hide();
				$("#orderOptions").append("<div><h4 id='noRests'>"+data.error+"</h4></div>");
			}
		}).error(function(){
			$("#loader").remove();
			$("#orderOptions").append("<div><h4 id='noRests'>Unknown error occurred. Please try again in a couple of minutes.</h4></div>");
		});	
	}
	return true;
}	
function setNewAddress(){
	address.addr=$("#addr").val();
	//ie
	if($("#addr2").val()=="Address Line 2"){
		$("#addr2").val("");
	}
	address.addr2=$("#addr2").val();
	address.city=$("#city").val();
	address.zip=$("#zip").val();
	address.state=$("#state").val();
	address.phone=$("#phone").val();
	address.addrNick=$("#addrNick").val();
	for(var i in address){
		if(i!="addr2"){
			failedCheck=emptyLine(address[i],i);
		}
		if(failedCheck){
			return false;
		}
	}
	if(isNaN(address.zip)){
		$("#zip").addClass("redBrdr");
		return false;	
	}
	switch(addrRtrnTo){
		case "selectPizza":	switchSlides(2,0);
		$("#addressTo").val($("#addrNick").val()).removeClass("redBrdr");
		break;
		case "account": switchSlides(2,7);
		break;
		case "card":switchSlides(3,6);
		$("#noCards").remove();
		break;
	}
	if(loggedIn){
		$.post(host+"SetAddress.php",address,function(data){
			getDeliveryOpts();	
		});	
	}
}
function deleteAddress(){
	$.post(host+"DeleteAddress.php",{"addrNick":$("#addrNick").val()});
	$(".delLoc").each(function(index, element) {
        if($(element).text().substr(4)==$("#addrNick").val()){
			$(element).remove();	
		}
    });
	clearAddressForm();
	switchSlides(2,1);
}
function clearAddressForm(){
	$("#addr,#addr2,#addrNick,#zip,#phone,#city").val("");	
}
function emptyLine(addrLine,addrID){
	if(addrLine==""){
		$("#"+addrID).addClass("redBrdr");
		return true;
	}
	else{
		$("#"+addrID).removeClass("redBrdr");
		return false;
	}
}
function selectAddress(active){
	$("#addressTo").blur();
	if($("#delOpts").children(".delLoc").length==1){
		switchSlides(active,2);
	}
	else{
		switchSlides(active,1);
	}
}
function logIn(theDiv){
	$(theDiv).append($(loader).clone());
	var PW=document.getElementById('pWordLogIn').value;
	var email=document.getElementById('emailLogIn').value;
	var userAndPW="Email="+email+"&Password="+PW;
	$.post(host+"Login.php",userAndPW,function(data){
		loader=$("#loader").remove();
		if(!isNaN(data.substr(0,1))){
			$("#badLogin").remove();
			switch(parseInt(data)){
				case 401:$("#pWordLogIn").parent("div").after("<div id='badLogin' class='cRed'>Invalid email or password</div>");
				break;
				default: 
				loggedIn=1;
				$("#orderText,#createText").toggle();
				getDeliveryOpts();
				getPizzaList();	
				getCardInfo();
				showUserInfo(data);
				addUserPizza();
				if(!orderPizzaPage(4)){
					switchSlides(4,0);
				}
				else{
					switchSlides(4,7);
				}
				break;
			}
		}
	}).error(function(){
		loader=$("#loader").remove();
		$("#pWordLogin").parent("div").after("<div id='badLogin' class='cRed'>Invalid email or password</div>");
	});
}
function createAccount(theDiv){
	var PW=document.getElementById('pWord').value;
	var email=document.getElementById('emailAdd').value;
	var fName=document.getElementById('fName').value;
	var lName=document.getElementById('lName').value;
	var info="Email="+email+"&Password="+PW+"&fName="+fName+"&lName="+lName;
	$(theDiv).append($(loader).clone());
	$.post(host+"CreateAccount.php",info,function(data){
		loader=$("#loader").remove();
		if(!isNaN(data)){
			loggedIn=1;
			$("#orderText,#createText").toggle();
			$("#emailAdd").removeClass("redBrdr");
			var dVal=$("#addressTo").val();
			if(dVal.length==0 || dVal=="ADDRESS"){
				switchSlides(3,0);
			}
			else{//should be tested
				switchSlides(3,5);//check me
				cardReturnTo="order";
				$.post(host+"SetAddress.php",address);
				addUserPizza();
				getUserInfo();
				getCardInfo();
				getDeliveryOpts();
			}
		}
		else{
			$("#emailAdd").addClass("redBrdr");
		}
	});			
}
function addUserPizza(){//same pizza different name doesn't get added to array, how to handle?
	if(!loggedIn){
		toppings=currentToppings();
		if(typeof additionalPizzas[$("#pizzaName").val()] == "undefined"){
			additionalPizzas[$("#pizzaName").val()]=toppings;
		}
		return false;
	}
	//multiple pizzas on first sign up
	//if pizza isn't saved by the time the order button is clicked (maybe just use loading icon on pizza)
	if(typeof additionalPizzas != "undefined" && !$.isEmptyObject(additionalPizzas)){
		//add the additional pizzas	and update the numbers
		var count = 0;
		for (k in additionalPizzas){
			count++;
		}
		var theCount=0;
		$.each(additionalPizzas,function(index,value){
			$.post(host+"CreatePizza.php",{"Toppings":value,"PizzaName":index},function(data){
				if(theCount==(count-1)){
					populatePizzaList($.parseJSON(data));	
				}
			});
			theCount++;	
		});
		delete(additionalPizzas);
		return false;
	}
	if(($("#pizzaName").attr("name")=="" || typeof $("#pizzaName").attr("name")=="undefined") && $("#pizzaName").val()!=""){//name is the pizzaid, if no pizza id, needs to be saved
		toppings=currentToppings();
		//validate pizzaname
		$.post(host+"CreatePizza.php",{"Toppings":toppings,"PizzaName":$("#pizzaName").val()},function(data){
			populatePizzaList($.parseJSON(data));	
		});	
	}
}
function currentToppings(){
	toppings="";
	$("#someToppings").children("li").each(function(index, element) {
		toppings+=$(element).attr("data-topping")+",";
	});
	toppings=toppings.substr(0,toppings.length-1);
	return toppings;
}
function getPizzaList(){
	$.getJSON(host+"GetUserPizzas.php",function(data){
		if(data!=null){
			populatePizzaList(data);
		}
	}).error(function(){
		populatePizzaList({});
	});
}
function populatePizzaList(data){
	$("#pizzaID").children("option:not([value=9]):not([value=2])" ).remove();
	if($("[name=qUpdate]").length>1){
		var qLength=$("[name=qUpdate]").length-1;	
	}
	$.each(data,function(index,value){
		//relies on most recent pizza being the highest num, also on only one pizza being added at a time (so should use swirly loader)
		if(parseInt(value.PizzaID)!=2 && parseInt(value.PizzaID)!=9){
			$("#pizzaID").append("<option value='"+value.PizzaID+"' data-toppings='"+value.Toppings+"'>"+value.PizzaName+"</option>");
			if(typeof qLength !="undefined"){
				if($("#pizzaName").val()==value.PizzaName){
					$("#pizzaName").attr("name",value.PizzaID);
				}
				$("[name=qUpdate]:eq("+qLength+")").attr("name","q"+value.PizzaID);
				qLength--;
			}		
			else{
				if(value.PizzaName==$("#pizzaName").val()){
					$("#pizzaName").attr("name",value.PizzaID);	
					$("[name=qUpdate]").attr("name","q"+value.PizzaID);
				}
			}
		}
		//ie
		if(index==0){
			$("#pizzaName").removeClass("placeholder");	
		}
	});
	$("#pizzaID").append("<option selected></option>");	
}
function addCard(){
	if($(".tipSelected").length==0){
		return false;
	}
	$("#cNum").removeClass("redBrdr");
	cardData=new Object();
	cardData.csc=$("#csc").val();
	cardData.cardNum=$("#cNum").val();
	cardData.expMo=$("#expMo").val();
	cardData.expYr=$("#expYr").val();
	cardData.zip=$("#cardZip").val();
	cardData.TipAmount=$(".tipSelected").text();
	if(cardData.cardNum.indexOf("*")!=-1){
		$("#cNum").addClass("redBrdr");
		return false;	
	}
	$("#noCards").remove();
	$("#addCardButton").append($(loader).clone());
	$.post(host+"Card.php",cardData,function(data){
		$("#loader").remove();
		switch(data){
			case "":switch(cardReturnTo){
				case "account": switchSlides(5,7);
				break;
				case "order": orderPizzaPage();
				break;	
			}
			break;
			case "address": addrRtrnTo="card";
				$("#cardInfo>.infoWrapper:first>div:last").after("<div class='cRed' id='noCards'>Please make sure one of your addresses matches your <span onclick=\"switchSlides($('section:visible').index(),3); clearAddressForm();\" class='u pntr'>billing address.</span></div>");
			break;
			default: 
				var errorLoc=$("#cardInfo>.infoWrapper:first>div:last");
				if(data.indexOf("OrdrinException")!=-1){
					$(errorLoc).after("<div class='cRed' id='noCards'>Error: Please re-enter card information and try again.</div>");
				}
				else{
					$(errorLoc).after("<div class='cRed' id='noCards'>Error: "+data+"</div>");
				}
			break;
		}
	});
}
function changePizza(theChoice){
	theOpt=$("#pizzaID option[value="+$(theChoice).val()+"]");
	$("#pizzaName").attr("name",$(theChoice).val()).val($(theOpt).text());
	$("#someToppings > li:not(:first)").remove();
	$(".topping:not(.chSelect)").attr("class","topping");
	if($(theChoice).val()!=""){
		pizTop=$(theOpt).attr("data-toppings").split(",");
		$.each(pizTop,function(ind,top){
			if(top=="Peppers" && $("#p3ppersTopping").attr("class").indexOf("Select")==-1){
				addTopping("p3ppersTopping");
			}
			else{
				top=top.toLowerCase();
				if($("#"+top+"Topping").attr("class").indexOf("Select")==-1){
					addTopping(top+"Topping");
				}
			}
		});
	}	
}
function updateCard(){
	switchSlides(7,5);
	cardReturnTo="account";	
}
function getCardInfo(){
	$.getJSON(host+"Card.php",function(data){	
		if(data.First.cc_last5!=""){
			$("#cNum").val("****"+data.First.cc_last5);
			$("#accntCard").html(data.First.type+" "+data.First.cc_last5+$("#accntCard").html().substring($("#accntCard").html().indexOf("<")));
			$("#expMo").val(data.First.expiry_month);
			$("#expYr").val(data.First.expiry_year);
			$("#cardZip").val(data.First.bill_zip);		
		}
	});
}
function viewAddresses(){
	addrRtrnTo="account";
	selectAddress(7);	
}
function getUserInfo(){
	$.get(host+"CheckAccount.php",function(data){
		showUserInfo(data);
	});
}
function showUserInfo(data){
	$("#yourEmail").empty().prepend(data.substring(1,data.indexOf(",")));
	$("#nameChange").prepend(data.substring(data.indexOf("/")+1,data.indexOf("["))).prepend(data.substring(data.indexOf(",")+1,data.indexOf("/"))+" ");	
	$("#welcome").html("Welcome, "+data.substring(data.indexOf(",")+1,data.indexOf("/")));
	//C=cash 1=15% 2=20%
	switch(data.substr(data.indexOf("[")+1,1)){		
		case "1": $(".tip:eq(0)").addClass("tipSelected");
		break;
		case "2": $(".tip:eq(1)").addClass("tipSelected");
		break;
		case "C": $(".tip:eq(2)").addClass("tipSelected");
		break;
	}
}
function leftPizza(){
	pizzaIndex=document.getElementById("pizzaID").selectedIndex;
	numOptions=$("#pizzaID").children("option").length;
	if(pizzaIndex==0){
		changePizza($("#pizzaID").children("option:last").attr("selected","selected"));
		$("#pizzaID").children("option:not(:last)").removeAttr("selected");
	}
	else{
		changePizza($("#pizzaID").children("option:eq("+(pizzaIndex-1)+")").attr("selected","selected"));
		$("#pizzaID").children("option:not(:eq("+(pizzaIndex-1)+"))").removeAttr("selected");
	}
	if(pizzaIndex==0 || numOptions==1){
		$("#pizzaToppings,.tapAddTxt").show();
		$("#pizzaName").show();
		$("#savedPizzaName").hide();
	}
	else{
		$("#pizzaToppings,.tapAddTxt").hide();
		$("#pizzaName").hide();
		$("#savedPizzaName").show();
	}	
	$("#savedPizzaName").text($("#pizzaName").val());
}
function rightPizza(){
	pizzaIndex=document.getElementById("pizzaID").selectedIndex;
	numOptions=$("#pizzaID").children("option").length;
	if(numOptions==(pizzaIndex+1)){
		changePizza($("#pizzaID").children("option:first").attr("selected","selected"));
		$("#pizzaID").children("option:not(:first)").removeAttr("selected");
	}
	else{
		changePizza($("#pizzaID").children("option:eq("+(pizzaIndex+1)+")").attr("selected","selected"));
		$("#pizzaID").children("option:not(:eq("+(pizzaIndex+1)+"))").removeAttr("selected");
	}
	if((pizzaIndex+2)==numOptions || numOptions==1){
		$("#pizzaToppings,.tapAddTxt").show();
		$("#pizzaName").show();
		$("#savedPizzaName").hide();
	}
	else{
		$("#pizzaToppings,.tapAddTxt").hide();
		$("#pizzaName").hide();
		$("#savedPizzaName").show();
	}
	$("#savedPizzaName").text($("#pizzaName").val());
}
function switchSlides(active,newSlide,backButton){
	prevSlide=active;
	if(typeof backButton=="undefined"){
		lastSlides.push(prevSlide);
	}
	$("section").hide().eq(newSlide).show();
	window.scrollTo(0,0);
	//iphone only
	checkCustomScrolling();
	document.activeElement.blur();
    $("input").blur();
	//iphone	
}
function checkCustomScrolling(){
	var visiSct=$("section:visible");
	var lastDiv=$("section:visible>div:visible:last");
	if($(lastDiv).position().top>=$(visiSct).children("header").height() && ($(lastDiv).position().top+$(lastDiv).height())>$(visiSct).children("footer").position().top){
		if($(visiSct).has(".aSlider").length==0){
			createCustomScroller(visiSct);
		}
	}
	/*else if($(visiSct).has(".aSlider").length!=0){
		$(visiSct).find(".aSlider").unwrap().unwrap().remove();
	}*/
}
function createCustomScroller(sctnForScroller){
	$(sctnForScroller).children("div,h2").wrapAll("<div id='custom-scrollbar-wrapper"+scrollBarNmbr+"' class='ovrFlwHide' />").wrapAll("<div id='custom-scrollbar-content"+scrollBarNmbr+"' class='clearFix' />");
	$("#custom-scrollbar-content"+scrollBarNmbr).append('<div class="h380 aSlider nD"><div class="h380 pntr"><div id="custom-scrollbar-slider'+scrollBarNmbr+'" style="position: relative; top: 3px;" class="ui-draggable"></div></div></div>');
	customScrolling('custom-scrollbar-wrapper'+scrollBarNmbr,'custom-scrollbar-content'+scrollBarNmbr,'custom-scrollbar-slider'+scrollBarNmbr);
	scrollBarNmbr++;
}
function customScrolling(theContainer,innerContainer,sliderHandle){
	$("#"+sliderHandle).draggable({scroll:false,axis:"y",containment:"parent",drag:function(e,u){ 
		$("#"+innerContainer).css("margin-top",(-$("#"+innerContainer).height()*(u.position.top/$(".aSlider:first").height()))+"px");}
	});
	$("#"+theContainer).on("touchstart",function(e){
		initY=e.originalEvent.touches[0].pageY;
	}).on("touchmove",function(e){
		e.preventDefault();
		var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
		//var elm = $(this).offset();
		var y = touch.pageY;
		if(lastY!=0 && Math.abs(y-initY)>30){
			touchStarted=true;
			scrollDiv(e,(y-lastY),"#"+innerContainer,"#"+sliderHandle,1,$(".aSlider:first").height());
		}
		lastY=y;
	}).on("touchend",function(e){
		if(touchStarted){
			e.preventDefault();
			e.stopPropagation();
			touchStarted=false;
		}
	}).mousewheel(function(e){
		scrollDiv(e,e.originalEvent.wheelDelta,"#"+innerContainer,"#"+sliderHandle,0,$(".aSlider:first").height());
	});
	$("#"+theContainer).on("touchstart",".aSlider",function(e){
		e.stopPropagation();
		if(typeof timeoutId!="undefined"){
			clearInterval(timeoutId);
		}
		if (!e.offsetY) {
			offY = e.pageY - $(e.target).offset().top;
		}
		else{
			offY=e.offsetY;
		}
		timeoutId=setInterval("clickScroll("+offY+",'"+innerContainer+"','#"+sliderHandle+"',"+$(".aSlider:first").height()+")",30);
	});
	$(document).on("touchend",function(e){
		if(typeof timeoutId!="undefined"){
			clearInterval(timeoutId);
		}
		$("#"+sliderHandle).stop(true);
	});
}
function scrollDiv(e,upOrDown,innerContainer,sliderHandle,touch,sliderHeight){
	e.preventDefault();
	e.stopPropagation();
	var iContMrgnTop=parseInt($(innerContainer).css("margin-top"),10);
	var heightAdj=sliderHeight-$("footer:first").height()-20;
	if(upOrDown<0){
		if((iContMrgnTop-(heightAdj))>-$(innerContainer).height()){
			$(innerContainer).css({"margin-top":"-="+(touch ? "15":"30")+"px","padding-bottom":"+="+(touch ? "15":"30")+"px"});
		}
	}
	else{
		if((iContMrgnTop+(heightAdj))<=(heightAdj-1)){
			$(innerContainer).css({"margin-top":"+="+(touch ? "15":"30")+"px","padding-bottom":"-="+(touch ? "15":"30")+"px"});
		}
	}
	adjustSlider(iContMrgnTop,innerContainer,sliderHandle,sliderHeight);	
}
function clickScroll(theOffset,innerContainer,sliderHandle,sliderHeight){
	$(sliderHandle).stop(true);
	var sliderPosition=parseInt($(sliderHandle).css("top"),10);
	if(theOffset>sliderPosition){
		if(sliderPosition<sliderHeight && sliderPosition!=theOffset){
			$(sliderHandle).css("top","+=1");
			$("#"+innerContainer).css("margin-top",(-($("#"+innerContainer).height()/sliderHeight)*parseInt($(sliderHandle).css("top"),10))+"px");
		}
	}
	else{
		if(sliderPosition>0 && sliderPosition!=theOffset){
			$(sliderHandle).css("top","-=1");
			$("#"+innerContainer).css("margin-top",(-($("#"+innerContainer).height()/sliderHeight)*parseInt($(sliderHandle).css("top"),10))+"px");
		}
	}					
}
function adjustSlider(iContMrgnTop,innerContainer,sliderHandle,sliderHeight){
	var slidePixels=-(iContMrgnTop/$(innerContainer).height())*sliderHeight;
	var handleHt=$(sliderHandle).height();
	// + or - height of slider 
	if(slidePixels<handleHt){
		slidePixels=0;
	}
	if(slidePixels>(sliderHeight-handleHt)){
		slidePixels=(sliderHeight-handleHt);
	}
	$(sliderHandle).css("top",slidePixels+"px"); 
}
function onMenuKeyDown(){
	var mO=$("#menuOptions");
	$(mO).toggle().children("li").show();
	if($("#overlay").length==0){
		$("body").append("<div id='overlay'></div>");
	}
	else{
		setTimeout("$('#overlay').remove()",400);
	}
	if(typeof loggedIn=="undefined" || !loggedIn){
		$(mO).children("li:eq(1)").hide();	
	}
	switch($("section:visible").index()){
		case 0: $(mO).children("li:eq(0)").hide();
		break;
		case 7: $(mO).children("li:eq(1)").hide();
		break;
		case 9:  $(mO).children("li:eq(3)").hide();
		break;
		case 10: $(mO).children("li:eq(2)").hide();
		break;
	}
}
function onBackButton(){
	$("#menuOptions").hide();
	$("#overlay").remove();
	if(lastSlides.length!=0){
		switchSlides($("section:visible").index(),lastSlides.pop(),1);
	}
	else{
		navigator.app.exitApp();	
	}
}
(function(a){a.fn.mousewheel=function(a){return this[a?"on":"trigger"]("wheel",a)},a.event.special.wheel={setup:function(){a.event.add(this,b,c,{})},teardown:function(){a.event.remove(this,b,c)}};var b=a.browser.mozilla?"DOMMouseScroll"+(a.browser.version<"1.9"?" mousemove":""):"mousewheel";function c(b){switch(b.type){case"mousemove":return a.extend(b.data,{clientX:b.clientX,clientY:b.clientY,pageX:b.pageX,pageY:b.pageY});case"DOMMouseScroll":a.extend(b,b.data),b.delta=-b.detail/3;break;case"mousewheel":b.delta=b.wheelDelta/120}b.type="wheel";return a.event.handle.call(this,b,b.delta)}})(jQuery);