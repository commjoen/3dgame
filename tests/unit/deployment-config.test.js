import { describe, it, expect } from 'vitest'
import fs from 'fs/promises'
import yaml from 'js-yaml'
import path from 'path'

describe('Deployment Configuration', () => {
  it('should have GitHub Pages deployment correctly configured', async () => {
    const workflowPath = path.join(process.cwd(), '.github/workflows/ci-cd.yml')
    const workflowContent = await fs.readFile(workflowPath, 'utf-8')
    const workflow = yaml.load(workflowContent)
    
    // Check deploy job exists
    expect(workflow.jobs.deploy).toBeDefined()
    
    // Check it uses modern GitHub Pages deployment
    const deploySteps = workflow.jobs.deploy.steps
    const hasSetupPages = deploySteps.some(step => step.uses === 'actions/configure-pages@v4')
    const hasUploadArtifact = deploySteps.some(step => step.uses === 'actions/upload-pages-artifact@v3')
    const hasDeployPages = deploySteps.some(step => step.uses === 'actions/deploy-pages@v4')
    
    expect(hasSetupPages).toBe(true)
    expect(hasUploadArtifact).toBe(true)
    expect(hasDeployPages).toBe(true)
    
    // Check permissions are correct
    expect(workflow.jobs.deploy.permissions).toMatchObject({
      contents: 'read',
      pages: 'write',
      'id-token': 'write'
    })
  })

  it('should have container build with multi-platform support', async () => {
    const workflowPath = path.join(process.cwd(), '.github/workflows/ci-cd.yml')
    const workflowContent = await fs.readFile(workflowPath, 'utf-8')
    const workflow = yaml.load(workflowContent)
    
    // Check container build job exists
    expect(workflow.jobs['build-and-push-container']).toBeDefined()
    
    const containerSteps = workflow.jobs['build-and-push-container'].steps
    
    // Check QEMU setup for multi-arch
    const hasQEMU = containerSteps.some(step => step.uses === 'docker/setup-qemu-action@v3')
    expect(hasQEMU).toBe(true)
    
    // Check buildx setup
    const hasBuildx = containerSteps.some(step => step.uses === 'docker/setup-buildx-action@v3')
    expect(hasBuildx).toBe(true)
    
    // Check multi-platform build
    const buildStep = containerSteps.find(step => step.uses === 'docker/build-push-action@v5')
    expect(buildStep).toBeDefined()
    expect(buildStep.with.platforms).toBe('linux/amd64,linux/arm64')
    
    // Check proper caching
    expect(buildStep.with['cache-from']).toBe('type=gha')
    expect(buildStep.with['cache-to']).toBe('type=gha,mode=max')
  })

  it('should have proper Docker image metadata', async () => {
    const workflowPath = path.join(process.cwd(), '.github/workflows/ci-cd.yml')
    const workflowContent = await fs.readFile(workflowPath, 'utf-8')
    const workflow = yaml.load(workflowContent)
    
    const metadataStep = workflow.jobs['build-and-push-container'].steps.find(
      step => step.uses === 'docker/metadata-action@v5'
    )
    
    expect(metadataStep).toBeDefined()
    
    // Check tags include main and latest
    const tags = metadataStep.with.tags
    expect(tags).toContain('type=raw,value=latest,enable={{is_default_branch}}')
    expect(tags).toContain('type=raw,value=main,enable={{is_default_branch}}')
    
    // Check labels include proper metadata
    const labels = metadataStep.with.labels
    expect(labels).toContain('org.opencontainers.image.title=Ocean Adventure')
    expect(labels).toContain('org.opencontainers.image.description=A 3D browser-based underwater platform game')
  })
})