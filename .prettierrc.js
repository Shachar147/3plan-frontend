module.exports = {
	// Inherit from package.json config
	trailingComma: 'es5',
	tabWidth: 4,
	singleQuote: true,
	printWidth: 120,
	useTabs: true,

	// New rules to fix issues we've been addressing
	jsxBracketSameLine: false,
	bracketSameLine: false,
	jsxSingleQuote: false,
	bracketSpacing: true,

	// Rules to fix curly braces in className
	jsxCurlyNewline: { multiline: 'consistent', singleline: 'consistent' },

	// This will ensure proper direction styles
	endOfLine: 'lf',
};
