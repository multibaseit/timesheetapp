var App={
	
	
	
	//INITIALISATION
		
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
				App.template.reviewHeader=$('.review_header')[0].outerHTML.replace(/\t|\r|\n/gi,'');
				App.template.reviewItem=$('.review_item')[0].outerHTML.replace(/\t|\r|\n/gi,'');
				App.template.reviewFooter=$('.review_footer')[0].outerHTML.replace(/\t|\r|\n/gi,'');
				$('.review_item').remove();
			//Login form handler
				$('.login_form').on('submit',App.submitLogin);
			//First page
				//App.showPage('.login_page');
				App.loadListData();
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
			$('.error_text').html(text.replace(/[\.\s\b][\s\s\b]/gi,'<br/><br/>'));
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
				App.cancelForm($('.item_form_header').attr('data-form-id'));
				return true;
			}
		},
	
	//Show and hide overlay panel
		showOverlay:function(overlay){
			$('.active_overlay').removeClass('active_overlay').hide();
			$('body').addClass('no_scroll');
			$(overlay).addClass('active_overlay').fadeIn();
		},
		hideOverlay:function(){
			$('.active_overlay').removeClass('active_overlay').fadeOut();
			$('body').removeClass('no_scroll');
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
			var u=$('#user').val();
			App.data.form.user=u.charAt(0).toUpperCase()+u.substring(1).toLowerCase();
			return true;
		},
	
	//Log out
		logOut:function(){
			App.showPage('.login_page',true);
		},
		
	//Display server error message
		showServerError:function(request,status,error){
			var a=
				("Request = "+request.responseText)+
				("\nStatus = "+status)+
				("\nError = "+error);
			//alert(a);
			App.showMessage({
				type:'confirm',
				text:App.message.updateError,
				process:function(){
					App.buildList();
				}
			});
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
							url:'http://api.jdvcentral.australis.net.au/api/ProjectList',
							//url:'http://jdvcentralapi/api/ProjectList',
							//url:'http://203.23.177.147/api/ProjectList',
							dataType:'json',
							crossDomain:true,
							method:'POST',
							data:{
								Token:'ED2370AF-EF87-49A8-BA10-1B67D63381AA'
							},
							timeout:10000,
							success:function(data,status,request){
								App.storeLocalData(data);
							},
							error:function(request,status,error){
								//alert('loadListData');
								App.showServerError(request,status,error);
							}
						});
				}
				else App.buildList();
			}
			else{
				/*if(!$('.error_page').hasClass('active_overlay'))App.showMessage({
					type:'warning',
					text:App.message.offlineUpdate,
					process:App.buildList
				});
				else App.buildList();*/
				App.buildList();
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
			//Generate list html
				var u=JSON.parse(window.localStorage.getItem(App.prefix+'-user-data'))||[],//user data
					s=App.template.listItem.split('-data-'),//item template
					h=[],//html buffer
					i=0,//counter
					c,//css class string
					p,//processed list item date
					t=0,//item total hours
					v,//item hours split value
					x=0//number of expired items in user data
				//Date now
					var n=new Date();
						n.setDate(n.getDate());
						n.setHours(0);
						n.setMinutes(0);
						n.setSeconds(0);
						n.setMilliseconds(0);
				//Date now minus 14 days
					var d=new Date();
						d.setTime(n.getTime());
						d.setDate(d.getDate()-13);
				//Date last Monday minus 7 days
					var m=new Date();
						m.setTime(n.getTime());
						m.setDate((n.getDate()+(1+7-n.getDay())%7)-14);
				if(u.length>0&&typeof u[u.length-1].Timestamp!='undefined'){
					//Date of first item in user data
						var f=new Date();
							f.setTime(parseInt(u[u.length-1].Timestamp));
					x=Math.floor((n.getTime()-f.getTime())/86400000);
					if(x>0)u.splice(0,x);
					if(x<0){
						u=[];
						App.showMessage({
							type:'warning',
							text:App.message.dataCleared
						});
					}
				}
				while(d.getTime()<n.getTime()+86400000){
					p=App.processDate(d);
					if(typeof u[i]==='undefined'){
						u.push({
							Day:p.dayFormat,
							Date:p.dateFormat,
							Timestamp:d.getTime().toString()
						});
					}
					c=' '+d.dayFormat.toLowerCase();
					if(d.getTime()<m.getTime())c+=' expired';
					if(u[i].ItemStatus)c+=' '+u[i].ItemStatus.toLowerCase();
					if(u[i].ItemData){
						if(x>0)u[i].ItemData.form_index_value=parseInt(u[i].ItemData.form_index_value)-x;
						v=u[i].ItemData.form_total_value.split('');
						if(v[0]=='0'&&(v[v.length-1]!='0'||v[v.length-2]!='0'))t='<1';
						else t=parseInt(u[i].ItemData.form_total_value);
					}
					else t=0;
					h.unshift(
						s[0]+c+
						s[1]+i+
						s[2]+d.getTime()+
						s[3]+p.dayFormat.charAt(0)+
						s[4]+p.dayFormat+' '+p.shortDateFormat+
						s[5]+t+' hr'+((t>1||t==0)?'s':'')+
						s[6]
					);
					d.setDate(d.getDate()+1);
					i++;
				}
				window.localStorage.setItem(App.prefix+'-user-data',JSON.stringify(u));
				$('.list_items').fadeIn().removeClass('filtered').html(h.join(''));
			//Bind events for list items
				$('.list_items .list_item').each(function(){
					$(this).on('click',function(){
						App.buildForm($(this).attr('data-item-index'));
					});
				});
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
				$('.list_toggle').off().on('click',function(){
					if($('.list_item.pending,.list_item.submitted')[0]){
						App.data.list.toggled=!App.data.list.toggled;
						App.toggleList();
					}
				});
				App.toggleList();
			//Bind list submit event
				$('.list_submit').off().not('.inactive').on('click',function(){
					App.initialiseReview();
				});
			//Display list page
				if(!$('.list_page').hasClass('active_page')){
					if($('.error_page').hasClass('active_overlay'))App.showPage('.list_page',true);
					else App.showPage('.list_page');
				}
			//Trigger queued form process
				App.processQueue();
		},
		
	//Display last update time
		updateTime:function(){
			$('.update_time').html(App.lastUpdateText(parseInt(window.localStorage.getItem(App.prefix+'-update-time'))));
		},
		
	//Force reload from server
		forceListLoad:function(){
			if(window.navigator.onLine==true){
				/*$('.list_update .fa').addClass('fa-spin');
				$('.list_items').fadeOut(function(){
					App.loadListData(true);
				});*/
				App.showPage('.load_page');
				//HERE load the data
			}
			else App.showMessage({
				type:'error',
				text:App.message.offlineUpdate
			});
		},
		
	//Toggle submitted list items
		toggleList:function(){
			if(App.data.list.toggled==true)$('.list_page').addClass('list_toggled');
			else $('.list_page').removeClass('list_toggled');
			if($('.list_item.pending,.list_item.submitted')[0])$('.list_toggle,.list_submit').removeClass('inactive');
			else $('.list_toggle,.list_submit').addClass('inactive');
		},
	
	
	
	//FORM PAGE
	
	//Generate item form
		buildForm:function(id){
			var f=JSON.parse(window.localStorage.getItem(App.prefix+'-user-data')),
				//t=f.TimeSheet[parseInt(id)],
				t=f[parseInt(id)],
				s=App.template.itemForm.split('-data-'),
				h=[];
			if(!!t.ItemData)var d=t.ItemData;
			h.push(
				s[0]+id+
				s[1]+t.Day+
				s[2]+t.Date+
				s[3]+((!!d)?App.addFormItems(t.ItemData.form_items):App.addFormItems())+
				s[4]+((App.data.form.total>=0)?App.data.form.total:'0:00')+
				s[5]+((App.data.form.total>=0)?App.data.form.total:'0:00')+
				s[6]+((!!d&&!!d.form_sign_value.indexOf('data:')==0)?d.form_sign_value:'No signature provided')+
				s[7]+'No photo captured'+
				s[8]+'No annotation entered'+
				s[9]+((!!d&&!!d.form_date_value)?d.form_date_value:t.Date)+
				s[10]+id+
				s[11]+((!!d&&!!d.form_geocode_value)?d.form_geocode_value:'No geocode captured')+
				s[12]+((!!d&&!!d.form_sign_value.indexOf('data:')==0)?'completed':'')+
				s[13]
			);
			$('.item_form').html(h.join(''));
			if(!!t.ItemData)App.updateFormTotal();
		//Bind events for form items
			$('.item_text').each(function(){
				if($(this).find('.item_code_value').val()=='')$(this).find('.item_code > span').show();
				else $(this).find('.item_code > span').hide();
				App.bindFormItemEvents($(this));
			});
			/*$('.item_form .picker_less,.item_form .picker_more').each(function(){
				App.bindItemPicker($(this));
			});
			$('.item_form .item_start').off().on('click',function(){
				App.data.form.clock=$(this);
				App.initialiseClockPanel($('#form_start_value').val());
			});
			$('.item_form .item_finish').off().on('click',function(){
				App.data.form.clock=$(this);
				App.initialiseClockPanel($('#form_finish_value').val());
			});*/
		//Bind clock panel events
			$('.clock_split_24').off().on('click',function(){
				App.setClockSplit(24,$(this));
			});
			$('.clock_split_12').off().on('click',function(){
				App.setClockSplit(12,$(this));
			});
			$('.clock_split_icon').off().on('click',function(){
				if($('.clock_split_12').hasClass('split_active'))App.setClockSplit(24,$('.clock_split_24'));
				else App.setClockSplit(12,$('.clock_split_12'));
			});
			$('.clock_number').each(function(){
				$(this).off().on('click',function(){
					$(this).addClass('number_active').siblings().removeClass('number_active');
					App.setClockTime($(this));
				});
			});
			$('.display_hours').off().on('click',function(){
				$('.display_hours').addClass('active');
				$('.display_mins').removeClass('active');
				$('.clock_hours,.clock_hand_hours').fadeIn();
				$('.clock_mins,.clock_hand_mins').fadeOut();
			});
			$('.display_mins').off().on('click',function(){
				$('.display_hours').removeClass('active');
				$('.display_mins').addClass('active');
				$('.clock_mins,.clock_hand_mins').fadeIn();
				$('.clock_hours,.clock_hand_hours').fadeOut();
			});
		//Bind item add event
			$('.form_items_add').off().on('click',function(){
				//$('.item_picker').removeClass('active');
				if($('.form_item').length>1||!$('.form_item').first().hasClass('new')){
					$('.form_items').append(App.addFormItems());
					App.bindFormItemEvents($('.form_item').last().find('.item_text'));
				}
				//App.bindItemPicker($('.form_item').last().find('.picker_less'));
				//App.bindItemPicker($('.form_item').last().find('.picker_more'));
				$('.form_item').last().find('.item_text').trigger('activate');
			});
		//Bind signature events
			$('#form_sign_button').off().on('click',function(){
				$('.item_picker').removeClass('active');
				App.showSignaturePanel();
			});
			$('.signature_clear').off().on('click',function(){
				App.clearSignaturePanel();
			});
		//Bind form + submit events
			$('.item_form').off().on('submit',function(){
				return false;
			});
			$('#form_submit_button').removeClass('active').off().on('click',App.submitForm);
		//Bind close button event
			$('.form_page > .close_button').off().on('click',function(){
				App.cancelForm(id);
			});
		//Display form page
			App.showPage('.form_page');
		},
		
	//Generate HTML for form items
		addFormItems:function(data){
			var s=App.template.formItem.split('-data-'),h=[];
			if(!!data){
				var b,e;
				for(i=0;i<data.length;i++){
					b=(data[i].item_start_time)?App.processDate(new Date(parseInt(data[i].item_start_time))):{hour:'HH',min:'MM'};
					e=(data[i].item_finish_time)?App.processDate(new Date(parseInt(data[i].item_finish_time))):{hour:'HH',min:'MM'};
					h.push(
						s[0]+''+
						s[1]+data[i].item_code+
						s[2]+decodeURIComponent(data[i].item_name)+
						s[3]+i+
						s[4]+i+
						s[5]+data[i].item_code+
						s[6]+''+
						s[7]+i+
						s[8]+b.hour+':'+b.min+
						s[9]+i+
						s[10]+i+
						s[11]+data[i].item_start_time+
						s[12]+i+
						s[13]+e.hour+':'+e.min+
						s[14]+i+
						s[15]+i+
						s[16]+data[i].item_finish_time+
						s[17]
					);
				}
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
					s[8]+'HH:MM'+
					s[9]+0+
					s[10]+0+
					s[11]+''+
					s[12]+0+
					s[13]+'HH:MM'+
					s[14]+0+
					s[15]+0+
					s[16]+''+
					s[17]
				);
			}
			return h.join('');
		},
		
	//Bind events for item selector
		bindFormItemEvents:function(selector){
			$(selector).on('activate',App.activateListSelector).on('touchstart mousedown',function(event){
				event.preventDefault();
				$(this).trigger('activate');
			});
			$(selector).parent().find('.item_start').on('activate',App.activateStartClock).on('touchstart mousedown',function(event){
				if(!$(this).parent().hasClass('disabled')){
					event.preventDefault();
					$(this).trigger('activate');
				}
				else $(this).parent().siblings('.item_text').fadeOut(function(){
					$(this).fadeIn();
				});
			});
			$(selector).parent().find('.item_finish').on('activate',App.activateFinishClock).on('touchstart mousedown',function(event){
				if(!$(this).parent().hasClass('disabled')){
					event.preventDefault();
					$(this).trigger('activate');
				}
				else $(this).parent().siblings('.item_text').fadeOut(function(){
					$(this).fadeIn();
				});
			});
		},
		
	//Activate clock panel for start time
		activateStartClock:function(){
			App.data.form.clock=$(this);
			App.initialiseClockPanel($(this).find('.item_start_value').val());
		},
		
	//Activate clock panel for finish time
		activateFinishClock:function(){
			App.data.form.clock=$(this);
			App.initialiseClockPanel($(this).find('.item_finish_value').val());
		},
		
	//Update total hours for form
		updateFormTotal:function(){
			/*
			var t,m=0,h,s,f;
			$('.item_times').each(function(){
				f=parseInt($(this).find('.item_finish_value').val());
				s=parseInt($(this).find('.item_start_value').val());
				if(!isNaN(f)&&!isNaN(s))m+=(f-s)/60000;
			});
			h=Math.round(m/60);
			m=m%60;
			if(!isNaN(h)&&!isNaN(m)){
				t=h+':'+((m<10)?'0'+m:m);
				$('#form_total_value').val(t);
				$('.total_number').html(t);
				App.data.form.total=t;
			}
			*/
			var v,t,h,m=0;
			$('.item_times').each(function(){
				v=App.getClockDuration($(this)).minutes;
				if(!isNaN(v))m+=v;
			});
			if(m!=0){
				h=Math.floor(m/60);
				m=m%60;
			}
			else h=0;
			t=h+':'+((m<10)?'0'+m:m);
			$('#form_total_value').val(t);
			$('.total_number').html(t);
			App.data.form.total=t;
		},
	
	//Calculate duration from start and finish times
		getClockDuration:function(item){
			var t,m=0,h,f,s,v;
			f=parseInt($(item).find('.item_finish_value').val());
			s=parseInt($(item).find('.item_start_value').val());
			if(!isNaN(f)&&!isNaN(s)){
				m+=(f-s)/60000;
				h=Math.round(m/60);
				v=m%60;
				t=h+':'+((v<10)?'0'+v:v);
				return{
					minutes:m,
					text:t
				};
			}
			else return {};
		},
	
	//Activate item list selector for data entry
		activateListSelector:function(){
			App.data.form.item=$(this);
			App.showListPanel();
		},
		
	//Initialise note panel
		showListPanel:function(){
			//$('.active_overlay').removeClass('active_overlay').hide();
			//$('body').addClass('no_scroll');
			$('.note_page .close_button').off().on('click',function(){
				if($('.note_list li.active').length>0&&$('.note_list li.active .note_value').val()!=''){
					$(App.data.form.item).children('.item_code').html($('.note_list li.active .note_code').text());
					$(App.data.form.item).children('.item_name').html($('.note_list li.active .note_value').val());
					$(App.data.form.item).children('.item_code_value').val($('.note_list li.active .note_code').text());
					$(App.data.form.item).siblings('.item_times').removeClass('disabled');
					$('.form_item.new').removeClass('new');
					//$('.note_page').fadeOut();
					App.hideOverlay();
				}
				else{
					$(App.data.form.item).parent().remove();
					App.updateFormTotal();
					if($('.form_item').length==0)$('.form_items').append(App.addFormItems());
					App.bindFormItemEvents($('.form_item').last().find('.item_text'));
					//$('.note_page').fadeOut();
					App.hideOverlay();
				}
			});
			var i=0,h=[],c=$(App.data.form.item).find('.item_code').text(),
				s=App.template.noteItem.split('-data-'),
				d=JSON.parse(window.localStorage.getItem(App.prefix+'-data'))||{};
			h.push(
				s[0]+'000'+
				s[1]+'Enter NEW project'+
				s[2]+''+
				s[3]
			);
			if(c=='000'){
				var n=$(App.data.form.item).find('.item_name').text();
				h.push(
					s[0]+'000'+
					s[1]+n+
					s[2]+n+
					s[3]
				);
			}
			if(typeof d.Jobs!='undefined'){
				while(i<d.Jobs.length){
					h.push(
						s[0]+((d.Jobs[i].JobNo.charAt(0)=='_')?d.Jobs[i].JobNo.substring(1):d.Jobs[i].JobNo)+
						s[1]+d.Jobs[i].Name+
						s[2]+d.Jobs[i].Name+
						s[3]
					);
					i++;
				}
			}
			$('.note_list').html(h.join(''));
			$('.note_list li:first-child').off().on('activate',App.activateListItem).on('click',function(){
				$(this).trigger('activate');
			}).on('store',App.addListItem).on('keypress',function(event){
				if(event.which==13)$(this).trigger('store');
				//return event.which!=13;
			});
			$('.note_list li').not('li:first-child').each(function(){
				if($(this).find('.note_code').html()==$(App.data.form.item).find('.item_code_value').val())$(this).addClass('active');
				$(this).off().on('click',function(){
					if(!$(this).hasClass('active')){
						$('.note_list li').removeClass('active');
						$(this).toggleClass('active');
					}
					else $('.note_list li').removeClass('active');
					$('.note_page .close_button').trigger('click');
				});
			});
			//$('.note_page').addClass('active_overlay').fadeIn();
			App.showOverlay('.note_page');
		},
	
	//Activate new list item for data entry
		activateListItem:function(){
			$('.note_item.active').removeClass('active');
			$(this).addClass('editable').find('.note_value').trigger('focus');
		},
		
	//Store new list item and add to list
		addListItem:function(){
			if($(this).find('.note_value').val()!='')$(this).addClass('active');
			$('.note_page .close_button').trigger('click');
		},
	
	//Initialise clock panel
		initialiseClockPanel:function(timestamp){
			//$('.active_overlay').removeClass('active_overlay').hide();
			$('.clock_page .close_button').off().on('click',function(){
				if(App.validateClockTime()==true){
					$(App.data.form.clock).find('label > span').html($('.clock_hours .number_active .split_active').text()+':'+$('.clock_mins .number_active').text());
					$(App.data.form.clock).addClass('completed');
					//$('.clock_page').fadeOut();
					App.hideOverlay();
				}
				else App.showMessage({
					type:'error',
					text:App.message.clockValidation
				});
			});
			$('.split_active').removeClass('split_active');
			$('.number_active').removeClass('number_active');	
			if(!timestamp){
				var t=new Date();
					t.setMinutes(Math.round(t.getMinutes()/5)*5);
					t.setMilliseconds(0);
				timestamp=t.getTime();
			}
			var d=new Date(parseInt(timestamp));
				d.setMinutes(Math.round(d.getMinutes()/5)*5);
			App.data.form.clockvalue=parseInt(timestamp);
			if(d.getHours()==0){
				$('.clock_hours .clock_0').addClass('number_active');
				if(d.getMinutes()==0)App.setClockSplit(12);
				else App.setClockSplit(24);
			}
			else if(d.getHours()<12){
				$('.clock_hours .clock_'+(d.getHours())).addClass('number_active');
				App.setClockSplit(12);
			}
			else if(d.getHours()==12){
				$('.clock_hours .clock_0').addClass('number_active');
				App.setClockSplit(24);
			}
			else if(d.getHours()>12){
				$('.clock_hours .clock_'+(d.getHours()-12)).addClass('number_active');
				App.setClockSplit(24);
			}
			$('.clock_mins .clock_'+(d.getMinutes()/5)).addClass('number_active');
			$('.display_hours').addClass('active');
			$('.display_mins').removeClass('active');
			$('.clock_hours,.clock_hand_hours').show();
			$('.clock_mins,.clock_hand_mins').hide();
			App.setClockTime();
			//$('.clock_page').addClass('active_overlay').fadeIn();
			App.showOverlay('.clock_page');
		},
	
	//Validate start and finish times for clock overlay
		validateClockTime:function(){
			var s=parseInt($(App.data.form.clock).parent().find('.item_start_value').val()),
				f=parseInt($(App.data.form.clock).parent().find('.item_finish_value').val());
			if(isNaN(s)||isNaN(f))return true;
			else if(new Date(s)<new Date(f))return true;
			else return false;
		},
		
	//Toggle AM and PM for clock overlay
		setClockSplit:function(split,element){
			if(split==12){
				$('.clock_split_12').addClass('split_active');
				$('.clock_split_24').removeClass('split_active');
				$('.display_split_24').removeClass('split_active').hide();
				$('.display_split_12').addClass('split_active').fadeIn();
			}
			else{
				$('.clock_split_24').addClass('split_active');
				$('.clock_split_12').removeClass('split_active');
				$('.display_split_12').removeClass('split_active').hide();
				$('.display_split_24').addClass('split_active').fadeIn();
			}
			if(element){
				App.setClockTime();
				$('.display_hours').addClass('active');
				$('.display_mins').removeClass('active');
				$('.clock_hours,.clock_hand_hours').fadeIn();
				$('.clock_mins,.clock_hand_mins').fadeOut();
			}
		},
		
	//Set selected time for clock overlay
		setClockTime:function(numeral){
			var d=new Date(App.data.form.clockvalue);
				d.setHours(parseInt($('.clock_hours .number_active .split_active').text()));
				d.setMinutes(parseInt($('.clock_mins .number_active').text()));
				d.setSeconds(0);
				d.setMilliseconds(0);
			$('.clock_hand_hours').css('transform','rotate('+(($('.clock_hours .number_active').index()*30)-90)+'deg)');
			$('.clock_hand_mins').css('transform','rotate('+(($('.clock_mins .number_active').index()*30)-90)+'deg)');
			if($(numeral).parent().hasClass('clock_hours')){
				$('.display_hours').removeClass('active');
				$('.display_mins').addClass('active');
				$('.clock_hours,.clock_hand_hours').fadeOut();
				$('.clock_mins,.clock_hand_mins').fadeIn();
			}
			App.data.form.clockvalue=d.getTime();
			$(App.data.form.clock).find('input').val(d.getTime());
			$('.display_hours').html($('.clock_hours .number_active .split_active').text());
			$('.display_mins').html($('.clock_mins .number_active').text());
			App.updateFormTotal();
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
		
	//Close item form screen (cancel form)
		cancelForm:function(id){
			var f=JSON.parse(window.localStorage.getItem(App.prefix+'-user-data'))[id]||{};
			if(typeof f.ItemData!='undefined'&&
				((typeof f.ItemData.form_items!='undefined'&&f.ItemData.form_items.length!=$('.form_item').length)||
				(typeof f.ItemData.form_total_value!='undefined'&&$('#form_total_value').val()!=f.ItemData.form_total_value)||
				(typeof f.ItemData.form_sign_value!='undefined'&&$('#form_sign_value').val()!=f.ItemData.form_sign_value))){
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
			$('#form_submit_button').addClass('active');
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
						i['item_name']=encodeURIComponent($(this).find('.item_name').html());
						i['item_code']=$(this).find('.item_code_value').val();
						i['item_start_time']=$(this).find('.item_start_value').val();
						i['item_finish_time']=$(this).find('.item_finish_value').val();
						i['item_hours']=App.getClockDuration($(this).children('.item_times')).text;
						a.push(i);
					}
				});
				var d=JSON.parse(window.localStorage.getItem(App.prefix+'-user-data'));
				if(a.length>0){
					f['form_items']=a;
					f['form_total_value']=$('#form_total_value').val();
					d[$('#form_index_value').val()].ItemData=f;
					window.localStorage.setItem(App.prefix+'-user-data',JSON.stringify(d));
					App.addQueueItem(f);
				}
				else{
					var t={};
					t.Day=App.processDate($('#form_date_value').val()).dayFormat;
					t.Date=$('#form_date_value').val();
					t.Timesheet=$('.list_item[data-item-index='+$('#form_index_value').val()+']').attr('data-item-date');
					d[$('#form_index_value').val()]=t;
					window.localStorage.setItem(App.prefix+'-user-data',JSON.stringify(d));
					App.removeQueueItem($('#form_index_value').val());
					App.loadListData();
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
			App.updateItemStatus({
				id:item.form_index_value,
				status:'Pending',
				process:App.loadListData
			});
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
	
	//Initialise user data review page
		initialiseReview:function(){
			var d=JSON.parse(window.localStorage.getItem(App.prefix+'-user-data')),
				a=App.template.reviewHeader.split('-data-'),
				b=App.template.reviewItem.split('-data-'),
				c=App.template.reviewFooter.split('-data-'),
				i=0,h=[];
			while(i<d.length){
				if(!!d[i].ItemData)h.push(
					App.addReviewItems(a,b,c,d[i])
				);
				i++;
			}
			$('.review_list').html(h.join(''));
			$('.review_page .close_button').off().on('click',function(){
				App.showPage('.list_page');
			});
			$('#form_send_button').off().on('click',function(){
				App.showMessage({
					type:'confirm',
					text:App.message.confirmSubmit,
					process:App.submitList
				});
			});
			App.showPage('.review_page');
		},
	
	//Add items to review list from data
		addReviewItems:function(header,item,footer,data){
			var h=[],i=0,d='';
			while(i<data.ItemData.form_items.length){
				if(d!=data.Date)h.push(
					header[0]+data.Day+
					header[1]+data.Date+
					header[2]+data.ItemData.form_total_value+
					header[3]
				);
				h.push(
					item[0]+data.ItemData.form_items[i].item_code+
					item[1]+decodeURIComponent(data.ItemData.form_items[i].item_name)+
					item[2]+((typeof data.ItemData.form_items[i].item_hours!='undefined')?data.ItemData.form_items[i].item_hours:'0:00')+
					item[3]
				);
				if(i==data.ItemData.form_items.length-1)h.push(
					//footer[0]+data.ItemData.form_sign_value+
					footer[0]+((data.ItemData.form_sign_value.indexOf('data:')==0)?'':'NO ')+'Signature provided'+
					footer[1]
				);
				d=data.Date;
				i++;
			}
			return h.join(''); 
		},
			
	//Submit entire user data set for server processing
		submitList:function(){
			if(window.navigator.onLine==true){
				App.showPage('.load_page',true);
				$.ajax({
					type:'POST',
					url:'https://www.multibaseit.com.au/ts/process_and_send.aspx',
					dataType:'html',
					crossDomain:true,
					timeout:10000,
					data:{
						'TIMESHEET':encodeURIComponent($('.review_list')[0].outerHTML),
						'method':'send_timesheet'
					},
					processData:true,
					success:function(data,status,request){
						if(data=='Good'){
							App.showMessage({
								type:'notification',
								text:App.message.sendSuccess,
								process:App.buildList
							});
						}
						else App.showMessage({
								type:'error',
								text:App.message.updateError,
								process:App.buildList
							});
					},
					error:function(request,status,error){
						App.showServerError(request,status,error);
					}
				});
			}
			else{
				$('.error_page').removeClass('active_overlay').fadeOut(function(){
					App.showMessage({
						type:'error',
						text:App.message.sendOffline,
						process:App.buildList
					});
				});
			}
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
					data:'TIMESHEET='+JSON.stringify(i),
					processData:false,
					success:function(data,status,request){
						App.processQueueResponse(i.form_index_value);
					},
					error:function(request,status,error){
						//alert('processQueue');
						App.showServerError(request,status,error);
					}
				});
			}
		},
		
	//Process response and remove item from queue
		processQueueResponse:function(index){
			var i=App.removeQueueItem(index);
			if(!!i){
				App.updateItemStatus({
					id:i.form_index_value,
					status:'Submitted',
					process:function(){
						App.uploadImageFile({
							file:i.form_photo_value,
							id:i.form_index_value+'-'+i.form_timestamp_value
						});
					}
				});
			}
		},
		
	//Update item status in stored list data
		updateItemStatus:function(args){
			var id=args.id,
				status=args.status;
			if(typeof args.process==='function')process=args.process;
			var q=JSON.parse(window.localStorage.getItem(App.prefix+'-user-data'));
			q[id].ItemStatus=status;
			window.localStorage.setItem(App.prefix+'-user-data',JSON.stringify(q));
			$('.list_item[data-item-index='+(id)+']').removeClass('pending submitted').addClass(status.toLowerCase());
			if(typeof process=='function')(process)();
		},
		
	//Upload image file
		uploadImageFile:function(args){
			var url=args.url,
				id=args.id;
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
		},



	/*CONFIG*/
	
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
			offlineUpdate:'Your project list will be updated next time your device is online',
			updateError:'There was an error communicating with the server  Do you want to try again?',
			cancelForm:'Any new entries or changes will not be saved',
			incompleteForm:'You must obtain a signature to save this timesheet',
			clockValidation:'The finish time must be later than the start time',
			confirmSubmit:'Your timesheet will be submitted for processing',
			sendSuccess:'Your timesheet has been submitted successfully',
			sendFailure:'Your timesheet could not be submitted  Please try again later',
			sendOffline:'Your timesheet cannot be submitted while your device is offline',
			dataCleared:'Stored data has been cleared'
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