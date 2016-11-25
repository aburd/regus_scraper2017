/*This file is used to clean of the inside of the malformed json files I was making*/ 
var fs = require('fs')
var path = require('path')

var fname = process.argv[2]
var base = path.dirname(fname)

var writable = fs.createWriteStream( path.join(__dirname, base, 'res.json') );

String.prototype.splice = function(addedStr, index){
 var substr = this.slice(0, index)
 var rest = this.slice(index, this.length)
 return substr + addedStr + rest;
}


function parseForNoCommas(str) {
	var cur = '', res = [];
	for(var i = 0; i < str.length; i++) {
		cur = str.charAt(i)
		if(cur === "]" && i !== str.length - 1) {
			res.push(",")	
		} else if(cur === "[" && i !== 0) {
			continue
		} else {
			res.push(cur)
		}
	}
	return res.join("")
}

fs.readFile(fname, {encoding: 'utf8'}, (err, file) => {
	// console.log(file)
	writable.write( parseForNoCommas(file) )
	console.log('File written.');
})