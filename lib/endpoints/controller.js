const { matchedData } = require('express-validator');
const queueService = require('../service');

async function empty (req, res, next) {
    const validData = matchedData(req);

    await queueService.empty(validData.name);

    return res.json({
        status: 'success'
    });
}

async function stats (req, res, next) {
    const validData = matchedData(req);

    const result = await queueService.getJobCounts(validData.name);

    return res.json(result);
}

async function jobDetails (req, res, next) {
    const { id, name } = matchedData(req);

    const job = await queueService.getJob(id, name);

    return res.json(job);
}

async function jobsByStatus (req, res, next) {
    const { name, status } = matchedData(req);

    const jobs = await queueService.getJobs(name, status);

    return res.json(jobs);
}

async function clean (req, res, next) {
    const { grace, limit, status, name } = matchedData(req);

    await queueService.clean(name, grace || 0, status, limit);

    return res.json({
        status: 'success'
    });
}

async function removeRepeatable (req, res, next) {
    const { key, method, config, name } = matchedData(req);

    if (key) {
        await queueService.removeRepeatableByKey(name, key);

        return res.json({
            status: 'success'
        });
    }

    await queueService.removeRepeatable(name, method, config);

    return res.json({
        status: 'success'
    });
}

async function createRepeatable (req, res, next) {
    const { method, repeatable, name, options, data = [] } = matchedData(req);

    await createJob(method, data, {
        ...options,
        repeat: repeatable,
        queue: name
    });

    return res.json({
        status: 'success'
    });
}

async function createJob (method, data, options) {
    return queueService.createJob(method, data, options);
}

module.exports = {
    clean,
    createRepeatable,
    empty,
    jobDetails,
    jobsByStatus,
    removeRepeatable,
    stats
};
