L.SVG.include({
    _updatecurve: function (layer) {
        let svg_path = this._curvePointsToPath(layer._points);
        this._setPath(layer, svg_path);

        if (layer.options.animate) {
            let path = layer._path;
            let length = path.getTotalLength();

            if (!layer.options.dashArray) {
                path.style.strokeDasharray = length + ' ' + length;
            }

            if (layer._initialUpdate) {
                path.animate([
                    {strokeDashoffset: length},
                    {strokeDashoffset: 0}
                ], layer.options.animate);
                layer._initialUpdate = false;
            }
        }

        return svg_path;
    },


    _curvePointsToPath: function (points) {
        let point, curCommand, str = '';
        for (let i = 0; i < points.length; i++) {
            point = points[i];
            if (typeof point === 'string' || point instanceof String) {
                curCommand = point;
                str += curCommand;
            } else
                str += point.x + ',' + point.y + ' ';


        }
        return str || 'M0 0';
    },

});

let Bezier = L.Path.extend({
    options: {
	delay: {
		midway: 2000,
		end: 7000
	},
	stopAt: 'three',
	loops: 0,
    },
    initialize: function (path, icon, options) {

        if (!path.mid || path.mid[0] === undefined) {
            path.mid = this.getMidPoint(path.from, path.to, (path.from.deep ? path.from.deep : 4), path.from.slide);
        }

        L.setOptions(this, options);
        this._initialUpdate = true;
        this.setPath(path);
        this.icon = icon;

    },
    //Juast after path is added
    onAdd: function (map) {
        this._renderer._initPath(this);
        this._reset();
        this._renderer._addPath(this);

        // TODO ajust plane acording to zoom
        map.on('zoom', function () {

        });

    },
    setAnimatePlane: function (path) {

        let self = this;

        if (this.spaceship_img)
            this.spaceship_img.remove();

        let SnapSvg = Snap('.leaflet-overlay-pane>svg');

        let spaceship_img = this.spaceship_img = SnapSvg.image(this.icon.path).attr({
            visibility: "hidden"
        });


        let spaceship = SnapSvg.group(spaceship_img);
        let flight_path = SnapSvg.path(path).attr({
            'fill': 'none',
            'stroke': 'none'
        });

        let full_path_length = Snap.path.getTotalLength(flight_path);
        let half_path_length = full_path_length / 2;
        let third_path_length = full_path_length / 3;
        let forth_path_length = full_path_length / 4;
	
	let midway_length = forth_path_length;
	let endway_length = half_path_length;
	
	let stopAt = this.options.stopAt ? this.options.stopAt : 'three';
	if(this.options.stopAt) {
		switch(this.options.stopAt) {
			case 'four':
				midway_length = third_path_length;
				endway_length = third_path_length*2;
				break;
			case 'six':
				midway_length = half_path_length;
				endway_length = full_path_length;
				break;
			case 'three':
			default:
				midway_length = forth_path_length;
				endway_length = half_path_length;
				break;
		}
	}

        let width = forth_path_length / this._map.getZoom();
        let height = forth_path_length / this._map.getZoom();

        width = Math.min(Math.max(width, 30), 64);
        height = Math.min(Math.max(height, 30), 64);


        let last_step = 0;
	
	let animationMidway = (this.options.delay && this.options.delay.midway) ? this.options.delay.midway : 2500;
	let animationEnd = (this.options.delay && this.options.delay.end) ? this.options.delay.end : 7000;
	let loops = (Number.isInteger(this.options.loops) && this.options.loops > 0) ? this.options.loops : 0;
	let doAnimation;
	doAnimation = (loops,midway_length,endway_length,animationMidway,animationEnd) => {
		Snap.animate(0, midway_length, function (step) {

		    //show image when plane start to animate
		    spaceship_img.attr({
			visibility: "visible"
		    });

		    spaceship_img.attr({width: width, height: height, class: self.icon.class});

		    last_step = step;

		    let moveToPoint = Snap.path.getPointAtLength(flight_path, step);

		    let x = moveToPoint.x - (width / 2);
		    let y = moveToPoint.y - (height / 2);


		    spaceship.transform('translate(' + x + ',' + y + ') rotate(' + (moveToPoint.alpha - 90) + ', ' + width / 2 + ', ' + height / 2 + ')');

		}, animationMidway, mina.easeout, function () {

		    Snap.animate(midway_length, endway_length, function (step) {

			last_step = step;
			let moveToPoint = Snap.path.getPointAtLength(flight_path, step);

			let x = moveToPoint.x - width / 2;
			let y = moveToPoint.y - height / 2;
			spaceship.transform('translate(' + x + ',' + y + ') rotate(' + (moveToPoint.alpha - 90) + ', ' + width / 2 + ', ' + height / 2 + ')');
		    }, animationEnd, mina.easein, function () {
			//done
			if(loops > 0) {
				setTimeout(doAnimation,10,loops-1,midway_length,endway_length,animationMidway,animationEnd);
			}
		    });

		});
	};
	
	doAnimation(loops,midway_length,endway_length,animationMidway,animationEnd);


    },
    getPath: function () {
        return this._coords;
    },
    setPath: function (path) {
        this._setPath(path);
        return this.redraw();
    },
    getBounds: function () {
        return this._bounds;
    },
    getMidPoint: function (from, to, deep, round_side = 'LEFT_ROUND') {

        let offset = Math.PI;

        if (round_side === 'RIGHT_ROUND')
            offset = offset * -1;

        let latlngs = [];

        let latlng1 = from,
            latlng2 = to;

        let offsetX = latlng2.lng - latlng1.lng,
            offsetY = latlng2.lat - latlng1.lat;

        let r = Math.sqrt(Math.pow(offsetX, 2) + Math.pow(offsetY, 2)),
            theta = Math.atan2(offsetY, offsetX);

        let thetaOffset = (offset / (deep ? deep : 4));

        let r2 = (r / 2) / (Math.cos(thetaOffset)),
            theta2 = theta + thetaOffset;

        let midpointX = (r2 * Math.cos(theta2)) + latlng1.lng,
            midpointY = (r2 * Math.sin(theta2)) + latlng1.lat;

        let midpointLatLng = [midpointY, midpointX];

        latlngs.push(latlng1, midpointLatLng, latlng2);

        return midpointLatLng;
    },
    _setPath: function (path) {
        this._coords = path;
        this._bounds = this._computeBounds();
    },
    _computeBounds: function () {

        let bound = new L.LatLngBounds();

        bound.extend(this._coords.from);
        bound.extend(this._coords.to);//for single destination
        bound.extend(this._coords.mid);

        return bound;
    },
    getCenter: function () {
        return this._bounds.getCenter();
    },
    _update: function () {
        if (!this._map) {
            return;
        }
        this._updatePath();
    },
    _updatePath: function () {
        //animated plane
        let path = this._renderer._updatecurve(this);
        this.setAnimatePlane(path);
    },
    _project: function () {

        this._points = [];

        this._points.push('M');

        let curPoint = this._map.latLngToLayerPoint(this._coords.from);
        this._points.push(curPoint);

        if (this._coords.mid) {
            this._points.push('Q');
            curPoint = this._map.latLngToLayerPoint(this._coords.mid);
            this._points.push(curPoint);
        }
        curPoint = this._map.latLngToLayerPoint(this._coords.to);
        this._points.push(curPoint);


    },


});

