const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Define utility class patterns to extract from inline styles
const utilityPatterns = [
  // Padding
  { regex: /padding:\s*0(\s*|;|})/, className: 'padding-0', cssRule: '.padding-0 { padding: 0; }' },
  { regex: /padding:\s*(\d+)px(\s*|;|})/, className: 'padding-$1', cssRule: '.padding-$1 { padding: $1px; }' },
  { regex: /padding-top:\s*(\d+)px(\s*|;|})/, className: 'padding-top-$1', cssRule: '.padding-top-$1 { padding-top: $1px; }' },
  { regex: /padding-bottom:\s*(\d+)px(\s*|;|})/, className: 'padding-bottom-$1', cssRule: '.padding-bottom-$1 { padding-bottom: $1px; }' },
  { regex: /padding-left:\s*(\d+)px(\s*|;|})/, className: 'padding-left-$1', cssRule: '.padding-left-$1 { padding-left: $1px; }' },
  { regex: /padding-right:\s*(\d+)px(\s*|;|})/, className: 'padding-right-$1', cssRule: '.padding-right-$1 { padding-right: $1px; }' },
  
  // Margin
  { regex: /margin:\s*0(\s*|;|})/, className: 'margin-0', cssRule: '.margin-0 { margin: 0; }' },
  { regex: /margin:\s*(\d+)px(\s*|;|})/, className: 'margin-$1', cssRule: '.margin-$1 { margin: $1px; }' },
  { regex: /margin-top:\s*(\d+)px(\s*|;|})/, className: 'margin-top-$1', cssRule: '.margin-top-$1 { margin-top: $1px; }' },
  { regex: /margin-bottom:\s*(\d+)px(\s*|;|})/, className: 'margin-bottom-$1', cssRule: '.margin-bottom-$1 { margin-bottom: $1px; }' },
  { regex: /margin-left:\s*(\d+)px(\s*|;|})/, className: 'margin-left-$1', cssRule: '.margin-left-$1 { margin-left: $1px; }' },
  { regex: /margin-right:\s*(\d+)px(\s*|;|})/, className: 'margin-right-$1', cssRule: '.margin-right-$1 { margin-right: $1px; }' },
  
  // Width
  { regex: /width:\s*100%(\s*|;|})/, className: 'width-100-percent', cssRule: '.width-100-percent { width: 100%; }' },
  { regex: /width:\s*(\d+)px(\s*|;|})/, className: 'width-$1', cssRule: '.width-$1 { width: $1px; }' },
  { regex: /width:\s*(\d+)%(\s*|;|})/, className: 'width-$1-percent', cssRule: '.width-$1-percent { width: $1%; }' },
  { regex: /min-width:\s*(\d+)px(\s*|;|})/, className: 'min-width-$1', cssRule: '.min-width-$1 { min-width: $1px; }' },
  { regex: /max-width:\s*(\d+)px(\s*|;|})/, className: 'max-width-$1', cssRule: '.max-width-$1 { max-width: $1px; }' },
  
  // Height
  { regex: /height:\s*100%(\s*|;|})/, className: 'height-100-percent', cssRule: '.height-100-percent { height: 100%; }' },
  { regex: /height:\s*(\d+)px(\s*|;|})/, className: 'height-$1', cssRule: '.height-$1 { height: $1px; }' },
  { regex: /min-height:\s*(\d+)px(\s*|;|})/, className: 'min-height-$1', cssRule: '.min-height-$1 { min-height: $1px; }' },
  { regex: /max-height:\s*(\d+)px(\s*|;|})/, className: 'max-height-$1', cssRule: '.max-height-$1 { max-height: $1px; }' },
  
  // Flex
  { regex: /display:\s*flex(\s*|;|})/, className: 'display-flex', cssRule: '.display-flex { display: flex; }' },
  { regex: /flex-direction:\s*row(\s*|;|})/, className: 'flex-row', cssRule: '.flex-row { display: flex; flex-direction: row; }' },
  { regex: /flex-direction:\s*column(\s*|;|})/, className: 'flex-column', cssRule: '.flex-column { display: flex; flex-direction: column; }' },
  { regex: /flex:\s*1(\s*|;|})/, className: 'flex-1', cssRule: '.flex-1 { flex: 1; }' },
  { regex: /flex-wrap:\s*wrap(\s*|;|})/, className: 'flex-wrap', cssRule: '.flex-wrap { flex-wrap: wrap; }' },
  { regex: /justify-content:\s*center(\s*|;|})/, className: 'justify-center', cssRule: '.justify-center { justify-content: center; }' },
  { regex: /justify-content:\s*flex-start(\s*|;|})/, className: 'justify-start', cssRule: '.justify-start { justify-content: flex-start; }' },
  { regex: /justify-content:\s*flex-end(\s*|;|})/, className: 'justify-end', cssRule: '.justify-end { justify-content: flex-end; }' },
  { regex: /justify-content:\s*space-between(\s*|;|})/, className: 'justify-between', cssRule: '.justify-between { justify-content: space-between; }' },
  { regex: /align-items:\s*center(\s*|;|})/, className: 'align-center', cssRule: '.align-center { align-items: center; }' },
  { regex: /align-items:\s*flex-start(\s*|;|})/, className: 'align-start', cssRule: '.align-start { align-items: flex-start; }' },
  { regex: /align-items:\s*flex-end(\s*|;|})/, className: 'align-end', cssRule: '.align-end { align-items: flex-end; }' },
  { regex: /gap:\s*(\d+)px(\s*|;|})/, className: 'gap-$1', cssRule: '.gap-$1 { gap: $1px; }' },
  
  // Position
  { regex: /position:\s*relative(\s*|;|})/, className: 'position-relative', cssRule: '.position-relative { position: relative; }' },
  { regex: /position:\s*absolute(\s*|;|})/, className: 'position-absolute', cssRule: '.position-absolute { position: absolute; }' },
  { regex: /position:\s*fixed(\s*|;|})/, className: 'position-fixed', cssRule: '.position-fixed { position: fixed; }' },
  
  // Text alignment
  { regex: /text-align:\s*center(\s*|;|})/, className: 'text-center', cssRule: '.text-center { text-align: center; }' },
  { regex: /text-align:\s*left(\s*|;|})/, className: 'text-left', cssRule: '.text-left { text-align: left; }' },
  { regex: /text-align:\s*right(\s*|;|})/, className: 'text-right', cssRule: '.text-right { text-align: right; }' },
  
  // Borders
  { regex: /border:\s*none(\s*|;|})/, className: 'border-none', cssRule: '.border-none { border: none; }' },
  { regex: /border-radius:\s*(\d+)px(\s*|;|})/, className: 'border-radius-$1', cssRule: '.border-radius-$1 { border-radius: $1px; }' },
  
  // Fonts
  { regex: /font-weight:\s*bold(\s*|;|})/, className: 'font-bold', cssRule: '.font-bold { font-weight: bold; }' },
  { regex: /font-size:\s*(\d+)px(\s*|;|})/, className: 'font-size-$1', cssRule: '.font-size-$1 { font-size: $1px; }' },
];

