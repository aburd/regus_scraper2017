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
  $('body').append(`
      <h2>${city.name}</h2>
      <ul></ul>
    `)
  city.locations.forEach(function(location) {
    $('ul').last().append(`
        <li>
          <h3>${location.name}</h3> <br>
          <a href="${location.url}">Link</a> <br>
          Prices: <ul>
             ${Object.keys(location.prices).map(function(priceType){
               return `<li>
                  ${priceType}: ${location.prices[priceType]}
                </li>`
             }).join('')}
          </ul>
        </li>
      `)
  })
})

writable.write($.html());
console.log('Differences written to', writable.path);
