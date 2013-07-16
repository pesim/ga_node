var nconf = require('nconf');

module.exports = function (app) {
    app.get('/auth_info.js', function (req, res) {
        res.write('it works');
        //res.write('var clientId= \'' + nconf.get('ga').consumerKey + '\';\n');
        //        res.write('var apiKey= \'' + nconf.get('ga').consumerSecret + '\';\n');
    });
    app.get('/', function (req, res) {
        res.render('index', { title: 'Main page' })
    });
}
