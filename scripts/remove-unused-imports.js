const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all .jsx and .tsx files in the src directory
const files = glob.sync('src/**/*.{jsx,tsx}');

// Common imports that are used in JSX and shouldn't be removed
const safeImports = ['React', 'Fragment', 'useState', 'useEffect', 'useContext', 'useRef', 'useMemo', 'useCallback', 'PureComponent'];

// Simple regex to find import statements
const importRegex = /import\s+(?:{([^}]+)}|([^{}\s;]+))\s+from\s+['"]([^'"]+)['"];?/g;

// Process each file
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const fileContent = content.replace(/\/\/.*$/gm, ''); // Remove comments
  
  // Find all imports
  const importMatches = [];
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const fullImport = match[0];
    const namedImports = match[1] ? match[1].split(',').map(i => i.trim().split(' as ')[0].trim()) : [];
    const defaultImport = match[2] ? match[2].trim() : null;
    const source = match[3];
    
    importMatches.push({
      fullImport,
      namedImports,
      defaultImport,
      source,
      index: match.index,
      length: fullImport.length
    });
  }
  
  // Check if imports are used
  const unusedImports = importMatches.map(importInfo => {
    const unusedNamed = importInfo.namedImports.filter(name => {
      // Skip safe imports
      if (safeImports.includes(name)) return false;
      
      // Check if the import is used in the file content (excluding import statements)
      const contentWithoutImports = content.substring(0, importInfo.index) + 
                                    content.substring(importInfo.index + importInfo.length);
      const regex = new RegExp(`\\b${name}\\b`, 'g');
      return !regex.test(contentWithoutImports);
    });
    
    let unusedDefault = null;
    if (importInfo.defaultImport && !safeImports.includes(importInfo.defaultImport)) {
      const contentWithoutImports = content.substring(0, importInfo.index) + 
                                  content.substring(importInfo.index + importInfo.length);
      const regex = new RegExp(`\\b${importInfo.defaultImport}\\b`, 'g');
      if (!regex.test(contentWithoutImports)) {
        unusedDefault = importInfo.defaultImport;
      }
    }
    
    return {
      ...importInfo,
      unusedNamed,
      unusedDefault
    };
  }).filter(info => info.unusedNamed.length > 0 || info.unusedDefault);
  
  if (unusedImports.length > 0) {
    console.log(`\nFile: ${file}`);
    console.log('Unused imports:');
    
    unusedImports.forEach(importInfo => {
      if (importInfo.unusedDefault) {
        console.log(`  - Default import: ${importInfo.unusedDefault} from "${importInfo.source}"`);
      }
      
      if (importInfo.unusedNamed.length > 0) {
        console.log(`  - Named imports: ${importInfo.unusedNamed.join(', ')} from "${importInfo.source}"`);
      }
    });
  }
}); 