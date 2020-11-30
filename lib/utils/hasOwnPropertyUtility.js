module.exports = (object, attribute) => {
    return Object.prototype.hasOwnProperty.call(object, attribute);
};
