const Koa = require('koa')
const app = new Koa()
const axios = require('axios').default

const codes = require('http-status-codes').StatusCodes
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
  if (Math.random() >= 0.5) {
    const statusMessage = availableCodes[Math.floor(Math.random() * availableCodes.length)]
    const statusCode = codes[statusMessage]
    ctx.statusCode = statusCode
    ctx.body = {
      code: statusCode,
      message: statusMessage
    }
    return next()
  }

  try {
    const url = `https://reqres.in/api/users/${Math.floor(Math.random() * 11)}?delay=${Math.random().toFixed(2)}`
    const { data: user } = await axios.get(url)
    ctx.body = user.data
    return next()
  } catch (err) {
    ctx.statusCode = 500
    ctx.body = {
      code: 500,
      message: availableCodes.INTERNAL_SERVER_ERROR
    }
  }
})

console.log(`Listening on 3000`)
app.listen(3000)
