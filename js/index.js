/**
 * @author: Ravi Yadav
 * Reference: 
 * Assignment 4.1
 * https://www.amcharts.com/docs/v4/
 * 
 * ---------------------------------------
 */

// Themes begin
am4core.useTheme(am4themes_animated);
// Themes end



var chart = am4core.create("chartdiv", am4maps.MapChart);


try {
    chart.geodata = am4geodata_worldHigh;
}
catch (e) {
    chart.raiseCriticalError(new Error("Map geodata could not be loaded. Please download the latest <a href=\"https://www.amcharts.com/download/download-v4/\">amcharts geodata</a> and extract its contents into the same directory as your amCharts files."));
}

try{
chart.projection = new am4maps.projections.Mercator();
}
catch(e){
    chart.raiseCriticalError(new Error("Zoom out not working"));
}
// zoomout on background click
chart.chartContainer.background.events.on("hit", function () { zoomOut() });

var colorSet = new am4core.ColorSet();
var morphedPolygon;

// map polygon series (countries)
var polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());
polygonSeries.useGeodata = true;
// specify which countries to include
polygonSeries.include = ["US", "CN", "RU", "GB", "IN", "JP","DD", "FR", "CA", "PL"]

// country area look and behavior
var polygonTemplate = polygonSeries.mapPolygons.template;
polygonTemplate.strokeOpacity = 1;
polygonTemplate.stroke = am4core.color("#ffffff");
polygonTemplate.fillOpacity = 0.5;
polygonTemplate.tooltipText = "{name}";

// desaturate filter for countries
var desaturateFilter = new am4core.DesaturateFilter();
desaturateFilter.saturation = 0.25;
polygonTemplate.filters.push(desaturateFilter);

// take a color from color set
polygonTemplate.adapter.add("fill", function (fill, target) {
    return colorSet.getIndex(target.dataItem.index + 1);
})

// set fillOpacity to 1 when hovered
var hoverState = polygonTemplate.states.create("hover");
hoverState.properties.fillOpacity = 1;

// what to do when country is clicked
polygonTemplate.events.on("hit", function (event) {
    event.target.zIndex = 1000000;
    selectPolygon(event.target);
})

// Pie chart
var pieChart = chart.seriesContainer.createChild(am4charts.PieChart);
// Set width/heigh of a pie chart for easier positioning only
pieChart.width = 20;
pieChart.height = 20;
pieChart.hidden = true; // can't use visible = false!

// because defauls are 50, and it's not good with small countries
pieChart.chartContainer.minHeight = 1;
pieChart.chartContainer.minWidth = 1;

var pieSeries = pieChart.series.push(new am4charts.PieSeries());
pieSeries.dataFields.value = "value";
pieSeries.dataFields.category = "category";
pieSeries.data = [{ value: 100, category: "Proportion of Solid Fuel" }, { value: 20, category: "Proportion of Liquid Fuel" }, { value: 10, category: "Proportion of Gas Fuel" }];

var dropShadowFilter = new am4core.DropShadowFilter();
dropShadowFilter.blur = 4;
pieSeries.filters.push(dropShadowFilter);

var sliceTemplate = pieSeries.slices.template;
sliceTemplate.fillOpacity = 1;
sliceTemplate.strokeOpacity = 0;

var activeState = sliceTemplate.states.getKey("active");
activeState.properties.shiftRadius = 0; // no need to pull on click, as country circle under the pie won't make it good

var sliceHoverState = sliceTemplate.states.getKey("hover");
sliceHoverState.properties.shiftRadius = 0; // no need to pull on click, as country circle under the pie won't make it good

// we don't need default pie chart animation, so change defaults
var hiddenState = pieSeries.hiddenState;
hiddenState.properties.startAngle = pieSeries.startAngle;
hiddenState.properties.endAngle = pieSeries.endAngle;
hiddenState.properties.opacity = 0;
hiddenState.properties.visible = false;

// series labels
var labelTemplate = pieSeries.labels.template;
labelTemplate.nonScaling = true;
labelTemplate.fill = am4core.color("#FFFFFF");
labelTemplate.fontSize = 10;
labelTemplate.background = new am4core.RoundedRectangle();
labelTemplate.background.fillOpacity = 0.9;
labelTemplate.padding(4, 9, 4, 9);
labelTemplate.background.fill = am4core.color("#7678a0");

