function GeoPlot(plotData) {
	this.plotData = plotData;

	this.createPlot = function(colors, minVal, maxVal) {
		var colorScale = this.createColorScale(colors, minVal, maxVal);
		var canvas = this.createCanvas();
		var context = canvas.getContext('2d');
		var imageData = context.createImageData(
			plotData.w, plotData.h);
		var readings = plotData.readings;
		for (var i = 0; i < readings.length; i++) {
			var colorString = colorScale(readings[i]);
			console.log(readings[i] + "  :  " + colorString);
			this.setPixel(
				imageData,
				i,
				this.convertHexToRgb(colorString),
				255
			);
		}

		context.putImageData(imageData, 0, 0);
		return canvas;
	};

	this.createColorScale = function(colors, minVal, maxVal) {
		var colorDomain = d3.range(
				minVal, maxVal, (maxVal - minVal) / (colors.length - 1));
		colorDomain.push(maxVal);
		var colorScale = d3.scale
				.linear()
				.domain(colorDomain)
				.range(colors);
		return colorScale;
	};

	this.createCanvas = function() {
		var canvas = document.createElement('canvas');
		canvas.width = plotData.w;
		canvas.height = plotData.h;
		return canvas;
	};

	this.setPixel = function(imageData, i, colorObj, a) {
		index = i * 4;
		imageData.data[index+0] = colorObj.r;
		imageData.data[index+1] = colorObj.g;
		imageData.data[index+2] = colorObj.b;
		imageData.data[index+3] = a;
	};

	this.convertHexToRgb = function(colorString){
		/*Returns an object with red, green, and blue
		properties in decimal value*/

		//Replace hex prefixes if present
		colorString = colorString.replace("0x", "");
		colorString = colorString.replace("#", "");

		//Easier to visualize bitshifts in hex
		var rgb = parseInt(colorString, 16);

		//Extract rgb info
		var colorObj = new Object();
		colorObj.r = (rgb & (255 << 16)) >> 16;
		colorObj.g = (rgb & (255 << 8)) >> 8;
		colorObj.b = (rgb & 255);

		return colorObj;
	};
}

function GeoDataParser(callbackContext, callback) {
	var self = this;
	this.callbackContext = callbackContext;
	this.callback = callback;
	this.parseXyzUrl = function(url) {
		d3.text(url, this.parseXyzText);
	};

	this.parseXyzText = function(text) {
		var readingsXyz = d3.csv.parseRows(text, function(d) {
			console.log(d[1]);
			return {
			    x: parseInt(d[0]),
			    y: parseInt(d[1]) - 1,
			    z: parseFloat(d[2])
			};
		});
		var w = Math.round(d3.max(readingsXyz, function(d) { return d.x + 1; }));
		var h = Math.round(d3.max(readingsXyz, function(d) { return d.y; }));

		readings = Array.apply(null, Array(w*h)).map(Number.prototype.valueOf, NaN);

		var r;
		for (var i = 0; i < readingsXyz.length; i++) {
			r = readingsXyz[i];
			readings[r.y * w + r.x] = r.z;
		}

		self.callback.call(self.callbackContext, new PlotData(w, h, readings));
	};
}

function PlotData(w, h, readings) {
	this.w = w;
	this.h = h;
	this.readings = readings;
}
