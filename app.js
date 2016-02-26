var express = require('express');
var app = express();
var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');



// set up the database
var url = require('./config').url;
mongoose.connect(url);
var db = mongoose.connection;

// auto increment ID
autoIncrement.initialize(db);

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('Connected to MongoDB');
});

var urlSchema = mongoose.Schema({
  link: {
    type: String,
    index: {unique: true, dropDups: true}
  }
});

urlSchema.methods.hash = function() {
  // return base 36 representation of id
  return this.id.toString(36);
}

urlSchema.plugin(autoIncrement.plugin, {
  model: 'Url',
  field: 'id',
  startAt: 1
});

var Url = mongoose.model('Url', urlSchema);

app.set('port', (process.env.PORT || 5000));
app.set('view engine', 'ejs');

// may not need this after all.
app.use(function (req, res, next) {
    req.shortTemplate = req.protocol + '://' + req.get('host') + '/';
  next();
});

app.get('/list/', function (req, res) {
  Url.find( {}, function (err, urls) {
    res.render('pages/list', {urls: urls, shortTemplate: req.shortTemplate});
  });
});

app.get('/', function(req, res) {
  res.render('pages/index');
});

app.get('/:hash', function(req, res) {
  var hash = req.params.hash;
  var index = parseInt(hash, 36);

  Url.findOne({id: index}, function (err, url) {
    if (err || url === null) {
      console.error(err);
      res.end("Bork :(");
      return;
    }
    res.redirect(url.link);
  });

});

app.get('/new/:url(*)', function(req, res) {
  var url = req.params.url;
  var query = {link: url};

  function cb(err, u) {
    if (err) console.error(err + ' [cb]');
    var resp = {};
    resp.original_url = u.link;
    resp.short_url = req.shortTemplate + u.hash();
    res.json(resp);
  }

  Url.findOne(query, function (e, resp) {
    if (e) console.error(e + '[Url.findOne]');
    if (resp) {
      cb(null, resp);
    }
    else {
      var newUrl = new Url(query);
      newUrl.save(cb);
    }
  });
});



app.listen(app.get('port'), function() {
  console.log('short-url app listening on port: ' + app.get('port'));
});
