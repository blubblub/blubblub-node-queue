const Queue = require('bull');
const Ioredis = require('ioredis');

const { delayFor: delay, hasOwnProperty } = require('./utils');
const defaultQueueDefinitions = require('./config/defaultQueues');

let queues = {};
let queueDefinitions = [];

let client, subscriber, connection;

async function setup (redisConnection, definitions = []) {
    connection = redisConnection;

    if (!client) {
        client = new Ioredis(connection);
    }

    if (!subscriber) {
        subscriber = new Ioredis(connection);
    }

    const promises = [];

    definitions.forEach(definition => {
        if (hasOwnProperty(queues, definition.name)) {
            return;
        }
        promises.push(registerQueue(definition));
    });

    defaultQueueDefinitions.forEach(definition => {
        if (hasOwnProperty(queues, definition.name)) {
            return;
        }
        promises.push(registerQueue(definition));
    });

    return Promise.all(promises);
}

async function registerQueue (definition) {
    queueDefinitions.push(definition);

    let queue;
    const { name, ...options } = definition;

    queues[name] = queue = new Queue(name, {
        redis: connection,
        createClient: function (type) {
            switch (type) {
            case 'client':
                return client;
            case 'subscriber':
                return subscriber;
            default:
                return new Ioredis(connection);
            }
        },
        ...options
    });

    return queue.isReady();
}

function attachListeners (queueName, listeners) {
    const queue = getQueue(queueName);

    if (!Array.isArray(listeners)) {
        listeners = [listeners];
    }

    listeners.forEach(({ event, listener }) => {
        queue.on(event, listener);
    });
}

function prepareJobStructure (name, data, options = {}) {
    return {
        name,
        data: {
            arguments: data,
            method: name
        },
        opts: options
    };
}

async function createJobsInBulk (queueName, jobs) {
    jobs = jobs.map(job => {
        return prepareJobStructure(...job);
    });

    return getQueue(queueName).addBulk(jobs);
}

async function createJob (jobName, args, opts = {}) {
    const { name, data, opts: options } = prepareJobStructure(jobName, args, opts);

    const onQueue = options.queue || 'default';
    delete options.queue;

    return getQueue(onQueue).add(name, data, options);
}

async function getJobs (queue, type = 'waiting') {
    return getQueue(queue).getJobs(type);
}

async function getJobCounts (queue, type) {
    const counts = await getQueue(queue).getJobCounts();

    if (type && hasOwnProperty(counts, type)) {
        return counts[type];
    }

    return counts;
}

async function getJob (id, queue) {
    return getQueue(queue).getJob(id);
}

async function clean (queueName, milliseconds, type, limit) {
    return getQueue(queueName).clean(milliseconds, type, limit);
}

async function close (queueName) {
    return getQueue(queueName).close();
}

async function closeAndClean (queueName) {
    await empty(queueName);
    await clean(queueName, 0);
    return close(queueName);
}

async function empty (queue) {
    await clean(queue, 0, 'completed');
    await clean(queue, 0, 'failed');
    return getQueue(queue).empty();
}

async function getRepeatableJobs (queueName, start, end) {
    return getQueue(queueName).getRepeatableJobs(start, end);
}

async function removeRepeatable (queueName, jobName, repetable) {
    return getQueue(queueName).removeRepeatable(jobName, repetable);
}

async function removeRepeatableByKey (queueName, key) {
    return getQueue(queueName).removeRepeatableByKey(key);
}

function delayFor (settings = {}) {
    return delay(settings) * 1000;
}

function getQueue (queue) {
    if (!queues || Object.keys(queues).length === 0) {
        throw new Error('No queues defined, please make sure that the queue is setup properly!');
    }

    if (queue instanceof Queue) {
        return queue;
    }

    if (!hasOwnProperty(queues, queue)) {
        throw new Error('Requested queue not initialized');
    }

    return queues[queue];
}

async function cleanAll () {
    await Promise.all(
        Object.keys(queues).map(queue => empty(queue))
    );
}

async function clear () {
    await Promise.all(
        Object.keys(queues).map(queue => closeAndClean(queue))
    );

    queues = {};
    queueDefinitions = [];
}

async function clearAndDisconnect () {
    await clear();

    await client.quit();
    await subscriber.quit();
}

module.exports = {
    attachListeners,
    clean,
    cleanAll,
    clear,
    clearAndDisconnect,
    createJob,
    createJobsInBulk,
    delayFor,
    empty,
    getJob,
    getJobCounts,
    getJobs,
    getRepeatableJobs,
    getQueue,
    prepareJobStructure,
    queueDefinitions,
    removeRepeatable,
    removeRepeatableByKey,
    setup
};
