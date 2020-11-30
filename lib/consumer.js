async function processor (job, operations) {
    const { data: { method, arguments: args } } = job;

    return operations?.[method](job, ...args);
}

function processJobs (queueService, operations) {
    queueService.queueDefinitions.forEach(definition => {
        queueService.getQueue(definition.name).process(definition?.metadata?.processName ?? '*', definition?.metadata?.processNumber ?? process.env.WEB_CONCURRENCY ?? 1, async job => {
            return processor(job, operations);
        });
    });
}

module.exports = processJobs;
