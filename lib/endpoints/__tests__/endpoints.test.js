const endpoints = require('../index');
const queueService = require('../../service');
const validationMiddleware = require('../validationMiddleware');

const { validate } = require('../../utils');

const server = require('../../../test/server');
const utils = require('../../../test/utils');

const request = require('supertest');

describe('Endpoints', () => {
    describe('Router', () => {
        test('number of routes', () => {
            expect(endpoints.stack).toHaveLength(7);
        });
    });

    describe('GET Stats', () => {
        const validation = validate(validationMiddleware.stats());

        test('passes', async () => {
            const { req, res } = utils.createHttpMock('GET', { name: 'queue' });

            const response = await validation(req, res, () => res);

            expect(response.statusCode).toBe(200);
        });

        test('fails with name', async () => {
            const { req, res } = utils.createHttpMock();

            const response = await validation(req, res, () => res);

            expect(response.statusCode).toBe(422);

            const [error] = response._getJSONData().errors;

            expect(error.param).toBe('name');
        });
    });

    describe('GET Job details', () => {
        const validation = validate(validationMiddleware.jobDetails());

        test('passes', async () => {
            const { req, res } = utils.createHttpMock('GET', { id: 1, name: 'default' });

            const response = await validation(req, res, () => res);

            expect(response.statusCode).toBe(200);
        });

        test('empty data', async () => {
            const { req, res } = utils.createHttpMock('GET');

            const response = await validation(req, res, () => res);

            expect(response.statusCode).toBe(422);

            const errors = response._getJSONData().errors;

            expect(errors).toHaveLength(2);
        });

        test('missing name', async () => {
            const { req, res } = utils.createHttpMock('GET', { id: 1 });

            const response = await validation(req, res, () => res);

            expect(response.statusCode).toBe(422);

            const [error] = response._getJSONData().errors;

            expect(error.param).toBe('name');
        });

        test('missing id', async () => {
            const { req, res } = utils.createHttpMock('GET', { name: 'default' });

            const response = await validation(req, res, () => res);

            expect(response.statusCode).toBe(422);

            const [error] = response._getJSONData().errors;

            expect(error.param).toBe('id');
        });
    });

    describe('GET Jobs by type', () => {
        const validation = validate(validationMiddleware.jobsByStatus());

        test('passes', async () => {
            const { req, res } = utils.createHttpMock('GET', { status: 'completed', name: 'default' });

            const response = await validation(req, res, () => res);

            expect(response.statusCode).toBe(200);
        });

        test('empty data', async () => {
            const { req, res } = utils.createHttpMock('GET');

            const response = await validation(req, res, () => res);

            expect(response.statusCode).toBe(422);

            const errors = response._getJSONData().errors;

            expect(errors).toHaveLength(2);
        });

        test('missing name', async () => {
            const { req, res } = utils.createHttpMock('GET', { status: 'completed' });

            const response = await validation(req, res, () => res);

            expect(response.statusCode).toBe(422);

            const [error] = response._getJSONData().errors;

            expect(error.param).toBe('name');
        });

        test('missing status', async () => {
            const { req, res } = utils.createHttpMock('GET', { name: 'default' });

            const response = await validation(req, res, () => res);

            expect(response.statusCode).toBe(422);

            const [error] = response._getJSONData().errors;

            expect(error.param).toBe('status');
        });

        test('incorrect status', async () => {
            const { req, res } = utils.createHttpMock('GET', { name: 'default', status: 'not-existant' });

            const response = await validation(req, res, () => res);

            expect(response.statusCode).toBe(422);

            const [error] = response._getJSONData().errors;

            expect(error.param).toBe('status');
        });
    });

    describe('POST Empty', () => {
        const validation = validate(validationMiddleware.empty());

        test('passes', async () => {
            const { req, res } = utils.createHttpMock('POST', { name: 'default' }, 'body');

            const response = await validation(req, res, () => res);

            expect(response.statusCode).toBe(200);
        });

        test('empty data', async () => {
            const { req, res } = utils.createHttpMock('POST');

            const response = await validation(req, res, () => res);

            expect(response.statusCode).toBe(422);

            const errors = response._getJSONData().errors;

            expect(errors).toHaveLength(1);
        });

        test('missing name', async () => {
            const { req, res } = utils.createHttpMock('POST');

            const response = await validation(req, res, () => res);

            expect(response.statusCode).toBe(422);

            const [error] = response._getJSONData().errors;

            expect(error.param).toBe('name');
        });
    });

    describe('POST Clean', () => {
        const validation = validate(validationMiddleware.clean());

        test('passes', async () => {
            const { req, res } = await utils.createHttpMock('POST', {
                status: 'completed',
                name: 'default'
            }, 'body');

            const response = await validation(req, res, () => res);

            expect(response.statusCode).toBe(200);
        });

        test('casts to int', async () => {
            const { req, res } = await utils.createHttpMock('POST', {
                status: 'completed',
                name: 'default',
                limit: '5'
            }, 'body');

            expect(req.body.limit).toStrictEqual('5');

            await validation(req, res, (res) => res);

            expect(req.body.limit).toStrictEqual(5);
        });

        test('empty data', async () => {
            const { req, res } = utils.createHttpMock('POST');

            const response = await validation(req, res, () => res);

            expect(response.statusCode).toBe(422);

            const errors = response._getJSONData().errors;

            expect(errors).toHaveLength(2);
        });

        test('missing name', async () => {
            const { req, res } = utils.createHttpMock('POST', { status: 'active' }, 'body');

            const response = await validation(req, res, () => res);

            expect(response.statusCode).toBe(422);

            const [error] = response._getJSONData().errors;

            expect(error.param).toBe('name');
        });

        test('missing status', async () => {
            const { req, res } = utils.createHttpMock('POST', { name: 'default' }, 'body');

            const response = await validation(req, res, () => res);

            expect(response.statusCode).toBe(422);

            const [error] = response._getJSONData().errors;

            expect(error.param).toBe('status');
        });

        test('non existant status', async () => {
            const { req, res } = utils.createHttpMock('POST', { name: 'default', status: 'non-existant' }, 'body');

            const response = await validation(req, res, () => res);

            expect(response.statusCode).toBe(422);

            const [error] = response._getJSONData().errors;

            expect(error.param).toBe('status');
        });
    });

    describe('DELETE Remove repeatable', () => {
        const validation = validate(validationMiddleware.removeRepeatable());

        test('passes', async () => {
            const { req, res } = await utils.createHttpMock('DELETE', {
                name: 'default',
                key: 'key'
            }, 'body');

            const response = await validation(req, res, () => res);

            expect(response.statusCode).toBe(200);
        });

        test('empty data', async () => {
            const { req, res } = utils.createHttpMock('DELETE');

            const response = await validation(req, res, () => res);

            expect(response.statusCode).toBe(422);

            const errors = response._getJSONData().errors;

            expect(errors).toHaveLength(1);
        });

        test('missing name', async () => {
            const { req, res } = utils.createHttpMock('DELETE', { key: 'key' }, 'body');

            const response = await validation(req, res, () => res);

            expect(response.statusCode).toBe(422);

            const [error] = response._getJSONData().errors;

            expect(error.param).toBe('name');
        });
    });

    describe('POST Create repeatable', () => {
        const validation = validate(validationMiddleware.createRepeatable());

        test('passes', async () => {
            const { req, res } = await utils.createHttpMock('POST', {
                name: 'default',
                method: 'job',
                repeatable: {
                    cron: '0 * * * *'
                }
            }, 'body');

            const response = await validation(req, res, () => res);

            expect(response.statusCode).toBe(200);
        });

        test('empty data', async () => {
            const { req, res } = utils.createHttpMock('POST');

            const response = await validation(req, res, () => res);

            expect(response.statusCode).toBe(422);

            const errors = response._getJSONData().errors;

            expect(errors).toHaveLength(3);
        });

        test('missing name', async () => {
            const { req, res } = utils.createHttpMock('POST', {
                method: 'job',
                repeatable: { cron: '0 * * * *' }
            }, 'body');

            const response = await validation(req, res, () => res);

            expect(response.statusCode).toBe(422);

            const [error] = response._getJSONData().errors;

            expect(error.param).toBe('name');
        });

        test('missing method', async () => {
            const { req, res } = utils.createHttpMock('POST', {
                name: 'default',
                repeatable: { cron: '0 * * * *' }
            }, 'body');

            const response = await validation(req, res, () => res);

            expect(response.statusCode).toBe(422);

            const [error] = response._getJSONData().errors;

            expect(error.param).toBe('method');
        });

        test('missing repeatable options', async () => {
            const { req, res } = utils.createHttpMock('POST', {
                name: 'default',
                method: 'job'
            }, 'body');

            const response = await validation(req, res, () => res);

            expect(response.statusCode).toBe(422);

            const [error] = response._getJSONData().errors;

            expect(error.param).toBe('repeatable');
        });
    });

    describe('Controller', () => {
        beforeAll(async () => {
            return utils.setupQueues([{
                name: 'default'
            }]);
        });

        afterAll(async () => {
            return utils.cleanUpAndDisconnect();
        });

        describe('Stats', () => {
            test('GET 200', async () => {
                const response = await request(server).get('/queue/stats').query({ name: 'default' }).expect('Content-Type', /json/).expect(200);

                const result = await queueService.getJobCounts('default');

                expect(response.body).toStrictEqual(result);
            });

            test('GET 422', async () => {
                const response = await request(server).get('/queue/stats').expect('Content-Type', /json/).expect(422);

                expect(response.body.errors).toHaveLength(1);
            });

            test('GET 500', async () => {
                const response = await request(server).get('/queue/stats').query({ name: 'not-existant' }).expect('Content-Type', /json/).expect(500);

                expect(response.body.errors.app.msg).toContain('not initialized');
            });
        });

        describe('Empty', () => {
            beforeAll(async () => {
                await queueService.createJob('job', [1, 1]);
            });

            afterAll(async () => {
                await utils.cleanAll();
            });

            test('POST 200', async () => {
                const before = await queueService.getJobCounts('default');

                const response = await request(server).post('/queue/empty').send({ name: 'default' }).expect('Content-Type', /json/).expect(200);

                const after = await queueService.getJobCounts('default');

                expect(response.body).toStrictEqual({ status: 'success' });
                expect(before).not.toStrictEqual(after);
                expect(before.waiting).toStrictEqual(1);
                expect(after.waiting).toStrictEqual(0);
            });

            test('POST 422', async () => {
                const response = await request(server).post('/queue/empty').expect('Content-Type', /json/).expect(422);

                expect(response.body.errors).toHaveLength(1);
            });

            test('POST 500', async () => {
                const response = await request(server).post('/queue/empty').send({ name: 'not-existant' }).expect('Content-Type', /json/).expect(500);

                expect(response.body.errors.app.msg).toContain('not initialized');
            });
        });

        describe('Job details', () => {
            beforeAll(async () => {
                await queueService.createJob('job', [1, 1]);
            });

            afterAll(async () => {
                await utils.cleanAll();
            });

            test('GET 200', async () => {
                const response = await request(server).get('/queue/jobDetails').query({
                    name: 'default',
                    id: 1
                }).expect('Content-Type', /json/).expect(200);

                const job = await queueService.getJob(1, 'default');

                expect(response.body.id).toBe(job.id.toString());
                expect(response.body.data).toStrictEqual(job.data);
            });

            test('GET 200 - non existant job', async () => {
                const response = await request(server).get('/queue/jobDetails').query({
                    name: 'default',
                    id: 2
                }).expect('Content-Type', /json/).expect(200);

                const job = await queueService.getJob(2, 'default');

                expect(response.body).toStrictEqual(job);
                expect(response.body).toBeNull();
            });

            test('GET 422', async () => {
                const response = await request(server).get('/queue/jobDetails').expect('Content-Type', /json/).expect(422);

                expect(response.body.errors).toHaveLength(2);
            });

            test('GET 500', async () => {
                const response = await request(server).get('/queue/jobDetails').query({
                    name: 'not-existant',
                    id: 1
                }).expect('Content-Type', /json/).expect(500);

                expect(response.body.errors.app.msg).toContain('not initialized');
            });
        });

        describe('Jobs by status', () => {
            beforeAll(async () => {
                await queueService.createJob('job', [1, 1]);
            });

            afterAll(async () => {
                await utils.cleanAll();
            });

            test('GET 200', async () => {
                const response = await request(server).get('/queue/jobsByStatus').query({
                    name: 'default',
                    status: 'waiting'
                }).expect('Content-Type', /json/).expect(200);

                const waiting = await queueService.getJobs('default', 'waiting');

                expect(response.body).toHaveLength(waiting.length);
                expect(response.body[0].id).toBe(waiting[0].id.toString());
                expect(response.body[0].data).toStrictEqual(waiting[0].data);
            });

            test('GET 200 - empty status', async () => {
                const response = await request(server).get('/queue/jobsByStatus').query({
                    name: 'default',
                    status: 'active'
                }).expect('Content-Type', /json/).expect(200);

                const active = await queueService.getJobs('default', 'active');

                expect(response.body).toHaveLength(active.length);
            });

            test('GET 200 - not-existant status', async () => {
                const response = await request(server).get('/queue/jobsByStatus').query({
                    name: 'default',
                    status: 'active'
                }).expect('Content-Type', /json/).expect(200);

                const notExistant = await queueService.getJobs('default', 'not-existant');

                expect(response.body).toHaveLength(notExistant.length);
            });

            test('GET 422', async () => {
                const response = await request(server).get('/queue/jobsByStatus').expect('Content-Type', /json/).expect(422);

                expect(response.body.errors).toHaveLength(2);
            });

            test('GET 500', async () => {
                const response = await request(server).get('/queue/jobsByStatus').query({
                    name: 'not-existant',
                    status: 'waiting'
                }).expect('Content-Type', /json/).expect(500);

                expect(response.body.errors.app.msg).toContain('not initialized');
            });
        });

        describe('Clean', () => {
            beforeEach(async () => {
                await queueService.createJob('job', [1, 1]);
            });

            afterEach(async () => {
                await utils.cleanAll();
            });

            test('POST 200', async () => {
                const before = await queueService.getJobCounts('default');

                const response = await request(server).post('/queue/clean').send({
                    name: 'default',
                    status: 'wait'
                }).expect('Content-Type', /json/).expect(200);

                const after = await queueService.getJobCounts('default');

                expect(response.body).toStrictEqual({ status: 'success' });
                expect(before).not.toStrictEqual(after);
                expect(before.waiting).toStrictEqual(1);
                expect(after.waiting).toStrictEqual(0);
            });

            test('POST 200 - high grace', async () => {
                const before = await queueService.getJobCounts('default');

                const response = await request(server).post('/queue/clean').send({
                    name: 'default',
                    status: 'wait',
                    grace: 2000
                }).expect('Content-Type', /json/).expect(200);

                const after = await queueService.getJobCounts('default');

                expect(response.body).toStrictEqual({ status: 'success' });
                expect(before).toStrictEqual(after);
                expect(before.waiting).toStrictEqual(1);
                expect(after.waiting).toStrictEqual(1);
            });

            test('POST 200 - limit', async () => {
                await queueService.createJob('job', [2, 2]);

                const before = await queueService.getJobCounts('default');

                const response = await request(server).post('/queue/clean').send({
                    name: 'default',
                    status: 'wait',
                    limit: 1
                }).expect('Content-Type', /json/).expect(200);

                const after = await queueService.getJobCounts('default');

                expect(response.body).toStrictEqual({ status: 'success' });
                expect(before).not.toStrictEqual(after);
                expect(before.waiting).toStrictEqual(2);
                expect(after.waiting).toStrictEqual(1);
            });

            test('POST 422', async () => {
                const response = await request(server).post('/queue/clean').expect('Content-Type', /json/).expect(422);

                expect(response.body.errors).toHaveLength(2);
            });

            test('POST 500', async () => {
                const response = await request(server).post('/queue/clean').send({
                    name: 'not-existant',
                    status: 'wait'
                }).expect('Content-Type', /json/).expect(500);

                expect(response.body.errors.app.msg).toContain('not initialized');
            });
        });

        describe('Create repeatable', () => {
            afterAll(async () => {
                await utils.cleanAll();
            });

            test('POST 200', async () => {
                const before = await queueService.getJobCounts('default');

                const response = await request(server).post('/queue/createRepeatable').send({
                    name: 'default',
                    method: 'test',
                    repeatable: {
                        cron: '0 * * * *'
                    }
                }).expect('Content-Type', /json/).expect(200);

                const after = await queueService.getJobCounts('default');
                const repeatable = await queueService.getRepeatableJobs('default');

                expect(response.body).toStrictEqual({ status: 'success' });
                expect(before).not.toStrictEqual(after);
                expect(before.delayed).toStrictEqual(0);
                expect(after.delayed).toStrictEqual(1);
                expect(repeatable).toHaveLength(1);
            });

            test('POST 422', async () => {
                const response = await request(server).post('/queue/createRepeatable').expect('Content-Type', /json/).expect(422);

                expect(response.body.errors).toHaveLength(3);
            });

            test('POST 500', async () => {
                const response = await request(server).post('/queue/createRepeatable').send({
                    name: 'not-existant',
                    method: 'job',
                    repeatable: {
                        cron: '0 * * * *'
                    }
                }).expect('Content-Type', /json/).expect(500);

                expect(response.body.errors.app.msg).toContain('not initialized');
            });
        });

        describe('Remove repeatable', () => {
            beforeEach(async () => {
                await queueService.createJob('test', [1, 1], {
                    queue: 'default',
                    repeat: {
                        cron: '0 * * * *'
                    }
                });
            });

            afterEach(async () => {
                await utils.cleanAll();
            });

            test('POST 200 - config', async () => {
                const before = await queueService.getRepeatableJobs('default');

                const response = await request(server).delete('/queue/removeRepeatable').send({
                    name: 'default',
                    method: 'test',
                    config: {
                        cron: '0 * * * *'
                    }
                }).expect('Content-Type', /json/).expect(200);

                const after = await queueService.getRepeatableJobs('default');

                expect(response.body).toStrictEqual({ status: 'success' });
                expect(before).not.toStrictEqual(after);
                expect(before).toHaveLength(1);
                expect(after).toHaveLength(0);
            });

            test('POST 200 - by key', async () => {
                const before = await queueService.getRepeatableJobs('default');

                const response = await request(server).delete('/queue/removeRepeatable').send({
                    name: 'default',
                    key: before[0].key
                }).expect('Content-Type', /json/).expect(200);

                const after = await queueService.getRepeatableJobs('default');

                expect(response.body).toStrictEqual({ status: 'success' });
                expect(before).not.toStrictEqual(after);
                expect(before).toHaveLength(1);
                expect(after).toHaveLength(0);
            });

            test('POST 422', async () => {
                const response = await request(server).delete('/queue/removeRepeatable').expect('Content-Type', /json/).expect(422);

                expect(response.body.errors).toHaveLength(1);
            });

            test('POST 500', async () => {
                const response = await request(server).delete('/queue/removeRepeatable').send({
                    name: 'not-existant'
                }).expect('Content-Type', /json/).expect(500);

                expect(response.body.errors.app.msg).toContain('not initialized');
            });
        });
    });
});