// we need pie series to hide faster to avoid strange pause after country is clicked
pieSeries.hiddenState.transitionDuration = 200;

// country label
var countryLabel = chart.chartContainer.createChild(am4core.Label);
countryLabel.text = "Select a country";
countryLabel.fill = am4core.color("#7678a0");
countryLabel.fontSize = 40;

countryLabel.hiddenState.properties.dy = 1000;
countryLabel.defaultState.properties.dy = 0;
countryLabel.valign = "middle";
countryLabel.align = "right";
countryLabel.paddingRight = 50;
countryLabel.hide(0);
countryLabel.show();

// select polygon
function selectPolygon(polygon) {
    if (morphedPolygon != polygon) {
        var animation = pieSeries.hide();
        if (animation) {
            animation.events.on("animationended", function () {
                morphToCircle(polygon);
            })
        }
        else {
            morphToCircle(polygon);
        }
    }
}

// fade out all countries except selected
function fadeOut(exceptPolygon) {
    for (var i = 0; i < polygonSeries.mapPolygons.length; i++) {
        var polygon = polygonSeries.mapPolygons.getIndex(i);
        if (polygon != exceptPolygon) {
            polygon.defaultState.properties.fillOpacity = 0.5;
            polygon.animate([{ property: "fillOpacity", to: 0.5 }, { property: "strokeOpacity", to: 1 }], polygon.polygon.morpher.morphDuration);
        }
    }
}

function zoomOut() {
    if (morphedPolygon) {
        pieSeries.hide();
        morphBack();
        fadeOut();
        countryLabel.hide();
        morphedPolygon = undefined;
    }
}

function morphBack() {
    if (morphedPolygon) {
        morphedPolygon.polygon.morpher.morphBack();
        var dsf = morphedPolygon.filters.getIndex(0);
        dsf.animate({ property: "saturation", to: 0.25 }, morphedPolygon.polygon.morpher.morphDuration);
    }
}

function morphToCircle(polygon) {


    var animationDuration = polygon.polygon.morpher.morphDuration;
    // if there is a country already morphed to circle, morph it back
    morphBack();
    // morph polygon to circle
    polygon.toFront();
    polygon.polygon.morpher.morphToSingle = true;
    var nn = 20;
    var morphAnimation = polygon.polygon.morpher.morphToCircle(20,20,(nn)=>10);
    debugger;
    polygon.strokeOpacity = 0; // hide stroke for lines not to cross countries

    polygon.defaultState.properties.fillOpacity = 1;
    polygon.animate({ property: "fillOpacity", to: 1 }, animationDuration);

    // animate desaturate filter
    var filter = polygon.filters.getIndex(0);
    filter.animate({ property: "saturation", to: 1 }, animationDuration);

    // save currently morphed polygon
    morphedPolygon = polygon;
debugger;
    // fade out all other
    fadeOut(polygon);

    // hide country label
    countryLabel.hide();

    if (morphAnimation) {
        morphAnimation.events.on("animationended", function () {
            zoomToCountry(polygon);
        })
    }
    else {
        zoomToCountry(polygon);
    }
}

function zoomToCountry(polygon) {
    var zoomAnimation = chart.zoomToMapObject(polygon, 2.2, true);
    if (zoomAnimation) {
        zoomAnimation.events.on("animationended", function () {
            showPieChart(polygon);
        })
    }
    else {
        showPieChart(polygon);
    }
}


