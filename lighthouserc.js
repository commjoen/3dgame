module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000'],
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local:.*:3000',
      startServerReadyTimeout: 30000
    },
    assert: {
      assertions: {
        'categories:performance': ['error', {minScore: 0.8}],
        'categories:accessibility': ['error', {minScore: 0.9}],
        'categories:best-practices': ['error', {minScore: 0.8}],
        'categories:seo': ['error', {minScore: 0.8}],
        'categories:pwa': ['warn', {minScore: 0.6}]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
}