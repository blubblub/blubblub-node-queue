const consumer = require('../consumer');
const service = require('../service');

const utils = require('../../test/utils');

jest.mock('ioredis');

beforeEach(async () => {
    await utils.setupQueues([{
        name: 'queue'
    }, {
        name: 'default',
        defaultJobOptions: {
            test: 'test'
        }
    }]);
});

afterEach(async () => {
    await utils.cleanUpAndDisconnect(service);
});

describe('Queue Consumer', () => {
    test('Process defaults', async () => {
        consumer(service, {});

        expect(await service.getQueue('default').getWorkers()).toHaveLength(1);
    });

    test('Concurrency', async () => {
        await utils.setupQueues([{
            name: 'multiworker',
            metadata: {
                processNumber: 3
            }
        }]);

        jest.spyOn(service.getQueue('multiworker'), 'process');

        consumer(service, {});

        expect(service.getQueue('multiworker').process).toBeCalledTimes(1);
        expect(service.getQueue('multiworker').process).toBeCalledWith('*', 3, expect.any(Function));
    });
});