function showPieChart(polygon) {
    polygon.polygon.measure();
    //var radius = polygon.polygon.measuredWidth / 2 * polygon.globalScale / chart.seriesContainer.scale;
    var radius = 20
    pieChart.width = radius * 2;
    pieChart.height = radius * 2;
    pieChart.radius = radius;

    var centerPoint = am4core.utils.spritePointToSvg(polygon.polygon.centerPoint, polygon.polygon);
    centerPoint = am4core.utils.svgPointToSprite(centerPoint, chart.seriesContainer);

    pieChart.x = centerPoint.x - radius;
    pieChart.y = centerPoint.y - radius;

    var fill = polygon.fill;
    var desaturated = fill.saturate(0.3);
    debugger;
    console.log(polygon);
    console.log(polygon.dataItem.dataContext.id);
    var match_i =0;
    for(var i=0;i<co2.length;i++){
        if(polygon.dataItem.dataContext.id == co2[i].id){
            console.log("Its a match!!")
            match_i = i;
            break;
        }
    }

    //++++++++++++++++++++++++++++++++++++++++++

    
    for (var i = 0; i < co2[match_i].pieData.length; i++) {
        var dataItem = pieSeries.dataItems.getIndex(i);
        dataItem.value = co2[match_i].pieData[i].value
        dataItem.slice.fill = am4core.color(am4core.colors.interpolate(
            fill.rgb,
            am4core.color("#ffffff").rgb,
            0.2 * i
        ));

        dataItem.label.background.fill = desaturated;
        dataItem.tick.stroke = fill;
    }

    //---------------------------------------------

    // for (var i = 0; i < pieSeries.dataItems.length; i++) {
    //     var dataItem = pieSeries.dataItems.getIndex(i);
    //     dataItem.value = Math.round(Math.random() * 100);
    //     dataItem.slice.fill = am4core.color(am4core.colors.interpolate(
    //         fill.rgb,
    //         am4core.color("#ffffff").rgb,
    //         0.2 * i
    //     ));

    //     dataItem.label.background.fill = desaturated;
    //     dataItem.tick.stroke = fill;
    // }

    pieSeries.show();
    pieChart.show();

    countryLabel.text = "{name}";
    debugger;
    countryLabel.dataItem = polygon.dataItem;
    countryLabel.fill = desaturated;
    countryLabel.show();
}

