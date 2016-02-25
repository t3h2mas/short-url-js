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

app.get('/new/:url(*)', function(req, res) {
  var url = req.params.url;

  var newUrl = new Url({link: url});
  newUrl.save(function(err, u) {
    if (err) return console.error(err);
    res.end(url + " ID: " + u.hash());
  });
});

app.listen(app.get('port'), function() {
  console.log('short-url app listening on port: ' + app.get('port'));
});