// Add these patterns to the utilityPatterns array
const additionalPatterns = [
  // Overflow
  { regex: /overflow:\s*hidden(\s*|;|})/, className: 'overflow-hidden', cssRule: '.overflow-hidden { overflow: hidden; }' },
  { regex: /overflow:\s*auto(\s*|;|})/, className: 'overflow-auto', cssRule: '.overflow-auto { overflow: auto; }' },
  { regex: /overflow:\s*scroll(\s*|;|})/, className: 'overflow-scroll', cssRule: '.overflow-scroll { overflow: scroll; }' },
  { regex: /overflow-x:\s*hidden(\s*|;|})/, className: 'overflow-x-hidden', cssRule: '.overflow-x-hidden { overflow-x: hidden; }' },
  { regex: /overflow-y:\s*hidden(\s*|;|})/, className: 'overflow-y-hidden', cssRule: '.overflow-y-hidden { overflow-y: hidden; }' },
  { regex: /overflow-x:\s*auto(\s*|;|})/, className: 'overflow-x-auto', cssRule: '.overflow-x-auto { overflow-x: auto; }' },
  { regex: /overflow-y:\s*auto(\s*|;|})/, className: 'overflow-y-auto', cssRule: '.overflow-y-auto { overflow-y: auto; }' },
  { regex: /overflow-x:\s*scroll(\s*|;|})/, className: 'overflow-x-scroll', cssRule: '.overflow-x-scroll { overflow-x: scroll; }' },
  { regex: /overflow-y:\s*scroll(\s*|;|})/, className: 'overflow-y-scroll', cssRule: '.overflow-y-scroll { overflow-y: scroll; }' },
  
  // Display
  { regex: /display:\s*block(\s*|;|})/, className: 'display-block', cssRule: '.display-block { display: block; }' },
  { regex: /display:\s*inline-block(\s*|;|})/, className: 'display-inline-block', cssRule: '.display-inline-block { display: inline-block; }' },
  { regex: /display:\s*none(\s*|;|})/, className: 'display-none', cssRule: '.display-none { display: none; }' },
  
  // Cursor
  { regex: /cursor:\s*pointer(\s*|;|})/, className: 'cursor-pointer', cssRule: '.cursor-pointer { cursor: pointer; }' },
  { regex: /cursor:\s*not-allowed(\s*|;|})/, className: 'cursor-not-allowed', cssRule: '.cursor-not-allowed { cursor: not-allowed; }' },
  
  // Background
  { regex: /background:\s*transparent(\s*|;|})/, className: 'bg-transparent', cssRule: '.bg-transparent { background: transparent; }' },
  { regex: /background-color:\s*transparent(\s*|;|})/, className: 'bg-transparent', cssRule: '.bg-transparent { background-color: transparent; }' },
  
  // Z-index
  { regex: /z-index:\s*(\d+)(\s*|;|})/, className: 'z-index-$1', cssRule: '.z-index-$1 { z-index: $1; }' },
  
  // White space
  { regex: /white-space:\s*nowrap(\s*|;|})/, className: 'whitespace-nowrap', cssRule: '.whitespace-nowrap { white-space: nowrap; }' },
  { regex: /white-space:\s*pre(\s*|;|})/, className: 'whitespace-pre', cssRule: '.whitespace-pre { white-space: pre; }' },
  { regex: /white-space:\s*pre-line(\s*|;|})/, className: 'whitespace-pre-line', cssRule: '.whitespace-pre-line { white-space: pre-line; }' },
  { regex: /white-space:\s*pre-wrap(\s*|;|})/, className: 'whitespace-pre-wrap', cssRule: '.whitespace-pre-wrap { white-space: pre-wrap; }' },
  
  // Line height
  { regex: /line-height:\s*(\d+)px(\s*|;|})/, className: 'line-height-$1', cssRule: '.line-height-$1 { line-height: $1px; }' },
  
  // Text decoration
  { regex: /text-decoration:\s*none(\s*|;|})/, className: 'text-decoration-none', cssRule: '.text-decoration-none { text-decoration: none; }' },
  { regex: /text-decoration:\s*underline(\s*|;|})/, className: 'text-underline', cssRule: '.text-underline { text-decoration: underline; }' },
];

