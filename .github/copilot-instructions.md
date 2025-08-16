# GitHub Copilot Instructions

## Project Context
This is Ocean Adventure, a 3D browser-based underwater platform game built with Three.js and Vite.

## Code Style Guidelines
- Use ES6+ modern JavaScript features
- Follow the existing code formatting with Prettier
- Use descriptive variable and function names
- Add JSDoc comments for complex functions
- Maintain consistent indentation and spacing

## Architecture Patterns
- Game follows Component-based architecture
- Mobile controls are separated into dedicated modules
- Use Three.js best practices for 3D rendering
- Implement responsive design for mobile and desktop

## Testing Approach
- Unit tests for core game logic in `tests/unit/`
- Integration tests in `tests/integration/`
- E2E tests with Playwright in `tests/e2e/`
- Mobile-specific tests for touch controls

## Performance Considerations
- Target 30-60 FPS on mobile devices
- Use object pooling for frequent operations
- Optimize Three.js scene graph
- Minimize DOM manipulations during gameplay

## Mobile Development
- Touch controls for swimming and movement
- Virtual joystick for navigation
- Responsive UI that adapts to screen size
- Handle device orientation changes gracefully

## Dependencies Management
- Keep dependencies minimal and secure
- Update dependencies regularly via Dependabot
- Use npm for package management
- Test after dependency updates