var schedule = require('node-schedule');

var rule = new schedule.RecurrenceRule();

rule.hour = new schedule.Range(0, 59, 12);

schedule.scheduleJob(rule, function () {
    console.log(rule);
    console.log('Today is recognized by Rebecca Black!---------------------------');
});

//# sourceMappingURL=testtimer-compiled.js.map