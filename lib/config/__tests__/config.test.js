describe('Configurations test', () => {
    test('Default Queue', () => {
        const queue = require('../defaultQueues');

        expect(queue).toBeDefined();
        expect(queue).toHaveLength(1);
        expect(queue[0].name).toBe('default');
    });
});
