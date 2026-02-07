# 🤝 Contributing to NuestrosGastos

Thank you for your interest in contributing! This document provides guidelines and instructions.

---

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/nuestros-gastos.git
   cd nuestros-gastos
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/andrea-r24/nuestros-gastos.git
   ```
4. **Create a branch** for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## Development Setup

### Web App

```bash
cd apps/web
npm install
cp .env.example .env
# Fill in .env with your Supabase and Telegram credentials
npm run dev
```

### Bot

```bash
cd apps/bot
pip install -r requirements.txt
cp .env.example .env
# Fill in .env
python main.py
```

---

## Code Style

### TypeScript/JavaScript
- Use **TypeScript** for all new files
- Follow existing code style (Prettier config)
- Use meaningful variable names
- Add JSDoc comments for complex functions

### Python
- Follow **PEP 8** style guide
- Use type hints where possible
- Add docstrings to functions and classes

---

## Commit Guidelines

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- **feat:** New feature
- **fix:** Bug fix
- **docs:** Documentation changes
- **style:** Code style changes (formatting, no logic change)
- **refactor:** Code refactoring
- **test:** Adding or updating tests
- **chore:** Build process, dependencies, etc.

### Examples
```bash
git commit -m "feat(dashboard): add expense filtering by date range"
git commit -m "fix(bot): handle timezone conversion in /resumen command"
git commit -m "docs: update deployment guide with Railway instructions"
```

---

## Pull Request Process

1. **Update your branch** with latest upstream:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests** (when available):
   ```bash
   npm run test
   ```

3. **Type check**:
   ```bash
   cd apps/web
   npx tsc --noEmit
   ```

4. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a Pull Request** on GitHub:
   - Clear title describing the change
   - Description with context and screenshots (if UI change)
   - Link any related issues

6. **Address review feedback** if requested

---

## Areas for Contribution

### High Priority
- [ ] Unit tests for queries and utilities
- [ ] E2E tests with Playwright
- [ ] Accessibility improvements (ARIA labels, keyboard navigation)
- [ ] Mobile responsiveness fixes
- [ ] Bot webhook mode (instead of polling)

### Features
- [ ] Export expenses to CSV/Excel
- [ ] Email receipts parsing
- [ ] Recurring expense management UI
- [ ] Multi-currency support
- [ ] Dark mode
- [ ] PWA support

### Documentation
- [ ] API documentation
- [ ] Bot commands reference
- [ ] Database schema diagram
- [ ] Deployment video tutorial

---

## Questions?

Open an issue or discussion on GitHub. We're happy to help!

---

**Thank you for contributing! 🙌**
