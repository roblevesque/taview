var lastInputBox;
var netDB;
$.widget("ui.resizable", $.ui.resizable, {
resizeBy: function(newSize) {
		this._mouseStart($.Event("mousedown", { pageX: 0, pageY: 0 }));
		this.axis = 'se';
		var end = $.Event("mouseup", {
				pageX: newSize.width,
				pageY: newSize.height
		});
		this._mouseDrag(end);
		this._mouseStop(end);
}
});
String.prototype.replaceAll = function(target, replacement) {
  return this.split(target).join(replacement);
};
function radians(degrees)
{
  var pi = Math.PI;
  return degrees * (pi/180);
}
$(document).ready(function() {

		setInterval(update_animations, 100);

		 // Controls menu hide/show
		$('#hotdog').click(function(){
                        $('#controls').toggleClass("active");
    });

		// Reset view
    $('.reset-container').click(function(){ reset_view();});
		$('#submitfindbyname').click(function() {
		      var selected = $('#findbyselect option:selected').text();
					var object = findObjectInfo(selected);
					zoomfocus(selected);
					// Populate information area about target
					//console.log(object)
					var objdata = "<b>Name: </b>" + object.name;
					objdata += "</br /><b>Classification: </b>" + object.type;
					objdata += "<br /><b>Owning Faction:</b>" + object.parent.name;
					objdata += "<br /><b>Location (Galactic Ref.)</b><br /><b>X</b>: " + object.x + "<br/><b>Y</b>: " + object.y + "<br /><b>Z</b>: " + object.z;
					$('#findbydata').html(objdata)
		});
		$('#route_output').change(function() {
			 var stop=$('#route_output :selected').parent().attr('label');
			 zoomfocus(stop);
		});
		$('#fbc_output').change(function() {
			 var beacon=$('#fbc_output :selected').val();
			 zoomfocus("FBC_" + beacon);
		});
		$('#swapab').click(function() {
			var swap=$('#pointa').val();
			$("#pointa").val($("#pointb").val());
			$("#pointb").val(swap);
		});
		$('#calctnd').click(function() {
			removeEntity('arrow');
			lastInputBox = null;
			$('#route_output').html("No route calculated");
			var speed = {'speed': $('#speed').val(), 'unit':$('#speedunit option:selected').val() };
			populateRoutePlan( $('#pointa  option:selected').text() , $('#pointb  option:selected').text(),speed );
		});
		$('#submitfindcoord').click(function() {
			 cleanupFBC();
			 execFBC( $('#fbc-x').val(), $('#fbc-y').val(), $('#fbc-z').val(), $('#fbc_frame option:selected').val() );
		});
		$('#submitfbcclear').click(function() {
					cleanupFBC();
		});
		$('#cbs').click(function() {populateFBSelect(); });
		$('#cbp').click(function() {populateFBSelect(); });
		$("#pointa").focus(function() {
			lastInputBox = "pointa";
		//	console.log('Updating last touched box to : ' + lastInputBox)
		});
		$("#pointb").focus(function() {
			lastInputBox = "pointb";
		//	console.log('Updating last touched box to : ' + lastInputBox)
		});
		String.prototype.capitalize = function(lower) {
    return (lower ? this.toLowerCase() : this).replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
		};
		$('.rpcoord').blur(function() {
			 if(!$(this).val()) { $(this).val( $(this).attr("id") ) }

		});
		$('.rpcoord').focus(function() {
			if($(this).val() == $(this).attr("id")) { $(this).val("") }
		});
		$('#calcpredict').click(function() {
				$('#intel_predicted').html("");
				var predicted = predictDestination(new THREE.Vector3(Number($('#x').val()),Number($('#y').val()),Number($('#z').val())),new THREE.Vector2(Number($('#azmuth').val()),Number($('#inclination').val())),$('#intel_frame option:selected').val());
				$('#intel_predicted').html(predicted);
		});
		$('#client-bar-control').click(function() {
			$('#client-term-container').toggleClass("hidden");
			$('#client-ico-down').toggleClass("hidden");
			$('#client-ico-up').toggleClass("hidden");
		});
		$('#client-login').click(function() { reconnect();})
		$(".vertical-resize").resizable({
        handles: {
            'n': '.handle'
        },
				alsoResize: "#client-term-output",
				minWidth: "100%",
				maxWidth: "100%",
				maxHeight: ($(window).height() * 0.95),
				stop: function(event, ui) {
        $(this).css("width", '');
				$('#client-term-output').css("width",'');
				}
		});
		$(".client-term-container").resize(function() { width = $(this).width(); $("#client").css({'width' : '100%'});   $("#client-term-output").css({'margin-right' : '0px !important', 'padding-right' : '0 !important'})  })
		$.ajax({
			url: 'CHANGELOG.md',
			type: 'get',
			async: 'true',
			success: function(text) {
				var converter = new showdown.Converter(),
				html = converter.makeHtml(text);

				$("#changelog_container").html(html);
			}
		});

		$(window).resize(function() {
				$('.vertical-resize').resizable( "option", "maxHeight", ($('.vertical-resize').parent().parent().height() * 0.95) );
				if($('.vertical-resize').height() > ($('.vertical-resize').parent().parent().height() * 0.95) )  	{
						$('.vertical-resize').resizable("resizeBy", {height: '95%', width:'100%'});
				}
		});
		// Websocket client startup
		startup();

});


