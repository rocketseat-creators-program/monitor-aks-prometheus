const Koa = require('koa')
const app = new Koa()
const axios = require('axios').default
const codes = require('http-status-codes').StatusCodes
const metricsService = require('./metrics')

const availableCodes = [
  codes.BAD_GATEWAY,
  codes.BAD_REQUEST,
  codes.UNAUTHORIZED,
  codes.FORBIDDEN,
  codes.NOT_FOUND,
  codes.NOT_ACCEPTABLE,
  codes.REQUEST_TIMEOUT,
  codes.CONFLICT,
  codes.GONE,
  codes.TOO_MANY_REQUESTS,
  codes.INTERNAL_SERVER_ERROR,
  codes.NOT_IMPLEMENTED,
  codes.SERVICE_UNAVAILABLE,
  codes.GATEWAY_TIMEOUT,
  codes.HTTP_VERSION_NOT_SUPPORTED
]

app.use(async (ctx, next) => {
  const start = Date.now()
  await next()
  const ms = Date.now() - start
  metricsService.record(ms)
  console.log(metricsService.metrics)
})

app.use(async (ctx) => {
  if (Math.random() >= 0.5) {
    const statusCode = availableCodes[Math.floor(Math.random() * availableCodes.length)]
    const statusMessage = codes[statusCode]
    ctx.statusCode = statusCode
    ctx.body = {
      code: statusCode,
      message: statusMessage
    }
    metricsService.record(null, statusCode)
    return
  }

  try {
    const url = `https://reqres.in/api/users/${Math.floor(Math.random() * 11)}?delay=${Math.random().toFixed(2)}`
    const { data: user } = await axios.get(url)
    metricsService.record(null, 200)
    ctx.body = user.data
    return
  } catch (err) {
    metricsService.record(null, 500)
    ctx.statusCode = 500
    ctx.body = {
      code: 500,
      message: availableCodes.INTERNAL_SERVER_ERROR
    }
  }
})

console.log(`Listening on 3000`)
app.listen(3000)

setInterval(() => { metricsService.writeToDisk('/tmp/shared', 'metrics.json') }, process.env.METRICS_WRITE_INTERVAL || 1000)
setInterval(() => { metricsService.metrics.history = {} }, 15000)
