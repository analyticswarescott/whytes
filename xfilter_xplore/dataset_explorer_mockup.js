//# dc.js Getting Started and How-To Guide
'use strict';

// todo move this to a resource file under data
var schema_whytes = {
    "title": "Whytes",
    "source": "data/2014_SALES.csv",
    "measures": [
        {
            "id": "m_sales",
            "name" : "Gross Sales"
        },
        {
            "id": "m_gm",
            "name" : "Gross Margin"
        }
    ],
    "charts": [
        {
            "name": "By Month",
            "dimension" : "month",
            "measure1" : "m_sales",
            "axisValues" : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            "width" : 600,
            "height": 240,
            "gap" : 30,
            "topn" : 12,
            "gsX" : 0,
            "gxY" : 0,
            "gsWidth" : 4,
            "gsHeight" : 3
        },
        {
            "name": "By Salesperson",
            "dimension" : "salesperson",
            "measure1" : "m_sales",
            "width" : 726,
            "height": 240,
            "gap" : 30,
            "topn" : 15,
            "gsX" : 4,
            "gxY" : 0,
            "gsWidth" : 4,
            "gsHeight" : 3
        },
        {
            "name": "By Region",
            "dimension" : "region",
            "measure1" : "m_sales",
            "width" : 930,
            "height": 240,
            "gap" : 26.5,
            "topn" : 22,
            "gsX" : 9,
            "gxY" : 0,
            "gsWidth" : 4,
            "gsHeight" : 3
        },
        {
            "name": "By Customer Group",
            "dimension" : "customer",
            "measure1" : "m_sales",
            "width" : 840,
            "height": 240,
            "gap" : 29,
            "topn" : 18,
            "gsX" : 0,
            "gxY" : 4,
            "gsWidth" : 4,
            "gsHeight" : 3
        }
    ]
};

var schema_cordova = {
    "title": "Cordova",
    "source": "data/cordova_dealer_ds/data-table.csv",
    "measures" : [
        {
            "id": "number_of_rounds",
            "name" : "Number of Rounds"
        },
        {
            "id": "fees_collected",
            "name" : "Feeds Collected"
        },
        {
            "id": "dealer_error_count",
            "name" : "Dealer Error Count"
        }
    ],
    "charts": [
        {
            "name": "By Dealer",
            "dimension" : "dealer",
            "measure1" : "dealer_error_count",
            "width" : 600,
            "height": 240,
            "gap" : 30,
            "topn" : 12,
            "gsX" : 0,
            "gxY" : 4,
            "gsWidth" : 6,
            "gsHeight" : 3
        },
        {
            "name": "By Table Name",
            "dimension" : "table_name",
            "measure1" : "dealer_error_count",
            "width" : 500,
            "height": 240,
            "gap" : 30,
            "topn" : 15,
            "gsX" : 6,
            "gxY" : 4,
            "gsWidth" : 6,
            "gsHeight" : 3
        },
        {
            "name": "By Game Day",
            "dimension" : "game_day",
            "measure1" : "dealer_error_count",
            "width" : 930,
            "height": 240,
            "gap" : 26.5,
            "topn" : 22,
            "gsX" : 0,
            "gxY" : 0,
            "gsWidth" : 9,
            "gsHeight" : 3
        }
    ]
};

var dimensions = {};
var groups = {};
var ndx2;

function getDimension(schema, column) {
    var dimensionName = "dim_" + column;
    var dimension = dimensions[dimensionName];
    if ( dimension ) {
        return dimension;
    }

    var handler = function (d) { return d[column]; };
    dimension = ndx2.dimension(handler);
    dimensions[dimensionName] = dimension;

    return dimension;
}

function getGroup(schema, dimensionColumn, measureColumn, metric) {
    var dimension = getDimension(schema, dimensionColumn);
    if ( !dimension ) {
        return;
    }

    var groupName = "m_" + dimensionColumn + "_" + measureColumn + "_" + metric;
    var group = groups[groupName];
    if ( group ) {
        return group;
    }

    group = dimension.group().reduceSum(function (d) {
        if (d[measureColumn] != "NULL") {
            return d[measureColumn];
        }
        else {
            return 0;
        }
    });

    groups[groupName] = group;

    return group;
}

