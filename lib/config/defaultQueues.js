module.exports = [{
    name: 'default',
    options: {
        defaultJobOptions: {
            removeOnComplete: true,
            removeOnFail: true,
            attempts: 4,
            backoff: {
                type: 'exponential',
                delay: 500
            }
        }
    }
}];
