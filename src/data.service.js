const vscode = require('vscode');
const axios = require('axios')
const moment = require('moment');
const {getConfigValue,setConfigValue} = require('./config.service')
const {scheduleAlertAt} = require('./alert.service')

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
        await this.getPraryerTimings()
        const todayTimimg = this.getTodaysTiming()
        if (todayTimimg) {
            const { timings: prayerInfo } = todayTimimg
            scheduleAlertAt('Fajr',prayerInfo['Fajr'])
            scheduleAlertAt('Dhuhr','8:33 ')
            scheduleAlertAt('Asr',prayerInfo['Asr'])
            scheduleAlertAt('Maghrib',prayerInfo['Maghrib'])
            scheduleAlertAt('Isha',prayerInfo['Isha'])

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
        const formattedDate = moment().format('DD MMM YYYY');
        let shouldFetchData = false

        let latitude = getConfigValue('latitude')
        if (!latitude) {
            latitude = await vscode.window.showInputBox({
                placeHolder: 'Enter Latitude'
            })
            if (latitude) {
                setConfigValue('latitude',latitude)
                shouldFetchData = true
            }
        }


        let longitude = getConfigValue('longitude')
        if (!longitude) {
            longitude = await vscode.window.showInputBox({
                placeHolder: 'Enter Longitude'
            })
            if (longitude) {
                setConfigValue('longitude',longitude)
                shouldFetchData = true
            }
        }

        if (shouldFetchData === false && !this.doWeHaveTodaysTimings()) {
            shouldFetchData = true
        }


        if (shouldFetchData === true) {
            await this.fetchPrayerTimings(year, month, latitude, longitude)
        }
    }

    doWeHaveTodaysTimings() {
        const todaysTimimg = this.getTodaysTiming()
        if (todaysTimimg) {
            return true
        } else {
            return false
        }
    }

    getTodaysTiming() {
        const formattedDate = moment().format('DD MMM YYYY');
        const thisMonthTimimg = JSON.parse(this.context.globalState.get('monthPraryerTimings', []))
        if (thisMonthTimimg) {
            return thisMonthTimimg?.filter(item => item?.date?.readable === formattedDate)?.[0]
        }
        return null
    }

    async fetchPrayerTimings(year, month, latitude, longitude) {
        const url = `http://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${latitude}&longitude=${longitude}&method=4`

        try {
            const { data } = await axios.get(url);
            const monthPrayerTimings = data?.data
            await this.context.globalState.update('monthPraryerTimings', JSON.stringify(monthPrayerTimings));
        } catch (error) {
            console.log(error.message);
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
