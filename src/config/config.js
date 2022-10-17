export function getServerAddress() {
    const mode = process.env.REACT_APP_MODE || process.env.STORYBOOK_APP_MODE;
    if (mode && mode.trim() === 'development'){
        return 'http://localhost:3000';
        // return 'https://triplan-server.herokuapp.com';
    } else {
        return 'https://triplan-server.herokuapp.com';
    }
}