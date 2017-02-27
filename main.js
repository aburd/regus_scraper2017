'use strict';

/*
 * Made because the main site now does not have any prices on it
 */

var Promise = require('bluebird'),
    request = Promise.promisifyAll(require('request')),
    cheerio = require('cheerio'),
    fs      = require('fs'),
    path    = require('path');

var prices      = [],
    links       = [],
    floorNames  = [],
    locCounter  = 0;

// DATE STUFF
var theDate       = new Date(),
    currentYear   = theDate.getFullYear().toString(),
    currentMonth  = (theDate.getMonth() + 1).toString(),
    dateString    = theDate.toDateString().replace(/\s/g, '-')

// EN / JP LINKS
var link = 'https://www.regus-office.jp/service/virtualoffice/virtualoffice/';

// DIRECTORY FOR NEW FILES
var pathToCurrentMonthFolder = path.join(__dirname, 'price-keeping', currentYear, currentMonth);
if(!fs.exists(pathToCurrentMonthFolder)) {
  fs.mkdirSync(pathToCurrentMonthFolder);
}
// MAKE FILE AND CREATE COLUMNS
var writable = fs.createWriteStream(path.join(pathToCurrentMonthFolder, 'res-'+dateString+'.csv'));
var regusPricesWriteStream = fs.createWriteStream(path.join(pathToCurrentMonthFolder, 'res-'+dateString+'.json') );
writable.write(`Location Name;URL;Mailbox Plus;Telephone Answering;Virtual Office;Virtual Office Plus\n`)

// OBJECT TO KEEP ALL DATA IN
var regusLocations = [];
// CLASS FOR LOCATION
function Location() {
  this.name = '';
  this.url = '';
  this.address = '';
  this.prices = {
    'Mailbox Plus': '',
    'Telephone Answering': '',
    'Virtual Office': '',
    'Virtual Office Plus': ''
  };
}
// SCRAPING SELECTORS
var citySelectors = {
  main: '.roomList',
  name: 'h2'
};
var locSelectors = {
  main: '.listUnit',
  name: 'h3',
  address: 'p',
  url: 'p a',
  prices: 'table tr'
};


//********
// THE SCRAPER FUNCTION WHICH GOES TO REGUS WEBSITE
//********/
function getInformation() {
  return new Promise((resolve, reject) => {
    var cityLocations = [];
    // retrieve the body HTML document
    request(link, function(error, response, body) {
      if (!error && response.statusCode == 200) {

        var $ = cheerio.load(body);
        locCounter = $(locSelectors.main).length;

        // Go through each city
        $(citySelectors.main).each(function(i, city){
          // retrive name of city
          var cityName = $(city).find(citySelectors.name).text().trim();
          var locations = [];
          // go through each Location
          $(city).find(locSelectors.main).each(function(i, location){
            var loc = new Location();
            // get location information
            loc.name = $(location).find(locSelectors.name).text().trim();
            loc.address = $(location).find(locSelectors.address).first().text().trim();
            loc.url = $(location).find(locSelectors.url).eq(2).attr('href');
            //prices
            //['Mailbox Plus', 'Telephone Answering', 'Virtual Office', 'Virtual Office Plus']
            var $prices = $(location).find(locSelectors.prices).eq(1).find('td');
            loc.prices['Mailbox Plus']        = $prices.eq(1).text();
            loc.prices['Telephone Answering'] = $prices.eq(2).text();
            loc.prices['Virtual Office']      = $prices.eq(3).text();
            loc.prices['Virtual Office Plus'] = $prices.eq(4).text();

            locations.push(loc)
          });
          // push this location to the locations
          regusLocations.push({
            name: cityName,
            locations: locations
          });
        });

        resolve(regusLocations);

      } else {
        reject(error)
      }
    });

  })
}


/*********
//********
// WRITE TO FILE LOGIC
//********
*********/
function writeLocationsToFile(cities){
  // ORGANIZE LOCATIONS INSIDE OF CITIES
  function compare(a, b) {
    if (a.name > b.name) {
      return 1;
    } else if (b.name > a.name) {
      return -1;
    } else {
      return 0;
    }
  }
  cities.sort(compare);

  // WRITE RESULTS TO STREAM
  regusPricesWriteStream.write(JSON.stringify(cities))
}

//********
// GET ALL LINKS AND THEN LOG ALL THE NECESSARY DATA TO FILES
//********/
console.info('Gathering links for analysis...');
getInformation()
  .then(function( cities ){
    // Write all information to a file
    console.log('Writing locations to file...')
    writeLocationsToFile(cities)
    console.log(`All done with data for ${locCounter} locations logged.`);
  });
