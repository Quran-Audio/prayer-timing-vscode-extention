// There is no power no might except from ALLAH
const vscode = require('vscode');
const MyViewProvider = require('./data.service');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	const myViewProvider = new MyViewProvider(context);
	vscode.window.registerTreeDataProvider('myView', myViewProvider);

	let refreshCommand = vscode.commands.registerCommand('prayer-timings.refresh', async () => {
		myViewProvider.refresh();
	});
	context.subscriptions.push(refreshCommand);

	let settingsCommand = vscode.commands.registerCommand('prayer-timings.settings', async () => {
		myViewProvider.settings();
	});
	context.subscriptions.push(settingsCommand);

	let settingsItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	settingsItem.command = 'prayer-timings.settings';
	settingsItem.text = '$(gear) Settings';
	settingsItem.tooltip = 'Open Extension Settings';
	settingsItem.show();
	context.subscriptions.push(settingsItem);


	let nextPrayerItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	nextPrayerItem.tooltip = 'Upcoming Salah';
	nextPrayerItem.show();
	context.subscriptions.push(nextPrayerItem);
	updateNextPrayer(context, myViewProvider,nextPrayerItem)


	fetchData(context, myViewProvider)
}

function updateNextPrayer(context, myViewProvider, nextPrayerItem) {
	const updateInterval = 1000 * 60; //Every Second
	const updateStatusBar = async () => {
		nextPrayerItem.text = await myViewProvider.getNextPrayerAlert();
	};
	const intervalId = setInterval(updateStatusBar, updateInterval);
	context.subscriptions.push({
		dispose: () => clearInterval(intervalId)
	});
}

function fetchData(context, myViewProvider) {
	const fetchInterval = 1000 * 60 * 60 * 12; // Every Twelve hours

	const fetchData = async () => {
		await myViewProvider.refresh()
	};
	const intervalId = setInterval(fetchData, fetchInterval);
	context.subscriptions.push({
		dispose: () => clearInterval(intervalId)
	});
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}
