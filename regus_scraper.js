'use strict';

var Promise = require('bluebird'),
  request = Promise.promisifyAll(require('request'));
var cheerio = require('cheerio'),
  fs = require('fs');

var prices = [],
  links = [],
  floorNames = [],
  locCounter = 0;

// EN of JP links
var linkEn = 'http://www.en.regus.co.jp/office-space/japan/';

var regusLocations = {};

function Location() {
  this.name = '';
  this.url = '';
  this.prices = [];
}
var writable = fs.createWriteStream('./res.csv');
writable.write(`Location Name;URL;Lounge Price;VO Price\n`)

var cities = ['Tokyo', 'Yokohama', 'Chiba', 'Ibaraki', 'Fukuoka', 'Hiroshima', 'Osaka', 'Nagoya', 'Sendai', 'Okayama', 'Kobe', 'Kagawa', 'Kyoto', 'Sapparo', 'Aomori', 'Kagoshima', 'Okinawa'];

// this function scrapes the regus tokyo website for names and link information
function getCityLinks(city) {
  return new Promise((resolve, reject) => {
    var cityLocations = [];
    // retrieve the body HTML document
    request(linkEn + city, function(error, response, body) {

      // if everything is ok then proceed
      if (!error && response.statusCode == 200) {

        var $ = cheerio.load(body);
        //var calculated = $('.more-info-link').length
        var actual = parseInt($('.results-count').text());

        $ = cheerio.load(body);
        // load links into an array
        $('.more-info-link', 'div.results_cols').each(function(i, a) {
          var loc = new Location();
          loc.url = 'http://www.regus.co.jp' + $(this).attr('href');
          loc.name = $(a).find('.centre-name').text().replace(/\s{2,}/g, '');

          cityLocations.push(loc);
          locCounter += 1;
        });
        regusLocations[city] = cityLocations;
        resolve(cityLocations);

      } else {
        reject(error)
      }
    });

  })
}

function getLocationPrice(url, locObj) {
  return new Promise((resolve, reject) => {

    var priceHolder = [];

    request(url, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        var $ = cheerio.load(body);

        //console.log( $.is )

        $('span.cost', 'p.pricing').each(function(i, span) {
          var content = $(this).text().replace(/,|¥|\.00/g, '');
          if (content != '')
            content = parseInt(content);
          else
            content = 0;

          locObj.prices.push(content);
        });
        console.log(`Data from ${locObj.name} done.`)
        resolve(locObj);

      } else {
        reject(error)
      }

    });

  });
}


var cityPromises = [];

cities.forEach((city) => {
  console.info('Getting city links for ' + city + '.');
  cityPromises.push(getCityLinks(city));

})

Promise.all(cityPromises).then((results) => {
  var locationPromises = [];

  cities.forEach((machi, i) => {
    regusLocations[machi].forEach((location, i) => {
      locationPromises.push(getLocationPrice(location.url, location))
    })
  })

  return Promise.all(locationPromises);
}).then((res) => {
  // console.log(res)

  function compare(a, b) {
    if (a.name > b.name) {
      return 1;
    } else if (b.name > a.name) {
      return -1;
    } else {
      return 0;
    }
  }
  res.sort(compare);
  res.forEach((locationObj) => {
    writable.write(`${locationObj.name};${locationObj.url};${locationObj.prices.join(';')}\n`)
  });
  console.log(`All done with data for ${locCounter} locations logged.`)
})