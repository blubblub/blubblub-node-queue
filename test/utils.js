const expressValidator = require('express-validator');
const Redis = require('ioredis');
const mockHttp = require('node-mocks-http');

const queueService = require('../lib/service');

const DEFAULT_QUEUE_PREFIX = 'blubblub-node-queue-test';

let defaultClient;

const defaultQueueOptions = {
    prefix: DEFAULT_QUEUE_PREFIX,
    defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true
    }
};

async function setupQueues (queues, client) {
    return queueService.setup(client, queues.map(appendDefaultQueueOptions));
}

function appendDefaultQueueOptions (definition, options = {}) {
    return {
        ...defaultQueueOptions,
        ...definition,
        ...options
    };
}

async function cleanKeys (client) {
    defaultClient = new Redis();

    const callingClient = client || defaultClient;

    const keys = await callingClient.keys(`${DEFAULT_QUEUE_PREFIX}*`);

    const promises = [];

    for (const key of keys) {
        promises.push(callingClient.del(key));
    }

    await Promise.all(promises);

    await defaultClient.disconnect();
}

async function cleanAll () {
    await queueService.cleanAll();
    await cleanKeys();
}

async function cleanUp () {
    await queueService.clear();
    await cleanKeys();
}

async function cleanUpAndDisconnect () {
    await queueService.clearAndDisconnect();
    await cleanKeys();
}

async function sleep (milliseconds = 1000) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, milliseconds);
    });
}

function validationStub (done) {
    const req = {
        query: {},
        body: {},
        params: {},
        param (name) {
            return this.params[name];
        }
    };

    return expressValidator(req, {}, done(req));
}

function createHttpMock (method = 'GET', data = {}, location = 'query') {
    const request = mockHttp.createRequest({
        method,
        [location]: data
    });

    const response = mockHttp.createResponse();

    return { req: request, res: response };
}

module.exports = {
    cleanAll,
    cleanUp,
    cleanUpAndDisconnect,
    createHttpMock,
    setupQueues,
    sleep,
    validationStub
};
