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
$('#start-date').val(lastNDays(14));
$('#end-date').val(lastNDays(0));

/**
 * Executes a Core Reporting API query to retrieve the top 25 organic search
 * terms. Once complete, handleCoreReportingResults is executed. Note: A user
 * must have gone through the Google APIs authorization routine and the Google
 * Anaytics client library must be loaded before this function is called.
 */
function makeApiCall() {
    var ga_option = {
        'ids': 'ga:65348039',
        'start-date': document.getElementById('start-date').value,
        'end-date': document.getElementById('end-date').value,
        'metrics': 'ga:totalEvents',
        'dimensions': 'ga:eventAction',
        'sort': '-ga:totalEvents',
        'filters': 'ga:eventCategory==purchase',
        'max-results': 25
    };
    var server_id = document.getElementById('server-id').value;
    if (server_id)
    {
        console.log('server id = ' + server_id);
        ga_option.filters += ';ga:customVarValue1==' + server_id;
    }
  gapi.client.analytics.data.ga.get(ga_option).execute(handleCoreReportingResults);
}


/**
 * Handles the response from the CVore Reporting API. If sucessful, the
 * results object from the API is passed to various printing functions.
 * If there was an error, a message with the error is printed to the user.
 * @param {Object} results The object returned from the API.
 */
function handleCoreReportingResults(results) {
  if (!results.code) {
    console.log(JSON.stringify(results));
    var data = {
      labels : 
      [
      ],
      datasets : [
        {
          fillColor : "rgba(220,220,220,0.5)",
          strokeColor : "rgba(220,220,220,1)",
          data : 
          [
          ]
        }
      ]
    };

    var max_events = 0;
    var items = new Array();
    for (var k = 0; k < bill_product_items.length; ++k)
    {
        items[bill_product_items[k].item_id] = 0;
    }

    for (var i = 0; i < results.rows.length; ++i)
    {
        data.labels[i] = results.rows[i][0];
        data.datasets[0].data[i] = results.rows[i][1];
        if (max_events < parseInt(data.datasets[0].data[i])) {
            max_events = parseInt(data.datasets[0].data[i]);
        }

        for (var j = 0; j < bill_products.length; ++j)
        {
            if (bill_products[j].product_id != results.rows[i][0]) continue;

            data.labels[i] += ' (' + bill_products[j].title + ')';
            for (var k = 0; k < bill_product_items.length; ++k)
            {
                if (bill_products[j].product_id != bill_product_items[k].product_id) continue;

                items[bill_product_items[k].item_id] += bill_product_items[k].count * parseInt(data.datasets[0].data[i]);
            }
            break;
        }
    }
    max_events = (Math.floor(max_events/1000)+1)*1000;
    var ctx = document.getElementById("chtProduct").getContext("2d");
    var ProductChart = new Chart(ctx).Bar(data, {scaleOverlay : true, scaleOverride : true, scaleSteps : 10, scaleStepWidth : max_events/10, scaleStartValue : 0 });

    var data_item = {
      labels : 
      [
      ],
      datasets : [
        {
          fillColor : "rgba(220,220,220,0.5)",
          strokeColor : "rgba(220,220,220,1)",
          data : 
          [
          ]
        }
      ]
    };
    var index_item = 0;
    var max_events_item = 0;
    for (var item in items)
    {
        if (items[item] == 0) continue;

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
        data_item.datasets[0].data[index_item] = items[item];
        if (max_events_item < parseInt(data_item.datasets[0].data[index_item])) {
            max_events_item = parseInt(data_item.datasets[0].data[index_item]);
        }
        ++index_item;
    }
    max_events_item = (Math.floor(max_events_item/1000)+1)*1000;
    var ctx_item = document.getElementById("chtItem").getContext("2d");
    var ItemChart = new Chart(ctx_item).Bar(data_item, {scaleOverlay : true, scaleOverride : true, scaleSteps : 10, scaleStepWidth : max_events_item/10, scaleStartValue : 0 });

  } else {
    console.log('There was an error: ' + results.message);
  }
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
