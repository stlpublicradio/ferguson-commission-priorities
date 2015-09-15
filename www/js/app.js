/*
 * Run on page load.
 */
var onDocumentLoad = function(e) {
    // Cache jQuery references
    // $commentCount = $('.comment-count');
    //
    // renderExampleTemplate();
    // getCommentCount(showCommentCount);
    //
    // SHARE.setup();

    pageInit();
}

$(onDocumentLoad);

var input_data;
var data;
var drake;

var priorities = $.parseJSON(localStorage.getItem(stored_priorities));


function setUpPage() {
    $.getJSON(config,initFromConfig);
    setUpDragging();
    $('#submit').append('<input class="btn btn-default" name="submitButton" value="Done" type="button" onclick="submitForm();" />');

    $('.priority-text').collapser({
        truncate: 0,
        ellipsis: '',
        mode: "words",
        showText: "Show details",
        hideText: "Hide"
    })
}

function displayResults() {

    // stop dragging
    $('#left').removeClass('dragula-container');
    $('#right').removeClass('dragula-container');

    // expand divs
    $('.priority-text').each( function() {
        var dataVar = $(this).data('collapser');
        if (dataVar) dataVar.show( $(this) );
    })

    // list priorities in previously-submitted order

    $.each(priorities, function(i, item) {
        var pri = $('div').find('[data-id="' + item.id + '"]');
        pri.detach();
        pri.addClass('col-md-12');
        $('#left').append($('<div class="row">').append($('<div class="container-priority">').append($(pri))));

    });


    // move other unsubmitted priorities to bottom of list
    $("#right div.priority").each(function(i) {
        $(this).detach();
        $(this).addClass('col-md-12')
        $('#left').append($('<div class="row">').append($('<div class="container-priority">').append($(this))));
    });

    // remove div with submit stuff in it
    $('#submit').hide();

    // remove recommendations div
    $('#container-recommendations').remove();

    // remove instructions
    $('.instructions').remove();


    compileData();

    $('#container-priorities').removeClass('col-md-6').addClass('col-md-12')
    $('#left').removeClass('border-dashed')
    $('#container-priorities').find($('h3')).text('Your priorities:');


}

// load all users' data

function compileData() {
    d3.json(resultsData, function(error, json) {
      if (error) return console.warn(error);
      input_data = json;
      visualizeit();
    });

};

function visualizeit(){

    var data = new Array();
    var placements = new Array();

    // splitting entries json up into usable lists
    $.each(input_data.feed.entry, function(i,entry){
        var templist = new Array();
        entries = entry.content.$t;
        entries = entries.split(',');

        $.each(entries,function(j,listItem){
            listItem = listItem.split(': ');
            listItem = listItem[1];
            templist[j] = listItem;
        })

        data[i] = templist;
    })

    // get totals by placement
    for (i = 0; i < how_many_props; i++) {
        templist = [];
        for ( j = 0; j < how_many_props; j++) {
            n = 0;
            for ( k = 0; k < data.length; k++) {
                n = n + (data[k][j] == i+1);
            }
            templist[j] = n;
        }
        placements.push({
            key: i+1,
            value: templist
        });
    }

    $('.priority').each(function(){
        $( this ).prepend( $('<div class="chart" id="chart-' + $(this).attr('data-id') + '">') );

    });

    for (i = 0; i < how_many_props; i++){
        target = '#chart-' + (i+1)

        containerWidth = $(target).width()
        renderColumnChart({
        container: target,
        width: containerWidth,
        data: placements[i].value,
        });
    }

    $('.chart').first().prepend(chart_explainer_text);

    for (i = 1; i <= priorities.length; i++){
        barvar = i - 1
        $("#left .row:nth-child(" + i + ")").find(".bar:nth-child(" + i + ")").each(function(){
            $(this).attr("class", "myplacement bar bar-" + barvar)
        });
    }



    // var priority_divs = d3.select('#left').selectAll('.priority').append('div')
    // .datum(function(d) { return {key: +d3.select(this.parentNode).attr("data-id")}; })
    //
    // priority_divs.data(placements, function(d) { return d.key });

}

function pageInit(){
    //Don't populate the form or set listeners if they already submitted
     try {
       //If they've already submitted, don't let them resubmit
       if (localStorage.getItem(stored_priorities)) {
           displayResults();
       }
       else {
           setUpPage();
       }
     } catch (e) {}

};

