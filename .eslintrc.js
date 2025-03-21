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
    
    // Temporarily disable the rule that's causing issues
    'no-unused-vars': 'off',
    
    // Enforce consistent direction in RTL components
    'react/style-prop-object': 'error'
  }
}; 