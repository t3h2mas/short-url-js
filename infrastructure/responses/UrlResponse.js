class UrlResponse {
  static jsonResponseFor(url, baseUrl) {
    return {
      original_url: url.link,
      short_url: baseUrl + url.hash()
    }
  }
}

module.exports = UrlResponse
