const validationMiddleware = require('../../endpoints/validationMiddleware');
const { delayFor, hasOwnProperty, validate } = require('../index');

const utils = require('../../../test/utils');

describe('Utilities', () => {
    describe('Delay for', () => {
        test('empty attribute', () => {
            expect(delayFor()).toBe(0);
        });

        test('years', () => {
            expect(delayFor({ years: 1 })).toBe(365 * 60 * 60 * 24);
        });

        test('months', () => {
            expect(delayFor({ months: 1 })).toBe(30 * 60 * 60 * 24);
        });

        test('days', () => {
            expect(delayFor({ days: 1 })).toBe(60 * 60 * 24);
        });

        test('hours', () => {
            expect(delayFor({ hours: 1 })).toBe(60 * 60);
        });

        test('minutes', () => {
            expect(delayFor({ minutes: 1 })).toBe(60);
        });

        test('seconds', () => {
            expect(delayFor({ seconds: 1 })).toBe(1);
        });

        test('negative', () => {
            expect(delayFor({ days: -1 })).toBe(0);
        });
    });

    describe('Has own property', () => {
        test('object has property', () => {
            expect(hasOwnProperty({ test: false }, 'test')).toBeTruthy();
        });

        test('object has no property', () => {
            expect(hasOwnProperty({ test: false }, 'no-property')).toBeFalsy();
        });

        test('with has own property attribute', () => {
            expect(hasOwnProperty({ hasOwnProperty: false }, 'hasOwnProperty')).toBeTruthy();
        });
    });

    describe('Validation middleware', () => {
        const validation = validate(validationMiddleware.stats());

        test('fails validation', async () => {
            const { req, res } = utils.createHttpMock();

            const response = await validation(req, res);

            expect(response.statusCode).toBe(422);

            const data = response._getJSONData();

            expect(response.statusCode).toBe(422);

            expect(data.errors).toHaveLength(1);

            const [error] = data.errors;

            expect(error).toHaveProperty('param');
            expect(error).toHaveProperty('msg');
            expect(error).toHaveProperty('location');

            expect(error.msg).toBe('Queue name is required');
        });

        test('fails multiple validations', async () => {
            const { req, res } = utils.createHttpMock('GET');

            const validation = validate(validationMiddleware.jobDetails());

            const response = await validation(req, res, () => res);

            expect(response.statusCode).toBe(422);
            expect(response._getJSONData().errors).toHaveLength(2);
        });

        test('passes validation', async () => {
            const { req, res } = utils.createHttpMock('GET', { name: 'default' });

            const response = await validation(req, res, () => res);

            expect(response.statusCode).toBe(200);
        });
    });
});
