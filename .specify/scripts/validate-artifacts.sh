#!/usr/bin/env bash
# Spec-Kit validation: checks artifact consistency
# Usage: bash .specify/scripts/validate-artifacts.sh

echo "=== Spec-Kit Artifact Validation ==="

SPECS_DIR=".specify/specs"
ERRORS=0

for spec_dir in "$SPECS_DIR"/[0-9]*/; do
  feature=$(basename "$spec_dir")
  echo ""
  echo "--- $feature ---"
  
  # Check required files
  if [ -f "$spec_dir/spec.md" ]; then
    echo "  ✓ spec.md"
  else
    echo "  ✗ spec.md MISSING"
    ERRORS=$((ERRORS + 1))
  fi
  
  # Check optional but recommended files
  for file in plan.md research.md data-model.md; do
    if [ -f "$spec_dir/$file" ]; then
      echo "  ✓ $file"
    else
      echo "  · $file (not created)"
    fi
  done
done

echo ""
if [ $ERRORS -eq 0 ]; then
  echo "=== All required artifacts present ==="
else
  echo "=== $ERRORS missing required artifacts ==="
  exit 1
fi
