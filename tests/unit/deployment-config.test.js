import { describe, it, expect } from 'vitest'
import fs from 'fs/promises'
import yaml from 'js-yaml'
import path from 'path'

describe('Deployment Configuration', () => {
  it('should have GitHub Pages deployment correctly configured', async () => {
    const workflowPath = path.join(process.cwd(), '.github/workflows/ci-cd.yml')
    const workflowContent = await fs.readFile(workflowPath, 'utf-8')
    const workflow = yaml.load(workflowContent)
    
    // Check both prepare-pages and deploy jobs exist
    expect(workflow.jobs['prepare-pages']).toBeDefined()
    expect(workflow.jobs.deploy).toBeDefined()
    
    // Check prepare-pages job has the setup and upload actions
    const preparePagesSteps = workflow.jobs['prepare-pages'].steps
    const hasSetupPages = preparePagesSteps.some(step => step.uses === 'actions/configure-pages@v5')
    const hasUploadArtifact = preparePagesSteps.some(step => step.uses === 'actions/upload-pages-artifact@v4')
    
    // Check deploy job has the deploy action
    const deploySteps = workflow.jobs.deploy.steps
    const hasDeployPages = deploySteps.some(step => step.uses === 'actions/deploy-pages@v4')
    
    expect(hasSetupPages).toBe(true)
    expect(hasUploadArtifact).toBe(true)
    expect(hasDeployPages).toBe(true)
    
    // Check deploy job has continue-on-error for graceful failure handling
    expect(workflow.jobs.deploy['continue-on-error']).toBe(true)
    
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
    const buildStep = containerSteps.find(step => step.uses === 'docker/build-push-action@v6')
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

  it('should build containers on every main branch commit', async () => {
    const workflowPath = path.join(process.cwd(), '.github/workflows/ci-cd.yml')
    const workflowContent = await fs.readFile(workflowPath, 'utf-8')
    const workflow = yaml.load(workflowContent)
    
    const containerJob = workflow.jobs['build-and-push-container']
    expect(containerJob).toBeDefined()
    
    // Check that the condition explicitly mentions main branch
    const ifCondition = containerJob.if
    expect(ifCondition).toContain('refs/heads/main')
    expect(ifCondition).toContain('github.event_name == \'push\'')
    expect(ifCondition).toContain('github.event_name == \'pull_request\'')
  })

  it('should allow container builds even when comprehensive tests fail', async () => {
    const workflowPath = path.join(process.cwd(), '.github/workflows/ci-cd.yml')
    const workflowContent = await fs.readFile(workflowPath, 'utf-8')
    const workflow = yaml.load(workflowContent)
    
    // Container builds should only depend on basic validation, not comprehensive tests
    const containerJob = workflow.jobs['build-and-push-container']
    const buildJob = workflow.jobs['build']
    
    expect(containerJob.needs).toEqual(['build'])
    expect(buildJob.needs).toEqual(['validate'])
    
    // Comprehensive tests should be allowed to fail
    const testJob = workflow.jobs['test']
    const e2eJob = workflow.jobs['e2e-tests']
    const mobileJob = workflow.jobs['mobile-compatibility']
    
    expect(testJob['continue-on-error']).toBe(true)
    expect(e2eJob['continue-on-error']).toBe(true)
    expect(mobileJob['continue-on-error']).toBe(true)
  })

  it('should have separate validate job for basic quality checks', async () => {
    const workflowPath = path.join(process.cwd(), '.github/workflows/ci-cd.yml')
    const workflowContent = await fs.readFile(workflowPath, 'utf-8')
    const workflow = yaml.load(workflowContent)
    
    const validateJob = workflow.jobs['validate']
    expect(validateJob).toBeDefined()
    expect(validateJob.name).toBe('Validate Code Quality')
    
    // Check that validation includes essential checks
    const steps = validateJob.steps.map(step => step.name)
    expect(steps).toContain('Run linter')
    expect(steps).toContain('Check code formatting')
    expect(steps).toContain('Type check')
  })

  it('should have PR tagging for containers', async () => {
    const workflowPath = path.join(process.cwd(), '.github/workflows/ci-cd.yml')
    const workflowContent = await fs.readFile(workflowPath, 'utf-8')
    const workflow = yaml.load(workflowContent)
    
    const metadataStep = workflow.jobs['build-and-push-container'].steps.find(
      step => step.uses === 'docker/metadata-action@v5'
    )
    
    expect(metadataStep).toBeDefined()
    
    // Check tags include PR tagging
    const tags = metadataStep.with.tags
    expect(tags).toContain('type=ref,event=pr')
    expect(tags).toContain('type=sha,prefix={{branch}}-')
  })
})