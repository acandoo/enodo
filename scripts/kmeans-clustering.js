#!/usr/bin/env node

/**
 * K-means clustering script for repository health data.
 * Clusters repositories into 3 groups based on metrics.
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { kmeans } from 'ml-kmeans';

const scriptDir = path.dirname(new URL(import.meta.url).pathname);
const csvFile = path.join(scriptDir, 'data science final labeling - Sheet1.csv');

// Load and parse CSV
function loadData(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  const data = [];
  const repoNames = [];

  for (const row of records) {
    repoNames.push(row.Name);

    // Extract numerical features
    const features = [
      parseFloat(row['# of Commits (90 days)']) || 0,
      parseFloat(row['CoVar of Commit Times (90 days)']) || 0,
      parseFloat(row['# of Tags (90 days)']) || 0,
      parseFloat(row['# of Contributors (90 days)']) || 0,
      parseFloat(row['CoVar of Commits per Contributor (90 days)']) || 0,
    ];

    data.push(features);
  }

  return { data, repoNames };
}

// Standardize features (Z-score normalization)
function standardizeData(data) {
  const numFeatures = data[0].length;
  const standardized = [];

  for (let i = 0; i < numFeatures; i++) {
    const column = data.map((row) => row[i]);
    const mean = column.reduce((a, b) => a + b, 0) / column.length;
    const variance =
      column.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      column.length;
    const stdDev = Math.sqrt(variance);

    for (let j = 0; j < data.length; j++) {
      if (!standardized[j]) {
        standardized[j] = [];
      }
      standardized[j][i] = stdDev === 0 ? 0 : (data[j][i] - mean) / stdDev;
    }
  }

  return standardized;
}

// Perform K-means clustering
function clusterData(data, nClusters = 3) {
  const standardized = standardizeData(data);
  const result = kmeans(standardized, nClusters, {
    maxIterations: 10000,
    initialization: 'kmeans++',
  });

  return result.clusters;
}



// Print cluster summary
function printClusterSummary(labels, repoNames) {
  console.log('\nCluster Summary:');
  console.log('-'.repeat(60));

  const maxCluster = Math.max(...labels);
  for (let clusterId = 0; clusterId <= maxCluster; clusterId++) {
    const clusterRepos = repoNames.filter((_, i) => labels[i] === clusterId);
    console.log(`\nCluster ${clusterId} (${clusterRepos.length} repositories):`);
    clusterRepos.forEach((repo) => {
      console.log(`  - ${repo}`);
    });
  }
}

// Main execution
async function main() {
  if (!fs.existsSync(csvFile)) {
    console.error(`Error: CSV file not found at ${csvFile}`);
    process.exit(1);
  }

  console.log(`Loading data from ${csvFile}...`);
  const { data, repoNames } = loadData(csvFile);
  console.log(`Loaded ${repoNames.length} repositories`);

  console.log('\nPerforming K-means clustering with k=3...');
  const labels = clusterData(data, 4);

  printClusterSummary(labels, repoNames);
  console.log('\n' + '='.repeat(60));
  console.log('K-means clustering complete!');
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
