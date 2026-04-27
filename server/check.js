import http from 'node:http'

const port = Number(process.env.PORT || 3020)
const host = process.env.HOST || '127.0.0.1'

function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.get({ host, port, path, timeout: 3000 }, res => {
      let body = ''
      res.on('data', chunk => { body += chunk })
      res.on('end', () => resolve({ status: res.statusCode, body }))
    })
    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy(new Error('timeout'))
    })
  })
}

const health = await get('/api/health')
if (health.status !== 200) throw new Error(`health failed: ${health.status}`)
const mission = await get('/api/mission')
if (mission.status !== 200) throw new Error(`mission failed: ${mission.status}`)
const data = JSON.parse(mission.body)
if (!Array.isArray(data.agents) || data.agents.length === 0) throw new Error('no agents loaded')
if (!['openclaw-readonly', 'demo'].includes(data.mode)) throw new Error(`unexpected mode: ${data.mode}`)
if (data.mode === 'openclaw-readonly' && data.integration && !data.integration.ok) throw new Error(`integration diagnostic failed: ${JSON.stringify(data.integration)}`)
if (!data.costs?.summary) throw new Error('missing cost summary')
if (data.costs.summary.calls > 0) {
  if (data.costs.summary.unpricedCalls !== 0) throw new Error(`unpriced calls: ${data.costs.summary.unpricedCalls}`)
  if (data.costs.summary.pricingCoverage < 100) throw new Error(`pricing coverage below 100%: ${data.costs.summary.pricingCoverage}`)
}
console.log(`ok: ${data.mode}, ${data.agents.length} agents, ${data.costs.summary.pricingCoverage}% cost coverage`)
