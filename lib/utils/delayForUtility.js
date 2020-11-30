module.exports = (settings = {}) => {
    let delay = 0;

    if (settings.years) {
        delay += settings.years * 365 * 60 * 60 * 24;
    }

    if (settings.months) {
        delay += settings.months * 30 * 60 * 60 * 24;
    }

    if (settings.days) {
        delay += settings.days * 60 * 60 * 24;
    }

    if (settings.hours) {
        delay += settings.hours * 60 * 60;
    }

    if (settings.minutes) {
        delay += settings.minutes * 60;
    }

    if (settings.seconds) {
        delay += settings.seconds;
    }

    return delay > 0 ? delay : 0;
};
