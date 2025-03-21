const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Regular expression to match className={'some-static-value'}
const regex = /className=\{['"]([^{}]+?)['"]\}/g;
const replacement = 'className="$1"';

// Find all .jsx and .tsx files in the src directory
const files = glob.sync('src/**/*.{jsx,tsx}');

let totalReplacements = 0;
let filesModified = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const newContent = content.replace(regex, replacement);
  
  // Count replacements in this file
  const matches = content.match(regex);
  const replacementsInFile = matches ? matches.length : 0;
  
  if (replacementsInFile > 0) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Modified ${file} (${replacementsInFile} replacements)`);
    totalReplacements += replacementsInFile;
    filesModified++;
  }
});

console.log(`\nSummary:`);
console.log(`Files modified: ${filesModified}`);
console.log(`Total replacements: ${totalReplacements}`); 