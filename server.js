
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
app.use(express.static(__dirname + '/public'));		// Set le répertoire public	

var httpServer = app.listen(1337, '0.0.0.0');		// Création du serveur HTTP
var io = require('socket.io').listen(httpServer);	// Appel de socket.io et listen

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

	// Déclaration du compteur d'u'tilisateur et log la connection d'utilisateur
	var me = false;
	usersCount++;
	console.log("\nNews -> Un utilisateur s'est connecté\nNews -> Utilisateurs connectés: " + usersCount);

	// Affiche les utilisateurs connectés
	for(var k in users)
	{
		socket.emit('newusr', users[k]);
	}

			 //---------------------------------//
			//---- Gestion des utilisateurs ---//
		   //---------------------------------//

	/*
	*	Vérifie que l'utilisateur n'est pas déjà connecté sinon le connecte
	*/
	socket.on('login', function(user)
	{
		var tempId = user.mail.replace('@','-').replace('.','-');
		if(users[tempId] !== undefined){
			socket.emit('loginError');
		}
		else
		{
			me = user;
			me.id = user.mail.replace('@','-').replace('.','-');
			// Vérifie que l'user n'est pas déjà dans la base
			userApp.getUser(me, function(temp){
				if (temp == null){
					userApp.addUser(me);	
					me.avatar = 'https://gravatar.com/avatar/' + crypto.createHash('md5').update(user.mail).digest('hex') + '?s=50';
				}
				else
				{
					me.avatar = temp.avatar;
				}
				users[me.id] = me;
				// L'user rejoint la Room (socket.io) générale
				socket.join('general');
				socket.emit('logged', me);
				users[me.id].inRoom = null;
				console.log("L'utilisateur " + me.username + " s'est connecté !");
				io.sockets.emit('newusr', me);
				socket.emit('userInfos', me);
				io.sockets.emit('usersCount', usersCount);
				io.sockets.emit('roomsCount', roomsCount);
				io.sockets.emit('gamesCount', gamesCount);
				io.sockets.emit('playersCount', playersCount);
			});
		}
	})

	/*
	*	Déconnection d'un utilisateur
	*/
	socket.on('disconnect', function()
	{
		usersCount--;
		io.sockets.emit('usersCount', usersCount);
		console.log("\nUtilisateur déconnecté");
		if(!me)
		{
			return false;
		}
		// Vérifie si l'user est dans une room
		if(users[me.id].inRoom !== null)
		{
			var room = rooms[users[me.id].inRoom];
			if (room.users.length > 1){
				if (me.id === room.owner)
				{
					room.users.splice(room.users.indexOf(me.id), 1);
					room.owner = room.users[0];
				}
				else
				{
					room.users.splice(room.users.indexOf(me.id), 1);
				}
			}
			else
			{
				deleteRoom();
			}
			socket.leave(room.id);
		}
		else
		{
			socket.leave('general');	
		}
		delete users[me.id];
		io.sockets.emit('disusr', me);
	})

			 //---------------------------------//
			//------ Module: Waiting Room -----//
		   //---------------------------------//

	/*
	*	Création d'une Room
	*/
	socket.on('createRoom', function(name)
	{
		var roomId = 'roomId' + roomsCount;
		var room = new Room(name, roomId, me.id);
		rooms[roomId] = room;
		roomsCount++;
		io.sockets.emit('roomsCount', roomsCount);
		socket.leave('general');
		socket.join(roomId);
		room.addUser(me.id);
		users[me.id].inRoom = roomId;
		messagesRooms[roomId] = new Array();
		io.sockets.emit('newroom', room);
		socket.emit('showRoom', room);
		io.sockets.in('roomId0').emit('inform');
	})

	/*
	*	Vérifie que la Room n'est pas pleine
	*/
	socket.on('isAvailable', function(roomId)
	{
		socket.emit('sizeOfRoom', rooms[roomId]);
	})

	/*
	*	Rejoint une Room
	*/
	socket.on('joinRoom', function(roomId)
	{
		var room = rooms[roomId];
		socket.leave('general');
		socket.join(roomId);
		room.addUser(me.id);
		users[me.id].inRoom = roomId;
		io.sockets.in(roomId).emit('addPlayer', me);
	})

	/*
	*	Quitte une Room
	*/
	socket.on('leaveRoom', function(roomId)
	{
		var room = rooms[roomId];
		if (room.users.length > 1)
		{
				if (me.id === room.owner)
				{
					room.users.splice(room.users.indexOf(me.id), 1);
					room.owner = room.users[0];
				}
				else
				{
					room.users.splice(room.users.indexOf(me.id), 1);
				}
		}
		else
		{
			deleteRoom();
		}
		io.sockets.in(roomId).emit('delPlayer', users[me.id]);
		socket.leave(roomId);
		socket.join('general');
		users[me.id].inRoom = null;
	})

	/*
	*	Affiche toutes les Rooms
	*/
	socket.on('listRooms', function()
	{
		for(var k in rooms)
		{
			socket.emit('newroom', rooms[k]);
		}		
	})

	/*
	*	Supprime une Room
	*/
	function deleteRoom()
	{
		io.sockets.emit('delroom', rooms[users[me.id].inRoom]);
		delete rooms[users[me.id].inRoom];
		roomsCount--;
		io.sockets.emit('roomsCount', roomsCount);
	}

			 //---------------------------------//
			//--------- Module: Rooms ---------//
		   //---------------------------------//

	/*
	*	Affiche tous les players d'une Room
	*/
	socket.on('listPlayers', function(roomId)
	{
		for (var i = 0; i < rooms[roomId].users.length; i++)
		{
			socket.emit('addPlayer', users[rooms[roomId].users[i]]);
		}
	})

			 //---------------------------------//
			//-------- Module: Messages -------//
		   //---------------------------------//
	/*
	*	Réception d'un message du Général
	*/
	socket.on('newmsgGeneral', function(message)
	{
		message.user = me;
		date = new Date();
		message.h = date.getHours();
		message.m = date.getMinutes();
		if (message.m < 10) message.m = '0' + message.m;
		messagesGen.push(message);
		if (messagesGen.length > history)
		{
			messagesGen.shift();
		}
		io.sockets.in('general').emit('newmsg', message);
	});

	/*
	*	Réception d'un message d'une Room
	*/
	socket.on('newmsgRoom', function(message, roomId)
	{
		message.user = me;
		date = new Date();
		message.h = date.getHours();
		message.m = date.getMinutes();
		messagesRooms[roomId].push(message);
		if (messagesRooms[roomId].length > history)
		{
			messagesRooms[roomId].shift();
		}
		io.sockets.in(roomId).emit('newmsg', message);
	});

	/*
	*	Affiche tous les messages du Général
	*/
	socket.on('listMsgGen', function()
	{
		for (var k in messagesGen)
		{
			socket.emit('newmsg', messagesGen[k]);
		}
	})

	/*
	*	Affiche tous les messages d'une Room
	*/
	socket.on('listMsgRoom', function(roomId)
	{
		for(var k in messagesRooms[roomId])
		{
			socket.emit('newmsg', messagesRooms[roomId][k]);
		}
	})

			 //---------------------------------//
			//------- Module: Side Panel ------//
		   //---------------------------------//

	/*
	*	Modifie l'Avatar
	*/
	socket.on('newAvatar', function(avatarSrc)
	{
		users[me.id].avatar = avatarSrc;
		userApp.updateUser(users[me.id]);
		socket.emit('userInfos', users[me.id]);
	})

});