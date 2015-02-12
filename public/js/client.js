(function($){

	var socket = io.connect('http://miagkin.herokuapp.com:80');
	var msgtpl = $('#msgtpl').html();
	var lastmsg = false;

	// Cache les parties HTML avant leur appel
	$('#msgtpl').remove(); 

			 //-------------------------------//
			//-------- Module: Login --------//
		   //-------------------------------//

	//	Envoi du formulaire de l'utilisateur
	$('#loginform').submit(function(event)
	{
		event.preventDefault();
		socket.emit('login', {
			username : $('#username').val(),
			mail	 : $('#mail').val()
		})
	})

	// Affiche une erreur si l'utilisateur est déjà connecté
	socket.on('loginError', function()
	{
		$('#notif').remove();
		$('#loginform').append('<div class="notif error" id="notif" style="margin-top: 15px;"><span>Utilisateur déjà connecté</span><div');
		$('#notif').click(function()
		{
			$(this).remove();
		})
	})

	// Cache le formulaire de login, affiche la Waiting Room et le chat Général
	socket.on('logged', function()
	{
		$('#login').animate({ "left": "-=130%" }, 700 );
		$('#login').fadeOut(200, function()
		{
    		$('#login').remove();
			socket.emit('listRooms');
			showChatGen();
			socket.emit('listMsgGen');
		})
	})

			 //-------------------------------//
			//----- Module: Waiting Room ----//
		   //-------------------------------//

	// Crée une nouvelle room
	$(document).on('click', '#createRoom', function()
	{
		var name = prompt("Nom de la Room: ");
		socket.emit('createRoom', name);
		socket.on('showRoom', function(room)
		{
			launchRoom(room);
		})
	})

	// Rejoint une room
	$(document).on('click', '.room', function()
	{
		var roomId = $(this).attr('id');
		socket.emit('isAvailable', roomId);
	})

	// Vérifie la place disponible dans la Room
	socket.on('sizeOfRoom', function(room)
	{
		if (room.users.length < 5){
			socket.emit('joinRoom', room.id);
			launchRoom(room);
		}
		else
		{		
			$('#notif').remove();
			$('#content').append('<div class="notif error">La partie est pleine</div>');
			$('#notif').click(function(){
				$(this).remove();
			})
		}
	})

	// Quitte une Room
	$(document).on('click', '.leaveRoom', function()
	{
		var roomId = $('.waitingRoom').attr('id');
		socket.emit('leaveRoom', roomId);
		leaveRoom();
		socket.emit('listRooms');
		showChatGen();
		socket.emit('listMsgGen');
	})

	function leaveRoom()
	{
		$('.waitingRoom').remove();
    	$('#messages').remove();
    	$('#formRoom').remove();
		$('#content').append('<div id="allRooms"></div>');
		$('#allRooms').append("<h2>Salle d'attente</h2>");
		$('#allRooms').append('<div id="createRoom"></div>');
	}

	function launchRoom(room)
	{
		$('#allRooms').fadeOut(200, function()
		{
    		$('#allRooms').remove();
    		$('#messages').remove();
    		$('#formGeneral').remove();
    		$('#content').append('<div id="messages"></div><form action="" id="formRoom"><input type="text" id="message" class="text"><input type="submit" id="send" value="Envoyer" class="submit"></form>');
			$('#content').append('<div class="waitingRoom" id="' + room.id + '"></div>');
			$('.waitingRoom').show();
			$('.waitingRoom').append('<div id="players"</div>');
			$('.waitingRoom').append('<div id="sidebar"</div>');
			$('#sidebar').append('<div class="title">' + room.name + '</div>');
			$('#sidebar').append('<div class="leaveRoom">X</div>');
			socket.emit('listPlayers', room.id);
			socket.emit('listMsgRoom', room.id);
		})
	}

	// Socket de mise à jour de l'affichage des rooms
	socket.on('newroom', function(room)
	{
		$('<div class="room" id="' + room.id + '"></div>').insertBefore('#createRoom');
		$('#' + room.id).append('<a>' + room.name + '</a>');
		$('#' + room.id).append('<p>Joueurs: ' + room.users.length + '</p>');
	})

	// Supprime la Room
	socket.on('delroom', function(room)
	{
		$('#' + room.id).remove();
	})

			 //-------------------------------//
			//-------- Module: Rooms --------//
		   //-------------------------------//

	// Récupère les utilisateurs de la room et les affiche
	socket.on('addPlayer', function(user)
	{
		$('#players').append('<div class="player" id="playerID' + user.id + '"></div>');
		$('#playerID' + user.id).append('<img src="' + user.avatar + '" id="' + user.id + '">');
		$('#playerID' + user.id).append('<a class="username">' + user.username + '</a>');
		$('#playerID' + user.id).animate({ "left": "0%" }, 700);
	})

	// Supprime le joueur
	socket.on('delPlayer', function(user)
	{
		$('#playerID' + user.id).remove();
	})

			 //-------------------------------//
			//------- Module: Messages ------//
		   //-------------------------------//

	// Envoi de messages sur le Général
	$(document).on('submit', '#formGeneral', function(event)
	{
		event.preventDefault();
		socket.emit('newmsgGeneral', {message: $('#message').val()});
		$('#message').val('');
		$('#message').focus();
	})

	// Envoi de messages sur une Room spécifique
	$(document).on('submit', '#formRoom', function(event)
	{
		event.preventDefault();
		var roomId = $('.waitingRoom').attr('id');
		socket.emit('newmsgRoom', {message: $('#message').val()}, roomId);
		$('#message').val('');
		$('#message').focus();
	})

	function showChatGen()
	{
		$('#allRooms').show();
		$('#content').append('<div id="messages"></div><form action="" id="formGeneral"><input type="text" id="message" class="text"><input type="submit" id="send" value="Envoyer" class="submit"></form>');
	}

	// Affichage d'un message
	socket.on('newmsg', function(message)
	{
		if(lastmsg != message.user.id){
			$('#messages').append('<div class="separator"></div>');
			lastmsg = message.user.id;
		}
		$('#messages').append('<div class="message">' + Mustache.render(msgtpl, message) + '</div>');
		$('#messages').animate({scrollTop : $('#messages').prop('scrollHeight') }, 500);
	})

			 //-------------------------------//
			//------- Module: Top Bar -------//
		   //-------------------------------//

	// Affiche le nouvel utilisateur
	socket.on('newusr', function(user)
	{
		$('#users').append('<img src="' + user.avatar + '" id="' + user.id + '">');
	})

	// Efface l'utilisateur déconnecté
	socket.on('disusr', function(user)
	{
		$('#' + user.id).remove();
	})

			 //-------------------------------//
			//------ Module: Side Panel -----//
		   //-------------------------------//

	// Side Panel
	$('#header-icon').click(function(e)
	{
		e.preventDefault();
		$('.panel').css('height', window.innerHeight);
		$('body').toggleClass('with-sidebar');
	})

	// Clique sur le bouton changer d'avatar
	$('#chAvatarPanel').click(function(e)
	{
		e.preventDefault();
		if ($('#chAvatarFramePanel').css('display') == 'none')
		{
			$('#chAvatarFramePanel').fadeIn();
			$('#chAvatarFramePanel').append('<img class="newAvatar" id="avatar01" src="../images/avatar01.jpeg">');
			$('#chAvatarFramePanel').append('<img class="newAvatar" id="avatar02" src="../images/avatar02.jpeg">');
			$('#chAvatarFramePanel').append('<img class="newAvatar" id="avatar03" src="../images/avatar03.jpeg">');
		}
		else
		{
			$('#chAvatarFramePanel').fadeOut();
			$('#chAvatarFramePanel').remove();
			$('#avatarSectionPanel').append('<div id="chAvatarFramePanel"></div>');
		}
	})

	// Sélection d'un nouvel avatar
	$(document).on('click', '.newAvatar', function()
	{
		var avatarSrc = $(this).attr('src');
		$('#chAvatarFramePanel').fadeOut();
		$('#chAvatarFramePanel').remove();
		$('#avatarSectionPanel').append('<div id="chAvatarFramePanel"></div>');
		socket.emit('newAvatar', avatarSrc);
	})

	// Affiche les infos de l'User
	socket.on('userInfos', function(user)
	{
		$('#usernamePanel').text(user.username);
		$('#avatarPanel').attr('src', user.avatar);
		$('#' + user.id).attr('src', user.avatar);
	})

			//-------- Statistiques -------//

	// Met à jour le compteur de connectés
	socket.on('usersCount', function(usersCount)
	{
		$('#usersCount').text(usersCount);
	})

	// Parties créées
	socket.on('roomsCount', function(roomsCount)
	{
		$('#roomsCount').text(roomsCount);
	})	

	// Games en cours
	socket.on('gamesCount', function(gamesCount)
	{
		$('#gamesCount').text(gamesCount);
	})	

	// Joueurs en pleine partie
	socket.on('playersCount', function(playersCount)
	{
		$('#playersCount').text(playersCount);
	})

})(jQuery);