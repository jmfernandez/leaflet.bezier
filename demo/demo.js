$(function () {

    var map = L.map('map').setView([6.9270786, 79.861243], 3);

    L.tileLayer('https://cartodb-basemaps-c.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
        maxZoom: 18,
        id: 'mapbox.streets'
    }).addTo(map);


    var dash_straight = {
        color: 'rgb(145, 146, 150)',
        fillColor: 'rgb(145, 146, 150)',
        dashArray: 8,
        opacity: 0.8,
        weight: '2',
    };

    let bez = L.bezier({
        path: [
            [
                {lat: 7.8731, lng: 80.7718, slide: 'RIGHT_ROUND'},//Sri Lanka
                {lat: -25.2744, lng: 133.7751, slide: 'LEFT_ROUND'},//Australia
                {lat: 36.2048, lng: 138.2529}//Japan
            ],
            [
                {lat: 7.8731, lng: 80.7718, slide: 'RIGHT_ROUND'},//Sri Lanka
                {lat: 3.1390, lng: 101.6869}
            ],
            [
                {lat: 7.8731, lng: 80.7718, slide: 'RIGHT_ROUND',deep:"8"},//Sri Lanka
                {lat: 41.8719, lng: 12.5674}
            ],[
                {lat: -25.2744, lng: 133.7751},//Australia
                {lat: -40.9006, lng: 174.8860}//Japan
            ],
            [
                {lat: 7.8731, lng: 80.7718, slide: 'RIGHT_ROUND'},
                {lat: -18.7669, lng: 46.8691},
            ]
        ],

        icon: {
            path: "plane.png"
        }
    }, dash_straight);

    bez.eachLayer(function(layer) {
	layer.on({
		mouseover: function(e) {
			let layer = e.target;
			console.log(e);
			L.popup().setLatLng(e.latlng).setContent("Hola "+e.latlng.toString()).openOn(map);
			//
			//layer.bindTooltip("Hola").openTooltip();
		}
	});
	//console.log(layer);
	//layer.bindTooltip("Hola");
    });

    bez.addTo(map);
	
	var testGeo = {
		features: [
			{
				type: 'Feature',
				properties: {
					uno: 'dos',
					tres: 4
				},
				geometry: {
					type: 'LineString',
					coordinates: [
						[1.9684260940067402,41.482757260358255],
						[2.123007428710469,41.4805952548463],
						[1.9684260940067402,41.482757260358255]
					]
				}
			}
		]
	};
	L.bezierGeoJSON(testGeo,{
		style: dash_straight,
		onEachFeature: function(feature,layer) {
			layer.on({
				mouseover: () => console.log("Hola"),
				mouseout: () => console.log("Adios"),
				click: () => console.log("Ay!")
			});
		},
		icon: {
		    path: "plane.png"
		}
	}).addTo(map);
});
