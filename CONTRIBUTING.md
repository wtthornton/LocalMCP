# Contributing to Personal MCP Gateway

Thank you for your interest in contributing to the Personal MCP Gateway! This project is designed to help "vibe coders" build faster and smarter.

## How to Contribute

### 1. Fork and Clone
```bash
git clone https://github.com/your-username/personal-mcp-gateway.git
cd personal-mcp-gateway
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Development Environment
```bash
# Copy environment file
cp env.example .env

# Start development services
docker-compose up -d

# Run the gateway in development mode
npm run dev
```

### 4. Make Your Changes
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Keep the "vibe coder" philosophy in mind

### 5. Test Your Changes
```bash
# Run all tests
npm test

# Run linting
npm run lint

# Run type checking
npm run typecheck

# Build the application
npm run build
```

### 6. Submit a Pull Request
- Create a descriptive title
- Explain what your changes do
- Reference any related issues
- Ensure all checks pass

## Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow the existing naming conventions
- Add comprehensive error handling
- Include helpful comments for vibe coders
- Keep functions small and focused

### Testing
- Write tests for all new features
- Aim for high test coverage
- Test both success and error cases
- Use descriptive test names

### Documentation
- Update README.md for user-facing changes
- Update API.md for new tools or endpoints
- Update ARCHITECTURE.md for structural changes
- Add inline comments for complex logic

### Vibe Coder Philosophy
Remember that this project is designed for developers who:
- Want to focus on building features, not learning frameworks
- Prefer smart defaults over complex configuration
- Value clear, helpful error messages
- Appreciate learning through doing

## Project Structure

```
src/
├── tools/           # MCP tools (repo, context7, docs, etc.)
├── services/        # Core services (cache, vector, playwright)
├── pipeline/        # Dynamic pipeline processing
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── config/          # Configuration management
```

## Getting Help

- 📖 Check the [documentation](docs/)
- 🐛 [Report issues](https://github.com/your-org/personal-mcp-gateway/issues)
- 💬 [Join discussions](https://github.com/your-org/personal-mcp-gateway/discussions)
- 📧 Contact the maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for helping make the Personal MCP Gateway better for vibe coders everywhere! 🚀
