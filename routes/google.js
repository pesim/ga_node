var OAuth= require('oauth').OAuth2
  , querystring= require('querystring')
  , nconf = require('nconf');

function LastNDays(n) {
  var date= new Date();
  date.setDate(new Date().getDate()- n);
  return date.toJSON().substr(0, 10);
}
function FromYMD(arg) { 
  var r= arg.replace(/\D/g, '').match(/(\d\d\d\d)(\d\d)(\d\d)(\d\d)?/);
  return Date.UTC(r[1], r[2]- 1, r[3], r[4]|| 0);
} 
function GenArray(n, v) {
  v= v|| 0;
  v= JSON.stringify(v);
  return JSON.parse('['+ Array(n).join(v+ ',')+ v+ ']');
}
function GetGAOAuth() {
  return new OAuth(
    nconf.get('google').clientId, nconf.get('google').key,
    'https://accounts.google.com',
    '/o/oauth2/auth',
    '/o/oauth2/token'
  );
}
function GetGA(token, params, callback) {
  params.ids= params.ids|| 'ga:65348039';
  params['start-date']= params['start-date']|| LastNDays(8);
  params['end-date']= params['end-date']|| LastNDays(1);
  GetGAOAuth().get(
    'https://www.googleapis.com/analytics/v3/data/ga?'+ querystring.stringify(params),
    token, callback);
}
function ReduceData(rows) {
  var SVR= function(i) { return parseInt(i)> 10000? 'F2P': 'P2P'; };
  var LVL= function(l) { return Math.floor((parseInt(l)- 1)/ 10); };
  var HourDiff= function(f, t) { return (t- f)/ 3600000/24 ; };
  var f_time= FromYMD(rows[0][0]);
  var e_time= FromYMD(rows[rows.length- 1][0]);
  var time_scale= HourDiff(f_time, e_time)+ 1;

  var result= {
    'F2P': GenArray(6, GenArray(time_scale)),
    'P2P': GenArray(6, GenArray(time_scale)),
    'Total': GenArray(time_scale)
  };
  rows.forEach(function(r) {
    if (SVR(r[1])== 'F2P') {
      result['F2P'][LVL(r[2])][HourDiff(f_time, FromYMD(r[0]))]+= parseInt(r[3]);
    } else {
      result['P2P'][LVL(r[2])][HourDiff(f_time, FromYMD(r[0]))]+= parseInt(r[3]);
    }
    result['Total'][HourDiff(f_time, FromYMD(r[0]))]+= parseInt(r[3]);
  });
  return { result: result, f_time: f_time };
}
module.exports = function (app) {
  app.get('/', function (req, res) {
    req.session.access_token= req.session.access_token|| null;
    if (req.session.access_token) {
      res.render('index');
      return;
    } 
    var oa= GetGAOAuth();
    var redirect_uri= oa.getAuthorizeUrl({
      redirect_uri:'http://'+ req.headers.host+ '/callback', 
      scope: 'https://www.googleapis.com/auth/analytics.readonly',
      response_type: 'code' });
    res.redirect(redirect_uri);
  });
  app.get('/logout', function(req, res) {
    req.session.destroy();
    res.redirect('/');
  });
  app.get('/callback', function(req, res) {
    var oa= GetGAOAuth();
    oa.getOAuthAccessToken(
      req.param('code'),
      { 
        redirect_uri: 'http://'+ req.headers.host+ '/callback', 
        grant_type: 'authorization_code'
      },
      function(error, access_token, refresh_token, results) {
        if (error) {
          res.send('err '+ JSON.stringify(error));
        } else {
          req.session.access_token= access_token;
          if (refresh_token) req.session.refresh_token= refresh_token;
          res.redirect('/');
        }
      }
    );
  });
  app.get('/get', function(req, res) {
    req.session.access_token= req.session.access_token|| null;
    if (!req.session.access_token) {
      res.status(401).send('');
      return;
    }
    GetGA(req.session.access_token, req.query, 
      function(error, result) {
        if (error) {
          res.send('Error'+ JSON.stringify(error));
        } else {
          res.send(result);
        }
      }
    );
  });
  app.get('/get_sales', function(req, res) {
    GetGA(req.session.access_token,
      {
        metrics: 'ga:totalEvents',
        dimensions: 'ga:date,ga:customVarValue1,ga:customVarValue2',
        sort: 'ga:date,ga:customVarValue1,-ga:customVarValue2',
        filters: 'ga:eventCategory==purchase',
        'start-date': req.param('start-date'), 
        'end-date': req.param('end-date'),
      },
      function(error, result) {
        if (error) {
          res.status(401).send('');
        } else {
          res.send(ReduceData(JSON.parse(result).rows));
        }
      }
    );
  });
};
