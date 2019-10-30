const express = require('express')
const app = express()

const bodyParser = require('body-parser')

app.use(bodyParser.json())

const mongoose = require('mongoose')
const autoIncrement = require('mongoose-auto-increment')

const UrlService = require('./services/UrlService')
const UrlResponse = require('./infrastructure/responses/UrlResponse')

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
const urlService = new UrlService({
  UrlModel: Url
})

app.set('port', process.env.PORT || DEFAULT_APPLICATION_PORT)
app.set('view engine', 'ejs')

// may not need this after all.
app.use((req, res, next) => {
  req.shortTemplate = `${req.protocol}://${req.get('host')}/`
  next()
})

app.get('/list/', async (req, res) => {
  try {
    const urls = await urlService.list()
    res.render('pages/list', { urls: urls, shortTemplate: req.shortTemplate })
  } catch (err) {
    logger.error(err.message, err.stack)
    return res.status(500).end()
  }
})

app.get('/', (req, res) => {
  res.render('pages/index')
})

app.get('/:hash', async (req, res) => {
  const hash = req.params.hash

  try {
    const url = await urlService.urlFor(hash)
    if (!url) {
      return res.status(404).end()
    }
    res.redirect(url.link)
  } catch (err) {
    logger.error(err)
    return res.status(500).end()
  }
})

app.post('/', async (req, res) => {
  try {
    const url = await urlService.getSet(req.body.url)

    return res.json(UrlResponse.jsonResponseFor(url, req.shortTemplate))
  } catch (err) {
    logger.error(err.message, err.stack)
    return res.status(500).end()
  }
})

app.listen(app.get('port'), () => {
  logger.info('short-url app listening on port: ' + app.get('port'))
})
