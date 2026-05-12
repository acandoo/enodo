#!/usr/bin/env bash
set -euo pipefail

# Summarize all JSON metric files in OUTDIR (default /tmp/git-visualize-metrics)
OUTDIR=${OUTDIR:-/tmp/git-visualize-metrics}

if [ ! -d "$OUTDIR" ]; then
  echo "Directory $OUTDIR does not exist"
  exit 1
fi

echo "Summaries for JSON files in $OUTDIR"

node - <<'NODE'
const fs = require('fs');
const path = require('path');
const dir = process.env.OUTDIR || '/tmp/git-visualize-metrics';
const files = fs.readdirSync(dir).filter(f=>f.endsWith('.json'));
if(files.length===0){
  console.log('(no JSON files found)');
  process.exit(0);
}
files.sort();
for(const f of files){
  try{
    const data = JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));
    const display = f.replace(/--/g,'/').replace('.json','');
    console.log(`${display}: commits90d=${data.commits90d} tags90d=${data.tags90d} distinctContributors90d=${data.distinctContributors90d} intervalCv90d=${data.intervalCv90d} commitsPerContributorCv90d=${data.commitsPerContributorCv90d}`);
  }catch(e){
    console.log(`${f}: parse error`);
  }
}
NODE
