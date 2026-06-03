#!/usr/bin/env bash
# ============================================================
# Dizzy Inc — White-Label Vercel Deployment Script
# Deploys the rebranded AI tools suite to a client's Vercel account
#
# Prerequisites:
#   - Vercel CLI installed: npm i -g vercel
#   - Client is logged in: vercel login
#   - rebrand.sh has already been run
#   - OPENAI_API_KEY is available
#
# Usage:
#   ./vercel-deploy.sh --project-name "acme-ai-tools" [options]
# ============================================================

set -euo pipefail

# ── Defaults ─────────────────────────────────────────────────
PROJECT_NAME=""
TEAM=""
DOMAIN=""
OPENAI_KEY=""
ENV="production"
SKIP_CONFIRM=false
DRY_RUN=false

# ── Parse arguments ──────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-name) PROJECT_NAME="$2"; shift 2 ;;
    --team)         TEAM="$2";         shift 2 ;;
    --domain)       DOMAIN="$2";       shift 2 ;;
    --openai-key)   OPENAI_KEY="$2";   shift 2 ;;
    --env)          ENV="$2";          shift 2 ;;
    --yes)          SKIP_CONFIRM=true; shift   ;;
    --dry-run)      DRY_RUN=true;      shift   ;;
    *)
      echo "Unknown argument: $1"
      echo ""
      echo "Usage: $0 --project-name NAME [--team TEAM] [--domain DOMAIN]"
      echo "          [--openai-key KEY] [--env production|preview] [--yes] [--dry-run]"
      exit 1
      ;;
  esac
done

# ── Validate required arguments ──────────────────────────────
if [[ -z "$PROJECT_NAME" ]]; then
  echo "ERROR: --project-name is required."
  echo "Example: ./vercel-deploy.sh --project-name acme-ai-tools"
  exit 1
fi

# ── Resolve paths ─────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

echo "============================================================"
echo "  Dizzy Inc — White-Label Vercel Deployment"
echo "============================================================"
echo "  Project name : $PROJECT_NAME"
echo "  Team         : ${TEAM:-"(personal account)"}"
echo "  Domain       : ${DOMAIN:-"(Vercel default)"}"
echo "  Environment  : $ENV"
echo "  Repo root    : $REPO_ROOT"
[[ "$DRY_RUN" == true ]] && echo "  MODE         : DRY RUN (no deployment will happen)"
echo "============================================================"
echo ""

# ── Check Vercel CLI ─────────────────────────────────────────
if ! command -v vercel &>/dev/null; then
  echo "ERROR: Vercel CLI not found."
  echo "Install it with: npm install -g vercel"
  echo "Then log in with: vercel login"
  exit 1
fi

VERCEL_VERSION=$(vercel --version 2>/dev/null | head -1)
echo "Vercel CLI detected: $VERCEL_VERSION"

# ── Check Vercel login ───────────────────────────────────────
echo "Checking Vercel authentication..."
if ! vercel whoami &>/dev/null; then
  echo "ERROR: Not logged in to Vercel."
  echo "Run: vercel login"
  exit 1
fi
VERCEL_USER=$(vercel whoami 2>/dev/null)
echo "Logged in as: $VERCEL_USER"
echo ""

# ── Confirm before deploying ─────────────────────────────────
if [[ "$SKIP_CONFIRM" == false && "$DRY_RUN" == false ]]; then
  read -rp "Deploy '$PROJECT_NAME' to Vercel as '$VERCEL_USER'? [y/N] " CONFIRM
  if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    echo "Deployment cancelled."
    exit 0
  fi
fi

# ── Build Vercel CLI flags ────────────────────────────────────
VERCEL_FLAGS=("--name" "$PROJECT_NAME" "--yes")

if [[ -n "$TEAM" ]]; then
  VERCEL_FLAGS+=("--scope" "$TEAM")
fi

if [[ "$ENV" == "production" ]]; then
  VERCEL_FLAGS+=("--prod")
fi

# ── Set environment variables ────────────────────────────────
echo ""
echo "Setting environment variables..."

