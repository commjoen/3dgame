# GitHub Pages Deployment System

This repository uses a dual deployment system for GitHub Pages that supports both the main application and PR preview functionality.

## How It Works

### Main Branch Deployment
- When code is pushed to the `main` branch, the CI/CD workflow automatically builds and deploys the application to GitHub Pages
- The deployment preserves existing PR preview content to ensure compatibility between systems

### PR Preview System
- When a PR is opened, the PR preview workflow creates a dedicated preview deployment
- Each PR gets its own subdirectory: `https://commjoen.github.io/3dgame/pr-{number}/`
- A master index page lists all available previews: `https://commjoen.github.io/3dgame/previews.html`

## Deployment Architecture

```
GitHub Pages Root (/)
├── index.html              # Main application entry point
├── assets/                 # Main application assets
├── manifest.json           # PWA manifest
├── previews.html          # PR preview index page
├── pr-48/                 # PR #48 preview
│   ├── index.html
│   └── assets/
├── pr-49/                 # PR #49 preview
│   ├── index.html
│   └── assets/
└── README.md              # GitHub Pages documentation
```

## Key Features

### Content Preservation
The main deployment workflow automatically:
- Preserves all existing PR preview directories (`pr-*/`)
- Maintains the `previews.html` index page
- Keeps other important files like `README.md`

### Automatic Updates
- Main application updates when code is merged to `main`
- PR previews update when commits are pushed to PR branches
- Preview index page regenerates automatically

### Multiple Access Points
- **Main Application**: `https://commjoen.github.io/3dgame/`
- **PR Previews Index**: `https://commjoen.github.io/3dgame/previews.html`
- **Specific PR Preview**: `https://commjoen.github.io/3dgame/pr-{number}/`

## Troubleshooting

### Missing previews.html
If the `previews.html` file is missing, it will be automatically regenerated:
1. When the next PR preview is deployed
2. By the daily regeneration workflow (6 AM UTC)
3. Manually by triggering the "Regenerate Previews Page" workflow

### Preview Links Not Working
1. Check that GitHub Pages is enabled in repository settings
2. Verify the source is set to "GitHub Actions"
3. Ensure the PR preview workflow has proper permissions

### Main Application Redirect Issues
The main application should be accessible at the root URL. If you're being redirected:
1. Clear your browser cache
2. Check that the base path configuration is correct
3. Verify the GitHub Pages custom domain settings (if applicable)

## Manual Operations

### Triggering Preview Regeneration
You can manually regenerate the `previews.html` file:
1. Go to Actions tab in GitHub
2. Select "Regenerate Previews Page"
3. Click "Run workflow"

### Cleanup Old Previews
Old PR previews are automatically cleaned up when PRs are closed, but you can also manually remove them by editing the gh-pages branch.

## Technical Implementation

The deployment system uses:
- **GitHub Actions** for automated builds and deployments
- **GitHub Pages** with Actions as the source
- **Git branch manipulation** for preserving content
- **Artifact uploads** for efficient deployment

This ensures that both the main application and PR preview functionality work seamlessly together without conflicts.