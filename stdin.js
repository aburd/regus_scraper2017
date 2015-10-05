process.stdin.setEncoding('utf8');

process.stdin.on('readable', function() {
  var chunk = process.stdin.read();
  if (chunk !== null) {
    process.stdout.write('data: ' + chunk);
    process.stdout.write(typeof chunk);
    process.exit(); 
    console.log('This was fun tho.');
 }

});

process.stdin.on('end', function() {
  process.stdout.write('end');
});

console.log('This was fun.');
