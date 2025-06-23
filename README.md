# git-visualizer

This repository is a monorepo currently housing two projects:

- `git-visualize` is a CLI/library focused on creating visualizations for git repositories.
- `notebooks` is a data science project built with Observable Framework using `git-visualize` to collect and create data.

### Repository Structure

```text
/
├── packages/
│   ├── notebooks/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   └── { components used within notebook }
│   │   │   └── data/
│   │   │       └── { raw data generated using git-visualize }
│   │   └── package.json
│   └── git-visualize/
│       ├── patches/
│       │   └── { patches for upstream projects before PRs (hopefully) get merged! }
│       ├── src/
│       │   ├── commands/
│       │   │   └── { functions for handling each subcommand }
│       │   ├── internal/
│       │   │   └── { internal functions shared across commands }
│       │   ├── test/
│       │   │   └── { unit tests for functions }
│       │   └── index.ts
│       └── package.json
├── package.json
└── { miscellaneous config, linting, formatting stuff }
```
