const express = require('express')
const app = express()
const mongoose = require('mongoose')
const autoIncrement = require('mongoose-auto-increment')

const logger = require('./infrastructure/logger')

const DEFAULT_APPLICATION_PORT = 5000

// set up the database
const url = require('./config').url
mongoose.connect(url)
const db = mongoose.connection

// auto increment ID
autoIncrement.initialize(db)

db.on('error', (error) => logger.error(`connection error: ${error}`))
db.once('open', () => {
  logger.info('Connected to MongoDB')
})

const Url = require('./infrastructure/models/Url')

app.set('port', process.env.PORT || DEFAULT_APPLICATION_PORT)
app.set('view engine', 'ejs')

// may not need this after all.
app.use((req, res, next) => {
  req.shortTemplate = `${req.protocol}://${req.get('host')}/`
  next()
})

app.get('/list/', (req, res) => {
  Url.find({}, (err, urls) => {
    if (err) {
      logger.error(err.message, err.stack)
      return res.status(500).end()
    }
    res.render('pages/list', { urls: urls, shortTemplate: req.shortTemplate })
  })
})

app.get('/', (req, res) => {
  res.render('pages/index')
})

app.get('/:hash', (req, res) => {
  const hash = req.params.hash
  const idOfHash = parseInt(hash, 36)

  Url.findOne({ id: idOfHash }, (err, url) => {
    if (err || url === null) {
      logger.error(err)
      return res.status(500).end()
    }
    res.redirect(url.link)
  })
})

app.get('/new/:url(*)', (req, res) => {
  const url = req.params.url
  const query = { link: url }

  Url.findOne(query, (err, url) => {
    if (err) {
      logger.error(err + '[Url.findOne]')
      return res.status(500).end()
    }

    if (url) {
      return res.json({
        original_url: url.link,
        short_url: req.shortTemplate + url.hash()
      })
    }

    const newUrl = new Url(query)
    newUrl.save((err, newUrl) => {
      if (err) {
        logger.error(err.message, err.stack)
        return res.status(500).end()
      }
      res.json({
        original_url: newUrl.link,
        short_url: req.shortTemplate + newUrl.hash()
      })
    })
  })
})

app.listen(app.get('port'), () => {
  logger.info('short-url app listening on port: ' + app.get('port'))
})
