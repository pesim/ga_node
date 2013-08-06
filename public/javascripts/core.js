// Copyright 2012 Google Inc. All Rights Reserved.

/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Reference example for the Core Reporting API. This example
 * demonstrates how to access the important information from version 3 of
 * the Google Analytics Core Reporting API.
 * @author api.nickm@gmail.com (Nick Mihailovski)
 */

// Initialize the UI Dates.
$('#product-start-date').val(lastNDays(14));
$('#product-end-date').val(lastNDays(0));
$('#product-max-results').val(10);

$('#date-start-date').val(lastNDays(14));
$('#date-end-date').val(lastNDays(0));

/**
 * Executes a Core Reporting API query to retrieve the top 25 organic search
 * terms. Once complete, handleCoreReportingResults is executed. Note: A user
 * must have gone through the Google APIs authorization routine and the Google
 * Anaytics client library must be loaded before this function is called.
 */
/*
function day_and_count()
{
    var days = (Date.parse(document.getElementById('end-date').value) - Date.parse(document.getElementById('start-date').value)) / (1000 * 60 * 60 * 24);
    console.log('days : ' + days);

    var max_results = bill_products.length * days;
    console.log('max_results : ' + max_results);

    return [days, max_results];
}
*/
function productApiCall()
{
    $('#product-output').show();

    var ga_option =
    {
        'ids': 'ga:65348039',
        'start-date': document.getElementById('product-start-date').value,
        'end-date': document.getElementById('product-end-date').value,
        'metrics': 'ga:totalEvents',
        'dimensions': 'ga:eventAction',
        'sort': '-ga:totalEvents',
        'filters': 'ga:eventCategory==purchase',
        'max-results' : document.getElementById('product-max-results').value
    };
    var server_id = document.getElementById('product-server-id').value;
    if (server_id)
    {
        console.log('server id = ' + server_id);
        ga_option.filters += ';ga:customVarValue1==' + server_id;
    }
    gapi.client.analytics.data.ga.get(ga_option).execute(handleProductApiCallResults);
}

/**
 * Handles the response from the CVore Reporting API. If sucessful, the
 * results object from the API is passed to various printing functions.
 * If there was an error, a message with the error is printed to the user.
 * @param {Object} results The object returned from the API.
 */
var ga_product_results;
function handleProductApiCallResults(results)
{
    if (results.code)
    {
        console.log('There was an error: ' + results.message);
        return;
    }
    console.log(JSON.stringify(results));
    ga_product_results = results;
    productApiCall2();
}

