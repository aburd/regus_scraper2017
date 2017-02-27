var fs = require('fs');
var path = require('path');
var url = require('url');
var cheerio = require('cheerio');
// CSV stuff
var csvWriter = require('csv-write-stream')
var writer = csvWriter({
  headers: ['City Name', 'Location Name','Mailbox Plus','Telephone Answering','Virtual Office','Virtual Office Plus'],
  sendHeaders: false
});

var locs = JSON.parse(
  fs.readFileSync(path.join(__dirname, process.argv[2]), {encoding: 'utf8'} )
)

writer.pipe(fs.createWriteStream( path.join(__dirname, 'prices.csv') ) );

locs.forEach(function(city){
  writer.write(['City Name', 'Location Name','Mailbox Plus','Telephone Answering','Virtual Office','Virtual Office Plus']);
  writer.write([city.name]);

  city.locations.forEach(function(location) {
    var prices = Object.keys(location.prices).map(function(priceType) {
        return location.prices[priceType]
      })
    writer.write([''].concat([location.name].concat(prices)));
  })
  writer.write(['']);
})
writer.end();
console.log('Differences written.');
