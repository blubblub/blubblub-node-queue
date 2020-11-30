const consumer = require('./lib/consumer');
const endpoints = require('./lib/endpoints');
const service = require('./lib/service');

module.exports = {
    Consumer: consumer,
    Router: endpoints,
    Service: service
};