function setupGraphs(schema) {
    d3.csv(schema.source, function (data) {
        ndx2 = crossfilter(data);
        // plot charts
        var chartNumber = 0;
        schema.charts.forEach( function(chart) {
            var chartId = "graph" + ++chartNumber;

            var template = cloneTemplate(
                chart.gsX, chart.gsY,
                chart.gsWidth, chart.gsHeight,
                chart.name, chartId);

            $(".grid-stack").prepend( template );

            createSingleMeasureChart(
                "#" + chartId,
                getDimension(schema, chart.dimension),
                getGroup(schema, chart.dimension, chart.measure1, schema.metric),
                chart.axisValues,
                chart.width,
                chart.height,
                chart.gap,
                chart.topn,
                chartNumber
            );
        });

        dc.renderAll();
    });

    // setup title
    $(".title").text(schema.title)

    // setup measures
    schema.measures.forEach( function(measure) {
        var option = $("<option/>");
        option.attr("value", measure.id);
        option.text(measure.name)
        $(".measures").append(option);
    })
}


function redrawExcept(chartNo) {
    // dc.renderAll();
}

function createSingleMeasureChart(targetDiv, dimension, group1, axisVals, w, h, gap, topn, chartNo) {
    var filteredGroup = (function (source_group) {
        return {
            all: function () {
                return source_group.top(topn).filter(function (d) {
                    return d.key;
                });
            }
        };
    })(group1);

    var composite = dc.compositeChart(targetDiv);
    var clicked;
    var c1 = dc.barChart(composite)
        .gap(gap)
        .group(filteredGroup)
        .colors('lightsteelblue')
        .on('filtered', function (chart, filter) {
            redrawExcept(chartNo);
        });

    composite
        .width(w)
        .height(h)
        .dimension(dimension);

    //months don't change for now to allow the ordering to work
    if (!axisVals) {
        composite.x(d3.scale.ordinal().domain(filteredGroup.all().map(function (d) {
            return d.key;
        })))
    }
    else {
        composite.x(d3.scale.ordinal().domain(axisVals));
    }

    composite.compose([c1])
        .xUnits(dc.units.ordinal)
        .mouseZoomable(true)
        .on('postRedraw', function (chart) {
            clicked = null;
        })
        .elasticY(true)
        .brushOn(false);

    composite.yAxis().tickFormat(function (d) {
        var prefix = d3.formatPrefix(d);
        return prefix.scale(d) + prefix.symbol;
    });

    composite.yAxis().tickSize(2);

    composite.renderlet(function (chart) {
        chart.selectAll("g._1").attr("transform", "translate(" + (22 + (gap - 30)) + ", 0)");
    });

    if (!axisVals) { //rotate non-month
        composite.renderlet(function (chart) {
            chart.selectAll("g.x text")
                .attr('dx', '-5')
                .attr('transform', "rotate(-15)");
        });
    }

    return composite;
}

function createDataGrid(targetDiv, dimension, group) {
    var grid = d3.divgrid();
    d3.csv('data/month_pivot.csv', function (data) {
        d3.select(targetDiv)
            .datum(data)
            .call(grid)
    });
}

var gridvis = false;
function toggleGrid() {
    var grid = document.getElementById('test');
    if (gridvis) {
        grid.style.display = 'none';
        gridvis = false
    }
    else {
        grid.style.display = 'block';
        gridvis = true;
    }
}

function cloneTemplate(gsX, gsY, gsWidth, gsHeight, title, id) {
    var template = $(".grid-stack-item-template").clone()
    template.removeClass("grid-stack-item-template");
    template.attr("data-gs-x", gsX);
    template.attr("data-gs-y", gsY);
    template.attr("data-gs-width", gsWidth);
    template.attr("data-gs-height", gsHeight);
    template.find(".item-title").text(title);
    template.find(".grid-stack-item-content .graphContent").attr("id", id);
    template.addClass("grid-stack-item");

    return template;
}