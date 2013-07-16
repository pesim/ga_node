var nconf = require('nconf');

module.exports = function (app) {
    app.get('/main', function (req, res) {
        res.render('index', { title: 'Main page' })
    });
    app.get('/auth_info.js', function (req, res) {
        res.set('Content-Type', 'text/javascript; charset=utf-8');
        res.send('var clientId= \'' + nconf.get('ga').consumerKey + '\';\n'+
            'var apiKey= \'' + nconf.get('ga').consumerSecret + '\';\n');
    });
}
