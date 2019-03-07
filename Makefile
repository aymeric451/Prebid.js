.PHONY: build

build:
	# cd ./Prebid.js && npm install && 
	./node_modules/gulp/bin/gulp.js build --modules=prebidServerBidAdapter,appnexusBidAdapter,improvedigitalBidAdapter,smartadserverBidAdapter,sublimeBidAdapter
	cp build/dist/prebid.js ../SublimePOC/pbjs/prebid.js
