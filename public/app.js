const navItems = [
  {
    id: 'dashboard',
    label: 'Painel Geral',
    short: 'Visão de comando',
    description: 'Resumo executivo do OpenClaw: agentes, tarefas, projetos, custo e prontidão operacional.',
    usage: 'Use esta tela no início do dia para entender rapidamente o que está ativo, o que precisa de atenção e se o Mission Control está conectado ao OpenClaw.',
    source: '~/.openclaw/openclaw.json, workspace/tasks/index.json, workspace/PROJETOS.md, cron/jobs.json e workspace/memory.'
  },
  {
    id: 'agents',
    label: 'Agentes',
    short: 'Equipe OpenClaw',
    description: 'Mostra os agentes reais configurados no OpenClaw local, seus papéis, status e modelo principal.',
    usage: 'Confira aqui se a frota esperada está aparecendo. Se um agente estiver offline, trate como sinal para revisar configuração, escopo ou disponibilidade.',
    source: '~/.openclaw/openclaw.json e sessões em ~/.openclaw/agents/*/sessions.'
  },
  {
    id: 'tasks',
    label: 'Quadro de Tarefas',
    short: 'Execução por etapa',
    description: 'Organiza o trabalho em planejamento, execução, revisão e concluído.',
    usage: 'Os dados vêm de ~/.openclaw/workspace/tasks/index.json. Hoje esse índice foi sincronizado do PROJETOS.md, e o rodapé de cada card mostra a fonte original. Para mudar o quadro, atualize o índice de tarefas do OpenClaw ou rode o sync a partir do PROJETOS.md.',
    source: '~/.openclaw/workspace/tasks/index.json; origem atual sincronizada de ~/.openclaw/workspace/PROJETOS.md.'
  },
  {
    id: 'calendar',
    label: 'Agenda e Cron',
    short: 'Rotinas automáticas',
    description: 'Central para rotinas recorrentes, briefings, verificações e automações agendadas.',
    usage: 'Use para planejar o que deve rodar sozinho: relatórios diários, coleta de dados, revisão de memória e alertas operacionais.',
    source: '~/.openclaw/cron/jobs.json.'
  },
  {
    id: 'projects',
    label: 'Projetos',
    short: 'Frentes de trabalho',
    description: 'Agrupa tarefas e agentes por objetivo de negócio, aula, produto ou laboratório.',
    usage: 'Crie um projeto para cada entrega relevante e acompanhe dono, saúde e progresso sem misturar assuntos.',
    source: '~/.openclaw/workspace/PROJETOS.md, interpretado no formato do quadro FES.'
  },
  {
    id: 'content',
    label: 'Esteira de Conteúdo',
    short: 'Produção e publicação',
    description: 'Pipeline para ideias, pesquisa, roteiro, revisão e publicação.',
    usage: 'Ideal para aulas, newsletters, posts, vídeos e materiais dos alunos. Cada etapa deixa claro o próximo movimento.',
    source: '~/.openclaw/workspace/artifacts/aurora-* manifests, relatórios e textos finais.'
  },
  {
    id: 'memories',
    label: 'Memórias',
    short: 'Contexto persistente',
    description: 'Registro de aprendizados, decisões, preferências e contexto que não pode se perder.',
    usage: 'Use como diário operacional: salve decisões importantes, padrões que funcionaram e informações que os agentes devem lembrar.',
    source: '~/.openclaw/workspace/memory/*.md.'
  },
  {
    id: 'docs',
    label: 'Documentos',
    short: 'Base de conhecimento',
    description: 'Biblioteca para PRDs, playbooks, briefs, pesquisas e materiais de apoio.',
    usage: 'Mantenha documentos ligados aos projetos certos para que a equipe saiba onde buscar referência antes de executar.',
    source: '~/.openclaw/workspace, especialmente artifacts, memory e research.'
  },
  {
    id: 'team',
    label: 'Organograma',
    short: 'Papéis e responsabilidades',
    description: 'Mostra a frota detectada no OpenClaw do aluno e organiza os agentes em uma visão simples de comando.',
    usage: 'Use esta tela para entender quem é o agente principal detectado e quais agentes operam como equipe no OpenClaw local.',
    source: '~/.openclaw/openclaw.json; opcionalmente CLAWMASTERS_EXPECTED_AGENTS para uma frota estrita.'
  },
  {
    id: 'costs',
    label: 'Custos e Modelos',
    short: 'Controle financeiro',
    description: 'Acompanha modelos, custos e futuramente tokens por agente, projeto e período.',
    usage: 'Use para evitar surpresas: compare custo por agente, ajuste modelos e ensine alunos a operar com responsabilidade.',
    source: 'Modelos e preços vêm de ~/.openclaw/openclaw.json. Uso real vem dos JSONL de ~/.openclaw/agents/*/sessions e, quando existir, de workspace/usage/llm-usage.jsonl.'
  },
  {
    id: 'integrations',
    label: 'Integrações',
    short: 'Conexões externas',
    description: 'Mapa de serviços que podem alimentar ou receber dados do Mission Control.',
    usage: 'Comece por OpenClaw e GitHub. Depois conecte Obsidian, Telegram, Slack, Drive e outras ferramentas conforme a necessidade.',
    source: 'Diagnósticos locais: openclaw.json, portas 3020/3000/18789, cron/jobs.json e diretórios workspace.'
  }
]

