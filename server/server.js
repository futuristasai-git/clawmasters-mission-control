import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import childProcess from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const publicDir = path.join(rootDir, 'public')

loadEnvFile(path.join(rootDir, '.env'))

const host = process.env.HOST || '127.0.0.1'
const port = Number(process.env.PORT || 3020)
const modeSetting = process.env.CLAWMASTERS_MODE || 'auto'
const stateDir = process.env.OPENCLAW_STATE_DIR || path.join(os.homedir(), '.openclaw')
const configPath = process.env.OPENCLAW_CONFIG_PATH || path.join(stateDir, 'openclaw.json')
const workspaceDir = path.join(stateDir, 'workspace')
const artifactsDir = path.join(workspaceDir, 'artifacts')
const memoryDir = path.join(workspaceDir, 'memory')
const agentsDir = path.join(stateDir, 'agents')
const cronPath = path.join(stateDir, 'cron', 'jobs.json')
const tasksPath = path.join(workspaceDir, 'tasks', 'index.json')
const projectsPath = path.join(workspaceDir, 'PROJETOS.md')
const usageLedgerPath = path.join(workspaceDir, 'usage', 'llm-usage.jsonl')
const modelPricesPath = path.join(workspaceDir, 'config', 'model-prices.json')
const expectedAgentNames = parseCsv(process.env.CLAWMASTERS_EXPECTED_AGENTS)
const hiddenAgentMatchers = parseCsv(process.env.OPENCLAW_HIDE_AGENT_IDS || 'skill-installer,lala')

const demoAgents = [
  ['main', 'Main', 'Chief of Staff', 'online', 'gpt-5.5', 12.4],
  ['product', 'Product', 'Product Strategist', 'online', 'gpt-5.5', 8.2],
  ['frontend', 'Frontend', 'Frontend Engineer', 'working', 'gpt-5.5', 6.1],
  ['backend', 'Backend', 'Backend Engineer', 'offline', 'gpt-5.5', 4.9],
  ['qa', 'QA', 'QA & Security', 'offline', 'gpt-5.5', 3.5],
  ['ops', 'Ops', 'OpenClaw Specialist', 'offline', 'gpt-5.5', 7.8],
  ['content', 'Content', 'Content Hunter', 'online', 'gpt-5.5', 5.6],
  ['traffic', 'Traffic', 'Traffic Manager', 'online', 'gpt-5.5', 4.1],
  ['scraper', 'Scraper', 'Scraping Specialist', 'online', 'gpt-5.5', 2.7]
].map(([id, name, role, status, model, cost]) => ({ id, name, role, status, model, cost }))

const demoTasks = [
  { id: 't1', title: 'Mapear workflow do aluno', status: 'doing', agent: 'Main', project: 'Clawmasters', priority: 'high' },
  { id: 't2', title: 'Criar pipeline de conteúdo', status: 'review', agent: 'Content', project: 'Content OS', priority: 'medium' },
  { id: 't3', title: 'Auditar cron jobs do OpenClaw', status: 'todo', agent: 'Ops', project: 'Automation', priority: 'high' },
  { id: 't4', title: 'Gerar PRD do dashboard', status: 'done', agent: 'Product', project: 'Mission Control', priority: 'medium' }
]

const demoProjects = [
  { id: 'p1', name: 'Clawmasters Mission Control', progress: 42, owner: 'Product', owners: 'Product', health: 'green', healthLabel: 'saudável', statusLabel: 'em execução', priorityClass: 'medium', source: 'demo data' },
  { id: 'p2', name: 'Content Engine', progress: 68, owner: 'Content', owners: 'Content', health: 'green', healthLabel: 'saudável', statusLabel: 'validação', priorityClass: 'medium', source: 'demo data' },
  { id: 'p3', name: 'Student Automation Lab', progress: 24, owner: 'Ops', owners: 'Ops', health: 'yellow', healthLabel: 'atenção', statusLabel: 'novo', priorityClass: 'high', source: 'demo data' }
]

const demoCron = [
  { id: 'daily-brief', name: 'Daily Brief', description: 'Resumo diário para revisar agentes, tarefas e prioridades.', schedule: '0 8 * * *', timezone: 'America/Sao_Paulo', status: 'ready', enabled: true, agent: 'Main', delivery: 'local', message: 'Gerar briefing diário.' },
  { id: 'weekly-review', name: 'Weekly Review', description: 'Revisão semanal de projetos e aprendizados.', schedule: '0 16 * * 5', timezone: 'America/Sao_Paulo', status: 'paused', enabled: false, agent: 'Ops', delivery: 'local', message: 'Revisar projetos.' }
]

const demoMemories = [
  { title: 'Preferências do Projeto', updatedLabel: 'demo', path: 'demo/memory/preferences.md', excerpt: 'Exemplo de memória persistente para decisões e preferências importantes.', tags: ['demo', 'memória'] },
  { title: 'Padrões de Operação', updatedLabel: 'demo', path: 'demo/memory/ops.md', excerpt: 'Exemplo de rotina operacional que alunos podem adaptar.', tags: ['demo', 'openclaw'] }
]