// Add the additional patterns to the utilityPatterns array
utilityPatterns.push(...additionalPatterns);

// Path to app.scss
const appScssPath = path.resolve('src/stylesheets/app.scss');

// Function to read app.scss and check if the utility classes already exist
function getExistingUtilityClasses() {
  if (!fs.existsSync(appScssPath)) {
    console.error(`Could not find app.scss at ${appScssPath}`);
    return [];
  }
  
  const content = fs.readFileSync(appScssPath, 'utf8');
  return utilityPatterns
    .map(pattern => {
      const className = pattern.className.replace(/\$\d+/g, '\\d+'); // Replace $1 with \d+ for regex
      const regex = new RegExp(`\\.${className}\\s*{`, 'g');
      return {
        pattern,
        exists: regex.test(content)
      };
    })
    .filter(item => item.exists)
    .map(item => item.pattern.className.replace(/\$\d+/g, '\\d+'));
}

// Collect all utility classes that need to be added
function collectUtilityClassesToAdd(files) {
  const classesToAdd = new Map();
  const existingClassPatterns = getExistingUtilityClasses();
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // Find inline styles
    const inlineStyleMatches = content.match(/style={{([^{}]+)}}/g);
    if (!inlineStyleMatches) return;
    
    inlineStyleMatches.forEach(inlineStyle => {
      const styleContent = inlineStyle.replace(/style={{|}}/g, '');
      
      utilityPatterns.forEach(pattern => {
        const matches = styleContent.match(pattern.regex);
        if (matches) {
          const existingClassPattern = existingClassPatterns.find(p => 
            new RegExp(`^${pattern.className.replace(/\$\d+/g, '\\d+')}$`).test(p)
          );
          
          if (!existingClassPattern) {
            // Extract values for captured groups if any
            const valueMatch = pattern.regex.exec(styleContent);
            let cssRule = pattern.cssRule;
            let className = pattern.className;
            
            if (valueMatch && valueMatch.length > 1) {
              for (let i = 1; i < valueMatch.length - 1; i++) {
                cssRule = cssRule.replace(`$${i}`, valueMatch[i]);
                className = className.replace(`$${i}`, valueMatch[i]);
              }
            }
            
            if (!classesToAdd.has(className)) {
              classesToAdd.set(className, cssRule);
            }
          }
        }
      });
    });
  });
  
  return classesToAdd;
}