let state = null
let active = 'dashboard'
const refreshIntervalMs = 30 * 60 * 1000

const nav = document.querySelector('#nav')
const view = document.querySelector('#view')
const title = document.querySelector('#page-title')
const modePill = document.querySelector('#mode-pill')

function statusClass(status) {
  if (['online', 'working', 'ready', 'connected'].includes(status)) return 'green'
  if (['draft', 'review', 'idle', 'paused', 'planned', 'warning'].includes(status)) return 'amber'
  if (['offline', 'error'].includes(status)) return 'red'
  return 'cyan'
}

function translateStatus(status) {
  const labels = {
    online: 'online',
    offline: 'offline',
    ready: 'pronto',
    paused: 'pausado',
    draft: 'rascunho',
    review: 'revisão',
    working: 'trabalhando',
    idle: 'ocioso',
    connected: 'conectado',
    warning: 'atenção',
    planned: 'planejado',
    error: 'erro'
  }
  return labels[status] || status
}

function translatePriority(priority) {
  const labels = { high: 'alta', medium: 'média', low: 'baixa' }
  return labels[priority] || priority
}

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function sanitizeValue(value) {
  if (typeof value === 'string') return escapeHtml(value)
  if (Array.isArray(value)) return value.map(sanitizeValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeValue(item)]))
  }
  return value
}

function safePercent(value) {
  const number = Number(value || 0)
  if (!Number.isFinite(number)) return 0
  return Math.min(100, Math.max(0, number))
}

function compactNumber(value) {
  return Number(value || 0).toLocaleString('pt-BR')
}

function formatDateTime(value) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return 'não informado'
  return date.toLocaleString('pt-BR')
}

function card(content, extra = '') {
  return `<article class="card ${extra}">${content}</article>`
}

function metric(label, value, hint) {
  return card(`<span>${label}</span><strong>${value}</strong><p>${hint}</p>`, 'metric')
}

function renderNav() {
  nav.innerHTML = navItems.map(item => (
    `<button class="nav-btn ${active === item.id ? 'active' : ''}" data-nav="${item.id}">
      <span>${item.label}</span>
      <small>${item.short}</small>
    </button>`
  )).join('')
  nav.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      active = btn.dataset.nav
      render()
    })
  })
}

function renderGuide() {
  const item = navItems.find(navItem => navItem.id === active)
  if (!item) return ''
  return `
    <section class="guide-panel">
      <div>
        <span class="section-kicker">O que é</span>
        <p>${item.description}</p>
      </div>
      <div>
        <span class="section-kicker">Como usar</span>
        <p>${item.usage}</p>
      </div>
      <div class="guide-source">
        <span class="section-kicker">Fonte dos dados</span>
        <p>${item.source}</p>
      </div>
    </section>
  `
}

