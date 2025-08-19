import { describe, it, expect } from 'vitest'
import fs from 'fs/promises'
import yaml from 'js-yaml'
import path from 'path'

describe('GitHub Pages Error Handling', () => {
  it('should have split deployment process for better error handling', async () => {
    const workflowPath = path.join(process.cwd(), '.github/workflows/ci-cd.yml')
    const workflowContent = await fs.readFile(workflowPath, 'utf-8')
    const workflow = yaml.load(workflowContent)
    
    // Should have separate prepare-pages and deploy jobs
    expect(workflow.jobs['prepare-pages']).toBeDefined()
    expect(workflow.jobs.deploy).toBeDefined()
    
    // Prepare-pages should build and upload artifacts
    const preparePagesJob = workflow.jobs['prepare-pages']
    expect(preparePagesJob.needs).toEqual(['build'])
    
    // Deploy should depend on prepare-pages
    const deployJob = workflow.jobs.deploy
    expect(deployJob.needs).toEqual(['prepare-pages'])
    
    // Deploy job should have continue-on-error for graceful failure
    expect(deployJob['continue-on-error']).toBe(true)
  })
  
  it('should provide helpful error messages when deployment fails', async () => {
    const workflowPath = path.join(process.cwd(), '.github/workflows/ci-cd.yml')
    const workflowContent = await fs.readFile(workflowPath, 'utf-8')
    const workflow = yaml.load(workflowContent)
    
    const deployJob = workflow.jobs.deploy
    const deploymentStatusStep = deployJob.steps.find(step => 
      step.name === 'Deployment status check'
    )
    
    expect(deploymentStatusStep).toBeDefined()
    expect(deploymentStatusStep.if).toBe('failure()')
    
    // Should contain helpful guidance
    const runCommand = deploymentStatusStep.run
    expect(runCommand).toContain('repository Settings > Pages')
    expect(runCommand).toContain('GitHub Actions')
    expect(runCommand).toContain('GITHUB_PAGES_TROUBLESHOOTING.md')
    expect(runCommand).toContain('container deployment')
  })
  
  it('should maintain environment configuration for successful deployments', async () => {
    const workflowPath = path.join(process.cwd(), '.github/workflows/ci-cd.yml')
    const workflowContent = await fs.readFile(workflowPath, 'utf-8')
    const workflow = yaml.load(workflowContent)
    
    const deployJob = workflow.jobs.deploy
    
    // Should still have github-pages environment configured
    expect(deployJob.environment).toBeDefined()
    expect(deployJob.environment.name).toBe('github-pages')
    expect(deployJob.environment.url).toBe('${{ steps.deployment.outputs.page_url }}')
    
    // Should have proper permissions
    expect(deployJob.permissions).toMatchObject({
      contents: 'read',
      pages: 'write',
      'id-token': 'write'
    })
  })
  
  it('should use artifact passing between jobs', async () => {
    const workflowPath = path.join(process.cwd(), '.github/workflows/ci-cd.yml')
    const workflowContent = await fs.readFile(workflowPath, 'utf-8')
    const workflow = yaml.load(workflowContent)
    
    // Prepare-pages should have outputs
    const preparePagesJob = workflow.jobs['prepare-pages']
    expect(preparePagesJob.outputs).toBeDefined()
    expect(preparePagesJob.outputs['pages-artifact-id']).toBe('${{ steps.pages-artifact.outputs.artifact-id }}')
    
    // Deploy job should use the artifact ID
    const deployJob = workflow.jobs.deploy
    const deployStep = deployJob.steps.find(step => step.uses === 'actions/deploy-pages@v4')
    expect(deployStep.with.artifact_id).toBe('${{ needs.prepare-pages.outputs.pages-artifact-id }}')
  })
})