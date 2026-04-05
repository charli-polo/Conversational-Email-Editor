# Deployment Guide

## Platform: Railway

Project: **Email-Brief**
Service: **Conversational-Email-Editor**
Project ID: `01314f0d-a655-4ed0-a40c-33ddac0398c2`
Production URL: https://conversational-email-editor-production.up.railway.app

## Architecture

```
charli-polo/Conversational-Email-Editor (GitHub)
│
├── PR merged to main
│   └──> Railway auto-deploys to "production" (GitHub integration)
│
└── git tag v0.2.0 && git push origin v0.2.0
    └──> GitHub Action creates frozen environment "v0.2.0" with its own URL

Railway project "Email-Brief"
│
├── production   (always latest main, auto-deployed on merge)
├── v0.1.0       (frozen snapshot)
├── v0.2.0       (frozen snapshot)
└── ...
```

Each environment is a separate running instance with its own URL and env vars.
Environments are copied from production, so they inherit env vars and domain config.

## How it works

| Trigger | What happens |
|---------|-------------|
| PR merged to `main` | Railway auto-deploys latest code to `production` environment |
| `v*` tag pushed | GitHub Action creates a new Railway environment copied from production, then deploys the tagged code into it |

## GitHub Action

File: `.github/workflows/deploy-tag.yml`

Triggered on any `v*` tag push. Steps:
1. Runs in official Railway CLI container (`ghcr.io/railwayapp/cli:latest`)
2. Links to the project's production environment
3. Creates a new environment by copying production (inherits env vars + domain)
4. Re-links to the new tag environment
5. Deploys the checked-out tag code

## Daily workflow

```bash
# Develop on a branch, open PR, merge to main
# --> Railway auto-deploys to production

# When you want to snapshot a version:
git tag v0.2.0
git push origin v0.2.0
# --> GitHub Action fires
# --> New Railway environment "v0.2.0" created with its own URL
```

## Secrets (GitHub repo)

| Secret | Description | How to get it |
|--------|-------------|---------------|
| `RAILWAY_API_TOKEN` | Account-scoped token (NOT project or workspace) | railway.com/account/tokens → New Token → scope to account |
| `RAILWAY_PROJECT_ID` | `01314f0d-a655-4ed0-a40c-33ddac0398c2` | Railway dashboard → Project Settings |

**Important:** The token must be **account-scoped**. Project tokens can deploy but cannot create environments. Workspace tokens also won't work.

## Local Railway CLI

```bash
# Login
railway login

# Link this directory to the project
railway link --project 01314f0d-a655-4ed0-a40c-33ddac0398c2

# Check status
railway status

# View logs
railway logs

# List environments
railway environment list

# Deploy manually
railway up --detach

# Deploy to a specific environment
railway up --environment v0.1.0 --service Conversational-Email-Editor --detach
```