function renderDashboard() {
  const m = state.metrics
  const integration = state.integration || {}
  return `
    <section class="command-hero">
      <div>
        <span class="section-kicker">Mission Control Futuristas</span>
        <h2>OpenClaw traduzido em operação visual, ensinável e auditável.</h2>
        <p>Esta versão conecta em modo somente leitura ao OpenClaw local, preserva segurança e transforma agentes, tarefas e automações em um painel fácil de explicar para alunos.</p>
      </div>
      <div class="hero-logo-card" aria-label="Logo Clawmasters">
        <img src="/assets/clawmasters-logo.jpeg" alt="Clawmasters Futuristas" />
      </div>
      <div class="signal-stack" aria-label="Estado do sistema">
        <span>OpenClaw</span>
        <strong>${state.mode === 'openclaw-readonly' ? 'Conectado' : 'Demo'}</strong>
        <small>${m.agentsTotal} agentes mapeados</small>
      </div>
    </section>
    <div class="grid cols-4">
      ${metric('Agentes mapeados', `${m.agentsOnline}/${m.agentsTotal}`, 'Frota operacional com sessão local conhecida')}
      ${metric('Tarefas abertas', m.tasksOpen, 'Trabalho que ainda move a operação')}
      ${metric('Projetos mapeados', m.projectsActive, 'Frentes organizadas por objetivo')}
      ${metric('Custo local', money(m.monthlyCost), 'Estimativa pelo histórico local de sessões')}
    </div>
    ${card(`<h2>Atualização automática</h2><p>O Mission Control relê os dados do OpenClaw automaticamente a cada <strong>30 minutos</strong>, sem precisar de cron externo. Última leitura: <strong>${formatDateTime(state.generatedAt)}</strong>.</p><div class="row"><span class="pill green">auto-refresh ativo</span><span class="pill cyan">intervalo: 30 min</span><span class="pill">somente leitura</span></div>`, 'refresh-card')}
    <div class="grid cols-2" style="margin-top:16px">
      ${card(`<h2>Sequência de Lançamento</h2><p>O aluno começa em modo demo, conecta o OpenClaw local, organiza agentes, tarefas, memória e automações.</p><div class="row"><span class="pill green">Demo pronto</span><span class="pill cyan">Adaptador somente leitura</span><span class="pill amber">Modo Pro no roadmap</span></div>`)}
      ${card(`<h2>Diagnóstico OpenClaw</h2><p>${integration.ok ? 'Integração validada com a frota detectada nesta instalação.' : 'A integração precisa de atenção.'}</p><div class="row"><span class="pill ${integration.ok ? 'green' : 'red'}">${integration.mappedCount || 0} agentes</span><span class="pill cyan">${integration.expectedAgentMode === 'strict' ? 'modo estrito' : 'modo dinâmico'}</span><span class="pill cyan">${integration.fallbackChains || 'fallbacks não detectados'}</span><span class="pill amber">${integration.excludedAgents?.length || 0} ocultos</span></div>`)}
    </div>
    ${card(`<h2>Arquitetura de Aprendizado</h2><p>Cada tela explica um conceito: agente, subagente, cron, memória, documento, custo, projeto e integração.</p><div class="progress"><div class="bar" style="width:${safePercent(42)}%"></div></div>`, 'learning-card')}
  `
}

function renderAgents() {
  return `<div class="grid cols-3">${state.agents.map(a => card(`
    <div class="row">
      <div class="avatar">${a.name.slice(0,2).toUpperCase()}</div>
      <div><h3>${a.name}</h3><p>${a.role}</p></div>
    </div>
    <div class="row"><span class="pill ${statusClass(a.status)}">${translateStatus(a.status)}</span><span class="pill">${a.model}</span><span class="pill cyan">${a.fallbackCount || 0} fallbacks</span><span class="pill">${a.lastSeenLabel || 'sem atividade'}</span></div>
  `, 'agent-card')).join('')}</div>`
}