// Update app.scss with new utility classes
function updateAppScss(classesToAdd) {
  if (!fs.existsSync(appScssPath)) {
    console.error(`Could not find app.scss at ${appScssPath}`);
    return;
  }
  
  let content = fs.readFileSync(appScssPath, 'utf8');
  
  // Add utility classes section if it doesn't exist
  if (!content.includes('/* Utility Classes */')) {
    content += '\n\n/* Utility Classes */\n';
  }
  
  // Add new utility classes
  classesToAdd.forEach((cssRule, className) => {
    if (!content.includes(cssRule)) {
      content += `${cssRule}\n`;
    }
  });
  
  fs.writeFileSync(appScssPath, content, 'utf8');
  console.log(`Added ${classesToAdd.size} utility classes to app.scss`);
}

// Replace inline styles with utility classes in components
function replaceInlineStylesWithClasses(files) {
  let totalReplacements = 0;
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    let newContent = content;
    let fileModified = false;
    
    // Find elements with style prop - more comprehensive pattern
    const stylePatterns = [
      // Regular pattern: className="..." style={{...}}
      { pattern: /className="([^"]*)"\s+style={{([^{}]+)}}/g, classFirst: true },
      // Reverse order: style={{...}} className="..."
      { pattern: /style={{([^{}]+)}}\s+className="([^"]*)"/g, classFirst: false },
      // Template string className: className={`...`} style={{...}}
      { pattern: /className={`([^`]*)`}\s+style={{([^{}]+)}}/g, classFirst: true },
      // Template string className reverse: style={{...}} className={`...`}
      { pattern: /style={{([^{}]+)}}\s+className={`([^`]*)`}/g, classFirst: false },
      // No className, just style: style={{...}}
      { pattern: /style={{([^{}]+)}}/g, classFirst: null },
    ];
    
    stylePatterns.forEach(({ pattern, classFirst }) => {
      let match;
      
      // Reset pattern's lastIndex if it's a global regex
      if (pattern.global) {
        pattern.lastIndex = 0;
      }
      
      // Use exec for stateful iteration through all matches
      while ((match = pattern.exec(newContent)) !== null) {
        let fullMatch = match[0];
        let existingClasses = classFirst ? match[1] : match[2];
        let inlineStyles = classFirst ? match[2] : match[1];
        
        // For the pattern that has no className
        if (classFirst === null) {
          inlineStyles = match[1];
          existingClasses = '';
        }
        
        let styleReplacement = inlineStyles;
        let newClasses = existingClasses || '';
        let styleChanged = false;
        
        // Check each utility pattern
        utilityPatterns.forEach(utilityPattern => {
          const styleMatches = inlineStyles.match(utilityPattern.regex);
          if (styleMatches) {
            // Extract values for captured groups if any
            const valueMatch = utilityPattern.regex.exec(inlineStyles);
            let className = utilityPattern.className;
            
            if (valueMatch && valueMatch.length > 1) {
              for (let i = 1; i < valueMatch.length - 1; i++) {
                className = className.replace(`$${i}`, valueMatch[i]);
              }
            }
            
            // Add the utility class
            newClasses = newClasses ? `${newClasses} ${className}` : className;
            
            // Remove the style property
            styleReplacement = styleReplacement.replace(styleMatches[0], '').trim();
            if (styleReplacement.endsWith(',')) {
              styleReplacement = styleReplacement.slice(0, -1);
            }
            
            styleChanged = true;
          }
        });
        
        // If we've applied utility classes
        if (styleChanged) {
          let replacement;
          
          // Determine which pattern to use for the replacement based on the original pattern
          if (classFirst === null) {
            // No className was present originally
            if (styleReplacement.trim()) {
              replacement = `className="${newClasses}" style={{${styleReplacement}}}`;
            } else {
              replacement = `className="${newClasses}"`;
            }
          } else if (classFirst) {
            // Original had className first
            if (styleReplacement.trim()) {
              // Using the same format as the original (template string or regular string)
              if (fullMatch.includes('{`')) {
                replacement = `className={\`${newClasses}\`} style={{${styleReplacement}}}`;
              } else {
                replacement = `className="${newClasses}" style={{${styleReplacement}}}`;
              }
            } else {
              if (fullMatch.includes('{`')) {
                replacement = `className={\`${newClasses}\`}`;
              } else {
                replacement = `className="${newClasses}"`;
              }
            }
          } else {
            // Original had style first
            if (styleReplacement.trim()) {
              if (fullMatch.includes('{`')) {
                replacement = `style={{${styleReplacement}}} className={\`${newClasses}\`}`;
              } else {
                replacement = `style={{${styleReplacement}}} className="${newClasses}"`;
              }
            } else {
              if (fullMatch.includes('{`')) {
                replacement = `className={\`${newClasses}\`}`;
              } else {
                replacement = `className="${newClasses}"`;
              }
            }
          }
          
          newContent = newContent.replace(fullMatch, replacement);
          fileModified = true;
          totalReplacements++;
        }
      }
    });
    
    // Write changes to file
    if (fileModified) {
      fs.writeFileSync(file, newContent, 'utf8');
      console.log(`Updated styles in ${file}`);
    }
  });
  
  return totalReplacements;
}

// Main execution
function main() {
  // Get all JSX and TSX files
  const files = glob.sync('src/**/*.{jsx,tsx}');
  
  // Collect utility classes to add
  const classesToAdd = collectUtilityClassesToAdd(files);
  
  // Update app.scss with new utility classes
  if (classesToAdd.size > 0) {
    updateAppScss(classesToAdd);
  }
  
  // Replace inline styles with utility classes
  const replacements = replaceInlineStylesWithClasses(files);
  
  console.log(`\nSummary:`);
  console.log(`Added ${classesToAdd.size} utility classes to app.scss`);
  console.log(`Made ${replacements} style replacements across all files`);
}

main(); 