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
host="http://pizzadelivery.piecewise.com/Final/";
loader=$("<img src='images/loading.gif' id='loader'>");
lastY=0;
dontFocus=false;
$(document).ready(function(e) {
	$(window).on("resize",function(){
		$("html").css("font-size",($(window).width()/5.12)+"%");
	});
	document.addEventListener("menubutton", onMenuKeyDown, false);
	$.get(host+"LoginStatus.php",function(data){
		loggedIn=(data==1 ? true:false);
		if(loggedIn){
			getDeliveryOpts();
			getPizzaList();
			getCardInfo();
			getUserInfo();
			showGear();
		}
	});
	customScrolling("abtContentWrapper","abtContent","aboutSlider");
	customScrolling("legalContentWrapper","legalContent","legalSlider");
	$("[src='images/Gear.png']").on("tap",function(){
		if(loggedIn){
			if($(this).parentsUntil("section").parent("section").index()!=7){
				switchSlides($(this).parentsUntil("section").parent("section").index(),7);
			}
		}
	});
	$(".aChev").on("tap",function(){
		switchSlides($(this).parentsUntil("section").parent("section").index(),prevSlide);
	});
	$("#pRight").on("tap",function(){
		rightPizza();
	});
	$("#pLeft").on("tap",function(){
		leftPizza();	
	});
	$(".tip").on("tap",function(){
		$(".tipSelected").removeClass("tipSelected");
		$(this).addClass("tipSelected");		
	});
	$("#orderSummary").on("tap",".removePizza",function(){
		var pizName=$(this).prev("input").prev("h4").text();
		pizName=pizName.substr(0,pizName.length-1);
		if(typeof additionalPizzas[pizName] != "undefined"){
			delete(additionalPizzas[pizName]);
		}
		$(this).parent().remove();
		dontFocus=true;
		setTimeout("dontFocus=false",400);
	});
	$("#addPizza.ribbon").on("tap",function(){
		//fix bug where pizza can have same name and different toppings
		thePiz=$("#pizzaName");
		//ie
		if($(thePiz).val()=="" || $(thePiz).val=="Enter Name"){
			$("#pizzaName").addClass("redBrdr");
			return false;
		}
		$(thePiz).removeClass("redBrdr");		
		if($("#pizzaID").children("option").length!=0){
			$("#pizzaID").children("option").each(function(index, element) {
				if($("#pizzaName").val()==$(element).text()){
					if(loggedIn){
						if($("[name=q"+thePiz.attr("name")+"]").length!=0){
							$("[name=q"+thePiz.attr("name")+"]").val(parseInt($("[name=q"+thePiz.attr("name")+"]").val())+1);
						}
						else{
							$("#pizzaName").parent("div").after("<div><h4>"+thePiz.val()+":</h4><input type='text' value='1' class='w40' name='q"+thePiz.attr("name")+"'><div class='removePizza'><div class='stretchX'>X</div></div></div>");
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
									$("#pizzaName").parent("div").after("<div><h4>"+$(element).text()+":</h4><input type='text' value='1' class='w40' name='qUpdate'><div class='removePizza'><div class='stretchX'>X</div></div></div>");
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
							$("#pizzaName").parent("div").after("<div><h4>"+thePiz.val()+":</h4><input type='text' value='1' name='qUpdate'></div>");
						}
					}
				}
			});
		}
		else{//first time user
			addUserPizza();
			$("#pizzaName").parent("div").after("<div><h4>"+thePiz.val()+":</h4><input type='text' value='1' name='qUpdate'></div>");
			notLoggedInToppings="";
			$("#someToppings").children("li").each(function(index, element) {
                notLoggedInToppings+=$(element).text()+",";
            });
			notLoggedInToppings=notLoggedInToppings.substr(0,notLoggedInToppings.length-1);
			$("#pizzaID").append("<option data-toppings='"+notLoggedInToppings+"'>"+$("#pizzaName").val()+"</option>");
		}
	});
	$("#pizzaID").on("change",function(){
		changePizza(this);
	});
    $("#pizzaToppings").on("tap",".topping:not(#cheeseTopping):not(#pRight):not(#pLeft)",function(){
		//$("#pizzaName").val("").attr("name","");
		theID=$(this).attr("id");
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
	});
	$("#orderOptions").on("tap",".orderOpt",function(){
		$("#confirmOrder").empty().append($(this).html());
		var theSelection=this;
		$("#confirmOrder").dialog({modal:true,
			buttons : [
				{
					text:"Cancel",
					click:function() {
						$(this).dialog("close");
					},
					"class":"cOrange"
				},			
				{
					text:"Confirm",
					click:function(){
						$("#confirmOrder").empty().append($(loader).clone());
						$.post(host+"PlaceOrder.php",{"RestaurantID":$(theSelection).attr("data-restID"),"TrayOrder":$(theSelection).attr("data-order"),"AddressName":$("#addressTo").val(),"Price":$(theSelection).children(".fR").text()},function(data){
							switchSlides(6,8);
							data=$.parseJSON(data);
							$("#refNum").text(data.refnum);
							$("#successID").text(data.cs_order_id);
							$("#confirmOrder").dialog("close");
						});
						
					},
					"class":"cRed"
				}
			]
		});
	});
	$("#delOpts").on("tap",".delLoc",function(){
		if($(this).index()==0){
			switchSlides(1,2);	
			$("#deleteAddress").hide();
			$("#addr,#addr2,#addrNick,#zip,#phone,#city").val("");
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
	}).on("tap",".editButton",function(e){
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
	$(".transBkgd").on("swipeleft",function(){
		leftPizza();
	}).on("swiperight",function(){
		rightPizza();
	});
});
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
		}
	});
}
function toppingsOnOff(theSmallID,topping,theID,topID){
	if($("#"+theSmallID).length==0){
		$("#pizzaCircle").children("ul").append("<li id='"+theSmallID+"' data-topping='"+topID+"'>"+topping+"</li>");
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
	if(address.addrNick!="" && address.addrNick!="Enter Address"){
		$("#addressTo").removeClass("redBrdr");	
	}
	else{
		$("#addressTo").addClass("redBrdr");
		return false;	
	}
	if($("input[name^=q]").length==0){
		$("#addressTo").parent("div").after("<div class='cRed' id='noPizzas'>Please add at least 1 pizza to order");	
		return false;
	}
	if(!loggedIn){
		switchSlides(0,3);	
	}
	else{
		//addUserPizza(); unnecessary since added every click
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
		$.getJSON(host+"FindPizzaPlaces.php?PizzaID="+pizzasString+"&AddressName="+address.addrNick,function(data){
			$("#loader").remove();
			if(typeof data.error=="undefined"){
				$.each(data,function(index,value){
					$("#orderOptions").append("<div><h4 class='orderOpt' data-order='"+value.Tray_Order+"' data-restID='"+value.RestaurantID+"'>"+value.Rest_Name+"<span class='fR pl10'>$"+value.Total_Price+"</span></h4></div>");
				});
			}
			else{
				$("#orderOptions").append("<div><h4 id='noRests'>"+data.error+"</h4></div>");
			}
		}).error(function(){
			$("#loader").remove();
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
		break;
		case "account": switchSlides(2,7);
		break;
	}
	$("#addressTo").val($("#addrNick").val()).removeClass("redBrdr");
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
	$("#addr,#addr2,#addrNick,#zip,#phone,#city").val("");
	switchSlides(2,1);
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
	if(dontFocus){
		dontFocus=false;
		return;
	}
	$("#addressTo").blur();
	if($("#delOpts").children(".delLoc").length==1){
		switchSlides(active,2);
	}
	else{
		switchSlides(active,1);
	}
}
function logIn(theDiv){
	$(theDiv).append(loader);
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
				getDeliveryOpts();
				getPizzaList();	
				getCardInfo();
				showUserInfo(data);
				showGear();
				if(!orderPizzaPage(4)){
					switchSlides(4,0);
				}
				break;
			}
		}
	}).error(function(){
		loader=$("#loader").remove();
		$("#pWordLogin").parent("div").after("<div id='badLogin' class='cRed'>Invalid email or password</div>");
	});
}
function showGear(){
	$("[src='images/Gear.png']").show();
}
function createAccount(theDiv){
	var PW=document.getElementById('pWord').value;
	var email=document.getElementById('emailAdd').value;
	var fName=document.getElementById('fName').value;
	var lName=document.getElementById('lName').value;
	var info="Email="+email+"&Password="+PW+"&fName="+fName+"&lName="+lName;
	$(theDiv).append(loader);
	$.post(host+"CreateAccount.php",info,function(data){
		loader=$("#loader").remove();
		loggedIn=1;
		showGear();
		if(!isNaN(data)){
			$("#emailAdd").removeClass("redBrdr");
			switchSlides(3,5);//check me
			cardReturnTo="order";
			$.post(host+"SetAddress.php",address);
			addUserPizza();
			getUserInfo();
			getCardInfo();
			getDeliveryOpts();
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
		$.each(additionalPizzas,function(index,value){
			$.post(host+"CreatePizza.php",{"Toppings":value,"PizzaName":index},function(data){
				if(index==(count-1)){
					populatePizzaList($.parseJSON(data));	
				}
			});	
		});
		delete(additionalPizzas);
		return false;
	}
	if($("#pizzaName").attr("name")==""){//name is the pizzaid, if no pizza id, needs to be saved
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
			$("#pizzaToppings,.tapAddTxt").hide();
			populatePizzaList(data);
			rightPizza();
		}
	}).error(function(){
		populatePizzaList({});
	});
}
function populatePizzaList(data){
	$("#pizzaID").children("option:not([value=9]):not([value=2])").remove();
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
	$("#pizzaID").append("<option selected='selected'></option>");	
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
	$.post(host+"Card.php",cardData);
	//if from account
	//if from pizza order
	switch(cardReturnTo){
		case "account": switchSlides(5,7);
		break;
		case "order": orderPizzaPage();
		break;	
	}
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
				$("#p3ppersTopping").tap();	
			}
			else{
				top=top.toLowerCase();
				if($("#"+top+"Topping").attr("class").indexOf("Select")==-1){
					$("#"+top+"Topping").tap();
				}
			}
		});
	}
	else{
		$(".topping:first").tap();
	}	
}
function updateCard(){
	switchSlides(7,5);
	cardReturnTo="account";	
}
function getCardInfo(){
	$.getJSON(host+"Card.php",function(data){		
		$("#cNum").val("****"+data.First.cc_last5);
		$("#accntCard").prepend(data.First.type+" "+data.First.cc_last5);
		$("#expMo").val(data.First.expiry_month);
		$("#expYr").val(data.First.expiry_year);
		$("#cardZip").val(data.First.bill_zip);		
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
	$("#welcome").empty().append("Welcome, "+data.substring(data.indexOf(",")+1,data.indexOf("/")));
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
	}
	else{
		$("#pizzaToppings,.tapAddTxt").hide();
	}	
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
		$("#pizzaName").removeAttr("readonly");
	}
	else{
		$("#pizzaToppings,.tapAddTxt").hide();
		$("#pizzaName").attr("readonly",1);
	}
}
function switchSlides(active,newSlide){
	var sectionHeight=$("section:first").height();
	prevSlide=active;
	if(active<newSlide){
		$("section:eq("+newSlide+")").show(0,function(){
			$("section:eq("+active+")").animate({"margin-top":"-"+sectionHeight+"px"},500,"swing",function(){
				$(this).hide().css("margin-top",0);
			});
		});
	}
	else{
		$("section:eq("+newSlide+")").css("margin-top","-"+sectionHeight+"px").show(0,function(){
			$("section:eq("+newSlide+")").animate({"margin-top":"0px"},500,"swing",function(){
				$("section:eq("+active+")").hide().css("margin-top",0);
			});
		});
	}
}
function customScrolling(theContainer,innerContainer,sliderHandle){
	$("#"+sliderHandle).draggable({scroll:false,axis:"y",containment:"parent",drag:function(e,u){ 
		$("#"+innerContainer).css("margin-top",(-$("#"+innerContainer).height()*(u.position.top/$(".aSlider:first").height()))+"px");}
	});
	$("#"+theContainer).on("touchmove",function(e){
		var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
		var elm = $(this).offset();
		var y = touch.pageY;
		if(lastY!=0){
			scrollDiv(e,(y-lastY),"#"+innerContainer,"#"+sliderHandle,1,$(".aSlider:first").height());
		}
		lastY=y;
	}).on("touchend",function(e){
		e.preventDefault();
		e.stopPropagation();
	}).mousewheel(function(e){
		scrollDiv(e,e.originalEvent.wheelDelta,"#"+innerContainer,"#"+sliderHandle,0,$(".aSlider:first").height());
	});
	$("#"+theContainer).on("mousedown",".aSlider",function(e){
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
	$(document).on("mouseup",function(e){
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
	if(upOrDown<0){
		if((iContMrgnTop-29)>-$(innerContainer).height()){
			$(innerContainer).css({"margin-top":"-="+(touch ? "15":"30")+"px"});
		}
	}
	else{
		if((iContMrgnTop+30)<=29){
			$(innerContainer).css({"margin-top":"+="+(touch ? "15":"30")+"px"});
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
	$("body").append("<div style='position: fixed;bottom: 0;height: 4rem;width: 10rem;background: red;z-index: 100;left: 40%;'><ul><li onclick='switchSlides(0,7); $(this).remove()'>Account info</li></ul></div>");	
}
(function(a){a.fn.mousewheel=function(a){return this[a?"on":"trigger"]("wheel",a)},a.event.special.wheel={setup:function(){a.event.add(this,b,c,{})},teardown:function(){a.event.remove(this,b,c)}};var b=a.browser.mozilla?"DOMMouseScroll"+(a.browser.version<"1.9"?" mousemove":""):"mousewheel";function c(b){switch(b.type){case"mousemove":return a.extend(b.data,{clientX:b.clientX,clientY:b.clientY,pageX:b.pageX,pageY:b.pageY});case"DOMMouseScroll":a.extend(b,b.data),b.delta=-b.detail/3;break;case"mousewheel":b.delta=b.wheelDelta/120}b.type="wheel";return a.event.handle.call(this,b,b.delta)}})(jQuery);