function renderTasks() {
  const columns = [
    ['todo', 'Projetos Planejados', 'Ideias e frentes ainda aguardando execução'],
    ['doing', 'Em execução', 'Trabalho em movimento agora'],
    ['review', 'Revisão', 'Itens em validação antes de fechar'],
    ['done', 'Concluído', 'Entregas já finalizadas']
  ]
  return `
    ${card(`<h2>Fonte das tarefas</h2><p>Este Kanban lê <strong>~/.openclaw/workspace/tasks/index.json</strong>. No estado atual, esse arquivo foi gerado/sincronizado a partir de <strong>PROJETOS.md</strong>; por isso muitos cards mostram <strong>PROJETOS.md</strong> no rodapé.</p><div class="row"><span class="pill cyan">${state.tasks.length} tarefas lidas</span><span class="pill">workspace/tasks/index.json</span><span class="pill amber">source: PROJETOS.md</span></div>`, 'tasks-source')}
    <div class="kanban">${columns.map(([status, label, description]) => `
    <section class="column">
      <div class="column-head">
        <div><h2>${label}</h2><p>${description}</p></div>
        <span class="pill cyan">${state.tasks.filter(t => t.status === status).length}</span>
      </div>
      ${state.tasks.filter(t => t.status === status).map(t => `
        <div class="task"><strong>${t.title}</strong><div class="row"><span class="pill">${t.agent}</span><span class="pill ${t.priority === 'high' ? 'red' : 'cyan'}">prioridade ${translatePriority(t.priority)}</span><span class="pill">${t.rawStatus || status}</span></div><p>${t.nextStep || 'Sem próximo passo registrado.'}</p><small>${t.project || 'OpenClaw'}</small></div>
      `).join('') || '<p class="empty">Nada nesta etapa.</p>'}
    </section>
  `).join('')}</div>
  `
}

function renderCalendar() {
  const activeJobs = state.cron.filter(job => job.enabled)
  const pausedJobs = state.cron.filter(job => !job.enabled)
  const scheduleLabel = schedule => {
    if (!schedule || schedule === 'manual') return { time: 'Manual', cadence: 'sob demanda', raw: schedule || 'manual' }
    const [minute = '0', hour = '*'] = schedule.split(' ')
    const pad = value => String(value).padStart(2, '0')
    if (hour.includes('-')) {
      const [start, end] = hour.split('-')
      return { time: `${pad(start)}:00-${pad(end)}:00`, cadence: 'janela diária', raw: schedule }
    }
    if (hour.includes(',')) {
      return { time: hour.split(',').map(item => `${pad(item)}:${pad(minute)}`).join(', '), cadence: 'múltiplas rodadas', raw: schedule }
    }
    return { time: `${pad(hour)}:${pad(minute)}`, cadence: 'diário', raw: schedule }
  }
  const jobCard = job => `
    <div class="cron-card">
      <div class="cron-schedule">
        <span class="cron-label">${scheduleLabel(job.schedule).cadence}</span>
        <strong>${scheduleLabel(job.schedule).time}</strong>
        <small>${job.timezone}</small>
        <code>${scheduleLabel(job.schedule).raw}</code>
      </div>
      <div class="cron-body">
        <div class="row"><h3>${job.name}</h3><span class="pill ${statusClass(job.status)}">${translateStatus(job.status)}</span></div>
        <p>${job.description || job.message || 'Sem descrição'}</p>
        <div class="row"><span class="pill">${job.agent}</span><span class="pill">${job.delivery}</span></div>
      </div>
    </div>
  `
  return `
    ${card(`<h2>Agenda e Cron reais do OpenClaw</h2><p>Rotinas carregadas diretamente de <strong>cron/jobs.json</strong>. Ativas aparecem primeiro; pausadas ficam separadas para não confundir operação viva com roadmap.</p><div class="row"><span class="pill green">${activeJobs.length} ativas</span><span class="pill amber">${pausedJobs.length} pausadas</span><span class="pill cyan">Timezone: America/Sao_Paulo</span></div>`, 'cron-summary')}
    <div class="cron-board">
      <section class="cron-section"><h2>Rotinas Ativas</h2>${activeJobs.map(jobCard).join('') || '<p class="empty">Nenhuma rotina ativa.</p>'}</section>
      <section class="cron-section muted-section"><h2>Pausadas</h2>${pausedJobs.map(jobCard).join('') || '<p class="empty">Nenhuma rotina pausada.</p>'}</section>
    </div>
  `
}

