const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const glob = require('glob');

// Get all JSX and TSX files
const files = glob.sync('src/**/*.{jsx,tsx}');

let totalFixedFiles = 0;

// Process each file
files.forEach((file) => {
	try {
		// Run ESLint to check for unused imports
		const result = execSync(`npx eslint ${file} --quiet --format json`, { encoding: 'utf8' });

		// Parse the ESLint output
		const lintResults = JSON.parse(result);

		// Check if there are any unused vars warnings
		const unusedVarsMessages =
			lintResults.length > 0
				? lintResults[0].messages.filter(
						(msg) => msg.ruleId === '@typescript-eslint/no-unused-vars' || msg.ruleId === 'no-unused-vars'
				  )
				: [];

		if (unusedVarsMessages.length > 0) {
			// Get the file content
			const content = fs.readFileSync(file, 'utf8');

			// Get the import lines (simple approach)
			const lines = content.split('\n');
			const importLines = lines.filter((line) => line.trim().startsWith('import'));

			// Track if we need to modify the file
			let fileModified = false;
			let newContent = content;

			// For each unused variable, try to find and remove its import
			unusedVarsMessages.forEach((msg) => {
				const unusedVar = msg.message.split("'")[1]; // Extract variable name from message

				if (unusedVar) {
					// Look for the import line that contains this variable
					importLines.forEach((importLine) => {
						// Match the variable in the import statement
						if (
							importLine.includes(` ${unusedVar}`) ||
							importLine.includes(`{${unusedVar}}`) ||
							importLine.includes(`{ ${unusedVar} }`) ||
							importLine.includes(`{${unusedVar}, `) ||
							importLine.includes(`, ${unusedVar}}`) ||
							importLine.includes(`, ${unusedVar}, `)
						) {
							// Simple case: it's the only imported thing (e.g., import { unusedVar } from '...')
							if (
								(importLine.includes(`{ ${unusedVar} }`) ||
									importLine.includes(`{${unusedVar}}`) ||
									importLine.includes(`import ${unusedVar} from`)) &&
								!importLine.includes(',')
							) {
								// Remove the whole line
								newContent = newContent.replace(importLine, '');
								fileModified = true;
							}
							// It's part of a destructured import (e.g., import { used, unusedVar, other } from '...')
							else if (importLine.includes('{')) {
								// Remove just this variable from the destructured import
								let newImport = importLine;

								// Handle different cases
								newImport = newImport.replace(`, ${unusedVar},`, ','); // Middle with spaces
								newImport = newImport.replace(`,${unusedVar},`, ','); // Middle without spaces
								newImport = newImport.replace(` ${unusedVar}, `, ' '); // Start with spaces
								newImport = newImport.replace(`${unusedVar}, `, ''); // Start without trailing space
								newImport = newImport.replace(`, ${unusedVar} `, ' '); // End with spaces
								newImport = newImport.replace(`, ${unusedVar}`, ''); // End without trailing space

								// Replace the old import with the new one
								newContent = newContent.replace(importLine, newImport);
								fileModified = true;
							}
						}
					});
				}
			});

			// Write the changes if we modified the file
			if (fileModified) {
				fs.writeFileSync(file, newContent, 'utf8');
				totalFixedFiles++;
				console.log(`Fixed unused imports in ${file}`);
			}
		}
	} catch (error) {
		// Skip files that cause errors in ESLint
		if (!error.message.includes('AssertionError')) {
			console.error(`Error processing ${file}:`, error.message);
		}
	}
});

console.log(`\nTotal files fixed: ${totalFixedFiles}`);
