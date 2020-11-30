const queueService = require('../service');

const utils = require('../../test/utils');

describe('Queue service', () => {
    beforeAll(async () => {
        return utils.setupQueues([{
            name: 'queue'
        }, {
            name: 'default',
            defaultJobOptions: {
                test: 'test'
            }
        }]);
    });

    afterEach(async () => {
        await utils.cleanAll();
    });

    afterAll(async () => {
        return utils.cleanUpAndDisconnect();
    });

    describe('Setup', () => {
        test('empty definitions', async () => {
            await queueService.setup();

            expect(queueService.queueDefinitions).toHaveLength(2);
        });

        test('override default queue', async () => {
            expect(queueService.queueDefinitions).toHaveLength(2);

            const queue = queueService.getQueue('default');

            expect(queue.name).toBe('default');
            expect(queue.defaultJobOptions).toEqual({
                test: 'test'
            });
        });

        test('setup new queue', async () => {
            await utils.setupQueues([{
                name: 'new-queue'
            }]);

            expect(queueService.queueDefinitions).toHaveLength(3);
        });
    });

    describe('Get queue', () => {
        test('succesfully', () => {
            const queue = queueService.getQueue('default');

            expect(queue).toBeDefined();
            expect(queue.name).toBe('default');
        });

        test('unsuccesfully', () => {
            expect(() => {
                queueService.getQueue('does-not-exists');
            }).toThrowError('not initialized');
        });

        test('by instance', () => {
            const queue = queueService.getQueue('default');
            const queueInstance = queueService.getQueue(queue);

            expect(queueInstance).toBeDefined();
            expect(queueInstance.name).toBe('default');
        });

        test('no queues', async () => {
            await utils.cleanUp();

            expect(() => {
                queueService.getQueue('default');
            }).toThrowError('No queues defined');

            await utils.setupQueues([{
                name: 'queue'
            }, {
                name: 'default',
                defaultJobOptions: {
                    test: 'test'
                }
            }]);
        });
    });

    describe('Create job', () => {
        test('default job', async () => {
            const job = await queueService.createJob('job', [1, 1]);

            expect(job.queue.name).toBe('default');
            expect(job.data.method).toBe('job');
            expect(job.data.arguments).toStrictEqual([1, 1]);
        });

        test('default job with specific queue', async () => {
            const job = await queueService.createJob('job', [1, 1], { queue: 'queue' });

            expect(job.queue.name).toBe('queue');
            expect(job.data.method).toBe('job');
            expect(job.data.arguments).toStrictEqual([1, 1]);
        });

        test('with job details', async () => {
            const job = await queueService.createJob('job', [1, 1], { queue: 'queue' });

            const jobs = await queueService.getJobs('queue');

            expect(jobs[0].data).toStrictEqual(job.data);
            expect(jobs[0].name).toStrictEqual(job.name);
            expect(jobs).toHaveLength(1);
        });

        test('in bulk', async () => {
            const result = await queueService.createJobsInBulk('default', [['first', [1, 1]], ['second', [2, 2]], ['third', [3, 3]]]);

            const jobs = await queueService.getJobs('default');

            expect(jobs).toHaveLength(3);
            expect(jobs[2].data).toStrictEqual(result[0].data);
            expect(jobs[1].data).toStrictEqual(result[1].data);
            expect(jobs[0].data).toStrictEqual(result[2].data);
        });
    });

    describe('Get jobs', () => {
        beforeEach(async () => {
            return queueService.createJob('job', [1, 1]);
        });

        afterEach(async () => {
            return utils.cleanAll();
        });

        test('for queue', async () => {
            const jobs = await queueService.getJobs('default');

            expect(jobs).toHaveLength(1);
        });

        test('waiting status', async () => {
            const jobs = await queueService.getJobs('default', 'waiting');

            expect(jobs).toHaveLength(1);
        });

        test('by status', async () => {
            const jobs = await queueService.getJobs('default', 'active');

            expect(jobs).toHaveLength(0);
        });

        test('by unexisting status', async () => { // TODO check for unexisting status
            const jobs = await queueService.getJobs('default', 'bad-type');

            expect(jobs).toHaveLength(0);
        });

        test('with array of statuses', async () => {
            const jobs = await queueService.getJobs('default', ['waiting', 'active']);

            expect(jobs).toBeDefined();
            expect(jobs).toHaveLength(1);
        });
    });

    describe('Get job', () => {
        beforeAll(async () => {
            return queueService.createJobsInBulk('default', [['name', [1, 1]], ['name', [1, 1]]]);
        });

        test('existing', async () => {
            const job = await queueService.getJob(2, 'default');

            expect(job).toBeDefined();
            expect(job.data.arguments).toStrictEqual([1, 1]);
        });

        test('unexisting', async () => {
            const job = await queueService.getJob(3, 'default');

            expect(job).toBeNull();
        });
    });

    describe('Get counts', () => {
        beforeEach(async () => {
            return queueService.createJobsInBulk('default', [['name', [1, 1]], ['name', [1, 1]]]);
        });

        test('all statuses', async () => {
            const statuses = await queueService.getJobCounts('default');

            expect(statuses).toBeDefined();
            expect(statuses).toBeInstanceOf(Object);
            expect(statuses.waiting).toBe(2);
            expect(statuses.active).toBe(0);
        });

        test('by status', async () => {
            const waiting = await queueService.getJobCounts('default', 'waiting');
            const active = await queueService.getJobCounts('default', 'active');

            expect(waiting).toBe(2);
            expect(active).toBe(0);
        });
    });

    describe('Clean', () => {
        beforeEach(async () => {
            return queueService.createJobsInBulk('default', [['name', [1, 1]], ['name', [2, 2]]]);
        });

        test('removes all', async () => {
            await queueService.clean('default', 0, 'wait');

            const jobs = await queueService.getJobs('default');

            expect(jobs).toHaveLength(0);
        });
    });

    describe('Get repeatable jobs', () => {
        beforeEach(async () => {
            return queueService.createJob('repeatable', [1, 1], {
                queue: 'default',
                repeat: {
                    cron: '0 * * * *'
                }
            });
        });

        test('get all repeatable jobs', async () => {
            const jobs = await queueService.getRepeatableJobs('default');

            expect(jobs).toBeDefined();
            expect(jobs).toHaveLength(1);
            expect(jobs[0].cron).toBe('0 * * * *');
        });

        test('get all repeatable jobs by status', async () => {
            const jobs = await queueService.getJobs('default', 'delayed');

            expect(jobs).toBeDefined();
            expect(jobs).toHaveLength(1);
            expect(jobs[0].opts.repeat.cron).toBe('0 * * * *');
        });
    });

    describe('Remove repeatable', () => {
        beforeEach(async () => {
            return queueService.createJob('repeatable', [1, 1], {
                queue: 'default',
                repeat: {
                    cron: '0 * * * *'
                }
            });
        });

        test('by repeat configuration', async () => {
            const jobs = await queueService.getRepeatableJobs('default');

            expect(jobs).toHaveLength(1);

            await queueService.removeRepeatable('default', 'repeatable', {
                cron: '0 * * * *'
            });

            const jobsAfterRemove = await queueService.getRepeatableJobs('default');

            expect(jobsAfterRemove).toHaveLength(0);
        });

        test('by key', async () => {
            const jobs = await queueService.getRepeatableJobs('default');

            expect(jobs).toHaveLength(1);

            await queueService.removeRepeatableByKey('default', jobs[0].key);

            const jobsAfterRemove = await queueService.getRepeatableJobs('default');

            expect(jobsAfterRemove).toHaveLength(0);
        });
    });

    describe('Extra tests', () => {
        test('Empty queue', async () => {
            await queueService.empty('default');
            const jobs = await queueService.getJobs('default');
            expect(jobs).toHaveLength(0);
        });

        test('Attach Listeners', () => {
            const listener = {
                event: 'complete',
                listener: jest.fn()
            };

            queueService.attachListeners('default', listener);

            expect(queueService.getQueue('default')._events).toHaveProperty('complete');
        });

        test('Prepare job Structure', () => {
            expect(queueService.prepareJobStructure('default', [])).toStrictEqual({
                name: 'default',
                data: {
                    arguments: [],
                    method: 'default'
                },
                opts: {}
            });
        });
    });

    describe('Delay for', () => {
        test('empty object', () => {
            expect(queueService.delayFor()).toBe(0);
        });

        test('negative number', () => {
            expect(queueService.delayFor({ seconds: -30 })).toBe(0);
        });

        test('positive number', () => {
            expect(queueService.delayFor({ seconds: 60 })).toBe(60000);
            expect(queueService.delayFor({ minutes: 2 })).toBe(120000);
        });
    });
});
