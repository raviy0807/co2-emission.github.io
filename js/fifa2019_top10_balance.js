var c_data = [{
    "name": "United States",
    "points": "(56.6%)",
    "rank":": 1st "
}, {
    "name": "Switzerland",
    "points": "(37.3%)",
    "rank":": 2nd "
},{
    "name": "Germany",
    "points": "(36.67%)",
    "rank":": 3rd "
},{
    "name": "France",
    "points": "(35.8%)",
    "rank":": 4th "
},{
    "name": "Austria",
    "points": "(31.98%)",
    "rank":": 5th "
},{
    "name": "Denmark",
    "points": "(30.28%)",
    "rank":": 6th "
},{
    "name": "Portugal",
    "points": "(27.35%)",
    "rank":": 7th "
},{
    "name": "Sweden",
    "points": "(26.16%)",
    "rank":": 8th "
},{
    "name": "Iceland",
    "points": "(26.0%)",
    "rank":": 9th "
},{
    "name": "Canada",
    "points": "(25.64%)",
    "rank":": 10th "
},];


/**
 * ---------------------------------------
 * This demo was created using amCharts 4.
 * 
 * For more information visit:
 * https://www.amcharts.com/
 * 
 * Documentation is available at:
 * https://www.amcharts.com/docs/v4/
 * ---------------------------------------
 */

// Themes begin
am4core.useTheme(am4themes_animated);
// Themes end



var countryCodes = ["US", "CH", "DE","FR","AT","DK","PT","SE","IS","CA"];

var chart = am4core.create("chartdiv", am4maps.MapChart);


try {
	chart.geodata = am4geodata_worldHigh;
}
catch (e) {
	chart.raiseCriticalError(new Error("Map geodata could not be loaded. Please download the latest <a href=\"https://www.amcharts.com/download/download-v4/\">amcharts geodata</a> and extract its contents into the same directory as your amCharts files."));
}

chart.projection = new am4maps.projections.Mercator();
chart.padding(10, 20, 10, 20);
chart.minZoomLevel = 0.9;
chart.zoomLevel = 0.9;
chart.maxZoomLevel = 1;

var polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());
polygonSeries.useGeodata = true;
polygonSeries.include = ["AF"];

var chart1 = am4core.create("hiddenchartdiv", am4maps.MapChart);
chart1.padding(10, 20, 10, 20);
chart1.geodata = am4geodata_worldHigh;
chart1.projection = new am4maps.projections.Mercator();

var polygonSeries1 = chart1.series.push(new am4maps.MapPolygonSeries());
polygonSeries1.useGeodata = true;
polygonSeries1.include = ["US"];

var label = chart.chartContainer.createChild(am4core.Label);
label.x = 100;
label.y = 100;
label.fill = am4core.color("#000000");
label.fontSize = 35;
label.fontWeight = "bold";
label.text = "United States";
label.fillOpacity = 0.2;

var slider = chart.createChild(am4core.Slider);
slider.padding(0, 15, 0, 60);
slider.background.padding(0, 15, 0, 60);
slider.marginBottom = 15;
slider.valign = "bottom";

var currentIndex = -1;
var colorset = new am4core.ColorSet();

setInterval(function () {
	var next = slider.start + 1 / countryCodes.length;
	if (next >= 1) {
		next = 0;
	}
	slider.animate({ property: "start", to: next }, 300);
}, 2000)

slider.events.on("rangechanged", function () {
	changeCountry();
})

function changeCountry() {
	var totalCountries = countryCodes.length - 1;
	var countryIndex = Math.round(totalCountries * slider.start);

	var morphToPolygon;

	if (currentIndex != countryIndex) {
		polygonSeries1.data = [];
		polygonSeries1.include = [countryCodes[countryIndex]];

		currentIndex = countryIndex;

		polygonSeries1.events.on("validated", function () {

			morphToPolygon = polygonSeries1.mapPolygons.getIndex(0);
			if(morphToPolygon){
				var countryPolygon = polygonSeries.mapPolygons.getIndex(0);

				var morpher = countryPolygon.polygon.morpher;
				var morphAnimation = morpher.morphToPolygon(morphToPolygon.polygon.points);

				var colorAnimation = countryPolygon.animate({ "property": "fill", "to": colorset.getIndex(Math.round(Math.random() * 20)) }, 1000);

				var animation = label.animate({ property: "y", to: 1000 }, 300);

				animation.events.on("animationended", function () {
					label.text = morphToPolygon.dataItem.dataContext["name"];
          label.text = label.text + "1";
					label.y = -50;
					label.animate({ property: "y", to: 200 }, 300, am4core.ease.quadOut);
				})
			}
		})
	}
}


