var fs = require('fs');
var path = require('path');
var url = require('url');
var cheerio = require('cheerio');

// process.argv

var locs = JSON.parse(
  fs.readFileSync(path.join(__dirname, process.argv[2]), {encoding: 'utf8'} )
)

var writable = fs.createWriteStream( path.join(__dirname, 'prices.html') );

//Setup HTML document to write to
var $ = cheerio.load('<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Regus Price differences</title><style>body{font-family: arial;font-weight: 100;}h1{margin-bottom:10px;}td, th {padding: 0 10px;text-align: right;}th:first-child, td:first-child, th:first-child {text-align: left;}</style></head><body></body></html>');
$('body').append('<h1>Prices for '+process.argv[2]+'</h1>')

locs.forEach(function(city){
  $('body').append(`<div id="${city.name}">
        <h2>${city.name}</h2>
        <ul></ul>
      </div>`)
  city.locations.forEach(function(location) {
    var prices = Object.keys(location.prices).map(function(priceType) {
        return `${priceType}: ${ location.prices[priceType] }`
      }).join('<br>');
      console.log(prices)
    $('#' + city.name + ' ul').append(`
        <li>
          <h3>${location.name}</h3> <br>
          <a href="${location.url}">Link</a> <br>
          ${prices}
        </li>`)
  })
})

writable.write($.html());
console.log('Differences written to', writable.path);