L.bezier = function (config, options) {
    let paths = [];
    for (let i = 0; config.path.length > i; i++) {
        let last_destination = false;
        for (let c = 0; config.path[i].length > c; c++) {

            let current_destination = config.path[i][c];
            if (last_destination) {
                let path_pair = {from: last_destination, to: current_destination};
                paths.push(new Bezier(path_pair, config.icon, options));
            }

            last_destination = config.path[i][c];
        }
    }
    return L.layerGroup(paths);

};

var BezierGeoJSON = L.GeoJSON.extend({
	addData: function (geojson) {
		var features = L.Util.isArray(geojson) ? geojson : geojson.features,
		    i, len, feature;

		if (features) {
			// Delegating in the original method for the iteration
			return L.GeoJSON.prototype.addData.call(this,geojson);
		}
		
		var options = this.options;
		
		// Nothing to do
		if (options.filter && !options.filter(geojson)) { return this; }
		
		// Deciding whether to follow
		var geometry = geojson.type === 'Feature' ? geojson.geometry : geojson,
		    coords = geometry ? geometry.coordinates : null;

		// Nothing to do (again)
		if (!coords && !geometry) {
			return this;
		}
		
		if(geometry.type !== 'LineString') {
			// Delegating in the original method for anything different
			// to a LineString
			return L.GeoJSON.prototype.addData.call(this,geojson);
		}
		
		// This piece of code is only focused on LineString
		var layers = [],
		    pointToLayer = options && options.pointToLayer,
		    _coordsToLatLng = options && options.coordsToLatLng || L.GeoJSON.coordsToLatLng,
		    latlng, latlngs, i, len;
		
		latlngs = L.GeoJSON.coordsToLatLngs(coords, 0, _coordsToLatLng);

		var icon = undefined;
		if(features && features.icon) {
			icon = features.icon;
		} else if(options.style && options.style.icon) {
			icon = options.style.icon;
		} else if(options.icon) {
			icon = options.icon;
		}
		var style = options.style ? options.style : options;
		var bLayers = [];
		
		var prevLatLng = latlngs[0];
		latlngs.forEach((latlng,iLL) => {
			if(iLL > 0) {
				let bez = new Bezier({
						from: prevLatLng,
						to: latlng
					},
					icon,
					style
				);
				if (options.onEachFeature) {
					options.onEachFeature(geojson, bez);
				}
				bLayers.push(bez);
				prevLatLng = latlng;
			}
		});
		let layer = L.layerGroup(bLayers);
		layer.feature = L.GeoJSON.asFeature(geojson);
		
		layer.defaultOptions = layer.options;
		this.resetStyle(layer);
		
		if (options.onEachFeature) {
			options.onEachFeature(geojson, layer);
		}
		
		return this.addLayer(layer);
	},
});

function bezierGeoJSON(geojson, options) {
	return new BezierGeoJSON(geojson, options);
}

L.bezierGeoJSON = bezierGeoJSON;
