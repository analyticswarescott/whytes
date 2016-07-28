//# dc.js Getting Started and How-To Guide
'use strict';

// todo move this to a resource file under data
var schema = {
    "dimensions": [ "month", "category", "region", "customer", "salesperson" ],
    "groupBy": ["sales", "m_gm"],
    "metric": "m_sales",
    "charts": [
        {
            "id" : "graph1",
            "dimension" : "month",
            "group1" : [ "month", "sales"],
            "group2" : [ "month", "m_gm"],
            "axisValues" : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            "width" : 600,
            "height": 240,
            "gap" : 30,
            "topn" : 12,
            "chartNo" : 1
        },
        {
            "id" : "graph2",
            "dimension" : "customer",
            "group1" : [ "salesperson", "sales"],
            "group2" : [ "salesperson", "m_gm"],
            "width" : 726,
            "height": 240,
            "gap" : 30,
            "topn" : 15,
            "chartNo" : 2
        },
        {
            "id" : "graph3",
            "dimension" : "customer",
            "group1" : [ "customer", "sales"],
            "group2" : [ "customer", "m_gm"],
            "width" : 930,
            "height": 240,
            "gap" : 26.5,
            "topn" : 22,
            "chartNo" : 3
        },
        {
            "id" : "graph4",
            "dimension" : "category",
            "group1" : [ "category", "sales"],
            "group2" : [ "category", "m_gm"],
            "width" : 840,
            "height": 240,
            "gap" : 29,
            "topn" : 18,
            "chartNo" : 4
        },
        {
            "id" : "graph5",
            "dimension" : "region",
            "group1" : [ "region", "sales"],
            "group2" : [ "region", "m_gm"],
            "width" : 410,
            "height": 240,
            "gap" : 30,
            "topn" : 12,
            "chartNo" : 5
        }
    ]
};

d3.csv('data/2014_SALES.csv', function (data) {
    /* since its a csv file we need to format the data a bit */
    //### Create Crossfilter Dimensions and Groups
    //See the [crossfilter API](https://github.com/square/crossfilter/wiki/API-Reference) for reference.
    var ndx2 = crossfilter(data);

    // define dimensions and groups from schema and data
    var dimensions = {};
    var groups = {};
    schema.dimensions.forEach(function (column) {
        var handler = function (d) { return d[column]; };
        var dimension = ndx2.dimension(handler);
        var dimensionName = "dim_" + column;
        dimensions[dimensionName] = dimension;
        schema.groupBy.forEach(function (groupByColumn) {
            var groupName = "m_" + column + "_" + groupByColumn;
            groups[groupName] = dimension.group().reduceSum(function (d) {
                if (d[groupByColumn] != "NULL") {
                    return d[schema.metric];
                }
                else {
                    return 0;
                }
            })
        })
    });

    // plot charts
    var test = groups.m_month_sales.top(Infinity);
    schema.charts.forEach( function(chart) {
        createCompositeChart(
            "#" + chart.id,
            dimensions["dim_" + chart.dimension],
            groups[ "m_" + chart.group1[0] + "_" + chart.group1[1] ],
            groups[ "m_" + chart.group2[0] + "_" + chart.group2[1] ],
            chart.axisValues,
            chart.width,
            chart.height,
            chart.gap,
            chart.topn,
            chart.chartNo
        );
    });

    createDataGrid("#test", dimensions.dim_month, groups.m_month_sales);

    dc.renderAll();
});

function redrawExcept(chartNo) {
    // dc.renderAll();
}

function createCompositeChart(targetDiv, dimension, group1, group2, axisVals, w, h, gap, topn, chartNo) {
    var filteredGroup = (function (source_group) {
        return {
            all: function () {
                return source_group.top(topn).filter(function (d) {
                    return d.key;
                });
            }
        };
    })(group1);

    //make sure second group follows first, not top 10 as it could be different
    var filteredGroup2 = (function (source_group) {
        return {
            all: function () {
                return source_group.all().filter(function (d) {
                    for (var i = 0; i < filteredGroup.all().length; i++) {
                        if (filteredGroup.all()[i].key === d.key) {
                            return d.key;
                        }
                    }
                });
            }
        };
    })(group2);

    var composite = dc.compositeChart(targetDiv);
    var clicked;
    var c1 = dc.barChart(composite)
        .gap(gap)
        .group(filteredGroup)
        .colors('lightsteelblue')
        .on('filtered', function (chart, filter) {
            redrawExcept(chartNo);
        });

    var c2 = dc.barChart(composite)
        .gap(gap)
        .centerBar(true)
        .group(filteredGroup2)
        .colors('green');

    composite
        .width(w)
        .height(h)
        ._rangeBandPadding(-0.5)
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

    composite.compose([c1, c2])
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
        //d3.event.stopPropagation();
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
