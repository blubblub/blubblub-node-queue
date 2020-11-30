const express = require('express');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(require('../lib/endpoints'));

app.use(function onError (err, req, res, next) {
    return res.status(500).json({
        errors: {
            app: { msg: err.message }
        }
    });
});

module.exports = app;
