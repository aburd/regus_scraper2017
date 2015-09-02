// declare necessary global variables
var request = require('request'),
	cheerio = require ('cheerio'),
	prices = [],
	links = [],
	floorNames = [];

	// this function scrapes the regus tokyo website for names and link information
	function getTokyoLinks(callback){

		// retrieve the body HTML document
		request('http://www.regus.co.jp/office-space/%E6%97%A5%E6%9C%AC/%E6%9D%B1%E4%BA%AC', function(error, response, body){
		
			// if everything is ok then proceed
			if(!error && response.statusCode == 200){

				var $ = cheerio.load(body);

				// load links into an array
				$('.more-info-link', 'div.results_cols').each( function(i, a){
					var link = $(this).attr('href');
					links.push(link);
				});

				// load the names into an array
				$('h3.centre-name', 'div.results-cell').each( function(i, h3){
					var floorName = $(this).text();
					floorNames.push(floorName);
				});

				// print that data
				console.log(links.length);
				console.log(floorNames.length);

			} else {
				console.log('There was an error retrieving the data.');
			}

			// execute callback (when this finishes loading then you can start to parse the price pages)
			callback && callback();
		});
		
	}

	function makeTokyoLinks(tokyoLinks, callback){

		var b;

		for(b=0;b<tokyoLinks.length;b++){
			
			tokyoLinks[b] = 'http://www.regus.co.jp' + tokyoLinks[b];
			
		}

		callback && callback();
	}

	function getTokyoPrice(tokyoLinks, tokyoPrices, callback){
		
		var priceHolder = [];
		var nameHolder = "";

		request(tokyoLinks, function(error, response, body){
			if(!error && response.statusCode == 200){
				var $ = cheerio.load(body);

				nameHolder = $('h1', '#ctl00_TopHeader_BocSearchTitle_pnlSubTitle').text();

				$('span.cost', 'div#services').each(function(i, span){

					priceHolder[i] = $(this).text();
					console.log(nameHolder);
					console.log(priceHolder.join());
					// tokyoPrices = priceHolder.join(' || ');

				});
				
			} else {
				console.log("There was an error retrieving the information.");
			}

		});


		callback && callback();	
	}


	function printData(tokyoLinks) {
		var i;
		for(i=0; i<tokyoLinks.length; i++){
			console.log(floorNames[i]);
			console.log(links[i]);
			console.log(prices[i]);
		}
	}

	function printer(floor, price, callback){
		console.log(floor);
		console.log(price);
	}

	getTokyoLinks( function(){
		makeTokyoLinks(links, function(){

			var i;
			for(i=0; i<links.length; i++){

				getTokyoPrice(links[i], prices[i], function(){

					//printer(floorNames[i], prices[i]);

				});

			}


		});
	});
