function getHourRates(input) {
    let rates = input.rates;
    let hourRates = [];

    rates.forEach((rate) => {
        let hourOffset = 0;
        let rateEndHour = rate.to;

        if (rate.from > rate.to) {
            hourOffset = rate.to;
            rateEndHour = 24;
        }

        for (let i = rate.from - hourOffset; i < rateEndHour; i++) {
            hourRates[(i + hourOffset) % 24] = rate.value;
        }
    });
    return hourRates;
}

function makeSchedule(input, schedule, powerAvailable, devicesSorted, consumedEnergy, hourRates) {

    for (let i = 0; i < 24; i++) {
        schedule[i] = {}
        schedule[i].devices = [];
        powerAvailable[i] = input.maxPower;
    }

    let del = [];

    // find a place for devices with max duration
    devicesSorted.forEach((device, i) => {
        if (device.duration == 24) {
            let bestPlace = findBestPlace(schedule, device, hourRates, consumedEnergy, powerAvailable)

            if (bestPlace !== null) {
                // Push device in schedule
                for (let j = bestPlace; j < bestPlace + device.duration; j++) {
                    schedule[j % 24].devices.push(device.id);
                }
            } else {
                console.error('Not enough maxPower for these devices.');
                throw Error('Not enough maxPower for these devices.');
            }
            del.push(i);
        } else if (device.duration == 14 && device.mode == 'day') {
            let bestPlace = findBestPlace(schedule, device, hourRates, consumedEnergy, powerAvailable)

            if (bestPlace !== null) {
                // Push device in schedule
                for (let j = bestPlace; j < bestPlace + device.duration; j++) {
                    // console.warn(i);
                    schedule[j % 24].devices.push(device.id);
                }
            } else {
                console.error('Not enough maxPower for these devices.');
                throw Error('Not enough maxPower for these devices.');
            }
            del.push(i);
        } else if (device.duration == 10 && device.mode == 'night') {
            let bestPlace = findBestPlace(schedule, device, hourRates, consumedEnergy, powerAvailable)

            if (bestPlace !== null) {
                // Push device in schedule
                for (let j = bestPlace; j < bestPlace + device.duration; j++) {
                    schedule[j % 24].devices.push(device.id);
                }
            } else {
                console.error('Not enough maxPower for these devices.');
                throw Error('Not enough maxPower for these devices.');
            }
            del.push(i);
        }
    });

    // find a place for rest of devices
    devicesSorted.forEach((device, i) => {
        if (del.indexOf(i) != -1) {
            return;
        }

        let bestPlace = findBestPlace(schedule, device, hourRates, consumedEnergy, powerAvailable);

        if (bestPlace !== null) {
            // Push device in schedule
            for (let j = bestPlace; j < bestPlace + device.duration; j++) {
                schedule[j % 24].devices.push(device.id);
            }
        } else {
            console.error('Not enough maxPower for these devices.');
            throw Error('Not enough maxPower for these devices.')
        }
    });
    return schedule;
}

function findBestPlace(schedule, device, hourRates, consumedEnergy, powerAvailable) {
    let bestPlace = null,
        bestCost = Number.POSITIVE_INFINITY,
        offsetHour = 0,
        startHour = 0,
        endHour = 24;

    if (device.mode === "day")  {
        startHour = 7;
        endHour = 21 - device.duration + 1;
    } else if (device.mode === "night") {
        offsetHour = 7;
        startHour = 21 - offsetHour;
        endHour = 24 - device.duration + 1;
    }

    for (let i = startHour; i < endHour; i++) {
        let powerFlag = false;
        let placeCost = 0;
        for (let j = 0; j < device.duration; j++) {
            if (!isEnoughPower((i + j + offsetHour) % 24, device, powerAvailable)) {
                powerFlag = true;
            } else {
                placeCost += hourRates[(i + j + offsetHour) % 24];
            }
        }
        if (powerFlag) continue;

        if (placeCost < bestCost) {
            bestCost = placeCost;
            bestPlace = (i + offsetHour) % 24;
        }
    }

    for (let i = bestPlace; i <  bestPlace + device.duration; i++) {
        if(device.mode == 'night') {
            powerAvailable[i % 24] -= device.power;
        } else {
            powerAvailable[(i + offsetHour) % 24] -= device.power;
        }
    }

    consumedEnergy.devices[device.id] = parseFloat((bestCost * device.power / 1000).toFixed(3));
    consumedEnergy.value += consumedEnergy.devices[device.id];

    return bestPlace;
}

function isEnoughPower(i, device, powerAvailable) {
    let isEnoughPower = false;
    for (let j = i; j < i + device.duration; j++) {
        if (powerAvailable[i] >= device.power) {
            isEnoughPower = true;
        }
    }
    return isEnoughPower;
}

function makeOutput(input) {

    input = JSON.parse(input);
    let consumedEnergy = {},
        scheduleArray = [],
        powerAvailable = [];

    // sort by power descending
    let devicesSorted = input.devices.sort((a, b) => {
        return b.power - a.power;
    });

    // Hour rates array
    let hourRates = getHourRates(input);
    consumedEnergy.value = 0;
    consumedEnergy.devices = {};

    scheduleArray = makeSchedule(input, scheduleArray, powerAvailable, devicesSorted, consumedEnergy, hourRates);
    consumedEnergy.value = parseFloat(consumedEnergy.value.toFixed(3));

    // from array to object
    let schedule = scheduleArray.reduce(function(acc, cur, i) {
        acc[i] = cur;
        return acc;
    }, {});

    for (let key in schedule) {
        if (schedule.hasOwnProperty(key)) {
            schedule[key] = schedule[key].devices;
        }
    }

    let output = {
        schedule,
        consumedEnergy
    }

    return JSON.stringify(output);
}