function productApiCall2()
{
    var ga_option =
    {
        'ids': 'ga:65348039',
        'start-date': document.getElementById('product-start-date').value,
        'end-date': document.getElementById('product-end-date').value,
        'metrics': 'ga:totalEvents',
        'dimensions': 'ga:eventAction',
        'sort': '-ga:totalEvents',
        'filters': 'ga:eventCategory==purchase;ga:eventLabel!~^$',
        'max-results' : document.getElementById('product-max-results').value
    };
    var server_id = document.getElementById('product-server-id').value;
    if (server_id)
    {
        console.log('server id = ' + server_id);
        ga_option.filters += ';ga:customVarValue1==' + server_id;
    }
    gapi.client.analytics.data.ga.get(ga_option).execute(handleProductApiCallResults2);
}
function handleProductApiCallResults2(results)
{
    if (results.code)
    {
        console.log('There was an error: ' + results.message);
        return;
    }

    console.log(JSON.stringify(results));
    var data =
    {
        labels : [],
        datasets : 
        [
            {
                fillColor : "rgba(220,220,220,0.5)",
                strokeColor : "rgba(220,220,220,1)",
                data : []
            }
        ]
    };

    var items = new Array();

    var index = 0;
    var max_events = 0;
    var server_category = 0;
    for (var i = 0; i < ga_product_results.rows.length; ++i)
    {
        var count = parseInt(ga_product_results.rows[i][1]);
        if (results.rows)
        {
            for (var l = 0; l < results.rows.length; ++l)
            {
                if (ga_product_results.rows[i][0] == results.rows[l][0])
                    count -= parseInt(results.rows[l][1]);
            }
        }
        if (count <= 0) continue;

        data.labels[index] = ga_product_results.rows[i][0];
        data.datasets[0].data[index] = count;
        if (max_events < count)
        {
            max_events = count;
        }

        for (var j = 0; j < bill_products.length; ++j)
        {
            if (bill_products[j].product_id != ga_product_results.rows[i][0]) continue;

            data.labels[index] += ' (' + bill_products[j].title + ')';
            if (parseInt(bill_products[j].gameid) < 10000)
            {
                data.labels[index] += " - p2p";
                server_category = 1;
            }
            else
            {
                data.labels[index] += " - f2p";
                server_category = 2;
            }
            for (var k = 0; k < bill_product_items.length; ++k)
            {
                if (bill_products[j].product_id != bill_product_items[k].product_id) continue;

                if (!items[bill_product_items[k].item_id])
                {
                    items[bill_product_items[k].item_id] = new Array();
                    items[bill_product_items[k].item_id][0] = 0;
                    items[bill_product_items[k].item_id][1] = 0;
                    items[bill_product_items[k].item_id][2] = 0;
                }
                items[bill_product_items[k].item_id][0] += bill_product_items[k].count * count;
                items[bill_product_items[k].item_id][server_category] += bill_product_items[k].count * count;
            }
            break;
        }
        ++index;
    }
    if (document.getElementById('product-max-products-scale').value)
        max_events = document.getElementById('product-max-products-scale').value;
    else
        max_events = (Math.floor(max_events/1000)+1)*1000;
    var ctx = document.getElementById("chtProduct").getContext("2d");
    var ProductChart = new Chart(ctx).Bar(data, {scaleOverlay : true, scaleOverride : true, scaleSteps : 10, scaleStepWidth : max_events/10, scaleStartValue : 0 });

    var data_item =
    {
        labels : [],
        datasets : 
        [
            {
                fillColor : "rgba(220,220,220,0.5)",
                strokeColor : "rgba(220,220,220,1)",
                data : []
            },
            {
                fillColor : "rgba(151,187,205,0.5)",
                strokeColor : "rgba(151,187,205,1)",
                data : []
            },
            {
                fillColor : "rgba(205,187,151,0.5)",
                strokeColor : "rgba(205,187,151,1)",
                data : []
            }
        ]
    };
    var index_item = 0;
    var max_events_item = 0;
    for (var item in items)
    {
        if (items[item][0] == 0) continue;

        var item_label = item;
        for (var item_id = 0; item_id < service_item.length; ++item_id)
        {
            if (service_item[item_id].serviceItemSN == parseInt(item))
            {
                item_label += ' (' + service_item[item_id].serviceItemName + ')';
                break;
            }
        }
        data_item.labels[index_item] = item_label;

        for (var c = 0; c < 3; ++c)
        {
            data_item.datasets[c].data[index_item] = items[item][c];
        }
        if (max_events_item < parseInt(data_item.datasets[0].data[index_item]))
            max_events_item = parseInt(data_item.datasets[0].data[index_item]);
        ++index_item;
    }
    if (document.getElementById('product-max-items-scale').value)
        max_events_item = document.getElementById('product-max-items-scale').value;
    else
        max_events_item = (Math.floor(max_events_item/1000)+1)*1000;
    var ctx_item = document.getElementById("chtItem").getContext("2d");
    var ItemChart = new Chart(ctx_item).Bar(data_item, {scaleOverlay : true, scaleOverride : true, scaleSteps : 10, scaleStepWidth : max_events_item/10, scaleStartValue : 0 });
}

function dateApiCall()
{
    $('#date-output').show();

    var ga_option =
    {
        'ids': 'ga:65348039',
        'start-date': document.getElementById('date-start-date').value,
        'end-date': document.getElementById('date-end-date').value,
        'metrics': 'ga:totalEvents',
        'dimensions': 'ga:date,ga:customVarValue1',
        'sort': 'ga:date',
        'filters': 'ga:eventCategory==purchase'
    };
    var server_id = document.getElementById('date-server-id').value;
    if (server_id)
    {
        console.log('server id = ' + server_id);
        ga_option.filters += ';ga:customVarValue1==' + server_id;
    }
    gapi.client.analytics.data.ga.get(ga_option).execute(handleDateApiCallResults);
}

