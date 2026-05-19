# ConectaDoc Web

Frontend React do ConectaDoc.

**Stack**: React 18, TypeScript, Vite, Nginx e Docker.

## Sumario

- [Pre-requisitos](#pre-requisitos)
- [Rodando localmente](#rodando-localmente)
- [Variaveis de ambiente](#variaveis-de-ambiente)
- [Deploy DEV via GitHub Actions](#deploy-dev-via-github-actions)
- [Scripts](#scripts)

## Pre-requisitos

| Ferramenta | Versao |
| --- | --- |
| Node.js | 22+ |
| npm | 10+ |
| Docker | versao recente |
| Acesso Bitbucket | necessario enquanto existirem pacotes privados `@afinz/*` |

## Rodando localmente

### 1. Instalar dependencias

```bash
npm install
```

Se o install precisar baixar pacotes privados `@afinz/*`, configure a chave SSH com acesso ao Bitbucket antes de rodar o comando.

### 2. Configurar ambiente local

```bash
cp .env.example .env.local
```

Base local:

```env
VITE_APP_BASE_URL=http://localhost:3000
VITE_APP_OPEN_SEARCH_URL=
```

### 3. Iniciar desenvolvimento

```bash
npm run dev
```

O Vite sobe a aplicacao em:

```txt
http://localhost:5173
```

## Variaveis de ambiente

| Variavel | Descricao | Exemplo DEV |
| --- | --- | --- |
| `VITE_APP_BASE_URL` | URL base da API usada pelo frontend | `/api` |
| `VITE_APP_OPEN_SEARCH_URL` | URL de busca externa, quando existir | vazio |

Para deploy DEV, as variaveis sao cadastradas no secret `WEB_ENV_FILE` e gravadas como `.env.production` durante o build.

## Deploy DEV via GitHub Actions

O deploy DEV do frontend e feito pelo workflow manual `Deploy Web DEV`, disponivel na aba `Actions` do GitHub. Ele nao roda em `push`; o gatilho e somente pelo botao `Run workflow`.

### Pre-requisitos

- Infra DEV aplicada pelo repositorio `conectadoc-infra-tf`;
- Nginx publico da infra roteando `/` para o container `conectadoc-web`;
- Docker e Docker Compose funcionando na maquina DEV;
- rede Docker externa `conectadoc_internal` criada pela infra;
- acesso SSH de deploy configurado no GitHub Actions;
- chave SSH do Bitbucket cadastrada se os pacotes privados `@afinz/*` ainda forem usados.

### Secrets obrigatorios

Cadastre em `Settings > Secrets and variables > Actions > Secrets`:

| Secret | Exemplo | Descricao |
| --- | --- | --- |
| `DEPLOY_SSH_HOST` | `187.77.7.7` | IP/DNS da maquina DEV |
| `DEPLOY_SSH_PORT` | `22` | Porta SSH |
| `DEPLOY_SSH_USER` | `root` | Usuario SSH de deploy |
| `DEPLOY_SSH_PRIVATE_KEY` | conteudo da chave privada | Chave SSH autorizada na maquina DEV |
| `DEPLOY_BASE_PATH` | `/opt/conectadoc` | Diretorio base criado pela infra |
| `WEB_ENV_FILE` | conteudo do `.env.production` | Variaveis Vite usadas no build |
| `BITBUCKET_SSH_KEY` | chave privada Bitbucket | Acesso de leitura aos pacotes privados `@afinz/*` |

Base atual do `WEB_ENV_FILE` para DEV:

```env
VITE_APP_BASE_URL=/api
VITE_APP_OPEN_SEARCH_URL=
```

### Como executar

1. Abra o repositorio `conectadoc-web` no GitHub.
2. Acesse `Actions`.
3. Selecione `Deploy Web DEV`.
4. Clique em `Run workflow`.
5. Escolha a branch `main`.
6. Acompanhe os jobs `Build web` e `Deploy web`.

### O que o workflow faz

- configura acesso SSH ao Bitbucket, quando `BITBUCKET_SSH_KEY` existir;
- grava `WEB_ENV_FILE` em `.env.production`;
- executa `npm ci`;
- executa `npm run build`;
- publica o artefato `dist` junto com `Dockerfile`, `nginx.conf` e `docker-compose.deploy.yml`;
- envia o release para `/opt/conectadoc/apps/web/releases/<sha>`;
- atualiza o symlink `/opt/conectadoc/apps/web/current`;
- executa `docker compose -f docker-compose.deploy.yml build`;
- executa `docker compose -f docker-compose.deploy.yml up -d --remove-orphans`;
- valida o health check do container `conectadoc-web`.

### Validacao pos-deploy

Na maquina DEV:

```bash
ssh -i ~/.ssh/conectadoc_github_actions root@187.77.7.7
cd /opt/conectadoc
docker ps
docker inspect --format='{{.State.Health.Status}}' conectadoc-web
docker logs --tail=100 conectadoc-web
curl -i http://127.0.0.1/healthz
```

Pela URL publica:

```bash
curl -i http://187.77.7.7/healthz
```

### Observacoes

- O workflow mantem os ultimos 5 releases em `/opt/conectadoc/apps/web/releases`.
- O container web entra na rede `conectadoc_internal`.
- O acesso publico passa pelo Nginx da infra.
- Para rollback em DEV, rode novamente o workflow a partir de um commit anterior ou ajuste manualmente o symlink `current` no servidor.

## Scripts

| Script | Descricao |
| --- | --- |
| `npm run dev` | Inicia Vite em modo desenvolvimento |
| `npm run build` | Compila TypeScript e gera `dist/` |
| `npm run preview` | Servidor local para visualizar o build |
| `npm run lint` | Executa ESLint |
| `npm run prettier` | Verifica formatacao |
| `npm run test:unit` | Executa testes unitarios |
| `npm run test:e2e` | Executa Cypress |
