var express = require("express");

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

var url = require('./config').url;

MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log("Connected correctly to server.");
  db.close();
});
