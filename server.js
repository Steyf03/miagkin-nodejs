
			 //-------------------//
			//----- Modules -----//
		   //-------------------//

var express = require('express');
var crypto = require('crypto');
var mongoose = require('mongoose');
var db = require('./config/db');
var userApp = require('./app/user');
var Room = require('./app/room.js');

			 //-------------------//
			//-- Configuration --//
		   //-------------------//

mongoose.connect(db.url);							// Connection à la DB
var database = mongoose.connection;

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

			 //-----------------------------------------//
			//-- Déclaration des variables générales --//
		   //-----------------------------------------//

var users = {}; 		// Objet users
var usersCount = 0;
var rooms = {}; 		// Objet rooms
var roomsCount = 0;
var games = [];			// Games
var gamesCount = 0;
var playersCount = 0;
var messages = []; 		// Tableau qui stocke les messages
var messagesGen = []; 	// Tableau qui stocke les messages du général
var messagesRooms = []; // Tableau qui stocke les messages pour chaque Room
var history = 2;

			 //------------------------//
			//-- Sockets Connection --//
		   //------------------------//

io.sockets.on('connection', function(socket)
{
	console.log('Lol');
});