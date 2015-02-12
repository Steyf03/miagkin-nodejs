
			 //-------------------//
			//----- Modules -----//
		   //-------------------//

var express = require('express');

			 //-------------------//
			//-- Configuration --//
		   //-------------------//

var app = express(); // Express
var port = process.env.PORT || 1337;
var server = require('http').createServer(app).listen(port);
var io = require('socket.io').listen(server);

app.set('port', 1337);  
app.set('ipaddr', "127.0.0.1");

app.use(express.static(__dirname + '/public'));		// Set le répertoire public	

app.get('/', function(req, res) {
  res.render('index.html');
});

io.sockets.on('connection', function (socket)
{
	console.log("Port: " + port);
})