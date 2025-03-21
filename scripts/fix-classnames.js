const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all .jsx and .tsx files in the src directory
const files = glob.sync('src/**/*.{jsx,tsx}');

// Regex to find className with unnecessary curly braces
// Matches patterns like className={"some-class"} or className={"some-class " + variable}
// where the curly braces enclose a string literal that doesn't need to be there
const unnecessaryCurlyBracesRegex = /className=\{["']([^{}]+)["']\}/g;

let totalMatches = 0;
let totalFilesModified = 0;

// Process each file
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  
  // Skip files that don't have any className with curly braces
  if (!unnecessaryCurlyBracesRegex.test(content)) {
    return;
  }
  
  // Reset regex lastIndex
  unnecessaryCurlyBracesRegex.lastIndex = 0;
  
  // Replace unnecessary curly braces with direct string
  let matches = 0;
  const newContent = content.replace(unnecessaryCurlyBracesRegex, (match, classNames) => {
    matches++;
    return `className="${classNames}"`;
  });
  
  // Update the file if changes were made
  if (matches > 0) {
    fs.writeFileSync(file, newContent, 'utf8');
    totalMatches += matches;
    totalFilesModified++;
    console.log(`Fixed ${matches} instances in ${file}`);
  }
});

console.log(`\nTotal: Fixed ${totalMatches} instances in ${totalFilesModified} files`); 