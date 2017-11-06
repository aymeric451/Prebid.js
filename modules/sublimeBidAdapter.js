import {registerBidder} from 'src/adapters/bidderFactory';

const DEFAULT_BID_ENDPOINT = 'https://pbjs.virtua.io/longpolling/bid';
const DEFAULT_NOTIFY_ENDPOINT = 'https://pbjs.virtua.io/longpolling/notify';
const DEFAULT_SAC_HOST = 'sac.ayads.co';
const DEFAULT_MODE = 'longpolling+sjs';
const DEFAULT_ZONE_ID = 5;
const DEFAULT_CALLBACK_NAME = 'sublime_prebid_callback';

export const spec = {
  code: 'sublime',
  aliases: ['sskz', 'sublime-skinz'],

  /**
   * Determines whether or not the given bid request is valid.
   *
   * @param {BidRequest} bid The bid params to validate.
   * @return boolean True if this is a valid bid, and false otherwise.
   */
  isBidRequestValid: function(bid) {
    return !!bid.params.zoneId;
  },
  /**
   * Make a server request from the list of BidRequests.
   *
   * @return ServerRequest Info describing the request to the server.
   * @param validBidRequests
   */
  buildRequests: function (validBidRequests, bidderRequest) {
    // <script src="//sac.ayads.co.local/sublime/14312/prebid?callback=testCallback"></script>
    let params = validBidRequests[0].params || {};
    let requestId = validBidRequests[0].bidId || '';
    let sacHost = params.sacHost || DEFAULT_SAC_HOST;
    let bidEndpoint = params.bidEndpoint || DEFAULT_BID_ENDPOINT;
    let notifyEndpoint = params.notifyEndpoint || DEFAULT_NOTIFY_ENDPOINT;
    let mode = params.mode || DEFAULT_MODE; // modes: longpolling longpolling+sjs instantresponse
    let zoneId = params.zoneId || DEFAULT_ZONE_ID;
    let callbackName = params.callbackName || DEFAULT_CALLBACK_NAME;

    if (mode === 'longpolling' || mode === 'longpolling+sjs') {
      window[callbackName] = function(response) {
	      console.log('sublime callback', response);

	      var xhr=new XMLHttpRequest();
	      xhr.open('POST', notifyEndpoint, true);
	      xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
	      xhr.send(
          'notify=1' +
          '&request_id=' + encodeURIComponent(requestId) +
          '&ad=' + encodeURIComponent(response.ad || '') +
          '&cpm=' + encodeURIComponent(response.cpm || 0)
        );
      };

      if (mode === 'longpolling+sjs') {
        let script = document.createElement('script');
        script.type = 'application/javascript';
        script.src = '//' + sacHost + '/sublime/' + zoneId + '/prebid?callback=' + callbackName;
        document.body.appendChild(script);
      }
    }

    return {
      method: 'GET',
      url: bidEndpoint,
      data: {
        prebid: 1,
        mode,
        request_id: requestId,
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
  interpretResponse: function(serverResponse, bidRequest) {
    const bidResponses = [];

    const bidResponse = {
      requestId: serverResponse.body.request_id || '',
      cpm: serverResponse.body.cpm || 0,
      width: 1800,
      height: 1000,
      creativeId: 1,
      dealId: 1,
      currency: serverResponse.body.currency || 'USD',
      netRevenue: true,
      ttl: 600,
      referrer: '',
      ad: serverResponse.body.ad || '',
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
   * @return The user syncs which should be dropped.
   */
  getUserSyncs: function(syncOptions, serverResponses) {
    return false;
  },
};
registerBidder(spec);
