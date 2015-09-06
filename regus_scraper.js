'use strict';

// declare necessary global variables
var request = require('request'),
	cheerio = require ('cheerio'),
	forEachAsync = require('foreachasync').forEachAsync;

var	prices = [],
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
					var link = 'http://www.regus.co.jp' + $(this).attr('href');
					links.push(link);
				});

				// load the names into an array
				$('h3.centre-name', 'div.results-cell').each( function(i, h3){
					var floorName = $(this).text();
					floorNames.push(floorName);
				});

				// print the number of locations
				console.log('There are ' + links.length + ' Regus locations in Tokyo.');

			} else {
				console.log('There was an error retrieving the data.');
			}

			// execute callback (when this finishes loading then you can start to parse the price pages)
			callback && callback();
		});
		
	}

	function getTokyoPrice(url, index, callback){
		
		var priceHolder = [];

		request(url, function(error, response, body){
			if(!error && response.statusCode == 200){
				var $ = cheerio.load(body);

				$('span.cost', 'div#services').each(function(i, span){
					priceHolder[i] = $(this).text();
//					console.log(priceHolder.join(','));
				});
				
			} else {
				console.log("There was an error retrieving the information.");
			}
			var currentFloor = floorNames[index].replace(/\s/g, '');
			console.log((index+1) + '. ' + currentFloor);
			console.log( 'Business lounge: ' + priceHolder.join(' || Virtual Office:') );
			console.log('\n ');
		});
		
		callback && callback();	
	}


	getTokyoLinks( function(){
		links.forEach( function(link, i){
			getTokyoPrice(link, i);
		});
	});