function populateUserFields() {
	// Populate findby box
	populateFBSelect();
  // Populate pointa and pointb dropdowns
	var types = ['planets','stations'];
	option = "";
	for (var type in types){
			var keys = Object.keys(listobjects(types[type]));
			var captype = types[type];
			captype = captype.capitalize()
			option += '<optgroup label="'+ captype + '">';
			keys.sort().forEach(function(element, index, array){
				 option += '<option value="'+ escapeHTML(element) + '">' + escapeHTML(element) + '</option>';
			 });
			 option += '</optgroup>';

 	}

 	$('#pointa').html(option);
	$('#pointb').html(option);

	// Populate list of borders for intel frame selection
	option = $('#intel_frame').html();
	var borderlist = listobjects("borders");

	for (var border in borderlist) {
		if(borderlist[border].radius > 10) {
			option += '<option value="'+ escapeHTML(border) + '">' + escapeHTML(border) + '</option>';
		}
	}
		$('#intel_frame').html(option);

		// Poulate the frame list for find by coordinate
		option = $('#fbc_frame').html();
		var borderlist = listobjects("borders");

		for (var border in borderlist) {
			if(borderlist[border].radius > 10) {
				option += '<option value="'+ escapeHTML(border) + '">' + escapeHTML(border) + '</option>';
			}
		}
			$('#fbc_frame').html(option);

}
function populateFBSelect() {
	//Populate find by select dropdown
	 var types = [];
	 var checkboxes = document.getElementsByName("objtype");
	 for (var type in checkboxes) {
	 if(checkboxes[type].checked) {
			types[type] = checkboxes[type].value;
		}

	 }
	 var option = '';
	 for (var type in types) {
		 				var captype = types[type];
		 				captype = captype.capitalize()
		 				option += '<optgroup label="'+ captype + '">';
						var keys = Object.keys(listobjects(types[type]));
						keys.sort().forEach(function(element, index, array){
							 option += '<option value="'+ escapeHTML(element) + '">' + escapeHTML(element) + '</option>';
						 });
						  option += '</optgroup>';

	}

	$('#findbyselect').html(option);

}

