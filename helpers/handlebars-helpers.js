const moment = require('moment');

module.exports = {
    select: function (selected, options) {
        return options.fn(this).replace(new RegExp(' value=\"' + selected + '\"'), '$&selected="selected"');
    },

    generateTime: function (date, format) {
        return moment(date).format(format);
    },

    ifEquality: function(id1, id2, opts) {
        if(id1 == id2) {
            return opts.fn(this);
        } else {
            return opts.inverse(this);
        }
    }
};