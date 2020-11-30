module.exports = fn => {
    return async (req, res, next) => {
        return fn(req, res, next).catch(next);
    };
};
