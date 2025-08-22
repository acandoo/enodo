# git-visualize

git-visualize is a CLI/library focused on creating visualizations for git repositories. This tool was created for a data science distinction project analyzing patterns in open source projects.

# Using git-visualize

To use git-visualize, it is recommended to have [npm](https://nodejs.org/en/download) or [pnpm](https://pnpm.io/) installed.

If you installed npm, you can run the project with `npx git-visualize` in the terminal.

If you installed pnpm, you can run the project with `pnpx git-visualize` in the terminal.

```sh
$ npx git-visualize
Usage: git-visualize [options] [command]

A CLI tool to visualize git repositories.

Options:
  -V, --version                         output the version number
  -h, --help                            display help for command

Commands:
  author-commits [options] <repo>       See the commits per author in a repository
  commit-activity [options] <repos...>  Compare commit activity over time across multiple repositories
  raw-log [options] <repo>              Get raw JSON commit log for a repository
  author-activity [options] <repo>      Compare author activity over time for a repository
  help [command]                        display help for command
```

# Development

This package, like the other packages in enodo, is developed using pnpm. Use `pnpm install` at the root of the repository.
