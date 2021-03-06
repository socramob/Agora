'use strict';

var moment = require('moment-timezone');
var nconf = require('nconf');
var beans = nconf.get('beans');
var Renderer = beans.get('renderer');

function Addon(object) {
  this.state = object || {}; // this must be *the* object that is referenced by activity.addonInfos[memberId]
  return this;
}

Addon.prototype.fillFromUI = function (uiInputObject) {
  this.state.homeAddress = uiInputObject.homeAddress;
  this.state.billingAddress = uiInputObject.billingAddress;
  this.state.tShirtSize = uiInputObject.tShirtSize;
  this.state.roommate = uiInputObject.roommate;

  return this;
};

Addon.prototype.homeAddress = function () {
  return this.state.homeAddress;
};

Addon.prototype.homeAddressLines = function () {
  return this.state.homeAddress ? this.state.homeAddress.split('\n') : [];
};

Addon.prototype.billingAddress = function () {
  return this.state.billingAddress;
};

Addon.prototype.billingAddressLines = function () {
  return this.state.billingAddress ? this.state.billingAddress.split('\n') : [];
};

Addon.prototype.tShirtSize = function () {
  return this.state.tShirtSize;
};

Addon.prototype.roommate = function () {
  return this.state.roommate;
};

Addon.prototype.moneyTransferred = function () {
  return this.state.moneyTransferred;
};

Addon.prototype.creditCardPaid = function () {
  return this.state.creditCardPaid;
};

Addon.prototype.moneyTransferredMoment = function () {
  return this.state.moneyTransferred && moment(this.state.moneyTransferred);
};

Addon.prototype.creditCardPaidMoment = function () {
  return this.state.creditCardPaid && moment(this.state.creditCardPaid);
};

Addon.prototype.paymentReceivedMoment = function () {
  return this.state.paymentReceived && moment(this.state.paymentReceived);
};

Addon.prototype.paymentDone = function () {
  return !!(this.creditCardPaid() || this.moneyTransferred());
};

Addon.prototype.noteCreditCardPayment = function () {
  this.state.creditCardPaid = moment().toDate();
};

Addon.prototype.noteMoneyTransfer = function () {
  this.state.moneyTransferred = moment().toDate();
};

Addon.prototype.notePaymentReceived = function () {
  this.state.paymentReceived = moment().toDate();
};


function AddonConfig(object) {
  this.state = object || {}; // this must be *the* object that is referenced by activity.addOnInfos[memberId]
  return this;
}

AddonConfig.prototype.homeAddress = function () {
  return this.state.homeAddress;
};

AddonConfig.prototype.billingAddress = function () {
  return this.state.billingAddress;
};

AddonConfig.prototype.tShirtSize = function () {
  return this.state.tShirtSize;
};

AddonConfig.prototype.roommate = function () {
  return this.state.roommate;
};

AddonConfig.prototype.addonInformation = function () {
  return this.state.addonInformation || '';
};

AddonConfig.prototype.addonInformationHTML = function () {
  return Renderer.render(this.addonInformation());
};

AddonConfig.prototype.deposit = function () {
  return this.state.deposit; // net amount
};

module.exports.Addon = Addon;
module.exports.AddonConfig = AddonConfig;
