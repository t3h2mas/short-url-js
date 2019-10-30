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

app.get('/list/', async (req, res) => {
  try {
    const urls = await Url.find({})
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
  const idOfHash = parseInt(hash, 36)

  try {
    const url = await Url.findOne({ id: idOfHash })
    if (!url) {
      return res.status(404).end()
    }
    res.redirect(url.link)
  } catch (err) {
    logger.error(err)
    return res.status(500).end()
  }
})

app.get('/new/:url(*)', async (req, res) => {
  const url = req.params.url

  const existingUrl = await Url.findOne({
    link: url
  })

  if (existingUrl) {
    return res.json({
      original_url: existingUrl.link,
      short_url: req.shortTemplate + existingUrl.hash()
    })
  }

  const newUrl = new Url({
    link: url
  })

  try {
    const createdUrl = await newUrl.save()
    res.json({
      original_url: createdUrl.link,
      short_url: req.shortTemplate + createdUrl.hash()
    })
  } catch (err) {
    logger.error(err.message, err.stack)
    return res.status(500).end()
  }
})

app.listen(app.get('port'), () => {
  logger.info('short-url app listening on port: ' + app.get('port'))
})
