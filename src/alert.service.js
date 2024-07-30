const vscode = require('vscode');

const calculateTimeUntil = (hour, minute) => {
    try {
        const now = new Date();
        let nextSix = new Date();
        nextSix.setHours(hour, minute, 0, 0);

        if (now.getTime() > nextSix.getTime()) {
            // If it's already past skip
            return -1
        }

        return nextSix.getTime() - now.getTime(); // Time in milliseconds
    } catch (error) { }
    return -1
};

const scheduleAlertAt = (waqthName, hourAndMinute) => {
    let tokens = hourAndMinute?.split(' ')
    tokens = tokens[0]?.split(':')
    const timeUntil = calculateTimeUntil(Number(tokens[0]), Number(tokens[1]));
    if (timeUntil < 0)
        return

    setTimeout(() => {
        vscode.window.showInformationMessage(`It is time for ${waqthName}`);
    }, timeUntil);
};

module.exports = { scheduleAlertAt }