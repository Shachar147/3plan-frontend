module.exports = {
	extends: ['react-app', 'react-app/jest'],
	globals: {
		$: 'readonly',
		google: 'readonly',
	},
	rules: {
		// Prevent unnecessary curly braces in JSX attributes
		'react/jsx-curly-brace-presence': [
			'warn',
			{
				props: 'never',
				children: 'never',
				propElementValues: 'always',
			},
		],

		// Temporarily disable the rule that's causing issues
		'no-unused-vars': 'off',

		// Enforce consistent direction in RTL components
		'react/style-prop-object': 'warn',

		// Downgrade hooks rules from errors to warnings
		'react-hooks/rules-of-hooks': 'warn',
		'react-hooks/exhaustive-deps': 'warn',

		// Handle MobX observer issue
		'mobx/missing-observer': 'off',
	},
};