const demoDocs = [
  { title: 'Mission Control PRD.md', type: 'md', updated: 'demo', project: 'demo', path: 'demo/docs/mission-control-prd.md', sizeKb: 12 },
  { title: 'Student Playbook.md', type: 'md', updated: 'demo', project: 'demo', path: 'demo/docs/student-playbook.md', sizeKb: 8 }
]

const demoContent = {
  stages: [
    { id: 'coleta', label: 'Coleta', items: [{ title: 'Ideias da semana', kind: 'demo', updated: 'demo', path: 'demo/artifacts/ideas.md' }] },
    { id: 'curadoria', label: 'Curadoria', items: [{ title: 'Radar de referências', kind: 'demo', updated: 'demo', path: 'demo/artifacts/radar.md' }] },
    { id: 'roteiro', label: 'Roteiro', items: [{ title: 'Roteiro de aula', kind: 'demo', updated: 'demo', path: 'demo/artifacts/script.md' }] },
    { id: 'entrega', label: 'Entrega', items: [{ title: 'Publicação final', kind: 'demo', updated: 'demo', path: 'demo/artifacts/final.md' }] }
  ],
  summary: {
    manifests: 1,
    premiumReports: 1,
    publishedTexts: 1,
    latestAt: Date.now()
  }
}

const demoIntegrations = [
  { name: 'OpenClaw', status: 'planned', detail: 'demo mode aguardando openclaw.json', evidence: 'demo' },
  { name: 'Gateway local', status: 'planned', detail: 'configure na VPS quando necessário', evidence: 'demo' },
  { name: 'Mission Control', status: 'connected', detail: 'dashboard local ativo', evidence: '127.0.0.1:3020' },
  { name: 'Cron', status: 'connected', detail: '1 rotina demo ativa', evidence: 'demo cron' },
  { name: 'Memórias', status: 'connected', detail: '2 notas demo', evidence: 'demo memory' },
  { name: 'Documentos', status: 'connected', detail: '2 documentos demo', evidence: 'demo docs' },
  { name: 'Esteira de Conteúdo', status: 'connected', detail: '1 item demo', evidence: 'demo artifacts' },
  { name: 'Claw3D', status: 'planned', detail: 'opcional por instalação', evidence: 'demo' }
]

function loadEnvFile(filePath) {
  let text = ''
  try {
    text = fs.readFileSync(filePath, 'utf8')
  } catch {
    return
  }
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue
    const [, key, rawValue] = match
    if (process.env[key] !== undefined) continue
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '')
  }
}

function parseCsv(value) {
  return String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch {
    return null
  }
}

function safeStat(filePath) {
  try {
    return fs.statSync(filePath)
  } catch {
    return null
  }
}

function safeRead(filePath, limit = 8000) {
  try {
    const fd = fs.openSync(filePath, 'r')
    const buffer = Buffer.alloc(limit)
    const bytes = fs.readSync(fd, buffer, 0, limit, 0)
    fs.closeSync(fd)
    return buffer.subarray(0, bytes).toString('utf8')
  } catch {
    return ''
  }
}

function relativeToOpenClaw(filePath) {
  return path.relative(stateDir, filePath)
}

function displayPath(filePath) {
  const home = os.homedir()
  const value = String(filePath || '')
  if (!value) return null
  if (value === home) return '~'
  if (value.startsWith(`${home}${path.sep}`)) return `~/${path.relative(home, value)}`
  return value
}

function listFiles(dir, predicate = () => true, limit = 80) {
  const found = []
  function walk(current, depth) {
    if (depth < 0 || found.length > limit * 4) return
    let entries = []
    try {
      entries = fs.readdirSync(current, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (entry.name.startsWith('.git')) continue
      const filePath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        walk(filePath, depth - 1)
      } else if (predicate(filePath, entry.name)) {
        const stat = safeStat(filePath)
        if (stat) found.push({ filePath, name: entry.name, mtimeMs: stat.mtimeMs, size: stat.size })
      }
    }
  }
  walk(dir, 3)
  return found.sort((a, b) => b.mtimeMs - a.mtimeMs).slice(0, limit)
}

function formatWhen(ms) {
  if (!ms) return 'sem atividade'
  const diff = Date.now() - ms
  const minutes = Math.max(0, Math.round(diff / 60000))
  if (minutes < 60) return `${minutes} min atrás`
  const hours = Math.round(minutes / 60)
  if (hours < 48) return `${hours} h atrás`
  return new Date(ms).toLocaleDateString('pt-BR')
}