/**
 * Handles the response from the CVore Reporting API. If sucessful, the
 * results object from the API is passed to various printing functions.
 * If there was an error, a message with the error is printed to the user.
 * @param {Object} results The object returned from the API.
 */
var ga_date_results;
function handleDateApiCallResults(results)
{
    if (results.code)
    {
        console.log('There was an error: ' + results.message);
        return;
    }
    console.log(JSON.stringify(results));
    ga_date_results = results;
    dateApiCall2();
}

function dateApiCall2()
{
    var ga_option =
    {
        'ids': 'ga:65348039',
        'start-date': document.getElementById('date-start-date').value,
        'end-date': document.getElementById('date-end-date').value,
        'metrics': 'ga:totalEvents',
        'dimensions': 'ga:date,ga:customVarValue1',
        'sort': 'ga:date',
        'filters': 'ga:eventCategory==purchase;ga:eventLabel!~^$'
    };
    var server_id = document.getElementById('date-server-id').value;
    if (server_id)
    {
        console.log('server id = ' + server_id);
        ga_option.filters += ';ga:customVarValue1==' + server_id;
    }
    gapi.client.analytics.data.ga.get(ga_option).execute(handleDateApiCallResults2);
}
function handleDateApiCallResults2(results)
{
    if (results.code)
    {
        console.log('There was an error: ' + results.message);
        return;
    }

    console.log(JSON.stringify(results));
    var data =
    {
        labels : [],
        datasets : 
        [
            {
                fillColor : "rgba(220,220,220,0.5)",
                strokeColor : "rgba(220,220,220,1)",
			    pointColor : "rgba(220,220,220,1)",
			    pointStrokeColor : "#fff",
                data : []
            },
            {
                fillColor : "rgba(151,187,205,0.5)",
                strokeColor : "rgba(151,187,205,1)",
                pointColor : "rgba(151,187,205,1)",
                pointStrokeColor : "#fff",
                data : []
            },
            {
                fillColor : "rgba(205,187,151,0.5)",
                strokeColor : "rgba(205,187,151,1)",
                pointColor : "rgba(205,187,151,1)",
                pointStrokeColor : "#fff",
                data : []
            }
        ]
    };

    var index = 0;
    var max_events = 0;
    var server_category = 0;
    var prev_date = "";
    for (var i = 0; i < ga_date_results.rows.length; ++i)
    {
        if (prev_date != "" && prev_date != ga_date_results.rows[i][0])
        {
            ++index;
        }
        prev_date = ga_date_results.rows[i][0];

        var count = parseInt(ga_date_results.rows[i][2]);
        if (results.rows)
        {
            for (var l = 0; l < results.rows.length; ++l)
            {
                if (ga_date_results.rows[i][0] == results.rows[l][0] &&
                    ga_date_results.rows[i][1] == results.rows[l][1])
                    count -= parseInt(results.rows[l][2]);
            }
        }

        if (parseInt(ga_date_results.rows[i][1]) < 10000)
            server_category = 1;
        else
            server_category = 2;

        data.labels[index] = ga_date_results.rows[i][0];
        if (!data.datasets[0].data[index]) data.datasets[0].data[index] = 0;
        data.datasets[0].data[index] += count;
        if (!data.datasets[server_category].data[index]) data.datasets[server_category].data[index] = 0;
        data.datasets[server_category].data[index] += count;
        if (max_events < data.datasets[0].data[index])
        {
            max_events = data.datasets[0].data[index];
        }
    }
    max_events = (Math.floor(max_events/1000)+1)*1000;
    var ctx = document.getElementById("chtDate").getContext("2d");
    var DateChart = new Chart(ctx).Line(data, {scaleOverlay : true, scaleOverride : true, scaleSteps : 10, scaleStepWidth : max_events/10, scaleStartValue : 0 });
}
/**
 * Utility method to return the lastNdays from today in the format yyyy-MM-dd.
 * @param {Number} n The number of days in the past from tpday that we should
 *     return a date. Value of 0 returns today.
 */
function lastNDays(n) {
  var today = new Date();
  var before = new Date();
  before.setDate(today.getDate() - n);

  var year = before.getFullYear();

  var month = before.getMonth() + 1;
  if (month < 10) {
    month = '0' + month;
  }

  var day = before.getDate();
  if (day < 10) {
    day = '0' + day;
  }

  return [year, month, day].join('-');
}
