# enodo

enodo is an analysis suite built with Node and TypeScript for the open source ecosystem. This repository is a monorepo currently housing two projects:

- `git-visualize` is a CLI/library focused on creating visualizations for git repositories.
- `notebooks` is a data science app built with Observable Framework using `git-visualize` to tabulate data.

This repository was worked on for Hack Club's 2025 Summer of Making hackathon program.

### Repository Structure

```text
/
├── patches/
│   └── { patches for upstream projects before PRs (hopefully) get merged! }
├── packages/
│   ├── notebooks/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   └── { components used within notebook }
│   │   │   └── data/
│   │   │       └── { raw data generated using git-visualize }
│   │   └── package.json
│   └── git-visualize/
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

### AI Usage

On Hack Club's `#summer-of-making-bulletin`:

> Our only rule is that you have to check the box and explain what the AI did in the readme!!! Otherwise we consider it to be plagiarism and it can get you booted from the game 🤡

My goals for this project were to learn the interfaces/APIs of Node and popular NPM libraries, and build something cool (and useful) in the process! Generative AI tools were partially used in the following processes:

- researching libraries
- generating commit messages
- refactoring code
- auto-completing/generating code snippets
- parsing error messages and resolving them
- automatically resolving type errors
- explaining APIs

Later branches used agentic AI for certain features to quickly use for an in-class project, but the CLI published on NPM does not contain any agentic AI-generated code.