function excerpt(text) {
  return String(text || '')
    .replace(/^# .+$/gm, '')
    .replace(/[`*_>#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220)
}

function normalizeName(agent) {
  return agent?.identity?.name || agent?.name || agent?.id || 'Agent'
}

function normalizeAgentName(name) {
  return String(name || 'Agent').trim()
}

function shouldHideAgent(agent) {
  const id = String(agent?.id || '')
  return hiddenAgentMatchers.some(match => id === match || id.startsWith(match))
}

function readOpenClaw() {
  if (modeSetting === 'demo') return { cfg: null, agents: null, excluded: [], diagnostics: integrationDiagnostics(null, [], []) }

  const cfg = readJson(configPath)
  const list = Array.isArray(cfg?.agents?.list) ? cfg.agents.list : []
  if (!list.length) return { cfg, agents: null, excluded: [], diagnostics: integrationDiagnostics(null, [], []) }

  const excluded = list
    .filter(shouldHideAgent)
    .map(agent => ({
      id: agent.id || normalizeName(agent),
      name: normalizeAgentName(normalizeName(agent)),
      reason: 'oculto por OPENCLAW_HIDE_AGENT_IDS'
    }))

  const agents = list
    .filter(agent => !shouldHideAgent(agent))
    .map(agent => {
      const stats = agentSessionStats(agent.id)
      return {
        id: agent.id || normalizeName(agent),
        name: normalizeAgentName(normalizeName(agent)),
        role: agent?.identity?.theme || 'OpenClaw agent',
        status: agentRuntimeStatus(agent.id, stats),
        model: agent?.model?.primary || 'configured',
        fallbackCount: Array.isArray(agent?.model?.fallbacks) ? agent.model.fallbacks.length : 0,
        toolsProfile: agent?.tools?.profile || 'custom',
        toolCount: Array.isArray(agent?.tools?.alsoAllow) ? agent.tools.alsoAllow.length : 0,
        sessionCount: stats.count,
        lastSeenAt: stats.lastSeenAt,
        lastSeenLabel: formatWhen(stats.lastSeenAt),
        cost: 0
      }
    })

  return { cfg, agents, excluded, diagnostics: integrationDiagnostics(cfg, agents, excluded) }
}

function agentSessionStats(agentId) {
  const sessionDir = path.join(agentsDir, agentId, 'sessions')
  const files = listFiles(sessionDir, filePath => filePath.endsWith('.jsonl'), 250)
  return {
    count: files.length,
    lastSeenAt: files[0]?.mtimeMs || 0
  }
}

function agentRuntimeStatus(agentId, stats = agentSessionStats(agentId)) {
  if (!stats.lastSeenAt) return 'offline'
  const ageMinutes = (Date.now() - stats.lastSeenAt) / 60000
  if (ageMinutes <= 30) return 'online'
  if (ageMinutes <= 24 * 60) return 'idle'
  return 'offline'
}

function integrationDiagnostics(cfg, agents, excluded) {
  const names = new Set((agents || []).map(agent => agent.name))
  const hasExpectedList = expectedAgentNames.length > 0
  const missing = hasExpectedList ? expectedAgentNames.filter(name => !names.has(name)) : []
  const unexpected = hasExpectedList ? (agents || []).map(agent => agent.name).filter(name => !expectedAgentNames.includes(name)) : []
  const models = [...new Set((agents || []).map(agent => agent.model).filter(Boolean))]
  const fallbackCounts = [...new Set((agents || []).map(agent => Number(agent.fallbackCount || 0)))]
  const hasConfig = Boolean(cfg) && fs.existsSync(configPath)
  const stat = hasConfig ? fs.statSync(configPath) : null

  return {
    ok: Boolean(cfg && agents?.length && missing.length === 0 && unexpected.length === 0),
    source: hasConfig ? displayPath(configPath) : null,
    configFound: hasConfig,
    configUpdatedAt: stat ? stat.mtime.toISOString() : null,
    expectedAgents: expectedAgentNames,
    expectedAgentMode: hasExpectedList ? 'strict' : 'dynamic',
    mappedAgents: (agents || []).map(agent => agent.name),
    mappedCount: agents?.length || 0,
    excludedAgents: excluded,
    missingAgents: missing,
    unexpectedAgents: unexpected,
    primaryModels: models,
    fallbackChains: fallbackCounts.length === 1 ? `${fallbackCounts[0]} fallbacks por agente` : fallbackCounts.length ? `${fallbackCounts.join(', ')} fallbacks` : '0 fallbacks',
    mode: agents?.length ? 'openclaw-readonly' : 'demo'
  }
}

function readTasks() {
  const data = readJson(tasksPath)
  const tasks = Array.isArray(data?.tasks) ? data.tasks : demoTasks
  return normalizeTasks(tasks)
}

function normalizeTasks(tasks) {
  return tasks.slice(0, 80).map(task => ({
    id: task.id,
    title: task.title,
    status: normalizeTaskStatus(task.status),
    rawStatus: task.status,
    agent: normalizeAgentName(task.ownerAgent || task.agent || 'OpenClaw'),
    project: task.source || task.project || 'OpenClaw',
    priority: normalizePriority(task.priority),
    nextStep: task.nextStep || task.lastEvidence || '',
    lastEvidenceAt: task.lastEvidenceAt || task.updatedAt || '',
    updatedAt: task.updatedAt || task.createdAt || ''
  }))
}

function normalizeTaskStatus(status) {
  const value = String(status || '').toLowerCase()
  if (value.includes('conclu') || value === 'done') return 'done'
  if (value.includes('revis') || value.includes('review')) return 'review'
  if (value.includes('andamento') || value.includes('progress') || value === 'doing') return 'doing'
  return 'todo'
}

function normalizePriority(priority) {
  const value = String(priority || '').toLowerCase()
  if (value.includes('🔴') || value.includes('urgent') || value.includes('high')) return 'high'
  if (value.includes('🟠')) return 'medium'
  if (value.includes('🟡') || value.includes('medium')) return 'medium'
  return 'low'
}

function readProjects(tasks) {
  const boardProjects = readProjectsBoard()
  if (boardProjects.length) return boardProjects

  const groups = new Map()
  for (const task of tasks) {
    const key = task.project && task.project !== 'PROJETOS.md' ? task.project : task.title
    const current = groups.get(key) || { id: key, name: key, owner: task.agent, total: 0, done: 0, high: 0 }
    current.total += 1
    if (task.status === 'done') current.done += 1
    if (task.priority === 'high') current.high += 1
    groups.set(key, current)
  }
  const projects = [...groups.values()].map(project => ({
    ...project,
    progress: project.total ? Math.round((project.done / project.total) * 100) : 0,
    health: project.high > 0 && project.progress < 70 ? 'yellow' : 'green'
  }))
  return projects.length ? projects.slice(0, 12) : demoProjects
}

function readProjectsBoard() {
  const text = safeRead(projectsPath, 120000)
  if (!text) return []

  let section = 'Projetos'
  const projects = []
  for (const rawLine of text.split(/\r?\n/)) {
    const heading = rawLine.match(/^##\s+(.+)$/)
    if (heading) {
      section = heading[1].trim()
      continue
    }
    const match = rawLine.match(/^\[([^\]]+)\]\s+(.+)$/)
    if (!match) continue

    const status = match[1].trim()
    const fields = match[2].split('|').map(part => part.trim())
    if (fields.length < 7) continue

    const [name, owner, eta, priority, evidence, nextStep, updated] = fields
    const progress = projectProgress(status)
    const health = projectHealth(status, priority, updated)
    projects.push({
      id: slugify(name),
      name,
      owner: normalizeAgentName(owner.split('/')[0]),
      owners: owner,
      eta,
      priority,
      priorityClass: normalizePriority(priority),
      status,
      statusLabel: projectStatusLabel(status),
      section,
      evidence: excerpt(evidence),
      nextStep: excerpt(nextStep),
      updated,
      progress,
      health,
      healthLabel: projectHealthLabel(health),
      total: 1,
      done: progress === 100 ? 1 : 0,
      source: relativeToOpenClaw(projectsPath)
    })
  }

  const order = { red: 0, yellow: 1, green: 2 }
  return projects
    .sort((a, b) => {
      const doneDelta = Number(b.progress < 100) - Number(a.progress < 100)
      if (doneDelta) return doneDelta
      const healthDelta = (order[a.health] ?? 9) - (order[b.health] ?? 9)
      if (healthDelta) return healthDelta
      return String(b.updated).localeCompare(String(a.updated))
    })
    .slice(0, 24)
}

function slugify(value) {
  return String(value || 'project')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function projectStatusLabel(status) {
  const value = String(status || '').toUpperCase()
  if (value.includes('CONCLUID')) return 'concluído'
  if (value.includes('FECHAD')) return 'fechado'
  if (value.includes('VALIDAC')) return 'validação'
  if (value.includes('EXEC') || value.includes('ANDAMENTO')) return 'em execução'
  if (value.includes('PROVA')) return 'em prova'
  if (value.includes('BLOQUE')) return 'bloqueado'
  if (value.includes('NOVA')) return 'novo'
  return status
}

function projectProgress(status) {
  const value = String(status || '').toUpperCase()
  if (value.includes('CONCLUID') || value.includes('FECHAD')) return 100
  if (value.includes('VALIDAC')) return 78
  if (value.includes('EXEC') || value.includes('ANDAMENTO')) return 55
  if (value.includes('PROVA') || value.includes('BLOQUE')) return 35
  if (value.includes('NOVA')) return 15
  return 20
}

function projectHealth(status, priority, updated) {
  const value = String(status || '').toUpperCase()
  if (value.includes('FECHAD')) return 'yellow'
  if (value.includes('CONCLUID')) return 'green'
  if (value.includes('BLOQUE')) return 'red'

  const ageDays = updatedAgeDays(updated)
  if (ageDays !== null && ageDays > 14) return 'red'
  if (ageDays !== null && ageDays > 7) return 'yellow'
  if (normalizePriority(priority) === 'high') return 'yellow'
  return 'green'
}

function projectHealthLabel(health) {
  return health === 'green' ? 'saudável' : health === 'yellow' ? 'atenção/arquivado' : 'crítico'
}

function updatedAgeDays(value) {
  const match = String(value || '').match(/(\d{4}-\d{2}-\d{2})/)
  if (!match) return null
  const time = new Date(`${match[1]}T00:00:00-03:00`).getTime()
  if (!Number.isFinite(time)) return null
  return Math.floor((Date.now() - time) / 86400000)
}

function readCron() {
  const data = readJson(cronPath)
  const jobs = Array.isArray(data?.jobs) ? data.jobs : []
  return jobs.map(job => ({
    id: job.id,
    name: job.name || job.id,
    description: job.description || excerpt(job?.payload?.message),
    schedule: job?.schedule?.expr || 'manual',
    timezone: job?.schedule?.tz || 'local',
    status: job.enabled ? 'ready' : 'paused',
    enabled: Boolean(job.enabled),
    agent: normalizeAgentName(agentIdToName(job.agentId || 'main')),
    delivery: job?.delivery?.channel || 'local',
    message: excerpt(job?.payload?.message)
  })).sort((a, b) => Number(b.enabled) - Number(a.enabled) || a.name.localeCompare(b.name))
}

function agentIdToName(agentId) {
  const map = { main: 'Main' }
  return map[agentId] || agentId
}

function readMemories() {
  return listFiles(memoryDir, filePath => filePath.endsWith('.md'), 30).map(file => {
    const text = safeRead(file.filePath, 5000)
    return {
      title: text.match(/^#\s+(.+)$/m)?.[1] || file.name.replace(/\.md$/, ''),
      updatedAt: new Date(file.mtimeMs).toISOString(),
      updatedLabel: formatWhen(file.mtimeMs),
      path: relativeToOpenClaw(file.filePath),
      excerpt: excerpt(text),
      tags: inferTags(file.name, text)
    }
  })
}

function inferTags(name, text) {
  const source = `${name} ${text}`.toLowerCase()
  const tags = []
  for (const [needle, tag] of [['aurora', 'aurora'], ['claw3d', 'claw3d'], ['cron', 'cron'], ['qmd', 'qmd'], ['mem', 'memória'], ['telegram', 'telegram'], ['openclaw', 'openclaw']]) {
    if (source.includes(needle)) tags.push(tag)
  }
  return tags.slice(0, 4)
}

function readDocs() {
  const docs = listFiles(workspaceDir, (filePath, name) => {
    if (filePath.includes('/node_modules/') || filePath.includes('/.git/')) return false
    return /\.(md|json|txt|pdf|png|html)$/i.test(name)
  }, 80)
  return docs.map(file => ({
    title: file.name,
    type: path.extname(file.name).replace('.', '') || 'file',
    updated: formatWhen(file.mtimeMs),
    updatedAt: new Date(file.mtimeMs).toISOString(),
    project: file.filePath.includes('/artifacts/') ? 'artifacts' : file.filePath.includes('/memory/') ? 'memory' : file.filePath.includes('/research/') ? 'research' : 'workspace',
    path: relativeToOpenClaw(file.filePath),
    sizeKb: Math.max(1, Math.round(file.size / 1024))
  }))
}

function readContentPipeline() {
  const manifests = listFiles(artifactsDir, (filePath, name) => name.startsWith('aurora-openclaw-telegram-') && name.endsWith('-manifest.json'), 20)
  const premium = listFiles(artifactsDir, (filePath, name) => name.includes('aurora-openclaw-youtube-radar') && name.endsWith('.md'), 20)
  const published = listFiles(artifactsDir, (filePath, name) => name.startsWith('aurora-openclaw-telegram-') && name.endsWith('-text.md'), 20)
  const generic = listFiles(artifactsDir, (filePath, name) => /\.(md|json|txt)$/i.test(name), 24)
  const hasAuroraPipeline = manifests.length || premium.length || published.length

  if (!hasAuroraPipeline) {
    const buckets = [
      generic.filter((_, index) => index % 4 === 0),
      generic.filter((_, index) => index % 4 === 1),
      generic.filter((_, index) => index % 4 === 2),
      generic.filter((_, index) => index % 4 === 3)
    ]
    return {
      stages: [
        { id: 'coleta', label: 'Coleta', items: buckets[0].map(file => fileItem(file, 'Artefato')).slice(0, 6) },
        { id: 'curadoria', label: 'Curadoria', items: buckets[1].map(file => fileItem(file, 'Artefato')).slice(0, 6) },
        { id: 'roteiro', label: 'Roteiro', items: buckets[2].map(file => fileItem(file, 'Artefato')).slice(0, 6) },
        { id: 'entrega', label: 'Entrega', items: buckets[3].map(file => fileItem(file, 'Artefato')).slice(0, 6) }
      ],
      summary: {
        manifests: generic.filter(file => file.name.endsWith('.json')).length,
        premiumReports: generic.filter(file => file.name.endsWith('.md')).length,
        publishedTexts: generic.filter(file => file.name.endsWith('.txt')).length,
        latestAt: generic[0]?.mtimeMs || 0
      }
    }
  }

  return {
    stages: [
      { id: 'coleta', label: 'Coleta', items: manifests.map(file => manifestItem(file)).filter(Boolean).slice(0, 6) },
      { id: 'curadoria', label: 'Curadoria', items: premium.map(file => fileItem(file, 'Radar premium')).slice(0, 6) },
      { id: 'roteiro', label: 'Roteiro', items: published.map(file => fileItem(file, 'Texto final')).slice(0, 6) },
      { id: 'entrega', label: 'Entrega', items: manifests.map(file => deliveryItem(file)).filter(Boolean).slice(0, 6) }
    ],
    summary: {
      manifests: manifests.length,
      premiumReports: premium.length,
      publishedTexts: published.length,
      latestAt: manifests[0]?.mtimeMs || premium[0]?.mtimeMs || published[0]?.mtimeMs || 0
    }
  }
}

function readCosts(agents, cfg) {
  const pricing = readModelPricing(cfg)
  const records = readUsageRecords(pricing)
  const byAgent = rollup(records, record => record.agent)
  const byModel = rollup(records, record => `${record.provider}:${record.model}`)
  const total = records.reduce((sum, record) => sum + record.cost, 0)
  const priced = records.filter(record => record.costSource !== 'unpriced').length
  const tokens = records.reduce((sum, record) => sum + record.totalTokens, 0)

  const agentsWithUsage = agents.map(agent => {
    const usage = byAgent.find(item => item.key === agent.name) || { ...emptyUsage(agent.name), models: [] }
    return {
      ...agent,
      cost: usage.cost,
      usage
    }
  })

  return {
    summary: {
      totalCost: roundMoney(total),
      totalTokens: tokens,
      calls: records.length,
      pricedCalls: priced,
      unpricedCalls: records.length - priced,
      pricingCoverage: records.length ? Math.round((priced / records.length) * 100) : 0,
      source: {
        sessions: 'agents/*/sessions/*.jsonl',
        ledger: relativeToOpenClaw(usageLedgerPath),
        pricing: fs.existsSync(modelPricesPath) ? relativeToOpenClaw(modelPricesPath) : 'openclaw.json models.providers[].models[].cost'
      }
    },
    byAgent: byAgent.slice(0, 12),
    byModel: byModel.slice(0, 12),
    recent: records.slice(0, 20),
    agents: agentsWithUsage
  }
}

function demoCosts(agents) {
  const byAgent = agents.map(agent => ({
    ...emptyUsage(agent.name),
    key: agent.name,
    calls: 0,
    totalTokens: 0,
    cost: roundMoney(agent.cost || 0),
    models: [agent.model].filter(Boolean)
  }))
  const totalCost = roundMoney(byAgent.reduce((sum, item) => sum + item.cost, 0))
  return {
    summary: {
      totalCost,
      totalTokens: 0,
      calls: 0,
      pricedCalls: 0,
      unpricedCalls: 0,
      pricingCoverage: 100,
      source: {
        sessions: 'demo data',
        ledger: 'demo data',
        pricing: 'demo data'
      }
    },
    byAgent,
    byModel: [],
    recent: [],
    agents: agents.map(agent => ({ ...agent, usage: byAgent.find(item => item.key === agent.name) || emptyUsage(agent.name) }))
  }
}

function readModelPricing(cfg) {
  const prices = new Map()
  const add = (provider, model, cost = {}) => {
    if (!provider || !model) return
    const price = normalizePrice(cost)
    prices.set(`${provider}:${model}`, price)
    prices.set(String(model), price)
  }

  for (const [provider, data] of Object.entries(cfg?.models?.providers || {})) {
    for (const model of data.models || []) {
      add(provider, model.id || model.model || model.name, model.cost)
    }
  }

  const overrides = readJson(modelPricesPath)
  for (const [key, value] of Object.entries(overrides || {})) {
    prices.set(key, normalizePrice(value))
  }
  return prices
}

function normalizePrice(cost = {}) {
  return {
    input: Number(cost.inputPerMillion ?? cost.input_per_million ?? cost.input ?? 0),
    output: Number(cost.outputPerMillion ?? cost.output_per_million ?? cost.output ?? 0),
    cacheRead: Number(cost.cacheReadPerMillion ?? cost.cache_read_per_million ?? cost.cacheRead ?? cost.cache_read ?? 0),
    cacheWrite: Number(cost.cacheWritePerMillion ?? cost.cache_write_per_million ?? cost.cacheWrite ?? cost.cache_write ?? 0)
  }
}

function readUsageRecords(pricing) {
  const fromSessions = readUsageFromSessions(pricing)
  const fromLedger = readUsageFromLedger(pricing)
  const seen = new Set()
  return [...fromSessions, ...fromLedger]
    .filter(record => {
      const key = record.id || `${record.ts}:${record.agent}:${record.provider}:${record.model}:${record.totalTokens}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => Date.parse(b.ts || 0) - Date.parse(a.ts || 0))
}

function readUsageFromSessions(pricing) {
  const files = listFiles(agentsDir, (filePath, name) => name.endsWith('.jsonl') && filePath.includes('/sessions/'), 1200)
  const records = []
  for (const file of files) {
    const agentId = path.relative(agentsDir, file.filePath).split(path.sep)[0]
    const agent = normalizeAgentName(agentIdToName(agentId))
    const lines = safeRead(file.filePath, Math.min(6_000_000, Math.max(file.size, 1))).split(/\r?\n/)
    lines.forEach((line, index) => {
      if (!line.includes('"usage"')) return
      const data = parseJsonLine(line)
      const usage = data?.usage || data?.message?.usage
      if (!usage) return
      const provider = data.provider || data.message?.provider || 'unknown'
      const model = data.model || data.message?.model || data.modelId || data.message?.modelId || 'unknown'
      records.push(usageRecord({
        id: data.responseId || data.id || `${relativeToOpenClaw(file.filePath)}:${index}`,
        ts: normalizeTimestamp(data.timestamp || data.message?.timestamp || file.mtimeMs),
        agent,
        provider,
        model,
        auth: 'session',
        usage,
        source: relativeToOpenClaw(file.filePath)
      }, pricing))
    })
  }
  return records
}

function readUsageFromLedger(pricing) {
  const text = safeRead(usageLedgerPath, 8_000_000)
  if (!text) return []
  return text.split(/\r?\n/).map((line, index) => {
    const data = parseJsonLine(line)
    if (!data) return null
    return usageRecord({
      id: data.requestId || data.id || `ledger:${index}`,
      ts: normalizeTimestamp(data.ts || data.timestamp || Date.now()),
        agent: normalizeAgentName(data.agent || 'OpenClaw'),
      provider: data.provider || 'unknown',
      model: data.model || 'unknown',
      auth: data.auth || 'ledger',
      usage: data.usage || data,
      source: relativeToOpenClaw(usageLedgerPath)
    }, pricing)
  }).filter(Boolean)
}

function usageRecord(base, pricing) {
  const usage = base.usage || {}
  const input = usageNumber(usage.input ?? usage.inputTokens ?? usage.prompt_tokens ?? usage.promptTokens)
  const output = usageNumber(usage.output ?? usage.outputTokens ?? usage.completion_tokens ?? usage.completionTokens)
  const cacheRead = usageNumber(usage.cacheRead ?? usage.cache_read ?? usage.cached_tokens ?? usage.cacheReadTokens)
  const cacheWrite = usageNumber(usage.cacheWrite ?? usage.cache_write ?? usage.cacheWriteTokens)
  const totalTokens = usageNumber(usage.totalTokens ?? usage.total_tokens) || input + output + cacheRead + cacheWrite
  const reported = normalizeReportedCost(usage.cost)
  const calculated = calculateCost({ input, output, cacheRead, cacheWrite }, base.provider, base.model, pricing)
  const cost = reported.total > 0 ? reported.total : calculated.total
  return {
    ...base,
    input,
    output,
    cacheRead,
    cacheWrite,
    totalTokens,
    cost: roundMoney(cost),
    costSource: reported.total > 0 ? 'provider' : calculated.matched ? 'pricing' : 'unpriced'
  }
}

function usageNumber(value) {
  const number = Number(value || 0)
  return Number.isFinite(number) ? number : 0
}

function normalizeReportedCost(cost = {}) {
  return {
    total: Number(cost.total || 0)
  }
}

function calculateCost(tokens, provider, model, pricing) {
  const price = pricing.get(`${provider}:${model}`) || pricing.get(String(model)) || pricing.get(`${provider}:${String(model).replace(`${provider}/`, '')}`)
  if (!price) return { total: 0, matched: false }
  const total = (tokens.input / 1_000_000) * price.input
    + (tokens.output / 1_000_000) * price.output
    + (tokens.cacheRead / 1_000_000) * price.cacheRead
    + (tokens.cacheWrite / 1_000_000) * price.cacheWrite
  return { total, matched: true }
}

function rollup(records, keyFn) {
  const map = new Map()
  for (const record of records) {
    const key = keyFn(record) || 'unknown'
    const current = map.get(key) || emptyUsage(key)
    current.calls += 1
    current.input += record.input
    current.output += record.output
    current.cacheRead += record.cacheRead
    current.cacheWrite += record.cacheWrite
    current.totalTokens += record.totalTokens
    current.cost += record.cost
    current.unpriced += record.costSource === 'unpriced' ? 1 : 0
    current.models.add(`${record.provider}:${record.model}`)
    map.set(key, current)
  }
  return [...map.values()]
    .map(item => ({ ...item, cost: roundMoney(item.cost), models: [...item.models].slice(0, 4) }))
    .sort((a, b) => b.cost - a.cost || b.totalTokens - a.totalTokens)
}

function emptyUsage(key) {
  return { key, calls: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: 0, unpriced: 0, models: new Set() }
}

function parseJsonLine(line) {
  try {
    return line ? JSON.parse(line) : null
  } catch {
    return null
  }
}

function normalizeTimestamp(value) {
  if (typeof value === 'number') return new Date(value).toISOString()
  const time = Date.parse(value)
  return Number.isFinite(time) ? new Date(time).toISOString() : new Date().toISOString()
}

function roundMoney(value) {
  return Math.round(Number(value || 0) * 1000000) / 1000000
}

function fileItem(file, kind) {
  return {
    title: file.name.replace(/\.md$/, ''),
    kind,
    updated: formatWhen(file.mtimeMs),
    path: relativeToOpenClaw(file.filePath)
  }
}

function manifestItem(file) {
  const data = readJson(file.filePath)
  if (!data) return null
  return {
    title: `Radar ${data.date || file.name}`,
    kind: `${data.total_candidates || 0} candidatos`,
    updated: formatWhen(file.mtimeMs),
    path: relativeToOpenClaw(file.filePath)
  }
}

function deliveryItem(file) {
  const data = readJson(file.filePath)
  if (!data) return null
  return {
    title: `Entrega ${data.date || file.name}`,
    kind: data.visible_delivery || 'manifesto',
    updated: formatWhen(file.mtimeMs),
    path: relativeToOpenClaw(file.filePath)
  }
}

function readIntegrations(openclaw, cron, memories, docs, content) {
  const portOpen = isPortOpen(3020)
  const gatewayOpen = isPortOpen(18789)
  const claw3dOpen = isPortOpen(3000)
  return [
    { name: 'OpenClaw', status: openclaw.diagnostics.ok ? 'connected' : 'warning', detail: `${openclaw.diagnostics.mappedCount} agentes mapeados`, evidence: 'openclaw.json' },
    { name: 'Gateway local', status: gatewayOpen ? 'connected' : 'warning', detail: gatewayOpen ? 'porta 18789 ativa' : 'HTTP público indisponível', evidence: '127.0.0.1:18789' },
    { name: 'Mission Control', status: portOpen ? 'connected' : 'warning', detail: portOpen ? 'serviço launchd ativo' : 'porta 3020 fechada', evidence: '127.0.0.1:3020' },
    { name: 'Cron', status: cron.some(job => job.enabled) ? 'connected' : 'warning', detail: `${cron.filter(job => job.enabled).length} rotinas ativas`, evidence: 'cron/jobs.json' },
    { name: 'Memórias', status: memories.length ? 'connected' : 'warning', detail: `${memories.length} notas recentes`, evidence: 'workspace/memory' },
    { name: 'Documentos', status: docs.length ? 'connected' : 'warning', detail: `${docs.length} artefatos indexados`, evidence: 'workspace/artifacts' },
    { name: 'Esteira Aurora', status: content.summary.publishedTexts ? 'connected' : 'warning', detail: `${content.summary.publishedTexts} textos recentes`, evidence: 'artifacts/aurora-*' },
    { name: 'Claw3D', status: claw3dOpen ? 'connected' : 'planned', detail: claw3dOpen ? 'porta 3000 ativa' : 'não detectado agora', evidence: '127.0.0.1:3000' }
  ]
}

function isPortOpen(portNumber) {
  try {
    childProcess.execFileSync('lsof', ['-nP', `-iTCP:${portNumber}`, '-sTCP:LISTEN'], { timeout: 1200, stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function payload() {
  const openclaw = readOpenClaw()
  const isDemo = !openclaw.agents
  const baseAgents = openclaw.agents || demoAgents
  const costs = openclaw.agents ? readCosts(baseAgents, openclaw.cfg) : demoCosts(baseAgents)
  const agents = costs.agents
  const tasks = isDemo ? normalizeTasks(demoTasks) : readTasks()
  const projects = isDemo ? demoProjects : readProjects(tasks)
  const cron = isDemo ? demoCron : readCron()
  const memories = isDemo ? demoMemories : readMemories()
  const docs = isDemo ? demoDocs : readDocs()
  const content = isDemo ? demoContent : readContentPipeline()
  const integrations = isDemo ? demoIntegrations : readIntegrations(openclaw, cron, memories, docs, content)
  const online = agents.filter(a => a.status !== 'offline').length
  return {
    mode: openclaw.agents ? 'openclaw-readonly' : 'demo',
    generatedAt: new Date().toISOString(),
    system: {
      name: 'Clawmasters Mission Control',
      version: '0.1.0',
      openclawConfigFound: fs.existsSync(configPath),
      stateDir: displayPath(stateDir),
      configPath: displayPath(configPath)
    },
    integration: openclaw.diagnostics,
    metrics: {
      agentsTotal: agents.length,
      agentsOnline: online,
      tasksOpen: tasks.filter(t => t.status !== 'done').length,
      projectsActive: projects.length,
      monthlyCost: costs.summary.totalCost
    },
    costs,
    agents,
    tasks,
    projects,
    docs,
    cron,
    memories,
    content,
    integrations
  }
}

function sendJson(res, data, status = 200) {
  const body = JSON.stringify(data, null, 2)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  })
  res.end(body)
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const safePath = url.pathname === '/' ? '/index.html' : url.pathname
  const filePath = path.normalize(path.join(publicDir, safePath))
  if (filePath !== publicDir && !filePath.startsWith(`${publicDir}${path.sep}`)) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }
  const ext = path.extname(filePath)
  const type = ext === '.css' ? 'text/css'
    : ext === '.js' ? 'text/javascript'
      : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
        : ext === '.png' ? 'image/png'
          : 'text/html'
  fs.readFile(filePath, (err, data) => {
    if (err) {
      fs.readFile(path.join(publicDir, 'index.html'), (_fallbackErr, fallback) => {
        res.writeHead(_fallbackErr ? 404 : 200, { 'content-type': _fallbackErr ? 'text/plain' : 'text/html; charset=utf-8' })
        res.end(_fallbackErr ? 'Not found' : fallback)
      })
      return
    }
    res.writeHead(200, { 'content-type': `${type}; charset=utf-8` })
    res.end(data)
  })
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  if (url.pathname === '/api/mission') return sendJson(res, payload())
  if (url.pathname === '/api/integration') return sendJson(res, payload().integration)
  if (url.pathname === '/api/health') return sendJson(res, { status: 'healthy', ...payload().system })
  return serveStatic(req, res)
})

server.listen(port, host, () => {
  console.log(`Clawmasters Mission Control running at http://${host}:${port}`)
})
