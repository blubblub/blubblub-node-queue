const { body, query } = require('express-validator');

function empty () {
    return [
        body('name').exists().withMessage('Queue name is required')
    ];
}

function stats () {
    return [
        query('name').exists().withMessage('Queue name is required')
    ];
}

function jobDetails () {
    return [
        query('name').exists().withMessage('Queue name is required'),
        query('id').exists().withMessage('Job ID is required')
    ];
}

function jobsByStatus () {
    return [
        query('name').exists().withMessage('Queue name is required'),
        query('status').isIn(['completed', 'failed', 'waiting', 'delayed', 'paused', 'stalled', 'active']).withMessage('Incorrect job status, please check the documentation about status types')
    ];
}

function clean () {
    return [
        body('status').isIn(['completed', 'wait', 'active', 'paused', 'delayed', 'failed']).withMessage('Incorrect job status, please check the documentation about status types'),
        body('name').exists().withMessage('Queue name is required'),
        body('grace').optional().toInt(),
        body('limit').optional().toInt()
    ];
}

function removeRepeatable () {
    return [
        body('name').exists().withMessage('Queue name is required'),
        body('method').optional(),
        body('key').optional(),
        body('config').optional()
    ];
}

function createRepeatable () {
    return [
        body('name').exists().withMessage('Queue name is required'),
        body('method').exists().withMessage('Method name is required'),
        body('repeatable').exists().withMessage('Repeatable options are required'),
        body('data').optional(),
        body('options').optional()
    ];
}

module.exports = {
    empty,
    stats,
    jobDetails,
    jobsByStatus,
    clean,
    removeRepeatable,
    createRepeatable
};
