import {expect} from 'chai';
import {spec} from 'modules/sublimeBidAdapter';
import {newBidder} from 'src/adapters/bidderFactory';

const ENDPOINT = '//ib.adnxs.com/ut/v3/prebid';

describe('SublimeAdapter', () => {
  const adapter = newBidder(spec);

  describe('inherited functions', () => {
    it('exists and is a function', () => {
      expect(adapter.callBids).to.exist.and.to.be.a('function');
    });
  });

  describe('isBidRequestValid', () => {
    let bid = {
      bidder: 'sublime',
      params: {
        zoneId: 14312,
        endpoint: 'http://ay-sskz.virtua.io/SublimePOC/pbjs/endpoint.php',
        sacHost: 'sac.ayads.co.local',
      },
    };

    it('should return true when required params found', () => {
      expect(spec.isBidRequestValid(bid)).to.equal(true);
    });

    it('should return true when required params found', () => {
      let bid = Object.assign({}, bid);
      delete bid.params;
      bid.params = {
        'zoneId': 1234,
      };

      expect(spec.isBidRequestValid(bid)).to.equal(true);
    });

    it('should return false when required params are not passed', () => {
      let bid = Object.assign({}, bid);
      delete bid.params;
      bid.params = {
        'zoneId': 0,
      };
      expect(spec.isBidRequestValid(bid)).to.equal(false);
    });
  });

  describe('buildRequests', () => {
    let bidRequests = [
      {
        bidder: 'sublime',
        params: {
          zoneId: 14312,
          endpoint: 'http://ay-sskz.virtua.io/SublimePOC/pbjs/endpoint.php',
          sacHost: 'sac.ayads.co.local',
          mode: 'instantresponse',
        },
        adUnitCode: 'adunit-code',
        sizes: [[300, 250], [300, 600]],
        bidId: '30b31c1838de1e',
        bidderRequestId: '22edbae2733bf6',
        auctionId: '1d1a030790a475',
      },
    ];

    it('should have a get method', () => {
      expect(spec.buildRequests(bidRequests).method).to.equal('GET');
    });
  });

  describe('interpretResponse', () => {
    let response = {
      'request_id': '3db3773286ee59',
      'cpm': 0.5,
      'ad': '<!-- Creative -->',
    };

    it('should get correct bid response', () => {
      let expectedResponse = [
        {
          requestId: '',
          cpm: 0,
          width: 1800,
          height: 1000,
          creativeId: 1,
          dealId: 1,
          currency: 'USD',
          netRevenue: true,
          ttl: 600,
          referrer: '',
          ad: '',
        },
      ];
      let bidderRequest;
      let result = spec.interpretResponse({body: response}, {bidderRequest});
      expect(Object.keys(result[0]))
        .to
        .have
        .members(Object.keys(expectedResponse[0]));
    });

    it('handles nobid responses', () => {
      let response = {
        request_id: '2f712657a184bc',
        cpm: 0,
        ad: '',
      };
      let bidderRequest;

      let result = spec.interpretResponse({body: response}, {bidderRequest});
      expect(result.length).to.equal(0);
    });
  });
});
