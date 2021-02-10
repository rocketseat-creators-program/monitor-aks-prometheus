const Koa = require('koa')
const app = new Koa()

const prometheus = require('prom-client')
const PrometheusRegistry = prometheus.Registry
const registry = new PrometheusRegistry()
let lastHash = 0

const PREFIX = `node_http_random_api_`
const pollingInterval = process.env.POLLING_INTERVAL_MS || 1000
registry.setDefaultLabels({ service: 'node_http_random_api', hostname: process.env.POD_NAME || process.env.HOSTNAME || 'unknown' })

// METRICS START

const totalScrapesCounter = new prometheus.Counter({
  name: `${PREFIX}total_scrapes`,
  help: 'Number of times the service has been scraped for metrics'
})
registry.registerMetric(totalScrapesCounter)

const maxResponseTime = new prometheus.Gauge({
  name: `${PREFIX}max_response_time`,
  help: 'Max response time of the api in ms'
})
registry.registerMetric(maxResponseTime)

const minResponseTime = new prometheus.Gauge({
  name: `${PREFIX}min_response_time`,
  help: 'Min response time of the api in ms'
})
registry.registerMetric(minResponseTime)

const totalCalls = new prometheus.Gauge({
  name: `${PREFIX}total_calls`,
  help: 'Total number of calls computed until now'
})
registry.registerMetric(totalCalls)

const responseTimes = new prometheus.Summary({
  name: `${PREFIX}response_time`,
  help: 'Response times of the api'
})
registry.registerMetric(responseTimes)

const statusCounts = new prometheus.Gauge({
  name: `${PREFIX}status_counts`,
  help: 'Status counts by status code',
  labelNames: ['statusCode']
})
registry.registerMetric(statusCounts)

// --Utility Function-- //

async function scrapeApplication () {
  // Importante que seja assíncrono se não o event loop será bloqueado
  const file = await require('fs/promises').readFile('/tmp/shared/metrics.json')
  const currentHash = require('crypto').createHash('sha256').update(file).digest('hex')
  console.log(`Scraping file [scrape hash: ${currentHash}]`)

  if (lastHash === currentHash) return console.log(`No new changes detected`)
  lastHash = currentHash

  try {
    const metrics = JSON.parse(file)

    totalScrapesCounter.inc()
    totalCalls.set(metrics.callCounts)
    maxResponseTime.set(metrics.maxResponseTime)
    minResponseTime.set(metrics.minResponseTime)
    responseTimes.observe(metrics.lastResponseTime)

    for (const code in metrics.statusCounts) {
      statusCounts.labels({ statusCode: code }).set(metrics.statusCounts[code])
    }

    console.log(`Scraped data [scrape hash: ${currentHash}]`)
    return metrics
  } catch (err) {
    // Para evitarmos cair nos casos onde o exporter lê o arquivo incompleto
    return
  }
}

// --Servers start-- //

app.use(async ctx => {
  console.log(`Received scrape request: ${ctx.method} ${ctx.url} @ ${new Date().toUTCString()}`)
  ctx.set('Content-Type', registry.contentType)
  ctx.body = await registry.metrics()
})

// start loop
if (pollingInterval > 0) {
  setInterval(async () => {
    scrapeApplication()
  }, pollingInterval)
}

console.log(`Listening on 9837`)
app.listen(9837)
