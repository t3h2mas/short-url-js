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


// may not need this after all.
app.use(function (req, res, next) {
  req.db = db;
  next();
});

app.get('/', function(req, res) {
  if (req.db)
    res.end("FOUND");
  else
    res.end("BORK!");
});

app.get('/:hash', function(req, res) {
  var fullUrl = req.protocol + '://' + req.get('host') + '/' + req.params.hash;
  res.end(fullUrl);
});

app.get('/new/:url(*)', function(req, res) {
  var url = req.params.url;
  var shortTemplate = req.protocol + '://' + req.get('host') + '/';
  var query = {link: url};
  Url.update(query, query, {upsert: true}, function (e, r) {
    if (e) return console.error(e);
  });

  function cb(err, u) {
    var resp = {};
    resp.original_url = u.link;
    resp.short_url = shortTemplate + u.hash();
    res.json(resp);
  }

  Url.findOne(query, cb);
});

app.listen(app.get('port'), function() {
  console.log('short-url app listening on port: ' + app.get('port'));
});
