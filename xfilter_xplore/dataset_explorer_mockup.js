//# dc.js Getting Started and How-To Guide
'use strict';

// todo move this to a resource file under data
var schema = {
    "dimensions": [
        {
            "column": "month"
        },
        {
            "column": "category"
        },
        {
            "column": "region"
        },
        {
            "column": "customer"
        },
        {
            "column": "salesperson"
        }
    ],
    "groupBy": ["sales", "m_gm"],
    "measure" : "m_sales"
};

d3.csv('data/2014_SALES.csv', function (data) {
    /* since its a csv file we need to format the data a bit */

    //### Create Crossfilter Dimensions and Groups
    //See the [crossfilter API](https://github.com/square/crossfilter/wiki/API-Reference) for reference.
    var ndx2 = crossfilter(data);

    var dimensionProviders = schema.dimensions.map( function(schema) {
        return {
            "column" : schema.column,
            "handler" : function(d) { return d[schema.column]; }
        }
    });

    // dimension by month
    var dim_month = ndx2.dimension(function (d) {
        return d.month;
    });

    // group by
    var m_month_sales = dim_month.group().reduceSum(function (d) {
        if (d.m_sales != "NULL") {
            return d.m_sales;
        }
        else {
            return 0;
        }

    });

    var dimensions = {};
    var groups = {};
    dimensionProviders.forEach(function(dimensionProvider) {
        var dimension = ndx2.dimension(dimensionProvider.handler);
        var dimensionName = "dim_" + dimensionProvider.column;
        dimensions[dimensionName] = dimension;
        console.log(dimensionName);
        schema.groupBy.forEach( function(groupByColumn) {
            var groupName = "m_" + dimensionProvider.column + "_" + groupByColumn;
            console.log(groupName);
            groups[groupName] = dimension.group().reduceSum(function (d) {
                if (d[groupByColumn] != "NULL") {
                    return d[schema.measure];
                }
                else {
                    return 0;
                }
            })
        })

    });

    var test = m_month_sales.top(Infinity);

    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    createCompositeChart("#graph1", dimensions.dim_month, groups.m_month_sales, groups.m_month_m_gm, months, 600, 240, 30, 12, 1);

    createCompositeChart("#graph2", dimensions.dim_salesperson, groups.m_salesperson_sales, groups.m_salesperson_m_gm, null, 726
        , 240, 30, 15, 2);

    createCompositeChart("#graph3", dimensions.dim_customer, groups.m_customer_sales, groups.m_customer_m_gm, null, 930
        , 240, 26.5, 22, 3);

    createCompositeChart("#graph4", dimensions.dim_category, groups.m_category_sales, groups.m_category_m_gm, null, 840
        , 240, 29, 18, 4);

    createCompositeChart("#graph5", dimensions.dim_region, groups.m_region_sales, groups.m_region_m_gm, null, 410
        , 240, 30, 12, 5);

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
                    ;
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
                            ;
                        }
                    }

                });
            }

        };
    })(group2);


    var composite = dc.compositeChart(targetDiv);

    /*        var vals;
     if (!axisVals) {
     vals = filteredGroup.all().map(function (d) {
     return d.key; });

     }
     else {
     vals = axisVals;
     }*/

    var clicked;
    var c1 = dc.barChart(composite)
    //  .dimension(dim_month)
        .gap(gap)
        // .margins({left: 222})
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

        ///.elasticX(true)
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
