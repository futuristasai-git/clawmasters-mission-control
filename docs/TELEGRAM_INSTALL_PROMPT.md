# Telegram Install Prompt

Use this prompt when OpenClaw is already connected to Telegram on the student's VPS.

This prompt already points to the public GitHub repository.

## Copy And Paste

```txt
Você está rodando dentro do meu OpenClaw na minha VPS Hostinger. Instale o Clawmasters Mission Control com segurança, sem apagar nem alterar minha instalação do OpenClaw.

Repositório GitHub:
https://github.com/futuristasai-git/clawmasters-mission-control

Objetivo:
1. Verificar se esta VPS tem Linux, git, Node.js 22+ e npm.
2. Verificar se meu OpenClaw existe em ~/.openclaw e se ~/.openclaw/openclaw.json existe.
3. Baixar ou atualizar o repositório em ~/clawmasters-mission-control.
4. Criar .env a partir de .env.example se ainda não existir.
5. Manter a configuração segura:
   - CLAWMASTERS_MODE=auto
   - HOST=127.0.0.1
   - PORT=3020
   - OPENCLAW_HIDE_AGENT_IDS=skill-installer,lala
   - não colocar nenhuma chave, token, senha ou segredo no repositório.
6. Rodar:
   - npm run check:syntax
   - npm run check
   - npm run check:security
7. Instalar como serviço systemd de usuário usando scripts/install-linux-systemd.sh.
8. Validar:
   - systemctl --user status clawmasters-mission-control
   - curl http://127.0.0.1:3020/api/health
   - curl http://127.0.0.1:3020/api/mission
9. Confirmar que o modo ficou openclaw-readonly quando meu OpenClaw estiver presente.
10. Confirmar que Agentes, Quadro de Tarefas, Projetos, Agenda/Cron, Memórias, Documentos, Custos, Esteira de Conteúdo e Integrações estão lendo meus dados locais do OpenClaw quando existirem.
11. Se algum dado não existir no meu OpenClaw, explicar exatamente qual arquivo ou pasta está faltando e como corrigir.
12. No final, me entregar:
   - URL local do Mission Control na VPS.
   - comando de túnel SSH para abrir no meu computador.
   - status do serviço.
   - resultado dos checks.
   - lista do que está conectado e do que ficou em demo/vazio.

Comandos permitidos:
- Você pode usar git, node, npm, bash, systemctl --user, journalctl --user, curl, mkdir, cp, sed e chmod.
- Você pode criar ou editar arquivos somente dentro de ~/clawmasters-mission-control e criar o serviço de usuário em ~/.config/systemd/user/clawmasters-mission-control.service.
- Você pode ler ~/.openclaw para conectar o dashboard em modo somente leitura.

Regras de segurança:
- Não apague ~/.openclaw.
- Não altere openclaw.json.
- Não mostre tokens, chaves, senhas ou segredos na resposta.
- Não rode comandos destrutivos como rm -rf em pastas fora de ~/clawmasters-mission-control.
- Não exponha o painel em 0.0.0.0 sem eu pedir explicitamente.
- Se Node.js for menor que 22, pare e me explique a forma mais segura de atualizar antes de continuar.

Execute até o final e só pare quando estiver instalado, validado e persistente após restart.
```

## Student Access

By default the service listens only on the VPS itself:

```txt
http://127.0.0.1:3020
```

From the student's computer, use an SSH tunnel:

```bash
ssh -L 3020:127.0.0.1:3020 YOUR_USER@YOUR_VPS_IP
```

Then open:

```txt
http://127.0.0.1:3020
```