var co2 = [
    {
      "title": "UNITED STATES",
      "id":"US",
      "Proportion of Solid Fuel": 38512113,
      "Proportion of Liquid Fuel": 38029557,
      "Proportion of Gas Fuel": 17889219,
      "Sum of Total": 95419188,
      "latitude": 37.09024,
      "longitude": -95.712891,
      "height": 203,
      "width": 101.5,
      "pieData":[
        {
           "category":"Proportion of Solid Fuel",
           "value":38512113
        },
        {
         "category":"Proportion of Liquid Fuel",
         "value":38029557
      },
      {
       "category":"Proportion of Gas Fuel",
       "value":17889219
       }
      ]
    },
    {
      "id":"CN",
      "title": "CHINA",
      "Proportion of Solid Fuel": 36420543,
      "Proportion of Liquid Fuel": 6546080,
      "Proportion of Gas Fuel": 870621,
      "Sum of Total": 47604445,
      "latitude": 35.86166,
      "longitude": 104.195397,
      "height": 173,
      "width": 86.5,
      "pieData":[
        {
           "category":"Proportion of Solid Fuel",
           "value":36420543
        },
        {
         "category":"Proportion of Liquid Fuel",
         "value":6546080
      },
      {
       "category":"Proportion of Gas Fuel",
       "value":870621
       }
      ]
    },
    {
      "id":"RU",
      "title": "USSR/RUSSIA",
      "Proportion of Solid Fuel": 14618949,
      "Proportion of Liquid Fuel": 9889019,
      "Proportion of Gas Fuel": 5063003,
      "Sum of Total": 30225588,
      "latitude": 61.52401,
      "longitude": 105.318756,
      "height": 153,
      "width": 76.5,
      "pieData":[
        {
           "category":"Proportion of Solid Fuel",
           "value":14618949
        },
        {
         "category":"Proportion of Liquid Fuel",
         "value":9889019
      },
      {
       "category":"Proportion of Gas Fuel",
       "value":5063003
       }
      ]
    },
    {
      "id":"JP",
      "title": "JAPAN",
      "Proportion of Solid Fuel": 4617433,
      "Proportion of Liquid Fuel": 8092780,
      "Proportion of Gas Fuel": 1356984,
      "Sum of Total": 14585037,
      "latitude": 36.204824,
      "longitude": 138.252924,
      "height": 121,
      "width": 60.5,
      "pieData":[
        {
           "category":"Proportion of Solid Fuel",
           "value":4617433
        },
        {
         "category":"Proportion of Liquid Fuel",
         "value":8092780
      },
      {
       "category":"Proportion of Gas Fuel",
       "value":1356984
       }
      ]
    },
    {
      "id":"GB",
      "title": "UNITED KINGDOM",
      "Proportion of Solid Fuel": 9107116,
      "Proportion of Liquid Fuel": 3294319,
      "Proportion of Gas Fuel": 1602855,
      "Sum of Total": 14192244,
      "latitude": 55.378051,
      "longitude": -3.435973,
      "height": 120,
      "width": 60,
      "pieData":[
        {
           "category":"Proportion of Solid Fuel",
           "value":9107116
        },
        {
         "category":"Proportion of Liquid Fuel",
         "value":3294319
      },
      {
       "category":"Proportion of Gas Fuel",
       "value":1602855
       }
      ]
    },
    {
      "id":"IN",
      "title": "INDIA",
      "Proportion of Solid Fuel": 7563421,
      "Proportion of Liquid Fuel": 2710395,
      "Proportion of Gas Fuel": 396766,
      "Sum of Total": 11259646,
      "latitude": 20.593684,
      "longitude": 78.96288,
      "height": 110,
      "width": 55,
      "pieData":[
        {
           "category":"Proportion of Solid Fuel",
           "value":7563421
        },
        {
         "category":"Proportion of Liquid Fuel",
         "value":2710395
      },
      {
       "category":"Proportion of Gas Fuel",
       "value":396766
       }
      ]
    },
    {
      "id":"DD",
      "title": "GERMANY",
      "Proportion of Solid Fuel": 6239866,
      "Proportion of Liquid Fuel": 1980631,
      "Proportion of Gas Fuel": 1065143,
      "Sum of Total": 9420827,
      "latitude": 51.165691,
      "longitude": 10.451526,
      "height": 102,
      "width": 51,
      "pieData":[
        {
           "category":"Proportion of Solid Fuel",
           "value":6239866
        },
        {
         "category":"Proportion of Liquid Fuel",
         "value":1980631
      },
      {
       "category":"Proportion of Gas Fuel",
       "value":1065143
       }
      ]
    },
    {
      "id":"FR",
      "title": "FRANCE (INCLUDING MONACO)",
      "Proportion of Solid Fuel": 3500138,
      "Proportion of Liquid Fuel": 3622665,
      "Proportion of Gas Fuel": 816367,
      "Sum of Total": 8149542,
      "latitude": 46.227638,
      "longitude": 2.213749,
      "height": 96,
      "width": 48,
      "pieData":[
        {
           "category":"Proportion of Solid Fuel",
           "value":3500138
        },
        {
         "category":"Proportion of Liquid Fuel",
         "value":3622665
      },
      {
       "category":"Proportion of Gas Fuel",
       "value":816367
       }
      ]
    },
    {
      "id":"CA",
      "title": "CANADA",
      "Proportion of Solid Fuel": 2249074,
      "Proportion of Liquid Fuel": 3534328,
      "Proportion of Gas Fuel": 1849172,
      "Sum of Total": 7784127,
      "latitude": 56.130366,
      "longitude": -106.346771,
      "height": 94,
      "width": 47,
      "pieData":[
        {
           "category":"Proportion of Solid Fuel",
           "value":2249074
        },
        {
         "category":"Proportion of Liquid Fuel",
         "value":3534328
      },
      {
       "category":"Proportion of Gas Fuel",
       "value":1849172
       }
      ]
    },
    {
      "id":"PL",
      "title": "POLAND",
      "Proportion of Solid Fuel": 5234646,
      "Proportion of Liquid Fuel": 640475,
      "Proportion of Gas Fuel": 274322,
      "Sum of Total": 6263256,
      "latitude": 51.919438,
      "longitude": 19.145136,
      "height": 85,
      "width": 47,
      "pieData":[
        {
           "category":"Proportion of Solid Fuel",
           "value":5234646
       },
        {
         "category":"Proportion of Liquid Fuel",
         "value":640475
      },
      {
       "category":"Proportion of Gas Fuel",
       "value":274322
       }
      ]
    }]
