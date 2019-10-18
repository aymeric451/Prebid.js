import {config} from '../src/config';
import * as utils from '../src/utils';
import * as url from '../src/url';
import adapterManager from '../src/adapterManager.js';

const BIDDER_CODE = 'sublime';
const DEFAULT_CALLBACK_NAME = 'sublime_prebid_callback';
const DEFAULT_CURRENCY = 'EUR';
const DEFAULT_PROTOCOL = 'https';
const DEFAULT_SAC_HOST = 'sac.ayads.co';
const DEFAULT_TTL = 600;
const SUBLIME_ANTENNA = 'antenna.ayads.co';
const SUBLIME_VERSION = '0.5.0';

/**
 * Debug log message
 * @param {String} msg
 * @param {Object} obj
 */
function log(msg, obj) {
  utils.logInfo('SublimeBidAdapter - ' + msg, obj);
}

// Default state
const state = {
  zoneId: '',
  transactionId: ''
};

/**
 * Set a new state
 * @param {Object} value
 */
function setState(value) {
  Object.assign(state, value);
  log('State has been updated :', state);
}

/**
 * Send pixel to our debug endpoint
 * @param {string} eventName - Event name that will be send in the e= query string
 * @param {Boolean} isMandatoryPixel - If set to true, will always send the pixel
 */
function sendEvent(eventName, isMandatoryPixel = false) {
  let shoudSendPixel = (isMandatoryPixel || state.debug);
  let ts = Date.now();
  let eventObject = {
    t: ts,
    tse: ts,
    z: state.zoneId,
    e: eventName,
    src: 'pa',
    puid: state.transactionId,
    trId: state.transactionId,
    ver: SUBLIME_VERSION
  };

  if (shoudSendPixel) {
    log('Sending pixel for event: ' + eventName, eventObject);

    let queryString = url.formatQS(eventObject);
    utils.triggerPixel('https://' + SUBLIME_ANTENNA + '/?' + queryString);
  } else {
    log('Not sending pixel for event (use debug: true to send it): ' + eventName, eventObject);
  }
}

const adapter = {
  callBids: function(bidRequest, addBidResponse, done) {
    console.log('call bids', bidRequest);

    let bid = bidRequest.bids[0] || {};
    let callbackName = (bid.params.callbackName || DEFAULT_CALLBACK_NAME) + '_' + bid.params.zoneId;
    let sacHost = bid.params.sacHost || DEFAULT_SAC_HOST;

    setState({
      transactionId: bid.transactionId,
      zoneId: bid.params.zoneId,
      debug: bid.params.debug || false,
    });

    // Adding Sublime tag
    let script = document.createElement('script');
    script.type = 'application/javascript';
    script.src = DEFAULT_PROTOCOL + '://' + sacHost + '/sublime/' + bid.params.zoneId + '/prebid?callback=' + callbackName;
    document.body.appendChild(script);

    window[callbackName] = response => {
      sendEvent(response ? 'bid' : 'dnobid');
      sendEvent('dintres');
      addBidResponse(bid.adUnitCode, {
        bidderCode: BIDDER_CODE,
        requestId: bidRequest.bidderRequestId,
        adId: '123',
        id: '123',
        ad: response.ad,
        cpm: response.cpm,
        currency: response.currency || DEFAULT_CURRENCY,
        width: 300,
        height: 250,
        mediaType: 'bannner',
        creativeId: 1,
        dealId: 1,
        netRevenue: true,
        ttl: 600,
        referrer: '',
        getSize: function() { return this.width + 'x' + this.height; }
      }, bidRequest);
      done();
    };
  },
  onTimeout: (timeoutData) => {
    log('Timeout from adapter', timeoutData);
    sendEvent('dbidtimeout', true);
  },
};

adapterManager.registerBidAdapter(adapter, BIDDER_CODE);
