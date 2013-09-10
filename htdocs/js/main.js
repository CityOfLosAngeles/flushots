(function($,TkMap,FusionTable,Flushots){
	/**
	 * @classDescription - Default settings for this application
	 * @class - Default
	 */
	var Default = {
		// City
		city:'Chicago',
		// DOM ID of where the Google Map is rendered
		domid:'map',
		// Google Fusion Tables URI
		fturl:'https://www.googleapis.com/fusiontables/v1/query',
		// Google maps API key
		googlemapsapikey:'***REMOVED***',
		// Google Fusion Tables SQL-like query string for school location data
		eventquery:'SELECT * FROM 1GmmKriTo3aXmM15-fl8q7J1mT1g8IyCm4C6tD-c',
		// infobox.js options
		infoboxoptions:{
			disableAutoPan: false,
			maxWidth: 0,
			pixelOffset: new google.maps.Size(-101, 0),
			zIndex: null,
			boxStyle: {
				background: "url('img/tipbox.gif') no-repeat",
				opacity: 0.92,
				width: "240px"
			},
			closeBoxMargin: "11px 4px 4px 4px",
			closeBoxURL: "img/close.gif",
			infoBoxClearance: new google.maps.Size(25, 60),
			visible: false,
			pane: "floatPane",
			enableEventPropagation: false
		},
		// Start center latutude of the Google map
		lat:41.875,
		// Start center longitude of the Google map
		lng:-87.6425,
		// State
		state:'Illinois',
		// Defined style types passed to TkMap
		styles:'grey minlabels',
		// Initial zoom level for the Google map
		zoom:12,
		// Zoom for finding address
		zoomaddress:13
	};
	
	/* 
	 * jQuery's 'on document ready' function
	 * Run this after the DOM is fully loaded.
	 */
	$(function(){
		/**
		 * @classDescription - Construct the Map object
		 * @class - Map
		 */
		var Map = new TkMap({
			domid:Default.domid,
			init:true,
			lat:Default.lat,
			lng:Default.lng,
			styles:Default.styles,
			zoom:Default.zoom
		}); // END Map object constructor
		
		/**
		 * The Flushot application object
		 */
		var Flu = new Flushots(Default.infoboxoptions);
		
		if(Flu.geolocate)
		{
			var FindMeDiv = document.createElement('div');
			Flu.setFindMeControl(FindMeDiv,Map,Flu);
			FindMeDiv.index = 1;
			Map.Map.controls[google.maps.ControlPosition.TOP_RIGHT].push(FindMeDiv);
		}
		
		// Get the flu shot event data from the Google Fusion Table
		var EventsFT = new FusionTable(Default.fturl,Default.eventquery,Default.googlemapsapikey);
		$.getJSON(EventsFT.url, {
			dataType: 'jsonp',
			timeout: 5000
		})
		.done(function (ftdata) {
			EventsFT.columns = ftdata.columns;
			EventsFT.rows = ftdata.rows;
			Flu.getEvents(EventsFT.columns,EventsFT.rows,Map);
			// Highlight all today's and upcoming events.
			Flu.setMarkersByDay('all');
		})
		.fail(function(){
			alert('Oh, no! We are having trouble getting the information we need from storage.');
		});
		/*
		 * The brand popover
		 */
		$('#nav-brand').popover({
			placement:'top',
			title:'<b>Get A Flu Shot Help</b>',
			html:true,
			content:'<small>This is some <b>help</b> text. Bacon turducken t-bone tri-tip jowl biltong pork belly kielbasa drumstick venison short loin. Shoulder andouille strip steak filet mignon meatball, ham short loin swine chuck brisket. Ground round tenderloin meatball shank. Pork loin strip steak short loin shank turducken tenderloin chicken ball tip corned beef ground round spare ribs. Shank ham chicken turkey, doner meatloaf tri-tip beef ribs cow tenderloin pork chop. Jowl frankfurter ground round, tail swine filet mignon salami fatback leberkas.</small>'
		}); // END brand popover
		
		/*
		 * The agency popover
		 */
		$('#nav-agency').popover({
			placement:'top',
			title:'<b>About This Web App</b>',
			html:true,
			content:'<small>Built by <a href="http://about.me/tomkompare" target="_blank">Tom Kompare</a>. This was not developed by the <a href="http://www.cityofchicago.org/city/en/depts/cdph.html" target="_blank">Chicago Department of Public Health (CDPH)</a> and CDPH makes no representations as to the accuracy of the information provided by this map application. <a href="https://github.com/tkompare/flushots2013" target="_blank">The code behind this web application</a> is free and open under an MIT License. <a href="https://github.com/tkompare/flushots2013/issues" target="_blank">Feel free to send me comments</a>.</small>'
		}); // END brand popover
		
		/*
		 * The Day dropup list listener
		 */
		$('.day').change(function(){
			
			// Change the UI
			$('#nav-li-today').removeClass('active');
			$('#nav-li-days').addClass('active');
			$('#nav-days-text').text($(this).val());
			if($('#navbar-button').is(':visible'))
			{
				$('#navbar-button').click();
			}
			
			// Select the day's events
			Flu.setMarkersByDay($(this).val());
			
		}); // END Day dropup listener
		
		$('#nav-today').click(function(){
			
			// Change the UI
			$('#nav-li-days,.day-btn').removeClass('active');
			$('#nav-li-today').addClass('active');
			$('#nav-days-text').text('On A Day');
			if($('#navbar-button').is(':visible'))
			{
				$('#navbar-button').click();
			}
			
			// Selected today's events
			Flu.setMarkersByDay('today');
			
		}); // END Day dropup listener
		
		$('#nav-address').change(function(){
			if($(this).val().length === 0)
			{
				if(Flu.AddressMarker !== null)
				{
					Flu.AddressMarker.setMap(null);
				}
			}
		});
		
		// Go button listener
		$('#nav-go').click(function(){
			if($('#nav-address').val().length > 0)
			{
				var Geocoder = new google.maps.Geocoder();
				Geocoder.geocode(
					{
						address:$('#nav-address').val()+', '+Default.city+', '+Default.state
					},
					// Google returned a status
					function(Results, Status)
					{
						// Google returned an OK status
						if (Status == google.maps.GeocoderStatus.OK)
						{
							// Google returned a location
							if (Results[0])
							{
								Map.Map.panTo(Results[0].geometry.location);
								Map.Map.setZoom(Default.zoomaddress);
								// Make a map marker if none exists yet
								if(Flu.AddressMarker === null)
								{
									Flu.AddressMarker = new google.maps.Marker({
										position:Results[0].geometry.location,
										map: Map.Map,
										icon:'/img/red-dot.png',
										clickable:false
									});
								}
								else
								{
									// Move the marker to the new location
									Flu.AddressMarker.setPosition(Results[0].geometry.location);
									// If the marker is hidden, unhide it
									if(Flu.AddressMarker.getMap() === null)
									{
										Flu.AddressMarker.setMap(Map.Map);
									}
								}
								if($('#navbar-button').is(':visible'))
								{
									$('#navbar-button').click();
								}
							}
							else
							{
								// Google didn't return a location
								alert('Sorry! We couldn\'t find that address.');
							}
						}
						else
						{
							// Google didn't return an OK status
							alert('Sorry! We couldn\'t find that address.');
						}
					}
				);
			}
			else
			{
				// Dude. The 'nav-address' input is empty
				alert('Please enter a Chicago street address in the box next to the "Go" button in the bottom navigation bar.');
			}
		}); // END Go button listener
		
		// Find me button listener
		$('body').on('click','#address-gps',function(){
			_gaq.push(['_trackEvent', 'Find Me Button', 'Click']);
			if(navigator.geolocation)
			{
				navigator.geolocation.getCurrentPosition(
					// Success
					function(position)
					{
						_gaq.push(['_trackEvent', 'GPS', 'Success']);
						var latlng = new google.maps.LatLng(
							position.coords.latitude,
							position.coords.longitude
						);
						codeLatLng(latlng);
					},
					// Failure
					function()
					{
						alert('We\'re sorry. We could not find you. Please type in an address.');
					},
					{
						timeout:5000,
						enableHighAccuracy:true
					}
				);
			}
		});
		
		$('body').on('click','.directions',function(){
			var theurl = 'http://www.google.com/maps?';
			if($('#nav-address').val() !== '')
			{
				theurl += 'saddr='+$('#nav-address').val()+' Chicago, IL&';
			}
			theurl += 'daddr='+this.Events[i].data.street1+' '+this.Events[i].data.city+', '+this.Events[i].data.state+' '+this.Events[i].data.postal_code;
			window.open(theurl);
		});
		
	}); // END jQuery on document ready
})(jQuery,TkMap,FusionTable,Flushots);