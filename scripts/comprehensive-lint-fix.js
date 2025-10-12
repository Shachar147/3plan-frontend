const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const glob = require('glob');

// Get all JSX and TSX files
const files = glob.sync('src/**/*.{jsx,tsx}');

// Track statistics
let totalFixedFiles = 0;
let equalityOperatorsFixed = 0;
let hookDepsFixed = 0;
let unusedVarsRemoved = 0;

// Process each file
files.forEach((file) => {
	try {
		// Run ESLint to get warnings and errors
		const result = execSync(`npx eslint ${file} --quiet --format json`, { encoding: 'utf8' });

		// Parse the ESLint output
		const lintResults = JSON.parse(result);

		if (lintResults.length === 0 || lintResults[0].messages.length === 0) {
			return; // No issues to fix
		}

		// Group issues by type
		const eqeqIssues = lintResults[0].messages.filter((msg) => msg.ruleId === 'eqeqeq');
		const hookDepsIssues = lintResults[0].messages.filter((msg) => msg.ruleId === 'react-hooks/exhaustive-deps');
		const unusedVarsIssues = lintResults[0].messages.filter(
			(msg) => msg.ruleId === '@typescript-eslint/no-unused-vars' || msg.ruleId === 'no-unused-vars'
		);

		if (eqeqIssues.length === 0 && hookDepsIssues.length === 0 && unusedVarsIssues.length === 0) {
			return; // No issues we can fix automatically
		}

		// Read the file content
		let content = fs.readFileSync(file, 'utf8');
		let fileModified = false;

		// 1. Fix equality operators (== to === and != to !==)
		if (eqeqIssues.length > 0) {
			// Sort by position in descending order to avoid index shifting
			eqeqIssues.sort((a, b) => b.endColumn - a.endColumn || b.endLine - a.endLine);

			// Get the file content as lines
			const lines = content.split('\n');

			// Fix each issue
			eqeqIssues.forEach((issue) => {
				const line = lines[issue.line - 1];
				const newLine =
					line.substring(0, issue.column - 1) +
					(line.substring(issue.column - 1, issue.endColumn).includes('!=') ? '!==' : '===') +
					line.substring(issue.endColumn);

				lines[issue.line - 1] = newLine;
				equalityOperatorsFixed++;
				fileModified = true;
			});

			// Reconstruct the file content
			content = lines.join('\n');
		}

		// 2. Fix React Hook dependencies
		if (hookDepsIssues.length > 0) {
			// Implement a simple version - just add the suggested dependencies
			hookDepsIssues.forEach((issue) => {
				if (issue.suggestions && issue.suggestions.length > 0) {
					const suggestion = issue.suggestions[0];

					// Extract the fix range and text
					const fixRange = suggestion.fix.range;
					const fixText = suggestion.fix.text;

					// Calculate the position and apply the fix
					const startPos = getPositionFromIndex(content, fixRange[0]);
					const endPos = getPositionFromIndex(content, fixRange[1]);

					if (startPos && endPos) {
						const lines = content.split('\n');
						if (startPos.line === endPos.line) {
							// Single line fix
							const line = lines[startPos.line];
							lines[startPos.line] =
								line.substring(0, startPos.column) + fixText + line.substring(endPos.column);
						} else {
							// Multi-line fix
							lines[startPos.line] = lines[startPos.line].substring(0, startPos.column) + fixText;
							for (let i = startPos.line + 1; i <= endPos.line; i++) {
								lines[i] = '';
							}
						}
						content = lines.join('\n');
						hookDepsFixed++;
						fileModified = true;
					}
				}
			});
		}

		// 3. Fix unused variables
		if (unusedVarsIssues.length > 0) {
			// Get the import lines (simple approach)
			const lines = content.split('\n');
			const importLines = lines.filter((line) => line.trim().startsWith('import'));

			// For each unused variable, try to find and remove its import
			unusedVarsIssues.forEach((msg) => {
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
								content = content.replace(importLine, '');
								unusedVarsRemoved++;
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
								content = content.replace(importLine, newImport);
								unusedVarsRemoved++;
								fileModified = true;
							}
						}
					});
				}
			});
		}

		// Write the changes if we modified the file
		if (fileModified) {
			fs.writeFileSync(file, content, 'utf8');
			totalFixedFiles++;
			console.log(`Fixed issues in ${file}`);
		}
	} catch (error) {
		// Skip files that cause errors in ESLint
		if (!error.message.includes('AssertionError')) {
			console.error(`Error processing ${file}:`, error.message);
		}
	}
});

console.log(`\nSummary:`);
console.log(`Total files fixed: ${totalFixedFiles}`);
console.log(`Equality operators fixed: ${equalityOperatorsFixed}`);
console.log(`React Hook dependencies fixed: ${hookDepsFixed}`);
console.log(`Unused variables removed: ${unusedVarsRemoved}`);

// Helper function to convert a character index to line and column
function getPositionFromIndex(content, index) {
	const lines = content.substring(0, index).split('\n');
	if (lines.length === 0) return null;

	return {
		line: lines.length - 1,
		column: lines[lines.length - 1].length,
	};
}
