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
  this.prices = {};
}
// SCRAPING SELECTORS
var citySelectors = {
  main: '.roomList',
  name: 'h2'
};
var locSelectors = {
  main: '.listUnit',
  name: 'h3',
  address: 'p:first',
  url: 'p a:nth(2)',
  prices: 'table tr:nth(1)'
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
        var actual = $(locSelectors.main).length;

        // Go through each city
        $(citySelectors.main).each(function(i, city){
          // retrive name of city
          var cityName = $(city).find(citySelectors.name).trim().text();
          regusLocations.push({cityName: cityName, locations: []})

          // go through each Location
          $(city).find(locSelectors.main).each(function(i, location){
            var loc = new Location();
            // get location information
            loc.name = $(location).find(locSelectors.name).trim().text();
            loc.address = $(location).find(locSelectors.address).trim().text();
            loc.url = $(location).find(locSelectors.url).trim().text();
          })

        })



        // load links into an array
        $('.results_cols_wrapper').each(function(i, a) {
          var loc = new Location();

          // GENERAL LOCATION INFORMATION
          loc.url = 'http://www.en.regus.co.jp' + $(a).find('.more-info-link').attr('href');
          loc.name = $(a).find('.centre-name').text().replace(/\s{2,}/g, '').replace(',', '');

          // PUSH THE SPECIFIC PRODUCTS TO THE LOCATION INFORMATION
          $(this).find('.vo_products').each(function(i, product) {
            var productName = $(product).find('p').text().trim();
            var amount = $(product).find('h3').text().match(/¥.*/)[0];
            loc.prices[productName] = amount;
          });

          cityLocations.push(loc);
          locCounter += 1;
        });

        resolve(cityLocations);

      } else {
        reject(error)
      }
    });

  })
}




//********
// GET ALL LINKS AND THEN LOG ALL THE NECESSARY DATA TO FILES
//********/
console.info('Gathering links for analysis...');
// Push all promises to an array for iteration
var cityPromises = [];
cities.forEach((city) => {
  cityPromises.push(getCityLinks(city));
});
// Map all locations in order
Promise.mapSeries(cityPromises, function(cityArray, i){
  console.log('Starting ' + i)
  writeLocationsToFile(cityArray)
})
.then(() => { // Print results

  console.log(`All done with data for ${locCounter} locations logged.`);

})


/*********
//********
// WRITE TO FILE LOGIC
//********
*********/
function writeLocationsToFile(cityArr){
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
  cityArr.sort(compare);

  // WRITE RESULTS TO STREAM
  regusPricesWriteStream.write(JSON.stringify(cityArr))
  cityArr.forEach(function(locationObj) {
    locationObj.prices['Mailbox Plus'] = locationObj.prices['Mailbox Plus'] || 'n/a';
    locationObj.prices['Telephone Answering'] = locationObj.prices['Telephone Answering'] || 'n/a';
    locationObj.prices['Virtual Office'] = locationObj.prices['Virtual Office'] || 'n/a';
    locationObj.prices['Virtual Office Plus'] = locationObj.prices['Virtual Office Plus'] || 'n/a';

    console.log(`Data written for ${locationObj.name}.`)
  });

}