set_env_var() {
  local key="$1"
  local value="$2"
  local env_target="${3:-production}"

  if [[ "$DRY_RUN" == true ]]; then
    echo "  [DRY RUN] Would set $key for $env_target"
    return
  fi

  SCOPE_FLAG=""
  if [[ -n "$TEAM" ]]; then
    SCOPE_FLAG="--scope $TEAM"
  fi

  echo "$value" | vercel env add "$key" "$env_target" \
    --name "$PROJECT_NAME" \
    $SCOPE_FLAG \
    --force 2>/dev/null || true
  echo "  Set $key for $env_target"
}

# Set OPENAI_API_KEY if provided
if [[ -n "$OPENAI_KEY" ]]; then
  set_env_var "OPENAI_API_KEY" "$OPENAI_KEY" "production"
  set_env_var "OPENAI_API_KEY" "$OPENAI_KEY" "preview"
  set_env_var "OPENAI_API_KEY" "$OPENAI_KEY" "development"
else
  echo "  NOTE: --openai-key not provided."
  echo "  Set it manually in Vercel dashboard: Settings → Environment Variables"
  echo "  Key name: OPENAI_API_KEY"
fi

# Set NODE_ENV
set_env_var "NODE_ENV" "production" "production"

echo ""

# ── Deploy ───────────────────────────────────────────────────
echo "Deploying to Vercel..."
echo ""

if [[ "$DRY_RUN" == true ]]; then
  echo "[DRY RUN] Would run:"
  echo "  vercel ${VERCEL_FLAGS[*]} $REPO_ROOT"
else
  cd "$REPO_ROOT"
  DEPLOY_URL=$(vercel "${VERCEL_FLAGS[@]}" 2>&1 | tee /dev/stderr | grep -E "^https://" | tail -1)
  echo ""
  echo "Deployment URL: $DEPLOY_URL"
fi

# ── Add custom domain ────────────────────────────────────────
if [[ -n "$DOMAIN" && "$DRY_RUN" == false ]]; then
  echo ""
  echo "Adding custom domain: $DOMAIN"

  SCOPE_FLAG=""
  if [[ -n "$TEAM" ]]; then
    SCOPE_FLAG="--scope $TEAM"
  fi

  vercel domains add "$DOMAIN" --name "$PROJECT_NAME" $SCOPE_FLAG 2>/dev/null || true
  echo "Domain '$DOMAIN' added to project."
  echo ""
  echo "============================================================"
  echo "  DNS Configuration Required"
  echo "============================================================"
  echo "  Add this CNAME record in your DNS provider:"
  echo ""
  echo "    Record type : CNAME"
  echo "    Host/Name   : ${DOMAIN%%.*}  (or @ for root domain)"
  echo "    Points to   : cname.vercel-dns.com"
  echo "    TTL         : 300 (5 minutes)"
  echo ""
  echo "  For root domains (e.g. acme.com), add an A record instead:"
  echo "    76.76.21.21"
  echo ""
  echo "  DNS propagation can take 1–48 hours."
  echo "============================================================"
fi

# ── Post-deploy instructions ──────────────────────────────────
echo ""
echo "============================================================"
if [[ "$DRY_RUN" == true ]]; then
  echo "  DRY RUN COMPLETE — No changes were made."
else
  echo "  DEPLOYMENT COMPLETE"
fi
echo "============================================================"
echo ""
echo "Post-deployment checklist:"
echo ""
echo "  [ ] Verify OPENAI_API_KEY is set in Vercel dashboard"
echo "      Dashboard → $PROJECT_NAME → Settings → Environment Variables"
echo ""
echo "  [ ] Test the deployed app"
if [[ -n "$DOMAIN" ]]; then
  echo "      https://$DOMAIN"
fi
echo ""
echo "  [ ] Configure Gumroad paywall (Full Suite clients)"
echo "      Add GUMROAD_API_KEY to environment variables"
echo "      See white-label-kit/README.md for Gumroad integration details"
echo ""
echo "  [ ] Set up monitoring / uptime alerts in Vercel dashboard"
echo ""
echo "  [ ] Share login credentials and domain with your client"
echo ""
echo "Questions? Contact Dizzy Inc: dzyntwrk@gmail.com"
echo ""
