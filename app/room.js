function Room(name, id, owner){
	this.name = name;
	this.id = id;
	this.owner = owner;
	this.users = [];
	this.status = "available";
};

Room.prototype.addUser = function(userID){
	if (this.status === "available"){
		this.users.push(userID);
	}
};

module.exports = Room;