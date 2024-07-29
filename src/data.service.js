const vscode = require('vscode');
const axios = require('axios')
const moment = require('moment');

class MyViewProvider {
    constructor(context) {
        this.context = context
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    getTreeItem(element) {
        return element;
    }

    getChildren(element) {
        if (element) {
            // If there is a parent element, return its children
            return Promise.resolve(element.children);
        } else {
            // If there is no parent element, return the root elements
            return Promise.resolve(this.getRootElements());
        }
    }
    
    async getRootElements() {
        const { timings, message } = await this.getPraryerTimings()
        if(!message) {
            const { timings: prayerInfo } = timings
            await this.context.globalState.update('todayPraryerTimings', JSON.stringify(timings.timings));
            return [
                new MyTreeItem(`🕑 Fajr [${prayerInfo['Fajr']}]`, []),
                new MyTreeItem(`🕑 Dhuhr [${prayerInfo['Dhuhr']}]`, []),
                new MyTreeItem(`🕑 Asr [${prayerInfo['Asr']}]`, []),
                new MyTreeItem(`🕑 Maghrib [${prayerInfo['Maghrib']}]`, []),
                new MyTreeItem(`🕑 Isha [${prayerInfo['Isha']}]`, [])
            ]
        }
        
    }

    async refresh() {
        this._onDidChangeTreeData.fire();
    }

    async settings() {
        await this.context.globalState.update('lattitudePraryerTimings', null);
        await this.context.globalState.update('longitudePraryerTimings', null);
        await this.getRootElements()
        this._onDidChangeTreeData.fire();
    }

    async getNextPrayerAlert() {
        try {
            const timings = JSON.parse(await this.context.globalState.get('todayPraryerTimings', {}))
            let hourAndMin = []

            for (const key in timings) {
                hourAndMin = timings[key]?.split(' ')
                if (this.inNowGreaterThan(hourAndMin?.[0]) === false) {
                    return `[${key}  ${timings[key]}]`
                }
            }
        } catch (error) {
            console.log(error)
        }
        return ''
    }

    parseTime(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return { hours, minutes };
    }

    inNowGreaterThan(time) {
        const now = new Date();
        const hour = now.getHours()
        const minute = now.getMinutes()

        const t1 = this.parseTime(`${hour}:${minute}`);
        const t2 = this.parseTime(time);

        if (t1.hours >= t2.hours) {
            return true;
        } else if (t1.hours < t2.hours) {
            return false;
        }
    }

    async getPraryerTimings() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        let latitude = this.context.globalState.get('lattitudePraryerTimings', null); //10.784703
        if (!latitude) {
            latitude = await vscode.window.showInputBox({
                placeHolder: 'Enter Latitude'
            })
            if (latitude) {
                await this.context.globalState.update('lattitudePraryerTimings', latitude);
            }
        }


        let longitude = this.context.globalState.get('longitudePraryerTimings', null); //76.653145
        if (!longitude) {
            longitude = await vscode.window.showInputBox({
                placeHolder: 'Enter Longitude'
            })
            if (longitude) {
                await this.context.globalState.update('longitudePraryerTimings', longitude);
            }
        }

        const formattedDate = moment().format('DD MMM YYYY');
        const url = `http://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${latitude}&longitude=${longitude}&method=4`

        try {
            const { data } = await axios.get(url);
            const timings = data?.data?.filter(item => item.date.readable == formattedDate)[0]
            return { timings }
        } catch (error) {
            return { timings: [], message: error.message }
        }
    }
}

class MyTreeItem extends vscode.TreeItem {
    constructor(label, children = []) {
        super(label);
        this.children = children;
    }
}

module.exports = MyViewProvider;
