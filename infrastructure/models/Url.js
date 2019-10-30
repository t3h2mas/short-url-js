const mongoose = require('mongoose')
const autoIncrement = require('mongoose-auto-increment')

const urlSchema = mongoose.Schema({
  link: {
    type: String,
    index: { unique: true, dropDups: true }
  }
})

urlSchema.methods.hash = function() {
  return this.id.toString(36)
}

urlSchema.plugin(autoIncrement.plugin, {
  model: 'Url',
  field: 'id',
  startAt: 1
})

const Url = mongoose.model('Url', urlSchema)

module.exports = Url
