const express = require('express');
const router = express.Router();

const { async, validate } = require('../utils');

const validationMiddleware = require('./validationMiddleware');

const queueController = require('./controller');

router.route('/queue/empty').post(
    validate(validationMiddleware.empty()),
    async(queueController.empty)
);

router.route('/queue/stats').get(
    validate(validationMiddleware.stats()),
    async(queueController.stats)
);

router.route('/queue/jobDetails').get(
    validate(validationMiddleware.jobDetails()),
    async(queueController.jobDetails)
);

router.route('/queue/jobsByStatus').get(
    validate(validationMiddleware.jobsByStatus()),
    async(queueController.jobsByStatus)
);

router.route('/queue/clean').post(
    validate(validationMiddleware.clean()),
    async(queueController.clean)
);

router.route('/queue/removeRepeatable').delete(
    validate(validationMiddleware.removeRepeatable()),
    async(queueController.removeRepeatable)
);

router.route('/queue/createRepeatable').post(
    validate(validationMiddleware.createRepeatable()),
    async(queueController.createRepeatable)
);

module.exports = router;
