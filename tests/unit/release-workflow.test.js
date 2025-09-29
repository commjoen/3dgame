import { describe, it, expect } from 'vitest'
import fs from 'fs/promises'
import yaml from 'js-yaml'
import path from 'path'

describe('Release Workflow Configuration', () => {
  it('should have valid YAML syntax in release.yml', async () => {
    const workflowPath = path.join(process.cwd(), '.github/workflows/release.yml')
    const workflowContent = await fs.readFile(workflowPath, 'utf-8')
    
    // Should parse without throwing
    expect(() => yaml.load(workflowContent)).not.toThrow()
  })

  it('should have proper release workflow structure', async () => {
    const workflowPath = path.join(process.cwd(), '.github/workflows/release.yml')
    const workflowContent = await fs.readFile(workflowPath, 'utf-8')
    const workflow = yaml.load(workflowContent)
    
    // Basic workflow structure
    expect(workflow.name).toBe('Release')
    expect(workflow.on).toBeDefined()
    expect(workflow.jobs.release).toBeDefined()
    
    // Should have both tag and workflow_dispatch triggers
    expect(workflow.on.push.tags).toContain('v*.*.*')
    expect(workflow.on.workflow_dispatch).toBeDefined()
    expect(workflow.on.workflow_dispatch.inputs.version_type).toBeDefined()
  })

  it('should have proper permissions for release creation', async () => {
    const workflowPath = path.join(process.cwd(), '.github/workflows/release.yml')
    const workflowContent = await fs.readFile(workflowPath, 'utf-8')
    const workflow = yaml.load(workflowContent)
    
    expect(workflow.permissions.contents).toBe('write')
  })

  it('should have all required steps in the release job', async () => {
    const workflowPath = path.join(process.cwd(), '.github/workflows/release.yml')
    const workflowContent = await fs.readFile(workflowPath, 'utf-8')
    const workflow = yaml.load(workflowContent)
    
    const steps = workflow.jobs.release.steps
    const stepNames = steps.map(step => step.name)
    
    // Essential steps for release workflow
    expect(stepNames).toContain('Checkout code')
    expect(stepNames).toContain('Setup Node.js')
    expect(stepNames).toContain('Install dependencies')
    expect(stepNames).toContain('Run tests')
    expect(stepNames).toContain('Build application')
    expect(stepNames).toContain('Create changelog')
    expect(stepNames).toContain('Create GitHub Release')
  })

  it('should use proper multiline output syntax in changelog step', async () => {
    const workflowPath = path.join(process.cwd(), '.github/workflows/release.yml')
    const workflowContent = await fs.readFile(workflowPath, 'utf-8')
    
    // Check that the changelog step uses proper syntax
    expect(workflowContent).toContain('echo "CHANGELOG<<EOF"')
    expect(workflowContent).toContain('echo "EOF"')
    
    // Should use atomic output blocks with {} subshells
    expect(workflowContent).toContain('} >> $GITHUB_OUTPUT')
  })

  it('should have proper version handling for both trigger types', async () => {
    const workflowPath = path.join(process.cwd(), '.github/workflows/release.yml')
    const workflowContent = await fs.readFile(workflowPath, 'utf-8')
    const workflow = yaml.load(workflowContent)
    
    const steps = workflow.jobs.release.steps
    
    // Should have version bump step for manual triggers
    const versionBumpStep = steps.find(step => step.name === 'Bump version and create tag')
    expect(versionBumpStep).toBeDefined()
    expect(versionBumpStep.if).toBe("github.event_name == 'workflow_dispatch'")
    
    // Should have version extraction step for tag triggers  
    const versionTagStep = steps.find(step => step.name === 'Get version from tag')
    expect(versionTagStep).toBeDefined()
    expect(versionTagStep.if).toBe("github.event_name == 'push'")
  })

  it('should create release archives in multiple formats', async () => {
    const workflowPath = path.join(process.cwd(), '.github/workflows/release.yml')
    const workflowContent = await fs.readFile(workflowPath, 'utf-8')
    
    // Should create both tar.gz and zip archives
    expect(workflowContent).toContain('tar -czf')
    expect(workflowContent).toContain('zip -r')
    expect(workflowContent).toContain('.tar.gz')
    expect(workflowContent).toContain('.zip')
  })
})