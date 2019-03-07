import {registerBidder} from 'src/adapters/bidderFactory';

const DEFAULT_BID_ENDPOINT = 'https://pbjs.ayads.co/bid';
const DEFAULT_NOTIFY_ENDPOINT = 'https://pbjs.ayads.co/notify';
const DEFAULT_SAC_HOST = 'sac.ayads.co';
const DEFAULT_MODE = 'promise';// longpolling, longpolling+sjs promise
const DEFAULT_ZONE_ID = 5;
const DEFAULT_CALLBACK_NAME = 'sublime_prebid_callback';
const OVERBID_ENABLED = true;

export const spec = {
  code: 'sublime',
  aliases: ['sskz', 'sublime-skinz'],

  /**
   * Determines whether or not the given bid request is valid.
   *
   * @param {BidRequest} bid The bid params to validate.
   * @return boolean True if this is a valid bid, and false otherwise.
   */
  isBidRequestValid: bid => {
    return !!bid.params.zoneId;
  },
  /**
   * Make a server request from the list of BidRequests.
   *
   * @return object ServerRequest Info describing the request to the server.
   * @param validBidRequests
   * @param bidderRequest
   * @param validBidRequests
   */
  buildRequests: (validBidRequests, bidderRequest) => {
    // <script src="//sac.ayads.co.local/sublime/14312/prebid?callback=testCallback"></script>
    let params = validBidRequests[0].params || {};
    let requestId = validBidRequests[0].bidId || '';
    let sacHost = params.sacHost || DEFAULT_SAC_HOST;
    let bidEndpoint = params.bidEndpoint || DEFAULT_BID_ENDPOINT;
    let notifyEndpoint = params.notifyEndpoint || DEFAULT_NOTIFY_ENDPOINT;
    let mode = params.mode || DEFAULT_MODE; // modes: longpolling longpolling+sjs instantresponse
    let zoneId = params.zoneId || DEFAULT_ZONE_ID;
    let callbackName = params.callbackName || DEFAULT_CALLBACK_NAME;

    // define JSONP callback
    if (mode === 'longpolling' || mode === 'longpolling+sjs') {
      window[callbackName] = function(response) {
        console.log('sublime callback', response);

        let xhr = new XMLHttpRequest();
        xhr.open('POST', notifyEndpoint, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.send(
          'notify=1' +
          '&request_id=' + encodeURIComponent(requestId) +
          '&ad=' + encodeURIComponent(response.ad || '') +
          '&cpm=' + encodeURIComponent(response.cpm || 0)
        );
      };
    }

    // invoke SJS
    if (mode === 'longpolling+sjs' || mode === 'promise') {
      let script = document.createElement('script');
      script.type = 'application/javascript';
      script.src = '//' + sacHost + '/sublime/' + zoneId + '/prebid?callback=' + callbackName;
      document.body.appendChild(script);
    }

    // promise return
    if (mode === 'promise') {
      return {
        method: 'PROMISE',
        promise: new Promise(resolve => {
          window[callbackName] = (response, reject) => {
            response.ad = 'Hello';
            response.cpm = 12;
            console.log('sublime callback', response);

            if (response.cpm && OVERBID_ENABLED) {
              response.cpm = window.overbid(response.cpm);
            }

            resolve({
              requestId,
              ad: response.ad,
              cpm: response.cpm
            });
          };
        })
      };
    }

    // standard return
    return {
      method: 'GET',
      url: bidEndpoint,
      data: {
        prebid: 1,
        mode,
        request_id: requestId
      }
    };
  },
  /**
   * Unpack the response from the server into a list of bids.
   *
   * @param serverResponse A successful response from the server.
   * @param bidRequest
   * @return {Bid[]} An array of bids which were nested inside the server.
   */
  interpretResponse: (serverResponse, bidRequest) => {
    const bidResponses = [];

    console.log('interpretResponse !!!!!', serverResponse);

    let body = serverResponse.body || {};

    const bidResponse = {
      requestId: serverResponse.requestId || body.request_id || '',
      cpm: serverResponse.cpm || serverResponse.body.cpm || 0,
      width: 1800,
      height: 1000,
      creativeId: 1,
      dealId: 1,
      currency: serverResponse.currency || body.currency || 'USD',
      netRevenue: true,
      ttl: 600,
      referrer: '',
      ad: serverResponse.ad || body.ad || ''
    };

    if (bidResponse.cpm) {
      bidResponses.push(bidResponse);
    }

    return bidResponses;
  },

  /**
   * Register the user sync pixels which should be dropped after the auction.
   *
   * @param  syncOptions Which user syncs are allowed?
   * @param serverResponses List of server's responses.
   * @return boolean user syncs which should be dropped.
   */
  getUserSyncs: (syncOptions, serverResponses) => {
    return false;
  }
};
registerBidder(spec);
