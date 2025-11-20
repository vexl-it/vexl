#!/bin/bash
# Build with this resource: https://solmaz.io/log/2025/09/08/claude-md-agents-md-migration-guide/
# Script to create CLAUDE.md symlinks to AGENTS.md files
# This allows CLAUDE.md files to exist locally without being committed to git

set -e

echo "Setting up CLAUDE.md symlinks..."

# Change to repository root
cd "$(git rev-parse --show-toplevel)"

# Find all AGENTS.md files and create corresponding CLAUDE.md symlinks
git ls-files | grep "AGENTS\.md$" | while read -r file; do
    dir=$(dirname "$file")
    claude_file="${file/AGENTS.md/CLAUDE.md}"

    # Remove existing CLAUDE.md file/link if it exists
    if [ -e "$claude_file" ] || [ -L "$claude_file" ]; then
        rm "$claude_file"
        echo "Removed existing $claude_file"
    fi

    # Create symlink
    if [ "$dir" = "." ]; then
        ln -s "AGENTS.md" "CLAUDE.md"
        echo "Created symlink: CLAUDE.md -> AGENTS.md"
    else
        ln -s "AGENTS.md" "$claude_file"
        echo "Created symlink: $claude_file -> AGENTS.md"
    fi
done

echo ""
echo "✓ CLAUDE.md symlinks setup complete!"
echo "  - CLAUDE.md files are ignored by git"
echo "  - They will automatically stay in sync with AGENTS.md files"
echo "  - Run this script again if you add new AGENTS.md files"
