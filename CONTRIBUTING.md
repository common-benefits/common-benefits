# Contributing

Thanks for your interest in contributing!

## Filing an issue

Before opening a PR, please file an issue using one of the templates so we can discuss scope:

- [Bug report](.github/ISSUE_TEMPLATE/1-bug-report.yml)
- [Feature request](.github/ISSUE_TEMPLATE/2-feature-request.yml)
- [Task](.github/ISSUE_TEMPLATE/3-task.yml)

If you're unsure whether something is a bug, a feature, or out of scope, file it anyway and we'll help triage.

## Submitting a pull request

1. Fork the repo and create a feature branch (e.g., `issue-42-add-foo`).
2. Make your changes. Run `pnpm run ci` locally to confirm lint, build, and tests pass.
3. Use [conventional commits](https://www.conventionalcommits.org/) — Release Please uses the commit messages to determine version bumps and changelog entries.
4. Open a PR against `main` and link the issue.

We use per-section CI workflows, so only the package(s) you touched will run in CI.

## Code of conduct

Participation is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). By contributing, you agree to abide by it.
