const inMemoryMetrics = {
  statusCounts: {},
  history: {},
  callCounts: 0,
  lastResponseTime: 0,
  maxResponseTime: 0,
  minResponseTime: Number.MAX_SAFE_INTEGER,
}

function record (requestDuration, statusCode = undefined) {
  if (requestDuration) {
    if (requestDuration > inMemoryMetrics.maxResponseTime) inMemoryMetrics.maxResponseTime = requestDuration
    if (requestDuration < inMemoryMetrics.minResponseTime) inMemoryMetrics.minResponseTime = requestDuration
    inMemoryMetrics.lastResponseTime = requestDuration
    inMemoryMetrics.callCounts++
    inMemoryMetrics.history[Date.now()] = requestDuration
  }

  if (statusCode) inMemoryMetrics.statusCounts[statusCode] = inMemoryMetrics.statusCounts[statusCode] ? inMemoryMetrics.statusCounts[statusCode] + 1 : 1
}

function writeToDisk (dir, filename) {
  const fs = require('fs')
  const path = require('path')
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, filename), JSON.stringify(inMemoryMetrics))
}

module.exports = {
  record,
  writeToDisk,
  metrics: inMemoryMetrics
}
