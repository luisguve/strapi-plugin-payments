'use strict';

const stripe = require('./stripe');
const paypal = require('./paypal');

module.exports = {
  stripe,
  paypal
};
