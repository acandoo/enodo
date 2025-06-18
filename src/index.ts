#!/bin/env node

import git from "isomorphic-git";
import http from "isomorphic-git/http/node";
import fs from "fs";

await git.clone({
    fs,
    http,
    dir: "./repo", // local directory to clone into
    url: "https://github.com/octocat/Hello-World", // repository URL
});