const config = require('dotenv').config()
const https = require('https')
const webhookURL = config.parsed.WEBHOOK_URL

console.log(webhookURL)

module.exports = function sendSlackMessage (messageBody) {
  // make sure the incoming message body can be parsed into valid JSON
  try {
    messageBody = JSON.stringify(messageBody)
  } catch (e) {
    throw new Error('Failed to stringify messageBody', e)
  }

  // Promisify the https.request
  return new Promise((resolve, reject) => {
    // general request options, we defined that it's a POST request and content is JSON
    const requestOptions = {
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      }
    }

    // actual request
    const req = https.request(webhookURL, requestOptions, (res) => {
      let response = ''


      res.on('data', (d) => {
        response += d
      })

      // response finished, resolve the promise with data
      res.on('end', () => {
        resolve(response)
      })
    })

    // there was an error, reject the promise
    req.on('error', (e) => {
      reject(e)
    })

    // send our message body (was parsed to JSON beforehand)
    req.write(messageBody)
    req.end()
  })
}
