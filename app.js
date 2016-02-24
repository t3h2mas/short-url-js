var express = require("express");
var app = express();
app.set('port', (process.env.PORT || 5000));
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');


var url = require('./config').url;

app.get('/', function(req, res) {
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    console.log("Connected correctly to mongodb server.");
    res.end("Greetings from MongoDB // Express.js");
    db.close();
  });
});
app.listen(app.get('port'), function() {
  console.log("short-url app listening on port: " + app.get('port'));
});