function renderProjects() {
  const activeProjects = state.projects.filter(p => p.progress < 100)
  const doneProjects = state.projects.filter(p => p.progress >= 100)
  const attentionProjects = state.projects.filter(p => p.health === 'yellow' || p.health === 'red')
  const healthyProjects = state.projects.filter(p => p.health === 'green')
  const healthClass = health => health === 'red' ? 'red' : health === 'yellow' ? 'amber' : 'green'
  const projectCard = p => `
    <article class="project-card ${p.health || 'green'}">
      <div class="project-head">
        <div>
          <span class="section-kicker">${p.section || 'Projetos'}</span>
          <h2>${p.name}</h2>
        </div>
        <strong class="project-score">${p.progress}%</strong>
      </div>
      <div class="project-progress"><span style="width:${safePercent(p.progress)}%"></span></div>
      <div class="project-tags">
        <span class="pill ${healthClass(p.health)}">${p.healthLabel || p.health || 'saúde'}</span>
        <span class="pill cyan">${p.statusLabel || p.status}</span>
        <span class="pill ${p.priorityClass === 'high' ? 'red' : p.priorityClass === 'medium' ? 'amber' : 'cyan'}">prioridade ${translatePriority(p.priorityClass || p.priority)}</span>
      </div>
      <dl class="project-meta">
        <div><dt>Owner</dt><dd>${p.owners || p.owner}</dd></div>
        <div><dt>ETA</dt><dd>${p.eta || 'sem ETA'}</dd></div>
        <div><dt>Atualização</dt><dd>${p.updated || 'sem data'}</dd></div>
      </dl>
      <div class="project-detail-grid">
        <div class="project-detail">
          <strong>Evidência</strong>
          <p>${p.evidence || 'Sem evidência registrada.'}</p>
        </div>
        <div class="project-detail">
          <strong>Próximo passo</strong>
          <p>${p.nextStep || 'Sem próximo passo registrado.'}</p>
        </div>
      </div>
    </article>
  `

  return `
    <section class="projects-hero">
      <div>
        <span class="section-kicker">Portfólio Operacional</span>
        <h2>${state.projects.length} projetos mapeados do OpenClaw.</h2>
        <p>Fonte: <strong>${state.projects[0]?.source || 'workspace/PROJETOS.md'}</strong>. Cada card mostra progresso, saúde, dono, ETA, evidência e próximo passo.</p>
      </div>
      <div class="project-stats">
        <div><strong>${doneProjects.length}</strong><span>concluídos</span></div>
        <div><strong>${activeProjects.length}</strong><span>em aberto</span></div>
        <div><strong>${attentionProjects.length}</strong><span>atenção</span></div>
        <div><strong>${healthyProjects.length}</strong><span>saudáveis</span></div>
      </div>
    </section>
    <div class="projects-list">${state.projects.map(projectCard).join('')}</div>
  `
}

function renderContent() {
  const pipeline = state.content || { stages: [] }
  return `
    ${card(`<h2>Esteira Aurora real</h2><p>${pipeline.summary?.publishedTexts || 0} textos finais, ${pipeline.summary?.manifests || 0} manifests e ${pipeline.summary?.premiumReports || 0} relatórios premium detectados nos artefatos locais.</p><div class="row"><span class="pill green">Fonte: artifacts/aurora-*</span><span class="pill cyan">Atualização: ${pipeline.summary?.latestAt ? new Date(pipeline.summary.latestAt).toLocaleString('pt-BR') : 'sem dados'}</span></div>`)}
    <div class="kanban content-flow" style="margin-top:16px">${pipeline.stages.map(stage => `
    <section class="column"><h2>${stage.label}</h2>
      ${stage.items.map(item => `<div class="task"><strong>${item.title}</strong><div class="row"><span class="pill cyan">${item.kind}</span><span class="pill">${item.updated}</span></div><p>${item.path}</p></div>`).join('') || '<p class="empty">Sem itens recentes.</p>'}
    </section>
  `).join('')}</div>
  `
}

function renderMemories() {
  return card(`<h2>Memórias reais do OpenClaw</h2><input class="filter-input" data-filter="memory-list" placeholder="Filtrar memórias..." /><div class="memory-list filter-list">${state.memories.map(m => `
    <div class="task searchable"><strong>${m.title}</strong><p>${m.excerpt || 'Sem prévia textual.'}</p><div class="row"><span class="pill">${m.updatedLabel}</span>${m.tags.map(tag => `<span class="pill cyan">${tag}</span>`).join('')}<span class="pill">${m.path}</span></div></div>
  `).join('')}</div>`)
}

