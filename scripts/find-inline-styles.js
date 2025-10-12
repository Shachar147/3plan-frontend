const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all .jsx and .tsx files in the src directory
const files = glob.sync('src/**/*.{jsx,tsx}');

const findInlineStyles = (content, filename) => {
	// Basic regex to find style={{ ... }}
	const styleRegex = /style=\{\{([^{}]+)\}\}/g;

	const inlineStyles = [];
	let match;

	while ((match = styleRegex.exec(content)) !== null) {
		const styleContent = match[1].trim();
		const fullMatch = match[0];
		const lineNumber = (content.substring(0, match.index).match(/\n/g) || []).length + 1;

		// Try to identify non-dynamic styles (no variables or expressions)
		const isDynamic = /\${|[.()]/.test(styleContent);

		inlineStyles.push({
			line: lineNumber,
			style: fullMatch,
			content: styleContent,
			isDynamic: isDynamic,
		});
	}

	if (inlineStyles.length > 0) {
		return {
			file: filename,
			styles: inlineStyles,
		};
	}

	return null;
};

// Process each file
const results = files
	.map((file) => {
		const content = fs.readFileSync(file, 'utf8');
		return findInlineStyles(content, file);
	})
	.filter((result) => result !== null);

// Output results
console.log('Files with inline styles:');
results.forEach((result) => {
	console.log(`\n${result.file}:`);
	const staticStyles = result.styles.filter((style) => !style.isDynamic);
	const dynamicStyles = result.styles.filter((style) => style.isDynamic);

	if (staticStyles.length > 0) {
		console.log('  Static styles (candidates for extraction):');
		staticStyles.forEach((style) => {
			console.log(`    Line ${style.line}: ${style.content}`);
		});
	}

	if (dynamicStyles.length > 0) {
		console.log('  Dynamic styles (might need to remain inline):');
		dynamicStyles.forEach((style) => {
			console.log(`    Line ${style.line}: ${style.content}`);
		});
	}
});
