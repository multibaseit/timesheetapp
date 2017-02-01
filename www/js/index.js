var App={
	
	
	
	//INITIALISATION
	
	//Function customisations
	/*
	initialise
	handleBackButton
	authenticateLogin
	loadListData
	buildList
	buildForm
	addFormItems
	submitForm
	validateForm
	processQueue
	uploadImageFile
	*/
	
	//Local storage name prefix
		prefix:'ts',
		
	//Data lifetime value (ms)
		timeout:3600000,
		
	//Persistent variables
		data:{
			list:{},
			map:{},
			//picker:{},
			form:{},
			signature:{},
			photo:{}
		},
		
	//HTML templates for repeaters
		template:{},
		
	//Text strings for prompts and alerts
		message:{
			logOutPrompt:'You will be logged out',
			invalidLogin:'Please enter a valid username and password',
			offlineUpdate:'Your timesheet will be updated next time your device is online',
			itemCompleted:'This timesheet has been completed',
			noItems:'You have no timesheets to be completed',
			updateError:'Your timesheet could not be updated due to a server error',
			noMapAvailable:'Maps are not available for this timesheet',
			noGeolocation:'Maps cannot be used offline or if location services are unavailable',
			googleError:'An error has occurred at Google Maps',
			locationError:'Your location cannot be determined',
			noCamera:'No camera is available',
			noSelection:'Please select a project',
			cancelForm:'Any new entries or changes will not be saved',
			incompleteForm:'You must obtain a signature to save this timesheet',
			incompleteItem:'You must add time to at least one project to save this timesheet'
		},
		
	//Initialise application and show first page
		initialise:function(){
			//iOS status bar
				if(/constructor/i.test(window.HTMLElement))$('body').addClass('ios');
				else if(window.StatusBar)StatusBar.overlaysWebView(false);
			//HTML templates
				App.template.listItem=$('.list_items').html().replace(/\t|\r|\n/gi,'');
				App.template.formItem=$('.form_items').html().replace(/\t|\r|\n/gi,'');
				$('.form_items').html('-data-');
				App.template.itemForm=$('.item_form').html().replace(/\t|\r|\n/gi,'');
				App.template.noteItem=$('.note_list').html().replace(/\t|\r|\n/gi,'');
				App.template.directionStep=$('.directions_list').html().replace(/\t|\r|\n/gi,'');
			//Login form handler
				$('.login_form').on('submit',App.submitLogin);
			//First page
				App.showPage('.login_page');
				//App.loadListData();
				//App.buildForm(0);
		},	
	
	
	
	//UTILITIES
	
	//Show a page
		showPage:function(page,fast){
			if($('.active_page')[0]){
				if(fast){
					$('.active_page').hide();
					$('body').scrollTop(0);
					$('.active_page').removeClass('active_page');
					$(page).show().addClass('active_page');
				}
				else{
					$('.active_page').fadeOut(function(){
						$('body').scrollTop(0);
						$('.active_page').removeClass('active_page');
						$(page).fadeIn(function(){
							$(page).addClass('active_page');
						});
					});
				}
			}
			else $(page).fadeIn(function(){
				$(page).addClass('active_page');
			});
		},
		
	//Display notification or confirmation dialogue
		showMessage:function(args){
			var type=args.type,
				text=args.text;
			if(typeof args.process==='function')process=args.process;
			if(type=='confirm')$('.confirm_button').show();
			else $('.confirm_button').hide();
			$('.error_page span.fa').not('.confirm_buttons span.fa').hide();
			$('.error_page span.icon_'+type).show();
			$('.error_text').html(text.replace(/\.\s\b/gi,'.<br/><br/>'));
			if(window.navigator.vibrate&&type=='error')window.navigator.vibrate(200);
			$('.error_page').removeClass('error confirm warning notification').addClass(type+' active_overlay').fadeIn(function(){
				if(typeof process=='function'&&type!='confirm')(process)();
				$(this).find('.close_button, .confirm_no').off().on('click',function(){
					$('.error_page').removeClass('active_overlay').fadeOut();
				});
				$(this).find('.confirm_yes').off().on('click',function(){
					(process)();
					$('.error_page').removeClass('active_overlay').fadeOut();
				});
			});
		},
		
	//Format date strings
		processDate:function(datetime){
			if(typeof datetime!='object'){
				var s=datetime.split('/');
				datetime=new Date();
				datetime.setFullYear(s[2],parseInt(s[1])-1,s[0]);
			}
			datetime.time=datetime.getTime();
			datetime.dd=parseInt(datetime.getDate());
			datetime.mm=parseInt(datetime.getMonth()+1);
			datetime.yyyy=datetime.getFullYear();
			datetime.hour=((datetime.getHours()<10)?'0':'')+datetime.getHours();
			datetime.min=((datetime.getMinutes()<10)?'0':'')+datetime.getMinutes();
			datetime.dateFormat=datetime.dd+'/'+datetime.mm+'/'+datetime.yyyy;
			datetime.shortDateFormat=datetime.dd+'/'+datetime.mm;
			datetime.timeFormat=datetime.hour+':'+datetime.min;
			var d=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
			datetime.dayFormat=d[datetime.getDay()];
			return datetime;
		},
		
	//Generate natural language last update string from timestamp
		lastUpdateText:function(timestamp){
			var t=new Date().getTime(),
				m=Math.floor((t-timestamp)/60000),
				h=Math.floor((t-timestamp)/3600000),
				d=Math.floor((t-timestamp)/86400000),
				u='a few seconds ago';
			if(d>0)u=(d==1)?'yesterday':d+' days ago';
			else if(h>0)u=h+' hour'+((h>1)?'s':'')+' ago';
			else if(m>0)u=m+' minute'+((m>1)?'s':'')+' ago';
			return u;
		},
		
	//Intercept device back button
		handleBackButton:function(){
			if($('.active_overlay')[0]){
				$('.active_overlay').removeClass('active_overlay').fadeOut();
				return true;
			}
			if($('.login_page').hasClass('active_page')){
				navigator.app.exitApp();
				return true;
			}
			if($('.list_page').hasClass('active_page')){
				App.showMessage({
					type:'confirm',
					text:App.message.logOutPrompt,
					process:App.logOut
				});
				return true;
			}
			if($('.form_page').hasClass('active_page')){
				App.cancelForm();
				return true;
			}
		},
	
	
	
	//LOGIN PAGE
	
	//Submit login form
		submitLogin:function(){
			var fail=false;
			if(!$('#user').val()||!$('#pass').val())fail=true;
			else{
				if(App.authenticateLogin()==true)App.loadListData();
				else fail=true;
			}
			if(fail)App.showMessage({
				type:'error',
				text:App.message.invalidLogin
			});
			return false;
		},
		
	//Validate login credentials
		authenticateLogin:function(){
			return true;
		},
	
	//Log out
		logOut:function(){
			App.showPage('.login_page',true);
		},
	
	
	
	//LIST PAGE
	
	//Load list data from server
		loadListData:function(force){
			if(window.navigator.onLine==true){
				if(new Date().getTime()>parseInt(window.localStorage.getItem(App.prefix+'-update-time'))+App.timeout||
					window.localStorage.getItem(App.prefix+'-update-time')==null||
					window.localStorage.getItem(App.prefix+'-data')==null||
					force==true){
						$.ajax({
							url:'https://www.multibaseit.com.au/ts/timesheet.aspx',
							dataType:'json',
							crossDomain:true,
							data:{
								time:new Date().getTime(),
								method:'get_timesheet',
								user_id:'1'
							},
							timeout:10000,
							success:function(data,status,request){
								App.storeLocalData(data);
							},
							error:function(request,status,error){
								App.showServerError(request,status,error);
							}
						});
				}
				else App.buildList();
			}
			else{
				if(!$('.error_page').hasClass('active_overlay'))App.showMessage({
					type:'warning',
					text:App.message.offlineUpdate,
					process:App.buildList
				});
				else App.buildList();
			}
		},
		
	//Store loaded list data 
		storeLocalData:function(data){
			window.localStorage.setItem(App.prefix+'-data',JSON.stringify(data));
			window.localStorage.setItem(App.prefix+'-update-time',new Date().getTime());
			App.buildList();
		},
		
	//Generate list HTML
		buildList:function(){
			var l=JSON.parse(window.localStorage.getItem(App.prefix+'-data'));
			if(!$.isEmptyObject(l)){
				var i=0,s=App.template.listItem.split('-data-'),h=[],d,t;
				while(i<Object.keys(l.TimeSheet).length){
					d=App.processDate(l.TimeSheet[i].Date);
					d.setHours(0);
					d.setMinutes(0);
					d.setSeconds(0);
					c=(l.TimeSheet[i].ItemStatus)?(' '+l.TimeSheet[i].ItemStatus.toLowerCase()):'';
					t=(l.TimeSheet[i].ItemData)?parseInt(l.TimeSheet[i].ItemData.form_total_value):0;
					h.push(
						s[0]+c+
						s[1]+i+
						s[2]+l.TimeSheet[i].Date+
						s[3]+d.dayFormat.charAt(0)+
						s[4]+d.dayFormat+' '+d.shortDateFormat+
						s[5]+t+' hr'+((t>1||t==0)?'s':'')+
						s[6]
					);
					i++;
				}
				$('.list_date > span').html(l.TimeSheet[0].Day+' '+l.TimeSheet[0].Date);
				$('.list_items').fadeIn().removeClass('filtered').html(h.join(''));
			//Bind events for list items
				$('.list_items .list_item').each(function(){
					$(this).on('click',function(){
						App.buildForm($(this).attr('data-item-index'));
					});
				});
			//Initialise list search + bind search events
				/*$('#search_value').val('');
				$('.search_clear').hide();	
				$('.search_form').on('submit',function(){
					$('#search_value').blur();
					return false;
				});
				$('#search_value').off().on('input',App.filterList).val('');
				$('.search_clear').off().on('click',function(){
					$('#search_value').val('');
					App.filterList();
				});*/
			//Display list update time
				$('.list_update').off().on('click',App.forceListLoad);
				App.updateTime();
				$('.list_update .fa').removeClass('fa-spin');
				App.data.list.timer=setInterval(App.updateTime,60000);
			//Bind close button event
				$('.list_page > .close_button').off().on('click',function(){
					App.showMessage({
						type:'confirm',
						text:App.message.logOutPrompt,
						process:App.logOut
					});
				});
			//Bind list toggle event
				/*$('.list_toggle').off().on('click',function(){
					if($('.list_item.pending,.list_item.submitted')[0]){
						App.data.list.toggled=!App.data.list.toggled;
						App.toggleList();
					}
				});
				App.toggleList();*/
			//Display list page
				$('.list_user').html(l.Name);
				if(!$('.list_page').hasClass('active_page')){
					if($('.error_page').hasClass('active_overlay'))App.showPage('.list_page',true);
					else App.showPage('.list_page');
				}
			//Trigger queued form process
				App.processQueue();
			}
			else if(!$('.error_page').hasClass('active_overlay'))App.showMessage({
				type:'warning',
				text:App.message.noItems
			});
		},
		
	//Display last update time
		updateTime:function(){
			$('.update_time').html(App.lastUpdateText(parseInt(window.localStorage.getItem(App.prefix+'-update-time'))));
		},
		
	//Display server error message
		showServerError:function(request,status,error){
			var a=
				("Request = "+request.responseText)+
				("\nStatus = "+status)+
				("\nError = "+error);
			alert(a);
			App.showMessage({
				type:'error',
				text:App.message.updateError,
				process:App.buildList
			});
		},
		
	//Force reload from server
		forceListLoad:function(){
			if(window.navigator.onLine==true){
				$('.list_update .fa').addClass('fa-spin');
				$('.list_items').fadeOut(function(){
					App.loadListData(true);
				});
			}
			else App.showMessage({
				type:'error',
				text:App.message.offlineUpdate
			});
		},
		
	//Search(filter) list
		filterList:function(){
			var s=$('#search_value')[0].value.trim().toLowerCase();
			if(s.length>1){
				$('.list_items').addClass('filtered');
				$('.list_item').each(function(){
					if($(this).text().toLowerCase().indexOf(s)<0)$(this).removeClass('filtered');
					else $(this).addClass('filtered');
				});
				$('.search_clear').show();
			}
			else{
				$('.list_items').removeClass('filtered');
				$('.filtered').removeClass('filtered');
				$('.search_clear').hide();
			}
		},
		
	//Validate map data
		validateMapData:function(destination){
			if(window.navigator.onLine==false||typeof window.navigator.geolocation!=='object'){
				App.showMessage({
					type:'error',
					text:App.message.noGeolocation
				});
				return;
			}
			var s=destination.split(',');
			if(isNaN(s[0])||isNaN(s[1])){
				App.showMessage({
					type:'error',
					text:App.message.noMapAvailable
				});
				return;
			}
			else{
				App.data.map.destination=destination;
				App.showMapPanel();
			}
		},
		
	//Show and hide map overlay
		showMapPanel:function(){
			$('#map_inner').empty();
			$('.map_icon').addClass('loading');
			$('.active_overlay').removeClass('active_overlay').hide();
			$('.map_page').addClass('active_overlay').fadeIn();
			$('body').addClass('no_scroll');
			$('.map_page .close_button').off().on('click',App.hideMapPanel);
			if(typeof google==='undefined'||typeof google.maps==='undefined'){
				$('body').append('<script type="text/javascript" src="'+$('#google_script').attr('data-src')+'"></script>');
				App.verifyMapScript();
			}
			else App.getGeocode(App.initialiseMap);
		},
		hideMapPanel:function(){
			$('.map_page').removeClass('active_overlay').fadeOut(function(){
				$('body').removeClass('no_scroll');
				$('.map_icon').removeClass('loading');
				$('.map_text_link,.map_directions').hide().removeClass('active');
			});
		},
		
	//Reload Google scripts if unavailable
		verifyMapScript:function(){
			if(typeof google==='object'&&typeof google.maps==='object'){
				App.getGeocode(App.initialiseMap);
			}
			else window.setTimeout(App.verifyMapScript,500);
		},
		
	//Initialise map for directions
		initialiseMap:function(){
			if(!new RegExp('error','gi').test(App.data.map.origin)){
				a=App.data.map.origin.split(',');
				b=App.data.map.destination.split(',');
				var o=new google.maps.LatLng(parseFloat(a[0]),parseFloat(a[1])),
					d=new google.maps.LatLng(parseFloat(b[0]),parseFloat(b[1])),
					r={
						origin:o,
						destination:d,
						travelMode:'DRIVING'
					},
					s=new google.maps.DirectionsService();
				s.route(r,function(response,status){
					if(status=='OK'){
						$('.map_icon').removeClass('loading');
						$('.map_text_link').show().addClass('active');
						var m=new google.maps.Map($('#map_inner')[0],{
								disableDefaultUI:true,
								zoomControl:true,
								streetViewControl:true
							}),
							g=new google.maps.DirectionsRenderer();
						g.setDirections(response);
						g.setMap(m);
						App.getTextDirections(response.routes[0].legs[0]);
					}
					else if($('.map_page.active_overlay')[0])App.showMessage({
						type:'error',
						text:App.message.googleError,
						process:App.hideMapPanel
					});
				});
			}
			else if($('.map_page').hasClass('active_overlay'))App.showMessage({
				type:'error',
				text:App.message.noGeolocation,
				process:App.hideMapPanel
			});
		},
		
	//Get text directions from map result
		getTextDirections:function(directions){
			var h=[],a=App.template.directionStep.split('-data-');
			h.push(
				a[0]+directions.distance.text+' ('+directions.duration.text+')'+
				a[1]+
				a[2]
			);
			for(s in directions.steps){
				h.push(
					a[0]+directions.steps[s].instructions+
					a[1]+directions.steps[s].distance.text+
					a[2]
				)
			}
			$('.directions_list').html(h.join(''));
			$('.map_text_link').off().on('click',function(){
				$(this).toggleClass('active');
				if($(this).hasClass('active'))$('.map_directions').fadeOut();
				else $('.map_directions').fadeIn().scrollTop(0);
			});
		},
		
	//Get geocode from device
		getGeocode:function(process){
			if(typeof window.navigator.geolocation==='object'){
				window.navigator.geolocation.getCurrentPosition(
					function(position){
						App.data.map.origin=position.coords.latitude+','+position.coords.longitude;
						if(typeof process=='function')(process)();
					},
					function(error){
						App.data.map.origin='Error: '+error.message;
						if(typeof process=='function')(process)();
					},
					{
						timeout:20000
					}
				);
			}
			else App.showMessage({
				type:'error',
				text:App.message.locationError
			});
		},
		
	//Add geocode value to form
		setGeocodeFormValue:function(){
			$('#form_geocode_value').val(App.data.map.origin);
			$('.location_check').hide();
			if(App.data.map.origin.indexOf('Error')==0)$('.location_error').show();
			else $('.location_captured').show();
		},
		
	//Toggle submitted list items
		toggleList:function(){
			if(App.data.list.toggled==true)$('.list_page').addClass('list_toggled');
			else $('.list_page').removeClass('list_toggled');
			if($('.list_item.pending,.list_item.submitted')[0])$('.list_toggle').removeClass('inactive');
			else $('.list_toggle').addClass('inactive');
		},
	
	
	
	//FORM PAGE
	
	//Generate item form
		buildForm:function(id){
			var f=JSON.parse(window.localStorage.getItem(App.prefix+'-data')),
				t=f.TimeSheet[parseInt(id)],
				s=App.template.itemForm.split('-data-'),
				h=[];
			if(!!t.ItemData)var d=t.ItemData;
			h.push(
				s[0]+t.Day+
				s[1]+t.Date+
				s[2]+((!!d)?App.addFormItems(t.ItemData.form_items):App.addFormItems())+
				s[3]+((App.data.form.total>=0)?App.data.form.total:0)+
				s[4]+((App.data.form.total>=0)?App.data.form.total:0)+
				s[5]+((!!d&&!!d.form_sign_value.indexOf('data:')==0)?d.form_sign_value:'No signature provided')+
				s[6]+'No photo captured'+
				s[7]+'No annotation entered'+
				s[8]+((!!d&&!!d.form_date_value)?d.form_date_value:t.Date)+
				s[9]+id+
				s[10]+((!!d&&!!d.form_geocode_value)?d.form_geocode_value:'No geocode captured')+
				s[11]+((!!d&&!!d.form_sign_value.indexOf('data:')==0)?'completed':'')+
				s[12]
			);
			$('.item_form').html(h.join(''));
		//Populate static form data
			//App.getGeocode(App.setGeocodeFormValue);
		//Bind events for form items
			$('.item_text').each(function(){
				if($(this).find('.item_code_value').val()=='')$(this).find('.item_code > span').show();
				else $(this).find('.item_code > span').hide();
				App.bindItemChooser($(this));
			});
			$('.item_form .picker_less,.item_form .picker_more').each(function(){
				App.bindItemPicker($(this));
			});
		//Bind item add event
			$('.form_items_add').off().on('click',function(){
				$('.item_picker').removeClass('active');
				$('.form_items').append(App.addFormItems());
				App.bindItemChooser($('.form_item').last().find('.item_text'));
				App.bindItemPicker($('.form_item').last().find('.picker_less'));
				App.bindItemPicker($('.form_item').last().find('.picker_more'));
				$('.form_item').last().find('.item_text').trigger('choose');
			});
		//Bind signature events
			$('#form_sign_button').off().on('click',function(){
				$('.item_picker').removeClass('active');
				App.showSignaturePanel();
			});
			$('.signature_clear').off().on('click',function(){
				App.clearSignaturePanel();
			});
		//Bind camera events
			/*$('#form_photo_button').off().on('click',function(){
				$('.item_picker').removeClass('active');
				App.openCamera();
			});
			$('.photo_clear').off().on('click',function(){
				App.clearPhotoPanel();
			});*/
		//Bind form + submit events
			$('.item_form').off().on('submit',function(){
				return false;
			});
			$('#form_submit_button').off().on('click',App.submitForm);
		//Bind close button event
			$('.form_page > .close_button').off().on('click',App.cancelForm);
		//Display form page
			App.showPage('.form_page');
		},
		
	//Generate HTML for form items
		addFormItems:function(data){
			var s=App.template.formItem.split('-data-'),h=[],t=0;
			if(!!data){
				for(i=0;i<data.length;i++){
					h.push(
						s[0]+''+
						s[1]+data[i].item_code+
						s[2]+data[i].item_name+
						s[3]+i+
						s[4]+i+
						s[5]+data[i].item_code+
						s[6]+''+
						s[7]+0+
						s[8]+data[i].item_quantity+
						s[9]+i+
						s[10]+i+
						s[11]+data[i].item_quantity+
						s[12]
					);
					t+=parseInt(data[i].item_quantity);
				}
				App.data.form.total=t;
			}
			else{
				h.push(
					s[0]+'new'+
					s[1]+''+
					s[2]+'Select project'+
					s[3]+$('.form_item').length+
					s[4]+$('.form_item').length+
					s[5]+''+
					s[6]+'disabled'+
					s[7]+0+
					s[8]+0+
					s[9]+$('.form_item').length+
					s[10]+$('.form_item').length+
					s[11]+0+
					s[12]
					
				);
				App.data.form.total=-1;
			}
			return h.join('');
		},
		
	//Bind events for item chooser
		bindItemChooser:function(chooser){
			$(chooser).on('choose',App.activateItemChooser).on('touchstart mousedown',function(event){
				event.preventDefault();
				$(this).trigger('choose');
			});
		},
		
	//Bind events for item picker
		bindItemPicker:function(picker){
			if($(picker).hasClass('picker_less')){
				$(picker).off().on('less',App.activatePickerLess).on('stop',App.deactivatePicker).on('touchstart mousedown',function(event){
					event.preventDefault();
					$(this).trigger('less');
				}).on('touchend mouseup',function(event){
					event.preventDefault();
					$(this).trigger('stop');
				});
			}
			else{
				$(picker).off().on('more',App.activatePickerMore).on('stop',App.deactivatePicker).on('touchstart mousedown',function(event){
					event.preventDefault();
					$(this).trigger('more');
				}).on('touchend mouseup',function(event){
					event.preventDefault();
					$(this).trigger('stop');
				});
			}
			$(picker).siblings('.picker_quantity').off().on('activate',App.activatePicker).on('touchstart mousedown',function(event){
				event.preventDefault();
				$(this).trigger('activate');
			});
		},
	
	//Activate item chooser for data entry
		activateItemChooser:function(){
			App.data.form.item=$(this);
			App.showListPanel();
		},
		
	//Initialise note panel
		showListPanel:function(){
			$('.active_overlay').removeClass('active_overlay').hide();
			$('.item_picker').removeClass('active');
			$('.picker_active').finish().hide();
			$('.note_page .close_button').off().on('click',function(){
				if($('.note_list li.active').length>0){
					$(App.data.form.item).find('.item_code').html($('.note_list li.active .note_code').text());
					$(App.data.form.item).find('.item_name').html($('.note_list li.active .note_name').text());
					$(App.data.form.item).find('.item_code_value').val($('.note_list li.active .note_code').text());
					$(App.data.form.item).parent().find('.item_picker').removeClass('disabled');
					$('.form_item.new').removeClass('new');
					$('.note_page').fadeOut();
				}
				else{
					$(App.data.form.item).parent().remove();
					App.setPickerTotal();
					if($('.form_item').length==0)$('.form_items').append(App.addFormItems());
					$('.note_page').fadeOut();
				}
			});
			var i=0,h=[],c,
				s=App.template.noteItem.split('-data-'),
				d=JSON.parse(window.localStorage.getItem(App.prefix+'-data'));
			while(i<d.Projects.length){
				h.push(
					s[0]+d.Projects[i].ID+
					s[1]+d.Projects[i].Name+
					s[2]
				);
				i++;
			}
			$('.note_list').html(h.join(''));
			$('.note_list li').each(function(){
				if($(this).find('.note_code').html()==$(App.data.form.item).find('.item_code_value').val())$(this).addClass('active');
				$(this).off().on('click',function(){
					if(!$(this).hasClass('active')){
						$('.note_list li').removeClass('active');
						$(this).toggleClass('active');
					}
					else $('.note_list li').removeClass('active');
				});
			});
			$('.note_page').addClass('active_overlay').fadeIn();
		},
		
	//Activate item quantity picker for data entry
		activatePicker:function(){
			if(!$(this).parent().hasClass('disabled')){
				if(!$(this).parent().hasClass('active')){
					$('.item_picker').removeClass('active');
					$(this).parent().addClass('active');
				}
				else $(this).parent().removeClass('active');
				$('.picker_active').finish().hide();
			}
			else{
				$(this).closest('.form_item').find('.item_text').fadeOut(function(){
					$(this).fadeIn();
				});
			}
		},
		
	//Subtract from item picker quantity
		activatePickerLess:function(){
			$(this).siblings('.item_quantity_value').val(Math.max(0,parseInt($(this).siblings('.item_quantity_value').val())-1));
			var n=parseInt($(this).siblings('.item_quantity_value').val());
			$(this).siblings('.picker_quantity').html(n);
			$(this).siblings('.picker_active').children(0).html(n);
			$(this).siblings('.picker_active').finish().fadeIn(0).show().delay(1000).fadeOut();
			App.setPickerTotal();
			App.data.form.picker=$(this);
			App.data.form.timer=setTimeout(function(){
				$(App.data.form.picker).trigger('less');
			},200);
		},
		
	//Add to item picker quantity
		activatePickerMore:function(){
			var m=parseInt($(this).parent().attr('data-picker-max'))||99;
			$(this).siblings('.item_quantity_value').val(Math.min(m,parseInt($(this).siblings('.item_quantity_value').val())+1));
			var n=parseInt($(this).siblings('.item_quantity_value').val());
			$(this).siblings('.picker_quantity').html(n);
			$(this).siblings('.picker_active').children(0).html(n);
			$(this).siblings('.picker_active').finish().fadeIn(0).show().delay(1000).fadeOut();
			App.setPickerTotal();
			App.data.form.picker=$(this);
			App.data.form.timer=setTimeout(function(){
				$(App.data.form.picker).trigger('more');
			},200);
		},
		
	//Update picker total quantity
		setPickerTotal:function(){
			var t=0;
			$('.item_quantity_value').each(function(){
				t+=parseInt($(this).val());
			});
			$('#form_total_value').val(t);
			$('.total_number').html(t);
		},
		
	//Deactivate repeated addition or subtraction for picker 
		deactivatePicker:function(){
			clearTimeout(App.data.form.timer);
		},
		
	//Show signature overlay - https://github.com/szimek/signature_pad
		showSignaturePanel:function(){
			$('.active_overlay').removeClass('active_overlay').hide();
			$('.signature_page .close_button').off().on('click',function(){
				$('.signature_page').fadeOut(function(){
					if(!App.data.signature.canvas.isEmpty()){
						$('#form_sign_value').val(App.data.signature.canvas.toDataURL());
						App.data.signature.canvas.clear();
						$('#form_sign_button').parent().addClass('completed');
					}
					else{
						$('#form_sign_value').val('No signature provided');
						$('#form_sign_button').parent().removeClass('completed');
					}
				});
			});
			App.initialiseSignaturePanel();
			$('.signature_page').addClass('active_overlay').fadeIn();
		},
		
	//Resize signature canvas element
		initialiseSignaturePanel:function(){
			App.data.signature.canvas=document.querySelector('canvas#signature_image');
			var r=Math.max(window.devicePixelRatio||1,1);
			$(App.data.signature.canvas).width($(document).width())*r;
			$(App.data.signature.canvas).height($(document).height())*r;
			App.data.signature.canvas.width=$(document).width()*r;
			App.data.signature.canvas.height=$(document).height()*r;
			App.data.signature.canvas.getContext("2d").scale(r,r);
			App.data.signature.canvas=new SignaturePad(App.data.signature.canvas);
			if($('#form_sign_value').val().indexOf('data:')==0)App.data.signature.canvas.fromDataURL($('#form_sign_value').val());
		},
		
	//Clear signature panel
		clearSignaturePanel:function(){
			App.data.signature.canvas.clear();
			$('#form_sign_value').val('No signature provided');
		},
		
	//Open camera for form
		openCamera:function(){
			if(window.navigator.camera&&$('#form_photo_value').val().indexOf('data:')<0){
				window.navigator.camera.getPicture(
					function(filename){
						App.showCameraPanel(filename);
					},
					function(error){
						App.showMessage({
							type:'error',
							text:error
						});
						$('#form_photo_button').parent().removeClass('completed');
					},
					{
						quality:50,
						destinationType:Camera.DestinationType.FILE_URI,
						correctOrientation:true,
						saveToPhotoAlbum:false
					}
				);
			}
			else if(window.navigator.camera&&$('#form_photo_value').val().indexOf('data:')==0){
				App.showCameraPanel($('#form_photo_value').val());
			}
			else App.showMessage({
				type:'error',
				text:App.message.noCamera
			});
		},
		
	//Show camera panel for photo annotation
		showCameraPanel:function(filename){
			if(filename){
				$('#form_photo_value').val(filename);
				$('#form_photo_button').parent().addClass('completed');
			}
			if(!$('.photo_page').hasClass('active_overlay'))$('.active_overlay').removeClass('active_overlay').hide();
			if($('#form_photo_value').val().indexOf('data:')==0)$('.photo_layout').css('background-image','url(\''+$('#form_photo_value').val()+'\')');
			$('.photo_page .close_button').off().on('click',function(){
				$('.photo_page').fadeOut(function(){
					if(!App.data.photo.canvas.isEmpty()){
						$('#form_annotation_value').val(App.data.photo.canvas.toDataURL());
						App.data.photo.canvas.clear();
					}
					else $('#form_annotation_value').val('No annotation entered');
				});
			});
			App.initialisePhotoPanel();
			$('.photo_page').addClass('active_overlay').fadeIn();
		},
		
	//Resize photo canvas element
		initialisePhotoPanel:function(){
			App.data.photo.canvas=document.querySelector('canvas#photo_image');
			var r=Math.max(window.devicePixelRatio||1,1);
			$(App.data.photo.canvas).width($(document).width())*r;
			$(App.data.photo.canvas).height($(document).height())*r;
			App.data.photo.canvas.width=$(document).width()*r;
			App.data.photo.canvas.height=$(document).height()*r;
			App.data.photo.canvas.getContext("2d").scale(r,r);
			App.data.photo.canvas=new SignaturePad(App.data.photo.canvas);
			App.data.photo.canvas.penColor='yellow';
			if($('#form_annotation_value').val().indexOf('data:')==0)App.data.photo.canvas.fromDataURL($('#form_annotation_value').val());
		},
		
	//Clear photo panel
		clearPhotoPanel:function(){
			App.data.photo.canvas.clear();
			$('#form_annotation_value').val('');
			$('#form_photo_value').val('No photo captured');
			$('.photo_layout').css('background-image','none')
			$('#form_photo_button').parent().removeClass('completed');
			App.openCamera();
		},
		
	//Close item form screen (cancel form)
		cancelForm:function(){
			if(parseInt($('#form_total_value').val())>0){
				App.showMessage({
					type:'confirm',
					text:App.message.cancelForm,
					process:App.loadListData
				});
			}
			else App.loadListData();
		},
		
	//Submit item form
		submitForm:function(){
			$('.item_picker').removeClass('active');
			if(App.validateForm()==true){
				$('#form_timestamp_value').val(new Date().getTime());
				var f={};
				$('.item_form .form_buttons > input').not('button,#form_total_value').each(function(){
					f[$(this).attr('id')]=$(this).val();
				});
				var a=[],i;
				$('.form_item').not('.new').each(function(){
					if($(this).find('.item_code_value').val()!=''){
						i={};
						i['item_name']=$(this).find('.item_name').html();
						i['item_code']=$(this).find('.item_code_value').val();
						i['item_quantity']=$(this).find('.item_quantity_value').val();
						a.push(i);
					}
				});
				var d=JSON.parse(window.localStorage.getItem(App.prefix+'-data'));
				if(a.length>0){
					f['form_items']=a;
					f['form_total_value']=$('#form_total_value').val();
					d.TimeSheet[$('#form_index_value').val()].ItemData=f;
					window.localStorage.setItem(App.prefix+'-data',JSON.stringify(d));
					App.addQueueItem(f);
				}
				else{
					var t={};
					t.Day=App.processDate($('#form_date_value').val()).dayFormat;
					t.Date=$('#form_date_value').val();
					d.TimeSheet[$('#form_index_value').val()]=t;
					window.localStorage.setItem(App.prefix+'-data',JSON.stringify(d));
					App.removeQueueItem($('#form_index_value').val());
				}
			}
			else App.showMessage({
				type:'error',
				text:App.message.incompleteForm
			});
			return false;
		},
		
	//Validate item form data before submission
		validateForm:function(){
			var i=0;
			$('.item_form .hidden_field[data-required=true]').each(function(){
				if($(this).val()=='')return false;
				i++;
			});
			if(i==$('.item_form .hidden_field[data-required=true]').length)return true;
			return false;
		},
		
	//Add submission to processing queue and return to list page
		addQueueItem:function(item){
			var q={};
			if(window.localStorage.getItem(App.prefix+'-queue')!=null)q=JSON.parse(window.localStorage.getItem(App.prefix+'-queue'));
			q[item.form_index_value]=item;
			window.localStorage.setItem(App.prefix+'-queue',JSON.stringify(q));
			App.updateItemStatus(item.form_index_value,'Pending',App.loadListData);
		},
	
	//Remove previous submission from processing queue after empty submission
		removeQueueItem:function(index){
			if(window.localStorage.getItem(App.prefix+'-queue')!=null){
				var q=JSON.parse(window.localStorage.getItem(App.prefix+'-queue'));
				var i=q[index];
				delete q[index];
				if(!$.isEmptyObject(q))window.localStorage.setItem(App.prefix+'-queue',JSON.stringify(q));
				else window.localStorage.removeItem(App.prefix+'-queue');
				return i;
			}
			else return false;
		},
		
	
	
	//FORM UPLOAD + QUEUE
	
	//Process form submission queue
		processQueue:function(){
			var q=JSON.parse(window.localStorage.getItem(App.prefix+'-queue'));
			if(!$.isEmptyObject(q)&&window.navigator.onLine==true){
				var i=q[Object.keys(q)[0]];
				$.ajax({
					type:'POST',
					url:'https://www.multibaseit.com.au/ts/process.aspx',
					dataType:'json',
					crossDomain:true,
					data:i,
					processData:false,
					success:function(data,status,request){
						App.processQueueResponse(i.form_index_value);
					},
					error:function(request,status,error){
						App.showServerError(request,status,error);
					}
				});
			}
		},
		
	//Process response and remove item from queue
		processQueueResponse:function(index){
			var i=App.removeQueueItem(index);
			if(!!i){
				App.updateItemStatus(i.form_index_value,'Submitted',function(){
					App.uploadImageFile(
						i.form_photo_value,
						i.form_index_value+'-'+i.form_timestamp_value
					);
				});
			}
		},
		
	//Update item status in stored list data
		updateItemStatus:function(id,status,process){
			var q=JSON.parse(window.localStorage.getItem(App.prefix+'-data'));
			//q[id].ItemStatus=status;
			q.TimeSheet[id].ItemStatus=status;
			window.localStorage.setItem(App.prefix+'-data',JSON.stringify(q));
			$('.list_item[data-item-index='+(id)+']').removeClass('pending submitted').addClass(status.toLowerCase());
			if(typeof process=='function')(process)();
		},
		
	//Upload image file
		uploadImageFile:function(url,id){
			if(window.cordova&&url.indexOf(' ')<0){
				var o=new window.FileUploadOptions();
					o.fileKey="file";
					o.fileName=id+url.substr(url.lastIndexOf('.')+1);
					o.mimeType="image/jpeg";
					o.chunkedMode=false;
				var t=new window.FileTransfer();
				t.upload(
					url,
					'https://www.multibaseit.com.au/ts/image.aspx',
					function(result){
						App.processUploadResult(result);
					},
					function(error){
						App.processUploadFailure(error);
					},
					o
				);
			}
			else App.processQueue();
		},
		
	//Process image upload success
		processUploadResult:function(result){
			var a=
				("Upload result code = "+result.responseCode)+
				("\nResponse = "+result.response)+
				("\nSent = "+result.bytesSent);
			//alert(a);
			App.processQueue();
		},
		
	//Process image upload failure
		processUploadFailure:function(error){
			var a=
				("Upload error code = "+error.code)+
				("\nUpload error source = "+error.source)+
				("\nUpload error http status = "+error.http_status)+
				("\nUpload error body = "+error.body)+
				("\nUpload error exception = "+error.exception)+
				("\nUpload error target = "+error.target);
			//alert(a);
			App.processQueue();
		}
};



function addDeviceEvents(){
	//Device back button
		document.addEventListener('backbutton',App.handleBackButton,false);
	//Device connection state
		document.addEventListener('online',App.processQueue,false);
	//Application focus
		document.addEventListener('resume',App.updateTime,false);
	//Initialisation
		$(document).ready(App.initialise);
}
if(window.cordova)document.addEventListener('deviceready',addDeviceEvents,false);
else $(document).ready(App.initialise);