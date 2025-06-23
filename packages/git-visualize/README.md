# git-visualize

git-visualize is a CLI/library focused on creating visualizations for git repositories. This tool was created for a data science distinction project analyzing patterns in open source projects.

### TODO

- [ ] contribute upstream to [isomorphic-git](https://github.com/isomorphic-git/isomorphic-git) to actually fix weird filename issue with systemd/systemd
- [ ] scan for system git before using isomorphic-git for cloning
- [ ] prompt user if file already exists (use inquirer-js)
- [ ] make all commands multi-repo options
- [ ] cleaner, functional code
- [ ] add tests
- [ ] moar features
    - [ ] commit activity over time (allow overlaying repos)
    - [ ] detect if a contributor is "active" (analyze frequency/commit patterns of individual contributors)
    - [ ] file type distribution
    - [ ] LOC added/removed over time
    - [ ] video node graph of files over time
    - [ ] file hotspots + import graphs
    - [ ] interactive dependency graph
- [ ] GitHub/GitLab API features
    - [ ] time to close issues/PRs
    - [ ] issues over time
