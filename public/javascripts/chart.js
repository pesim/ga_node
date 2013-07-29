var chart, chart2;

function FromYMD(arg) { 
  var r= arg.replace(/\D/g, '').match(/(\d\d\d\d)(\d\d)(\d\d)(\d\d)?/);
  return Date.UTC(r[1], r[2]- 1, r[3], r[4]|| 0);
} 

function Plot() {
  while(chart.series.length> 0) {
    chart.series[0].remove(false);
  }
  chart.setTitle({ 
    text: 'Termination reasons ('+ $('#start-date').val()+ ' ~ '+ $('#end-date').val()+ ')' 
  });
  $.getJSON('/get', {
    metrics: 'ga:totalEvents',
    dimensions: 'ga:eventAction,ga:date',
    sort: 'ga:eventAction,ga:date',
    filters: 'ga:eventCategory==endPopup;ga:eventAction!=0;ga:eventAction!=7;ga:eventAction!=8;ga:totalEvents>10',
    'start-date': $('#start-date').val(),
    'end-date': $('#end-date').val(),
    'max-results': 250
  }, 
  function(data) { 
    var curr_act= '', curr_idx= -1;
    data.rows.forEach(function(r) {
      if (curr_act!= r[0]) {
        curr_act= r[0];
        curr_idx+= 1;
        chart.addSeries({ 
          type: 'bar',
          stacking: 'percent',
          name: curr_act, 
          data: [] 
        });
      }
      chart.series[curr_idx].addPoint([FromYMD(r[1]), parseInt(r[2])], false);
    });
  });
}
function PlotSales() {
  $.getJSON('/get_sales', {
    'start-date': $('#start-date').val(),
    'end-date': $('#end-date').val(),
  },
  function(data) {
    while(chart.series.length> 0) {
      chart.series[0].remove(false);
    }
    chart.setTitle({ 
      text: 'Sales (' + $('#start-date').val()+ '~'+ $('#end-date').val()+ ')' 
    });
    data.result['P2P'].forEach(function(v, idx) {
      chart.addSeries({
        type: 'bar',
        name: 'P2P LV'+ idx.toString(),
        data: v,
        stacking: 'normal',
        stack: 'p2p',
        pointStart: data.f_time,
        pointInterval: 3600000* 24
      });
    });
    data.result['F2P'].forEach(function(v, idx) {
      chart.addSeries({
        type: 'bar',
        name: 'F2P LV'+ idx.toString(),
        data: v,
        stacking: 'normal',
        stack: 'f2p',
        pointStart: data.f_time,
        pointInterval: 3600000* 24
      });
    });
    chart.addSeries({
      type: 'line',
      name: 'Total',
      data: data.result['Total'],
      pointStart: data.f_time,
      pointInterval: 3600000* 24
    });
  });
}

$(function() {
  $('#start-date').datepicker({ 
    dateFormat: 'yy-mm-dd',
    maxDate: -1,
    onSelect: function() {
      $('#end-date').prop('disabled', false).datepicker({ 
        dateFormat: 'yy-mm-dd',
        maxDate: 0,
        minDate: $(this).val(),
        onSelect: function() {
          $('.btn').removeClass('disabled');
          $('#plot').click(Plot);
          $('#plot-sales').click(PlotSales);
        }
      });
    }});
  chart= new Highcharts.Chart({
    chart: {
      renderTo: 'chart_area',
      defaultSeriesType: 'area',
    },
    title: {text: ''},
    xAxis: { type: 'datetime' }, 
    yAxis: { min: 0 }, 
    plotOptions: { series: { stacking: 'normal' } },
  });
  $(document).ajaxError(function() {
    document.location.href= '/';
  });
});
