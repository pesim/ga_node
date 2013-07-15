var OAuth = require('oauth').OAuth,
    nconf = require('nconf');

function GetGAOAuth(req) {
    return new OAuth(

    );
}
module.exports = function(app) {

    // user account page
    app.get('/account', function(req, res) {
        res.render('account/account', { user: req.user });
    });

    // logout
    app.get('/logout', function(req, res) {
        res.redirect('/');
    });
}