function submitForm() {
    // fill out form
    var elements = [];

    priorities = $('#left div.priority').map(function() {
        var $item = $(this);
        return { id: $item.data('id')};
    }).get()
    $inputs = $('form *');
    $form = $('form');

    $inputs.filter('input').each(function(i, input){


        if (priorities[i]) {
            var number = priorities[i].id;
            $(this).val(number);
        }
        else {
            $(this).val('');
        }
    });

    //Append a submit button
    $form.submit();

    try {
   //put priorities into localStorage to mark that they submitted it
   localStorage.setItem(stored_priorities,JSON.stringify(priorities));
     } catch(e) {}

     displayResults();
}

function setUpDragging() {
    var drake = dragula({
      isContainer: function (el) {
        return el.classList.contains('dragula-container');
      }
    });
    $('#left').addClass('dragula-container');
    $('#right').addClass('dragula-container');

}

function getFormElement(item) {
    var $el,
        $outer = $('<div></div>')
                  .addClass('fs-form-item')
                  .toggleClass('required',item.required);

    $outer.append('<label>' + item.name + (item.required ? ' *' : '') + '</label>');

    if (item.name.toLowerCase() == 'x' || item.name.toLowerCase() == 'y') {

      return $('<input/>')
              .attr({
                type: 'hidden',
                name: item.field
              })
              .addClass(item.name.toLowerCase());

    } else if (item.type == 'textarea') {

      $el = $('<textarea></textarea>')
              .attr('name',item.field);

    } else if (item.type == 'select') {
      $el = $('<select></select>')
              .attr('name',item.field);

      $.each(item.choices,function(i,c){

        $el.append(

          $('<option></option>').text(c)

        );

      });

    } else if (item.type == 'radio' || item.type == 'checkbox') {

      $el = $('<div></div>');

      $.each(item.choices,function(i,c){

        var $i = $('<input/>').attr({
              name: item.field,
              type: item.type,
              value: c
            }),
            $s = $('<span/>').text(c);

        $el.append($i);
        $el.append($s);

      });
    } else {

      $el = $('<input/>').attr({
        name: item.field,
        type: item.type,
        value: ''
      });

    }

    $outer.append($el);

    return $outer;

  }

function initFromConfig(config) {

  var $form = $('#form form');

  //Don't populate the form or set listeners if they already submitted
   try {
     //If they've already submitted, don't let them resubmit
     if (localStorage.getItem(stored_priorities)) {
       return true;
     }
   } catch (e) {}

   //Set the form action
   $form.attr('action',config.dataDestination)
         .attr('method',config.dataMethod || "post")
         .attr('target', 'hidden_iframe')
         .attr('onsubmit', 'submitted=true');

   //Create the form fields
   $.each(config.fields || [],function(i,f){
     $form.append(getFormElement(f));
   });

}

// Global config
var GRAPHIC_DEFAULT_WIDTH = 600;
var MOBILE_THRESHOLD = 500;

// Global vars
var pymChild = null;
var isMobile = false;
var graphicData = null;

// D3 formatters
var fmtComma = d3.format(',');

