const express = require('express')
const app = express()
const psi = require('psi')
const config = require('dotenv').config()
const sendSlackMessage = require('./webhook')
const bodyParser = require('body-parser')

const createMessage = (url, report = {}) => {
  const fields = Object.keys(report).map(key => {
    return {
      'title': key,
      'value': report[key],
      'short': true
    }
  })

  return {
    'username': 'Olympians - PageSpeed report',
    'text': `New speed test: ${url}`,
    'icon_emoji': ':boat:',
    'attachments': [ // attachments, here we also use long attachment to use more space
      {
        'color': '#4c74b9',
        'fields': fields,
      }
    ],
  }
}

app.use(
  bodyParser.urlencoded({
    extended: true
  })
)

app.use(bodyParser.json())

app.get('/psi', async function(req, res) {
  const url = req.body.text || req.query.url
  console.log('start processing: ' + url)

  try {
    // Get the PageSpeed Insights report
    const { data } = await psi(url)

    // Real-world metrics
    const cruxMetrics = {
      'First Contentful Paint': data.loadingExperience.metrics.FIRST_CONTENTFUL_PAINT_MS.category,
      'First Input Delay': data.loadingExperience.metrics.FIRST_INPUT_DELAY_MS.category
    }
    // Lab metrics
    const lighthouse = data.lighthouseResult
    const lighthouseMetrics = {
      'First Contentful Paint': lighthouse.audits['first-contentful-paint'].displayValue,
      'Speed Index': lighthouse.audits['speed-index'].displayValue,
      'Time To Interactive': lighthouse.audits['interactive'].displayValue,
    }

    const report = {
      'Speed score': data.lighthouseResult.categories.performance.score * 100,
      ...cruxMetrics,
      ...lighthouseMetrics,
    }

    // curl -X POST --data-urlencode
    // 'payload={\'channel\': \'#general\', \'username\': \'webhookbot\', \'text\': \'This is posted to #general and comes from a bot named webhookbot.\', \'icon_emoji\': \':ghost:\'}'
    // https://hooks.slack.com/services/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

    const message = createMessage(url, report)
    sendSlackMessage(message)

    res.send(report)
  } catch (e) {
    res.send('request failed')
    throw e
  }
})

const port = config.parsed.SEVER_PORT
app.listen(port, function () {
  console.log(`app listening on port: ${port}`)
})
