#!/usr/bin/env bash
# ============================================================
# Dizzy Inc — White-Label Rebrand Script
# Usage: ./rebrand.sh --brand-name "Acme AI" --accent-color "#FF5733" \
#                     --logo-url "https://acme.com/logo.png" --domain "tools.acme.com"
# ============================================================

set -euo pipefail

# ── Defaults ────────────────────────────────────────────────
BRAND_NAME=""
ACCENT_COLOR=""
LOGO_URL=""
DOMAIN=""
DRY_RUN=false

# ── Parse arguments ─────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --brand-name)   BRAND_NAME="$2";   shift 2 ;;
    --accent-color) ACCENT_COLOR="$2"; shift 2 ;;
    --logo-url)     LOGO_URL="$2";     shift 2 ;;
    --domain)       DOMAIN="$2";       shift 2 ;;
    --dry-run)      DRY_RUN=true;      shift   ;;
    *)
      echo "Unknown argument: $1"
      echo "Usage: $0 --brand-name NAME --accent-color HEX --logo-url URL --domain DOMAIN [--dry-run]"
      exit 1
      ;;
  esac
done

# ── Validate required arguments ──────────────────────────────
ERRORS=()
[[ -z "$BRAND_NAME"   ]] && ERRORS+=("--brand-name is required")
[[ -z "$ACCENT_COLOR" ]] && ERRORS+=("--accent-color is required (e.g. #FF5733)")
[[ -z "$LOGO_URL"     ]] && ERRORS+=("--logo-url is required")
[[ -z "$DOMAIN"       ]] && ERRORS+=("--domain is required (e.g. tools.acme.com)")

if [[ ${#ERRORS[@]} -gt 0 ]]; then
  echo "ERROR: Missing required arguments:"
  for err in "${ERRORS[@]}"; do echo "  $err"; done
  exit 1
fi

# ── Normalize accent color (ensure leading #) ────────────────
if [[ "$ACCENT_COLOR" != \#* ]]; then
  ACCENT_COLOR="#${ACCENT_COLOR}"
fi

# ── Resolve script directory ─────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

echo "============================================================"
echo "  Dizzy Inc White-Label Rebranding"
echo "============================================================"
echo "  Brand name   : $BRAND_NAME"
echo "  Accent color : $ACCENT_COLOR"
echo "  Logo URL     : $LOGO_URL"
echo "  Domain       : $DOMAIN"
echo "  Repo root    : $REPO_ROOT"
[[ "$DRY_RUN" == true ]] && echo "  MODE         : DRY RUN (no files will be changed)"
echo "============================================================"
echo ""

# ── Source values to replace ─────────────────────────────────
OLD_BRAND="Dizzy Inc"
OLD_ACCENT="#6366f1"
OLD_ACCENT_NO_HASH="6366f1"
OLD_LOGO_PATTERN="dzyntwrk\.gumroad\.com\|dizzy-tools-one\.vercel\.app\|resume-tool-zeta\.vercel\.app"
OLD_DOMAIN_FULL="dzyntwrk.gumroad.com"
OLD_FOOTER_DOMAIN="dzyntwrk.gumroad.com"
OLD_TAGLINE="Clarity in Complexity. Automation in Action."
NEW_ACCENT_NO_HASH="${ACCENT_COLOR#\#}"

# ── File extensions to process ───────────────────────────────
EXTENSIONS=("html" "js" "jsx" "ts" "tsx" "css" "json")

# Build find expression
FIND_EXPR=()
for ext in "${EXTENSIONS[@]}"; do
  FIND_EXPR+=(-o -name "*.${ext}")
done
# Remove leading -o
FIND_EXPR=("${FIND_EXPR[@]:1}")

# Exclude node_modules and .git
mapfile -t TARGET_FILES < <(
  find "$REPO_ROOT" \
    \( -path "*/node_modules" -o -path "*/.git" -o -path "*/white-label-kit" \) -prune \
    -o \( "${FIND_EXPR[@]}" \) -print
)

echo "Found ${#TARGET_FILES[@]} files to process."
echo ""

CHANGED_COUNT=0

do_replace() {
  local file="$1"
  local old="$2"
  local new="$3"
  local label="$4"

  if grep -qF "$old" "$file" 2>/dev/null; then
    if [[ "$DRY_RUN" == true ]]; then
      echo "  [DRY RUN] Would replace '$old' → '$new' in: ${file#$REPO_ROOT/}"
    else
      # Use perl for reliable in-place replacement (handles special chars)
      perl -i -e "s/\Q${old}\E/${new}/g" "$file"
      echo "  Replaced '$label' in: ${file#$REPO_ROOT/}"
    fi
    return 0
  fi
  return 1
}

for file in "${TARGET_FILES[@]}"; do
  FILE_CHANGED=false

  # 1. Replace brand name
  if do_replace "$file" "$OLD_BRAND" "$BRAND_NAME" "brand name"; then
    FILE_CHANGED=true
  fi

  # 2. Replace accent color (with hash)
  if do_replace "$file" "$OLD_ACCENT" "$ACCENT_COLOR" "accent color"; then
    FILE_CHANGED=true
  fi

  # 3. Replace accent color (without hash, e.g. in Tailwind classes or CSS vars)
  if do_replace "$file" "$OLD_ACCENT_NO_HASH" "$NEW_ACCENT_NO_HASH" "accent color (no hash)"; then
    FILE_CHANGED=true
  fi

  # 4. Replace logo URL
  if do_replace "$file" "https://dzyntwrk.gumroad.com/logo" "$LOGO_URL" "logo URL"; then
    FILE_CHANGED=true
  fi

  # 5. Replace footer domain link
  if do_replace "$file" "dzyntwrk.gumroad.com" "$DOMAIN" "footer domain"; then
    FILE_CHANGED=true
  fi

  # 6. Replace old domain references
  if do_replace "$file" "dizzy-tools-one.vercel.app" "$DOMAIN" "old Vercel domain"; then
    FILE_CHANGED=true
  fi

  if do_replace "$file" "resume-tool-zeta.vercel.app" "$DOMAIN" "old ResumeAI domain"; then
    FILE_CHANGED=true
  fi

  # 7. Replace Twitter handle
  if do_replace "$file" "@thedizzyinc" "@${DOMAIN%%.*}" "Twitter handle"; then
    FILE_CHANGED=true
  fi

  # 8. Replace contact email
  if do_replace "$file" "dzyntwrk@gmail.com" "admin@${DOMAIN}" "contact email"; then
    FILE_CHANGED=true
  fi

  if [[ "$FILE_CHANGED" == true ]]; then
    (( CHANGED_COUNT++ )) || true
  fi
done

echo ""
echo "============================================================"
if [[ "$DRY_RUN" == true ]]; then
  echo "  DRY RUN COMPLETE — $CHANGED_COUNT files would be modified."
else
  echo "  REBRANDING COMPLETE — $CHANGED_COUNT files updated."
fi
echo "============================================================"
echo ""
echo "Next steps:"
echo "  1. Review changes: git diff"
echo "  2. Deploy: ./white-label-kit/vercel-deploy.sh --project-name my-project"
echo "  3. Add CNAME in DNS: $DOMAIN → cname.vercel-dns.com"
echo "  4. Set OPENAI_API_KEY in Vercel dashboard"
echo ""