var renderColumnChart = function(config) {

    var makeTranslate = function(x, y) {
        var transform = d3.transform();

        transform.translate[0] = x;
        transform.translate[1] = y;

        return transform.toString();
    }

    /*
     * Setup chart container.
     */

    var aspectWidth = isMobile ? 4 : 16;
    var aspectHeight = isMobile ? 3 : 9;
    var valueGap = 6;

    var margins = {
        top: 5,
        right: 5,
        bottom: 20,
        left: 5
    };

    var ticksY = 4;
    var roundTicksFactor = 10;

    // Calculate actual chart dimensions
    var chartWidth = config['width'] - margins['left'] - margins['right'];
    var chartHeight = Math.ceil((config['width'] * aspectHeight) / aspectWidth) - margins['top'] - margins['bottom'];

    // Clear existing graphic (for redraw)
    var containerElement = d3.select(config['container']);
    containerElement.html('');

    /*
     * Create the root SVG element.
     */
    var chartWrapper = containerElement.append('div')
        .attr('class', 'graphic-wrapper');

    var chartElement = chartWrapper.append('svg')
        .attr('width', chartWidth + margins['left'] + margins['right'])
        .attr('height', chartHeight + margins['top'] + margins['bottom'])
        .append('g')
        .attr('transform', 'translate(' + margins['left'] + ',' + margins['top'] + ')');

    /*
     * Create D3 scale objects.
     */
    var xScale = d3.scale.ordinal()
        .rangeRoundBands([0, chartWidth], .1)
        .domain(d3.range(config['data'].length));

    var min = d3.min(config['data'], function(d) {
        return Math.floor(d / roundTicksFactor) * roundTicksFactor;
    });

    if (min > 0) {
        min = 0;
    }

    var yScale = d3.scale.linear()
        .domain([
            min,
            d3.max(config['data'])
        ])
        .range([chartHeight, 0]);

    /*
     * Create D3 axes.
     */
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient('bottom')
        .tickFormat(function(d, i) {
            return d + 1;
        });

    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient('left')
        .ticks(ticksY)
        .tickFormat(function(d) {
            return fmtComma(d);
        });

    /*
     * Render axes to chart.
     */
    chartElement.append('g')
        .attr('class', 'x axis')
        .attr('transform', makeTranslate(0, chartHeight))
        .call(xAxis);

    // chartElement.append('g')
    //     .attr('class', 'y axis')
    //     .call(yAxis)

    /*
     * Render grid to chart.
     */
    // var yAxisGrid = function() {
    //     return yAxis;
    // };
    //
    // chartElement.append('g')
    //     .attr('class', 'y grid')
    //     .call(yAxisGrid()
    //         .tickSize(-chartWidth, 0)
    //         .tickFormat('')
    //     );

    /*
     * Render bars to chart.
     */
    chartElement.append('g')
        .attr('class', 'bars')
        .selectAll('rect')
        .data(config['data'])
        .enter()
        .append('rect')
            .attr('x', function(d, i) {
                return xScale(i);
            })
            .attr('y', function(d) {
                if (d < 0) {
                    return yScale(0);
                }

                return yScale(d);
            })
            .attr('width', xScale.rangeBand())
            .attr('height', function(d) {
                if (d < 0) {
                    return yScale(d) - yScale(0);
                }

                return yScale(0) - yScale(d);
            })
            .attr('class', function(d, i) {
                if (config.myplacement - 1 == i) {
                    return 'myplacement bar bar-' + i;
                }
                else {
                    return 'bar bar-' + i
                }
            });

    /*
     * Render 0 value line.
     */
    chartElement.append('line')
        .attr('class', 'zero-line')
        .attr('x1', 0)
        .attr('x2', chartWidth)
        .attr('y1', yScale(0))
        .attr('y2', yScale(0));

    /*
     * Render bar values.
     */
    // chartElement.append('g')
    //     .attr('class', 'value')
    //     .selectAll('text')
    //     .data(config['data'])
    //     .enter()
    //     .append('text')
    //         .text(function(d) {
    //             return d.toFixed(0);
    //         })
    //         .attr('x', function(d, i) {
    //             return xScale(i) + (xScale.rangeBand() / 2);
    //         })
    //         .attr('y', function(d) {
    //             return yScale(d);
    //         })
    //         .attr('dy', function(d) {
    //             var textHeight = d3.select(this).node().getBBox().height;
    //             var barHeight = 0;
    //
    //             if (d[valueColumn] < 0) {
    //                 barHeight = yScale(d) - yScale(0);
    //
    //                 if (textHeight + valueGap * 2 < barHeight) {
    //                     d3.select(this).classed('in', true);
    //                     return -(textHeight - valueGap / 2);
    //                 } else {
    //                     d3.select(this).classed('out', true)
    //                     return textHeight + valueGap;
    //                 }
    //             } else {
    //                 barHeight = yScale(0) - yScale(d);
    //
    //                 if (textHeight + valueGap * 2 < barHeight) {
    //                     d3.select(this).classed('in', true)
    //                     return textHeight + valueGap;
    //                 } else {
    //                     d3.select(this).classed('out', true)
    //                     return -(textHeight - valueGap / 2);
    //                 }
    //             }
    //         })
    //         .attr('text-anchor', 'middle')
}
