// Generate a monthly report for all prices in that month
var fs = require('fs')
var path = require('path')
var cheerio = require('cheerio');
// Get passed in filename and setup data file and write stream
var fname = process.argv[2]
var base = path.dirname(fname)
var thisMonth = JSON.parse( fs.readFileSync(path.join(__dirname, process.argv[2]), {encoding: 'utf8'}) );
var writable = fs.createWriteStream(path.join(base, 'monthly-report.html'))
//Setup HTML document to write to
var $ = cheerio.load(fs.readFileSync(path.join(__dirname, "..", "assets", "main.html")))
var dateString = new Date()
dateString = dateString.toDateString()
$('title').text('Monthly Report for ' + dateString)

// Set up titles
$('body').append('<h1>Monthly Report Taken On '+dateString+'</h1>')

//write all new locations to file
$('body').append('<h2>Regus Locations:</h2>')
$('body').append(`<table id="locations-table">
		<thead>
			<tr>
				<th>Location Name</th>
				<th>URL</th>
				<th>Prices</th>
			</tr>
		</thead>
		<tbody>
		</tbody>
	</table>`);
thisMonth.forEach( (location) => {
	$('#locations-table tbody').append('<tr></tr>')
  $('#locations-table tbody tr:last-child').append('<td>' + location.name + '</td>')
  $('#locations-table tbody tr:last-child').append('<td>' + '[ <a href="'+location.url+'">' + 'Regus Official Website' +'</a> ]' + '</td>')
  
  var pricesString = Object.keys(location.prices).map(function(priceProp){
  	return priceProp + ": " + location.prices[priceProp]
  }).join('<br>')
  $('#locations-table tbody tr:last-child td:last-child').append('<td>'+pricesString+'</td>')
})

// Finish up by outputting to file
writable.write($.html());
console.log('Report written to', writable.path);