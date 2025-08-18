import { describe, it, expect } from 'vitest'
import fs from 'fs/promises'
import yaml from 'js-yaml'
import path from 'path'

describe('PR Preview Configuration', () => {
  it('should have PR preview workflow with container URLs', async () => {
    const workflowPath = path.join(process.cwd(), '.github/workflows/pr-preview.yml')
    const workflowContent = await fs.readFile(workflowPath, 'utf-8')
    const workflow = yaml.load(workflowContent)
    
    // Check preview job exists
    expect(workflow.jobs['deploy-preview']).toBeDefined()
    
    // Check trigger conditions
    expect(workflow.on.pull_request.types).toContain('opened')
    expect(workflow.on.pull_request.types).toContain('synchronize')
    expect(workflow.on.pull_request.types).toContain('reopened')
  })

  it('should include container information in PR comments', async () => {
    const workflowPath = path.join(process.cwd(), '.github/workflows/pr-preview.yml')
    const workflowContent = await fs.readFile(workflowPath, 'utf-8')
    
    // Check that the PR comment script includes container URLs
    expect(workflowContent).toContain('ghcr.io/commjoen/3dgame:pr-')
    expect(workflowContent).toContain('Container Preview (GHCR)')
    expect(workflowContent).toContain('docker run -p 8080:80')
    expect(workflowContent).toContain('commit_sha')
    expect(workflowContent).toContain('branch_name')
  })

  it('should include both GitHub Pages and container deployment options', async () => {
    const workflowPath = path.join(process.cwd(), '.github/workflows/pr-preview.yml')
    const workflowContent = await fs.readFile(workflowPath, 'utf-8')
    
    // Check for GitHub Pages preview section
    expect(workflowContent).toContain('Web Preview (GitHub Pages)')
    expect(workflowContent).toContain('commjoen.github.io/3dgame/pr-')
    
    // Check for container preview section
    expect(workflowContent).toContain('Container Preview (GHCR)')
    expect(workflowContent).toContain('PR-specific tag')
    expect(workflowContent).toContain('Commit-specific tag')
  })

  it('should have PR cleanup workflow with container information', async () => {
    const workflowPath = path.join(process.cwd(), '.github/workflows/pr-preview-cleanup.yml')
    const workflowContent = await fs.readFile(workflowPath, 'utf-8')
    const workflow = yaml.load(workflowContent)
    
    // Check cleanup job exists
    expect(workflow.jobs['cleanup-preview']).toBeDefined()
    
    // Check trigger on PR closed
    expect(workflow.on.pull_request.types).toContain('closed')
    
    // Check cleanup mentions container registry
    expect(workflowContent).toContain('Container Note')
    expect(workflowContent).toContain('GitHub Container Registry')
  })

  it('should mention multi-architecture support in PR comments', async () => {
    const workflowPath = path.join(process.cwd(), '.github/workflows/pr-preview.yml')
    const workflowContent = await fs.readFile(workflowPath, 'utf-8')
    
    // Check that multi-arch support is mentioned
    expect(workflowContent).toContain('linux/amd64')
    expect(workflowContent).toContain('linux/arm64')
  })
})