function renderDocs() {
  return card(`<h2>Biblioteca real de documentos e artefatos</h2><input class="filter-input" data-filter="doc-list" placeholder="Filtrar documentos..." /><div class="doc-list filter-list">${state.docs.map(d => `
    <div class="task searchable"><strong>${d.title}</strong><p>${d.path}</p><div class="row"><span class="pill">${d.type}</span><span class="pill">${d.project}</span><span class="pill">${d.updated}</span><span class="pill">${d.sizeKb} KB</span></div></div>
  `).join('')}</div>`)
}

function renderTeam() {
  const agents = state.agents || []
  const leader = agents[0]
  const children = agents.slice(1)
  const width = 1040
  const nodeWidth = 178
  const nodeHeight = 74
  const rowGap = 118
  const maxPerRow = 4
  const height = Math.max(260, 190 + Math.ceil(children.length / maxPerRow) * rowGap)
  const truncate = (value, max = 36) => String(value || '').length > max ? `${String(value).slice(0, max - 1)}...` : value
  const childPosition = index => {
    const row = Math.floor(index / maxPerRow)
    const inRow = index % maxPerRow
    const rowItems = Math.min(maxPerRow, children.length - row * maxPerRow)
    const spacing = width / (rowItems + 1)
    return { x: Math.round(spacing * (inRow + 1) - nodeWidth / 2), y: 185 + row * rowGap }
  }
  const node = (agent, x, y) => `
    <g class="org-node" transform="translate(${x} ${y})">
      <rect width="${nodeWidth}" height="${nodeHeight}" rx="8"></rect>
      <text x="16" y="28" class="org-name">${truncate(agent?.name, 20)}</text>
      <text x="16" y="50" class="org-role">${truncate(agent?.role || agent?.model || '', 28)}</text>
    </g>`
  const lines = children.map((agent, index) => {
    const pos = childPosition(index)
    return `M${width / 2} 116 L${pos.x + nodeWidth / 2} ${pos.y}`
  }).join(' ')

  if (!agents.length) {
    return card('<h2>Organograma Operacional</h2><p class="empty">Nenhum agente detectado ainda.</p>')
  }
  return card(`<h2>Organograma Operacional</h2><p>Visão dinâmica da instalação atual: o primeiro agente listado no OpenClaw aparece como principal e os demais como equipe conectada.</p>
    <div class="org-chart">
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Organograma dos agentes OpenClaw">
        <path d="${lines}" class="org-line"></path>
        ${node(leader, Math.round(width / 2 - nodeWidth / 2), 42)}
        ${children.map((agent, index) => {
          const pos = childPosition(index)
          return node(agent, pos.x, pos.y)
        }).join('')}
      </svg>
    </div>`)
}

