const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all .jsx and .tsx files in the src directory
const files = glob.sync('src/**/*.{jsx,tsx}');

const findUnusedImports = (content, filename) => {
	// Extract imports
	const importRegex = /import\s+(?:{([^}]+)}|([^{}\s;]+))\s+from\s+['"]([^'"]+)['"]/g;
	const imports = [];

	let match;
	while ((match = importRegex.exec(content)) !== null) {
		// Either a named import (match[1]) or default import (match[2])
		const namedImports = match[1] ? match[1].split(',').map((i) => i.trim().split(' as ')[0].trim()) : [];
		const defaultImport = match[2] ? match[2].trim() : null;

		if (defaultImport) {
			imports.push(defaultImport);
		}

		namedImports.forEach((namedImport) => {
			if (namedImport && namedImport !== '') {
				imports.push(namedImport);
			}
		});
	}

	// Filter out common imports that might be used in JSX or indirectly
	imports.filter((imp) => imp !== 'React');

	// Check for usage in the file content
	const potentiallyUnused = imports.filter((importName) => {
		// Ignore import statements
		const contentWithoutImports = content.replace(/import.*?from.*?;/gs, '');

		// Check if the import name appears in the content
		return !new RegExp(`\\b${importName}\\b`).test(contentWithoutImports);
	});

	return {
		file: filename,
		potentiallyUnused,
	};
};

// Process each file
const results = files
	.map((file) => {
		const content = fs.readFileSync(file, 'utf8');
		return findUnusedImports(content, file);
	})
	.filter((result) => result.potentiallyUnused.length > 0);

// Output results
console.log('Potentially unused imports:');
results.forEach((result) => {
	console.log(`\n${result.file}:`);
	result.potentiallyUnused.forEach((unused) => {
		console.log(`  - ${unused}`);
	});
});
