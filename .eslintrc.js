module.exports = {
  extends: ['react-app', 'react-app/jest'],
  rules: {
    // Prevent unnecessary curly braces in JSX attributes
    'react/jsx-curly-brace-presence': [
      'error',
      {
        props: 'never',
        children: 'never',
        propElementValues: 'always'
      }
    ],
    
    // Remove unused imports
    'no-unused-vars': 'warn',
    
    // Enforce consistent direction in RTL components
    'react/style-prop-object': 'error'
  }
}; 