'use strict';

var request = require('request'),
	cheerio = require ('cheerio');

var	prices = [],
	links = [],
	floorNames = [];

var cities = ['Tokyo', 'Yokohama', 'Chiba', 'Ibaraki', 'Fukuoka', 'Hiroshima', 'Osaka', 'Nagoya', 'Sendai', 'Okayama', 'Kobe', 'Kagawa', 'Kyoto', 'Sapparo', 'Aomori', 'Kagoshima', 'Okinawa'];

	// this function scrapes the regus tokyo website for names and link information
	function getTokyoLinks(city, callback){
		// EN of JP links
		var linkEn = 'http://www.en.regus.co.jp/office-space/japan/';
		
		// retrieve the body HTML document
		request(linkEn + city, function(error, response, body){
		
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
				console.log('There are ' + links.length + ' Regus locations in '+ city +'.');

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

				$('span.cost', 'p.pricing').each(function(i, span){
					priceHolder[i] = $(this).text();
				});
				
			} else {
				console.log("There was an error retrieving the information.");
			}
			var currentFloor = floorNames[index].replace(/\s{2,}/g, '');
			console.log((index+1) + '. ' + currentFloor + '\n' +
					url + '\n' +
					'Business lounge: ' + priceHolder.join(' || Virtual Office:') + '\n');
		});
		
		callback && callback();	
	}

// Run the thang 

process.stdin.setEncoding('utf8');

process.stdin.on('readable', function() {
  var cityChunk = process.stdin.read();
  var cityChunk = Number(cityChunk);
  console.log(typeof cityChunk);

  if (cityChunk !== null) {
    getTokyoLinks(cities[cityChunk], function(){
      links.forEach( function(link, i){
        getTokyoPrice(link, i);
        process.stdin.exit();
      });
    });
  }
});

process.stdin.on('end', function() {
  process.stdout.write('end');
});

