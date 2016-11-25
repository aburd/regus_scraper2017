var fs = require('fs');
var path = require('path');
var url = require('url');
var cheerio = require('cheerio');

//Check and get the arguments passed into the script
if(process.argv.length < 4) {
  var more = 4 - process.argv.length;
  var msg = more > 1 ? 'This program requires 2 more arguments' : 'This program requires 1 more argument';
  throw new Error(msg);
  process.exit();
} 
var lastMonth = JSON.parse( fs.readFileSync(path.join(__dirname, process.argv[2]), {encoding: 'utf8'}) );
var thisMonth = JSON.parse( fs.readFileSync(path.join(__dirname, process.argv[3]), {encoding: 'utf8'}) );

// Declare globals
var newLocations = [];
var writableFolderPath = path.dirname(path.join(__dirname, process.argv[3]));
var writable = fs.createWriteStream( path.join(writableFolderPath, 'differences.html') );

//Setup HTML document to write to
var $ = cheerio.load('<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Regus Price differences</title><style>body{font-family: arial;font-weight: 100;}h1{margin-bottom:10px;}td, th {padding: 0 10px;text-align: right;}th:first-child, td:first-child, th:first-child {text-align: left;}</style></head><body></body></html>');
$('body').append('<h1>Price differences for</h1>')
$('body').append('<h2>'+process.argv[2]+' and '+process.argv[3]+'</h2>')

//loop through all locations for this month
lastMonth.forEach( (location, locationNumber) => {
  //find a match from last month
  function findCorrespondingLocation(locationName) {
    return thisMonth.filter( locationFromThisMonth => locationFromThisMonth.name === locationName );
  }
  var matchingLocation = findCorrespondingLocation(location.name)[0];
  
  //if no match exists, push to newlocations
  if(matchingLocation === undefined) {
    newLocations.push(location);
    // console.log(location)
  }
  else {
    //compare prices
    function comparePrices(pricesBefore, pricesNow) {
      var res = {name:'', url:'', messages:[]};
      res.name = location.name;
      res.url = convertUrl(location.url);

      var products = Object.keys(pricesNow);

      function makeInt(priceStr) {
        if(typeof priceStr !== "string" || typeof priceStr === "undefined") {
          priceStr = "0";
        }
        return parseInt(priceStr.replace(/¥|,/g, ""));
      }
      function makeTableCell(text, color) {
        if (color) {
          return '<td style="color:#'+ color +';">' + text + '</td>';  
        } else {
          return '<td>' + text + '</td>';
        }
      }

      products.forEach( (productName, i) => {
        var priceNow = pricesNow[productName];
        var priceBefore = pricesBefore[productName];
        var difference = makeInt(priceNow) - makeInt(priceBefore);

        if(priceNow !== priceBefore) {
          var msg = `${makeTableCell(productName)}${makeTableCell(priceBefore)}${makeTableCell(priceNow)}${makeTableCell(difference.toString(), 'b00')}`;
          res.messages.push(msg);
        }
      })
      return res;
    }

    var compared = comparePrices(location.prices, matchingLocation.prices);
    
    //log any differences to a file
    if(compared.messages.length > 0) {
      $('body').append(`<a href="${compared.url}"><span style="font-weight: bolder;">${compared.name}</span></a>`);
      $('body').append('<table><thead><tr><th>Product Name</th><th>Before</th><th>After</th><th>Difference</th></tr></thead></table>');
      compared.messages.forEach((msg) => {
        $('body table:last-child').append('<tr>'+msg+'</tr>');
      })
      $('body').append('<br />');
    }
  }

});

//write all new locations to file
$('body').append('<h2>New Locations:</h2>')
newLocations.forEach( (newLocation) => {
  $('body').append('<p> - ' + newLocation.name + ' [<a style="color:#999;" href="'+newLocation.url+'">' + newLocation.url +'</a>]</p>')
})

// Used to convert ja to en url
function convertUrl (uri) {
  var newUri = url.parse(uri);
  return url.format({protocol:newUri.protocol, hostname:"en.regus.co.jp", pathname: newUri.pathname});
}

writable.write($.html());
console.log('Differences written to', writable.path);