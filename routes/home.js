var nconf = require('nconf');
var sql = require('msnodesql');

module.exports = function (app) {
    app.get('/main', function (req, res) {
        res.render('index', { title: 'Main page' })
    });
    app.get('/auth_info.js', function (req, res) {
        res.set('Content-Type', 'text/javascript; charset=utf-8');
        res.send('var clientId= \'' + nconf.get('ga').consumerKey + '\';\n' +
            'var apiKey= \'' + nconf.get('ga').consumerSecret + '\';\n');
    });
    app.get('/bill_products.js', function (req, res) {
        sql.query(nconf.get('ga').product_db_conn_str, "SELECT product_id, title, gameid FROM dbo.bill_products", function (err, data) {
            if (err) {
                console.log("error : " + err);
                res.statusCode = 404;
                res.send();
            } else {
                res.set('Content-Type', 'text/javascript; charset=utf-8');
                res.send('var bill_products = ' + JSON.stringify(data) + ';\n');
            }
        });
    });
    app.get('/bill_product_items.js', function (req, res) {
        sql.query(nconf.get('ga').product_db_conn_str, "SELECT product_id, item_id, count FROM dbo.bill_product_items", function (err, data) {
            if (err) {
                console.log("error : " + err);
                res.statusCode = 404;
                res.send();
            } else {
                res.set('Content-Type', 'text/javascript; charset=utf-8');
                res.send('var bill_product_items = ' + JSON.stringify(data) + ';\n');
            }
        });
    });
    app.get('/service_item.js', function (req, res) {
        sql.query(nconf.get('ga').item_db_conn_str, "SELECT serviceItemSN, serviceItemName FROM dbo.service_item", function (err, data) {
            if (err) {
                console.log("error : " + err);
                res.statusCode = 404;
                res.send();
            } else {
                res.set('Content-Type', 'text/javascript; charset=utf-8');
                res.send('var service_item = ' + JSON.stringify(data) + ';\n');
            }
        });
    });
}
