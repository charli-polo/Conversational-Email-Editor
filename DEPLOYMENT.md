# Deployment Guide

## Platform: Railway

Project: **Email-Brief**
Service: **Conversational-Email-Editor**
Project ID: `01314f0d-a655-4ed0-a40c-33ddac0398c2`

## Architecture

```
charli-polo/Conversational-Email-Editor (GitHub)
│
├── PR merged to main
│   └──> Railway auto-deploys to "production" (GitHub integration)
│
└── git tag v0.2.0 && git push origin v0.2.0
    └──> GitHub Action creates frozen environment "v0.2.0"

Railway project "Email-Brief"
│
├── production (always latest main, auto-deployed on merge)
│   └── https://xxx-production.up.railway.app
│
├── v0.1.0 (frozen snapshot)
│   └── https://xxx-v010.up.railway.app
│
├── v0.2.0 (frozen snapshot)
│   └── https://xxx-v020.up.railway.app
│
└── v1.0.0 (frozen snapshot)
    └── https://xxx-v100.up.railway.app
```

Each environment is a separate running instance with its own URL and env vars.

## How it works

| Trigger | What happens | Where |
|---------|-------------|-------|
| PR merged to `main` | Railway auto-deploys latest code | `production` environment |
| `v*` tag pushed | GitHub Action creates a new Railway environment copied from production, then deploys the tagged code | `vX.Y.Z` environment |

## Daily workflow

```bash
# Develop on a branch, open PR, merge to main
# --> Railway auto-deploys to production

# When you want to snapshot a version:
git tag v0.2.0
git push origin v0.2.0
# --> GitHub Action fires
# --> New Railway environment "v0.2.0" created
# --> Code deployed, new URL appears in Railway dashboard

# Later, another version:
git tag v0.3.0
git push origin v0.3.0
# --> Same flow, separate environment "v0.3.0"
```

## GitHub Action

File: `.github/workflows/deploy-tag.yml`

Triggered on any `v*` tag push. Steps:
1. Uses official Railway CLI container (`ghcr.io/railwayapp/cli:latest`)
2. Links to the project
3. Creates a new environment by copying `production`
4. Deploys the checked-out tag code to that environment

## Setup (one-time)

### Prerequisites
- Railway CLI installed locally (`npm install -g @railway/cli`)
- Railway account linked to GitHub repo

### Secrets required in GitHub repo

| Secret | Value | How to get it |
|--------|-------|---------------|
| `RAILWAY_API_TOKEN` | Account-scoped token (NOT project-scoped) | Railway dashboard → Account Settings → Tokens → New Token → scope to account |
| `RAILWAY_PROJECT_ID` | `01314f0d-a655-4ed0-a40c-33ddac0398c2` | Already set |

### Token types (important)

| Token | Env var | Scope | Use case |
|-------|---------|-------|----------|
| Project token | `RAILWAY_TOKEN` | Single project, deploy only | Simple `railway up` deployments |
| Account token | `RAILWAY_API_TOKEN` | All projects, full management | Creating environments, linking projects (what we need) |

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
