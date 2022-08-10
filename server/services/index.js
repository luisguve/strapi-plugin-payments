'use strict';

const stripe = require('./stripe');
const paypal = require('./paypal');
const orders = require('./orders')

module.exports = {
  stripe,
  paypal,
  orders
};
