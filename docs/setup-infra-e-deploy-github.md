# Setup da infra automatizada e deploy do Web pelo GitHub

Este guia descreve como preparar a infraestrutura DEV automatizada e publicar o frontend `conectadoc-web` pelo GitHub Actions.

O deploy do Web depende da infra criada pelo repositorio `conectadoc-infra-tf`. O frontend nao provisiona Nginx publico, rede Docker ou servicos base; ele apenas publica o container `conectadoc-web` na rede Docker criada pela infra.

## Visao geral

```txt
GitHub Actions - conectadoc-web
  |
  |-- configura chave Bitbucket, se existir
  |-- grava WEB_ENV_FILE em .env.production
  |-- npm ci
  |-- npm run build
  |-- envia dist para /opt/conectadoc/apps/web/releases/<sha>
  |-- docker compose build
  `-- docker compose up -d conectadoc-web

Maquina DEV
  |
  |-- Nginx da infra: / -> conectadoc-web:80
  |-- Nginx da infra: /api -> conecta-doc-api:3000
  `-- Rede Docker: conectadoc_internal
```

## 1. Preparar a infra automatizada

Antes do deploy do frontend, aplique a infra pelo repositorio `conectadoc-infra-tf`.

No GitHub:

```txt
conectadoc-infra-tf > Actions > Terraform DEV > Run workflow
```

Rode primeiro:

```txt
action=plan
```

Depois aplique:

```txt
action=apply
confirm_apply=APPLY
```

Valide no servidor:

```bash
ssh -i ~/.ssh/conectadoc_github_actions root@187.77.7.7
cd /opt/conectadoc
docker compose ps
/opt/conectadoc/scripts/healthcheck.sh
curl -i http://127.0.0.1/healthz
exit
```

Resultado esperado:

- container `nginx` ativo;
- rede Docker `conectadoc_internal` existente;
- endpoint `/healthz` retornando `200`.

## 2. Preparar acesso SSH do GitHub Actions

Use uma chave SSH dedicada para deploy.

Na maquina local:

```bash
ssh-keygen -t ed25519 -C "github-actions-conectadoc-dev" -f ~/.ssh/conectadoc_github_actions
```

Autorize a chave publica no servidor:

```bash
cat ~/.ssh/conectadoc_github_actions.pub | ssh root@187.77.7.7 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"
```

Teste:

```bash
ssh -i ~/.ssh/conectadoc_github_actions root@187.77.7.7
docker ps
exit
```

## 3. Configurar secrets no GitHub

No repositorio `conectadoc-web`, acesse:

```txt
Settings > Secrets and variables > Actions > Secrets
```

Cadastre:

| Secret | Valor |
| --- | --- |
| `DEPLOY_SSH_HOST` | `187.77.7.7` |
| `DEPLOY_SSH_PORT` | `22` |
| `DEPLOY_SSH_USER` | `root` |
| `DEPLOY_SSH_PRIVATE_KEY` | conteudo de `~/.ssh/conectadoc_github_actions` |
| `DEPLOY_BASE_PATH` | `/opt/conectadoc` |
| `WEB_ENV_FILE` | variaveis Vite usadas no build |
| `BITBUCKET_SSH_KEY` | chave privada com acesso aos pacotes `@afinz/*` |
| `WHATSAPP_API_URL` | `http://187.77.7.7/wpp` |
| `WHATSAPP_API_KEY` | chave/token da API de WhatsApp |
| `WHATSAPP_INSTANCE` | instancia/sessao usada para envio |

Para copiar a chave privada de deploy:

```bash
cat ~/.ssh/conectadoc_github_actions
```

Em `Settings > Secrets and variables > Actions > Variables`, cadastre tambem:

| Variable | Valor |
| --- | --- |
| `PUBLIC_URL` | URL publica do frontend, por exemplo `http://187.77.7.7` |

O workflow envia aviso de nova versao para `+5581988145555` e `+5581981154380` depois que o container do Web fica saudavel. Se os secrets de WhatsApp nao estiverem configurados, o deploy nao falha; apenas registra que a notificacao foi ignorada. Se a API de WhatsApp ficar privada na maquina DEV, exponha-a via reverse proxy/firewall somente para o necessario ou adapte o passo para executar o `curl` via SSH.

## 4. Configurar WEB_ENV_FILE

Base DEV atual:

```env
VITE_APP_BASE_URL=/api
VITE_APP_OPEN_SEARCH_URL=
```

`VITE_APP_BASE_URL=/api` usa o Nginx da infra para encaminhar chamadas para a API.

## 5. Configurar acesso aos pacotes Bitbucket

Enquanto o frontend depender de pacotes privados `@afinz/*`, o workflow precisa do secret `BITBUCKET_SSH_KEY`.

Essa chave deve ter acesso de leitura aos repositorios Bitbucket usados no `package.json`.

Teste localmente antes:

```bash
ssh -T git@bitbucket.org
npm ci
```

## 6. Rodar deploy pelo GitHub

No GitHub:

```txt
conectadoc-web > Actions > Deploy Web DEV > Run workflow
```

Selecione a branch `main`.

O workflow e manual. Push em `main` nao dispara deploy automatico.

Ao final do deploy, a pipeline publica uma versao no formato:

```txt
<version-do-package.json>+<sha-curto>
```

Essa versao aparece no rodape da sidebar e fica disponivel em `/version.json`.

## 7. Validar deploy

Na maquina DEV:

```bash
ssh -i ~/.ssh/conectadoc_github_actions root@187.77.7.7
cd /opt/conectadoc
docker ps
docker inspect --format='{{.State.Health.Status}}' conectadoc-web
docker logs --tail=100 conectadoc-web
curl -i http://127.0.0.1/healthz
exit
```

Pela URL publica:

```bash
curl -i http://187.77.7.7/healthz
curl -i http://187.77.7.7/
curl -i http://187.77.7.7/version.json
```

## 8. Troubleshooting rapido

| Sintoma | Verificacao |
| --- | --- |
| `npm ci` falha com pacote privado | conferir `BITBUCKET_SSH_KEY` e acesso aos repositorios |
| build falha por env | conferir `WEB_ENV_FILE` |
| container `unhealthy` | `docker logs --tail=100 conectadoc-web` |
| tela nao chama API | conferir `VITE_APP_BASE_URL=/api` e deploy da API |
| Nginx publico nao responde | conferir infra em `/opt/conectadoc` |

## 9. Rollback DEV

O workflow mantem releases em:

```txt
/opt/conectadoc/apps/web/releases
```

Para rollback manual:

```bash
ssh -i ~/.ssh/conectadoc_github_actions root@187.77.7.7
cd /opt/conectadoc/apps/web
ln -sfn releases/<sha-anterior> current
cd current
APP_VERSION=<sha-anterior> DOCKER_NETWORK=conectadoc_internal docker compose -f docker-compose.deploy.yml up -d --remove-orphans
exit
```

Preferencialmente, rode o workflow novamente a partir do commit desejado.
