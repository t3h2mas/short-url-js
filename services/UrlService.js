class UrlService {
  constructor({ UrlModel }) {
    this.UrlModel = UrlModel
  }

  list() {
    return this.UrlModel.find({})
  }

  urlFor(hash) {
    const idOfHash = parseInt(hash, 36)
    return this.UrlModel.findOne({ id: hash })
  }

  async getSet(url) {
    const existingUrl = await this.UrlModel.findOne({
      link: url
    })

    if (existingUrl) {
      return existingUrl
    }

    return new this.UrlModel({
      link: url
    }).save()
  }
}

module.exports = UrlService
