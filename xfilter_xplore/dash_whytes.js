//# dc.js Getting Started and How-To Guide
'use strict';
var composite = dc.compositeChart("#graph1") ;

var c0 =  dc.rowChart("#graph2");
var cCat =  dc.barChart("#graph3");

var cCust =  dc.barChart("#graph4");

dc.override(composite, "filterAll", function (d) {
            var g = this._filter(d);
           for (var i = 0; i < _children.length; ++i) {
                    var child = _children[i];

                        child.filter(d.key);
                }

                return g;
        });



d3.csv('data/2014_SALES.csv', function (data) {
    /* since its a csv file we need to format the data a bit */

    //### Create Crossfilter Dimensions and Groups
    //See the [crossfilter API](https://github.com/square/crossfilter/wiki/API-Reference) for reference.
    var ndx2 = crossfilter(data);
    var all2 = ndx2.groupAll();

    // dimension by month
    var dim_month = ndx2.dimension(function (d) {
        return d.month;

    });

 /*   dim_month.order(function (p) {
        if (p.key == "Jan") {return 1};
        if (p.key == "Feb") {return 2};
        if (p.key == "Mar") {return 3};
        if (p.key == "Apr") {return 4};
        if (p.key == "May") {return 5};
        if (p.key == "Jun") {return 6};
        if (p.key == "Jul") {return 7};
        if (p.key == "Aug") {return 8};
        if (p.key == "Sep") {return 9};
        if (p.key == "Oct") {return 10};
        if (p.key == "Nov") {return 11};
        if (p.key == "Dec") {return 12};
    });*/

    var dim_category = ndx2.dimension(function (d) {
        return d.category;
    });

    var dim_region = ndx2.dimension(function (d) {
        return d.region;
    });

    var dim_customer = ndx2.dimension(function (d) {
        return d.customer;
    });

    var dim_rep = ndx2.dimension(function (d) {
        return d.salesperson;
    });


    // group by total movement within month
    var m_month_sales = dim_month.group().reduceSum(function (d) {
        if (d.m_sales != "NULL") {
            return d.m_sales;
        }
        else  {return 0;}

    });

    var m_cat_sales = dim_category.group().reduceSum(function (d) {
        if (d.m_sales != "NULL") {
            return d.m_sales;
        }
        else  {return 0;}

    });

    var m_region_sales = dim_region.group().reduceSum(function (d) {
        if (d.m_sales != "NULL") {
            return d.m_sales;
        }
        else  {return 0;}

    });

    var m_customer_sales = dim_customer.group().reduceSum(function (d) {
        if (d.m_sales != "NULL") {
            return d.m_sales;
        }
        else  {return 0;}

    });

    var m_rep_sales = dim_rep.group().reduceSum(function (d) {
        if (d.m_sales != "NULL") {
            return d.m_sales;
        }
        else  {return 0;}

    });

/*    m_month_sales.order(function (p) {
       if (p.key == "Jan") {return 1};
        if (p.key == "Feb") {return 2};
        if (p.key == "Mar") {return 3};
        if (p.key == "Apr") {return 4};
        if (p.key == "May") {return 5};
        if (p.key == "Jun") {return 6};
        if (p.key == "Jul") {return 7};
        if (p.key == "Aug") {return 8};
        if (p.key == "Sep") {return 9};
        if (p.key == "Oct") {return 10};
        if (p.key == "Nov") {return 11};
        if (p.key == "Dec") {return 12};
    });*/

    var m_month_gm = dim_month.group().reduceSum(function (d) {
        if (d.m_gm != "NULL") {
            return d.m_gm;
        }
        else  {return 0;}
    });

var test = m_month_sales.top(Infinity);
    var test2 = m_region_sales.top(Infinity);
    var test3 = m_customer_sales.top(12);
var grpCat = m_cat_sales.top(Infinity);
    var grpRep = m_rep_sales.top(Infinity);

    var xScale = d3.scale.ordinal()
        .domain(test.map(function (d) {
                return d.key; }
        ));

    var xAxis = d3.svg.axis().scale(xScale).orient("bottom");


    c0
        .width(400)
        .height(300)
        .x(d3.scale.ordinal().domain(test2.map(function (d) {
                return d.key; }
        )))
        .dimension(dim_region)
        .group(m_region_sales)
        .margins({top: 10, right: 50, bottom: 30, left: 40})
        .elasticX(true)


c0.xAxis().tickFormat(function (d) {
    var prefix = d3.formatPrefix(d);
    return prefix.scale(d) + prefix.symbol;
});

    cCat
        .width(800)
        .height(300)
        .x(d3.scale.ordinal().domain(grpCat.map(function (d) {
                return d.key; }
        )))
        .dimension(dim_category)
        .group(m_cat_sales)
      //  .margins({left: 20})
        .elasticY(true)
        .gap(10)
        .renderHorizontalGridLines(true)
        .xUnits(dc.units.ordinal);

cCat.yAxis().tickFormat(function (d) {
    var prefix = d3.formatPrefix(d);
    return prefix.scale(d) + prefix.symbol;
});

    cCat.yAxis().tickSize(2);


    cCust
        .width(800)
        .height(345)
        .x(d3.scale.ordinal().domain(test3.map(function (d) {
                return d.key; }
        )))
        .dimension(dim_customer)
        .group(m_customer_sales)
         // .margins({bottom: 0})
        .elasticY(true)
        .gap(10)
        .renderHorizontalGridLines(true)
        .xUnits(dc.units.ordinal)
        .renderlet(function (chart) {

            chart.selectAll("g.x text")

                .attr('dx', '-30')

                .attr('transform', "rotate(-90)");

        });

    cCust.yAxis().tickFormat(function (d) {
        var prefix = d3.formatPrefix(d);
        return prefix.scale(d) + prefix.symbol;
    });

    cCust.yAxis().tickSize(2);



    var months = ["Jan","Feb","Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    var clicked;
    var c1 =  dc.barChart(composite)
      //  .dimension(dim_month)
        .gap(33)
       // .margins({left: 222})
        .group(m_month_sales, "Sales")
      /*  .x(d3.scale.ordinal().domain(test.map(function (d) {
                return d.key; }
        )))*/
       // .x(d3.scale.ordinal().domain(months))

/*        .on('filtered', function(chart, filter){
            if (!clicked) {
                clicked = true;
                //c2.filterAll();
                c2.filter(chart.filter());

                c2.redraw();
                clicked = false;

            }
        })*/
        .colors('blue');

    var c2 =  dc.barChart(composite)
        .gap(29)
        .centerBar(true)
        .group(m_month_gm, "GM")
        .colors('red');

    composite
            .width(600)
            .height(320)
        ._rangeBandPadding(-0.5)
        .dimension(dim_month)

          //  .margins({left: 0})
       /*     .x(d3.scale.ordinal().domain(test.map(function (d) {
                    return d.key ; }
            )))*/
        .x(d3.scale.ordinal().domain(months))

            .compose([c1,c2])
            .xUnits(dc.units.ordinal)

            .mouseZoomable(true)


            .on('postRedraw', function(chart){
                clicked = null;

            })

                .elasticY(true)
                .brushOn(false);



     composite.yAxis().tickFormat(function (d) {
         var prefix = d3.formatPrefix(d);
         return prefix.scale(d) + prefix.symbol;
     });

    composite.yAxis().tickSize(2);

    composite.renderlet(function(chart) {
        chart.selectAll("g._1").attr("transform", "translate(" + 22 + ", 0)");
        //d3.event.stopPropagation();
    });


    dc.renderAll();
    d3.select("svg").selectAll("g.axis.x").attr("height", "50")




});