function openTab(evt,tabName) {
    var i, x, tablinks;
    x = document.getElementsByClassName("wvg-tools");
    for (i = 0; i < x.length; i++) {
        x[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("wvg-tablink");
    for (i = 0; i < x.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" wvg-tab-active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " wvg-tab-active";
}

function escapeHTML(text) {
       var chr = { '"': '"', '&': '&', '<': '[', '>': ']' };
       function abc(a)
       {
          return chr[a];
       }
       return text.replace(/[\"&<>]/g, abc);

}

function timeformat(secs) {
	  var s = new Decimal(secs);
    var hours = new Decimal(secs / 3600);
		var h = hours.floor(); //Get whole hours
		s = s - (h * 3600);
		var m = new Decimal(s / 60); //Get remaining minutes
		m = m.floor();
    s = s - (m * 60 );
		s = Math.round(s,0)
	//	console.log("Hours :"+ h);
	//	console.log("Minutes :"+ m);
	//	console.log("Seconds :"+ s);
	//	console.log("Input :"+ secs);
		return h+":"+(m < 10 ? '0'+m : m)+":"+(s < 10 ? '0'+s : s); //zero padding on minutes and seconds
}

function populateRoutePlan(pointa,pointb,speed) {
		if ( pointa != pointb ) {
			// Populate legacy (trip total) fields with route info
			$('#cal_start').html( pointa );
			$('#cal_end').html( pointb );
			$('#cal_speed').html( speed.speed + " " + speed.unit );
			var route = calcBestRoute(pointa,pointb);
			var dist = route.distance;
			var eta = calcETA(speed,dist);
			$('#cal_eta').html( timeformat(eta) );
			$('#cal_dist').html( dist.toFixed(2) + " PC");

			// Populate the route plan select area
			lastWaypoint = {'name': pointa, gate:false};
			var routeplan;
			route.stops.forEach(function(waypoint,index,self) {
				routeplan += '<optgroup label="' + waypoint.name + '">';
				if(typeof self[index+1] != 'undefined' ) {
					if(waypoint.gate && self[index+1].gate) {routeplan += '<option>^---- Gate From</option>'; }
				}
				if(waypoint.gate && lastWaypoint.gate) {routeplan += '<option>^---- Gate Exit</option>'; }

				if(!waypoint.gate || (!lastWaypoint.gate && waypoint.gate)) {
					var bordercrossings = listBorderCrossings(grabPositionByName( lastWaypoint.name.split('@')[lastWaypoint.name.split('@').length-1] ),grabPositionByName(waypoint.name.split('@')[waypoint.name.split('@').length-1] ));
					for ( var border in bordercrossings) {
						routeplan += `<option onClick='zoomfocus_point(new THREE.Vector3(${bordercrossings[border].x},${bordercrossings[border].y} ,${bordercrossings[border].z} ));'> WARNING!: Border crossing: ${border} </option>`;

					}
					routeplan += '<option>Distance:' + waypoint.distance.toFixed(2) + '</option>'
					routeplan += '<option>ETA: ' + timeformat(calcETA(speed,waypoint.distance)) + '</option>';
					drawline(grabPositionByName(lastWaypoint.name.split('@')[lastWaypoint.name.split('@').length-1] ),grabPositionByName(waypoint.name.split('@')[waypoint.name.split('@').length-1]  ));
				}
				lastWaypoint = waypoint;
			});
				$('#route_output').html(routeplan);
			//drawline(grabPositionByName($('#pointa  option:selected').text()),grabPositionByName($('#pointb  option:selected').text()));
	}
}


function execFBC(x,y,z,frame) {
			var optionoutput = "";
			var zoomto = "";
			var borderlist = listobjects("borders");

			if(frame === "Unknown") {
				// The stupid bumblefuck located at the chair/computer interface
				// doesn't know where it is so we gotta draw all the places!

				// Galactic frame. The easiest so we do it first on account that i'm stupid
				drawcircleindicator(new THREE.Vector3(x,y,z), "FBC_Galactic");
				optionoutput += '<option> Galactic </option>';

				// Now chooch each border/frame
				for (var border in borderlist) {
					if(borderlist[border].radius > 10) {
						var inputvector = new THREE.Vector3(parseFloat( x ),parseFloat( y ),parseFloat( z ));
						var framevector = new THREE.Vector3(parseFloat( borderlist[border].x ), parseFloat( borderlist[border].y ), parseFloat( borderlist[border].z ));
						var outputvector = framevector.add(inputvector);
						drawcircleindicator(outputvector,"FBC_" + borderlist[border].name);
						optionoutput += '<option>' + borderlist[border].name + '</option>';
					}
				}
			}  // Borders done got chooched. End bumblefuckery
			else if (frame === "Galactic") {
							drawcircleindicator(new THREE.Vector3(x,y,z), "FBC_Galactic");
							optionoutput += '<option> Galactic </option>';
			}
			else {
				border = borderlist[frame];
				var inputvector = new THREE.Vector3(parseFloat( x ),parseFloat( y ),parseFloat( z ));
				var framevector = new THREE.Vector3(parseFloat( border.x ), parseFloat( border.y ), parseFloat( border.z ));
				var outputvector = framevector.add(inputvector);
				drawcircleindicator(outputvector,"FBC_" + frame);
				optionoutput += '<option>' + frame + '</option>';
			}

			$('#fbc_output').html(optionoutput);
}


function cleanupFBC() {
	var borderlist = listobjects("borders");
	for (var border in borderlist) {
		if(borderlist[border].radius > 10) {
				removeEntity("FBC_" + borderlist[border].name);
				removeEntity("FBC_" + borderlist[border].name + "_label");
				removeEntity("FBC_" + borderlist[border].name + "_light");
				var index = misc_followers.indexOf("FBC_" + borderlist[border].name + "_label")
				if (index > -1 ) { misc_followers.splice(index, 1);}
		}
		removeEntity("FBC_Galactic");
		removeEntity("FBC_Galactic_light");
		removeEntity("FBC_Galactic_label");
		var index = misc_followers.indexOf("FBC_Galactic_label")
		if (index > -1 ) { misc_followers.splice(index, 1);}


	}
	$('#fbc_output').html("");
}


function netNewContact(data,su=false){
			var contactPos = new THREE.Vector3;
			var deltaPos = new THREE.Vector3;
			var detectingBase = data[2];
			if ( su == true) { var distance = pc2su(  data[7] ); }
			else { var distance = data[7]; }
			detectingBase = detectingBase.replaceAll('<','[');
			detectingBase = detectingBase.replaceAll('>',']');
			var detectingObject = scene.getObjectByName(detectingBase);
			var azmuth_rad = radians( data[5] );
			var pitch_rad = radians( data[6] );

			deltaPos.x = distance * Math.cos( azmuth_rad ) * Math.cos( pitch_rad );
			deltaPos.y = distance * Math.sin( pitch_rad );
			deltaPos.z = distance * Math.sin( azmuth_rad )  * Math.cos( pitch_rad );
			contactPos = deltaPos.add( detectingObject.position );

			drawShip(contactPos,detectingBase+"_" + data[5]);

			setTimeout(function() {
				removeEntity(detectingBase+"_" + data[5]);
			},600000);
			return detectingBase + "_" + data[5];
}

function parseSenNetData(data, text) {
	var contact_1 = /<(.+)\|(.+)> (\w+) contact (\w+) \((\d+)\) B: (\d+) (\d+) @: \[(\d+.+)\]/g;
	var contact_2 = /<(.+)\|(.+)> New contact (.+) \((\d+)\) B: (\d+) (\d+) @: \[(\d+.+)\]/g;
	var contact_3 = /<(.+)\|(.+)> New contact (.+) \((\d+)\) B: (\d+) (\d+) @: (\d+.+)/g;
	var contact_4 = /<(.+)\|(.+)> (\w+) contact (\w+) \((\d+)\) B: (\d+) (\d+) @: (\d+.+)/g;
	var unkcontact = contact_1.exec( data[0] );
	var newcontact = contact_2.exec( data[0] );
	var newcontact_su = contact_3.exec( data[0] );
	var unkcontact_su = contact_4.exec( data[0] );

	if( newcontact !== null ) {
		var shipobject = netNewContact( newcontact );
		console.log( newcontact )
	} else if ( unkcontact !== null ) {
		var shipobject = netNewContact ( unkcontact );
		console.log( unkcontact )
	} else if ( newcontact !== null ){
		var shipobject = netNewContact ( newcontact_su, true);
		console.log( newcontact_su )
	} else if ( unkcontact_su !== null ){
		var shipobject = netNewContact ( unkcontact_su, true);
		console.log( unkcontact_su )
	}

	if (  shipobject !== undefined ) {
			console.log(data)
			var linkElement = document.createElement('a');
			linkElement.innerHTML = "[" + data[1] + "|" + data[2] + "] " + data[3]
			linkElement.setAttribute('onClick','zoomfocus("' + shipobject  + '")');
			console.log(linkElement)
			return linkElement;
	}
}
