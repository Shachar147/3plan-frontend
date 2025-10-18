const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all .jsx and .tsx files in the src directory
const files = glob.sync('src/**/*.{jsx,tsx}');

// Regex to find inline styles
const inlineStyleRegex = /style\s*=\s*\{\s*\{([^{}]+)\}\s*\}/g;

// Threshold for reporting (number of inline styles in a file)
const REPORT_THRESHOLD = 3;

// Store results
const filesWithInlineStyles = [];

// Process each file
files.forEach((file) => {
	const content = fs.readFileSync(file, 'utf8');

	// Find all inline styles
	const matches = [];
	let match;

	// Reset regex lastIndex
	inlineStyleRegex.lastIndex = 0;

	while ((match = inlineStyleRegex.exec(content)) !== null) {
		matches.push({
			full: match[0],
			styles: match[1],
			index: match.index,
		});
	}

	if (matches.length >= REPORT_THRESHOLD) {
		// Get the component name from the file path
		const componentName = path.basename(file, path.extname(file));

		// Get the directory path to suggest where to create the .scss file
		const dirPath = path.dirname(file);
		const scssFilePath = path.join(dirPath, `${componentName.toLowerCase()}.scss`);

		filesWithInlineStyles.push({
			file,
			componentName,
			styleCount: matches.length,
			suggestedScssFile: scssFilePath,
			hasExistingScssFile: fs.existsSync(scssFilePath),
			inlineStyles: matches,
		});
	}
});

// Sort by number of inline styles (descending)
filesWithInlineStyles.sort((a, b) => b.styleCount - a.styleCount);

// Display results
console.log('Components with excessive inline styles:');
console.log('---------------------------------------');

filesWithInlineStyles.forEach((item) => {
	console.log(`\n${item.file} (${item.styleCount} inline styles)`);
	console.log(`Component: ${item.componentName}`);

	if (item.hasExistingScssFile) {
		console.log(`SCSS file already exists: ${item.suggestedScssFile}`);
	} else {
		console.log(`Suggested SCSS file: ${item.suggestedScssFile}`);
	}

	console.log('First few inline styles:');
	item.inlineStyles.slice(0, 3).forEach((style, index) => {
		console.log(`  ${index + 1}. ${style.styles.trim()}`);
	});

	if (item.inlineStyles.length > 3) {
		console.log(`  ... and ${item.inlineStyles.length - 3} more`);
	}
});

console.log(`\nTotal: ${filesWithInlineStyles.length} components with excessive inline styles`);
console.log('\nTo extract these styles to SCSS:');
console.log("1. Create the suggested SCSS file if it doesn't exist");
console.log('2. Import the SCSS file in your component');
console.log('3. Convert inline styles to class-based styles in SCSS');
console.log('4. Replace style={{...}} with className="..."');
