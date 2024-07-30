const vscode = require('vscode');

const CONFIG_ID = 'prayer-timings'

const getConfigValue = (key) => {
    const config = vscode.workspace.getConfiguration(CONFIG_ID);
    return config.get(key);
}

const setConfigValue = (key, value) => {
    const config = vscode.workspace.getConfiguration(CONFIG_ID);
    config.update(key, value, vscode.ConfigurationTarget.Global);
}

module.exports = { getConfigValue, setConfigValue }