function renderCosts() {
  const costs = state.costs || { summary: {}, byAgent: [], byModel: [] }
  const summary = costs.summary || {}
  const agentRow = item => `
    <div class="cost-row">
      <div><strong>${item.key}</strong><p>${(item.models || []).join(', ') || 'sem modelo registrado'}</p></div>
      <span>${compactNumber(item.totalTokens)} tokens</span>
      <span>${item.calls} chamadas</span>
      <strong>${money(item.cost)}</strong>
    </div>
  `
  const modelRow = item => `
    <div class="cost-row">
      <div><strong>${item.key}</strong><p>${item.unpriced ? `${item.unpriced} chamadas sem preço` : 'precificado'}</p></div>
      <span>${compactNumber(item.totalTokens)} tokens</span>
      <span>${item.calls} chamadas</span>
      <strong>${money(item.cost)}</strong>
    </div>
  `

  return `
    <section class="cost-hero">
      <div>
        <span class="section-kicker">Custos Reais</span>
        <h2>${money(summary.totalCost)} estimados a partir do uso local.</h2>
        <p>OAuth não impede o cálculo: o Mission Control lê tokens e custos gravados nas sessões JSONL dos agentes. Quando o provedor não grava custo, usa a tabela de preços do OpenClaw. Este valor é operacional, não uma fatura oficial.</p>
      </div>
      <div class="cost-stats">
        <div><strong>${compactNumber(summary.totalTokens)}</strong><span>tokens</span></div>
        <div><strong>${summary.calls || 0}</strong><span>chamadas</span></div>
        <div><strong>${summary.pricingCoverage || 0}%</strong><span>precificação</span></div>
        <div><strong>${summary.unpricedCalls || 0}</strong><span>sem preço</span></div>
      </div>
    </section>
    ${card(`<h2>Fontes do cálculo</h2><p>Uso real: <strong>${summary.source?.sessions || 'agents/*/sessions'}</strong>. Ledger opcional: <strong>${summary.source?.ledger || 'workspace/usage/llm-usage.jsonl'}</strong>. Preços: <strong>${summary.source?.pricing || 'openclaw.json'}</strong>.</p><div class="row"><span class="pill green">usage real</span><span class="pill cyan">OAuth compatível</span><span class="pill ${summary.unpricedCalls ? 'amber' : 'green'}">${summary.unpricedCalls || 0} chamadas sem preço</span></div>`, 'cost-source')}
    <div class="cost-panels">
      ${card(`<h2>Custo por agente</h2><div class="cost-table">${(costs.byAgent || []).map(agentRow).join('') || '<p class="empty">Sem uso registrado.</p>'}</div>`)}
      ${card(`<h2>Custo por modelo</h2><div class="cost-table">${(costs.byModel || []).map(modelRow).join('') || '<p class="empty">Sem uso registrado.</p>'}</div>`)}
    </div>
  `
}

function renderIntegrations() {
  const integration = state.integration || {}
  return `
    ${card(`<h2>Status da Integração OpenClaw</h2><p>Fonte local: openclaw.json ${integration.configUpdatedAt ? `atualizado em ${new Date(integration.configUpdatedAt).toLocaleString('pt-BR')}` : ''}</p><div class="row"><span class="pill ${integration.ok ? 'green' : 'red'}">${integration.ok ? 'validado' : 'atenção'}</span><span class="pill cyan">${integration.mappedCount || 0} agentes mapeados</span><span class="pill amber">${integration.excludedAgents?.length || 0} entradas ocultas</span></div>`)}
    <div class="grid cols-4" style="margin-top:16px">${state.integrations.map(item => card(`<h3>${item.name}</h3><p>${item.detail}</p><div class="row"><span class="pill ${statusClass(item.status)}">${translateStatus(item.status)}</span><span class="pill">${item.evidence}</span></div>`)).join('')}</div>
  `
}

const renderers = {
  dashboard: renderDashboard,
  agents: renderAgents,
  tasks: renderTasks,
  calendar: renderCalendar,
  projects: renderProjects,
  content: renderContent,
  memories: renderMemories,
  docs: renderDocs,
  team: renderTeam,
  costs: renderCosts,
  integrations: renderIntegrations
}

function wireFilters() {
  document.querySelectorAll('.filter-input').forEach(input => {
    input.addEventListener('input', () => {
      const scope = input.closest('.card')
      const query = input.value.trim().toLowerCase()
      scope.querySelectorAll('.searchable').forEach(item => {
        item.hidden = query && !item.textContent.toLowerCase().includes(query)
      })
    })
  })
}

function render() {
  renderNav()
  const item = navItems.find(navItem => navItem.id === active)
  title.textContent = item?.label || 'Painel Geral'
  modePill.textContent = state.mode
  view.innerHTML = `${renderGuide()}${(renderers[active] || renderDashboard)()}`
  wireFilters()
}

async function boot() {
  await refreshState()
  setInterval(() => {
    refreshState({ silent: true }).catch(err => {
      console.warn('auto-refresh failed', err)
    })
  }, refreshIntervalMs)
}

async function refreshState({ silent = false } = {}) {
  const res = await fetch('/api/mission')
  if (!res.ok) throw new Error(`Falha ao carregar /api/mission: ${res.status}`)
  state = sanitizeValue(await res.json())
  render()
  if (!silent) return
}

boot().catch(err => {
  view.innerHTML = `<div class="card"><h2>Erro ao carregar</h2><pre>${escapeHtml(err.message)}</pre></div>`
})
