// merry christmas

// load modules
const path = require("path");
const http = require("http");
const express = require("express");
const socket = require("socket.io");
const fs = require("fs");
const flatted = require("flatted");
const c3ds = require("./c3ds"); //"chat 3d server" module

// globals
const app = express();
const server = http.Server(app);
const io = socket(server);

let sockets = []; //stores sockets
sockets.pull = pull; //TODO this is stupid

let port = 80; //set to 80 for public

// main

// constants
const yborder = -25;
const posZero = {x: 0, y: 0, z: 0};

// environment (+map)
let environment = c3ds.createEnvironment("main"); //I should probably remove the name there's no point
let chat = c3ds.createChat();
let map = c3ds.createMap();
let kothMap = c3ds.createMap();
let christmasMap = c3ds.createMap();

map.loadDataFromFile("maps/ordinary.json");
kothMap.loadDataFromFile("maps/koth.json");
christmasMap.loadDataFromFile("maps/christmas.json");

let maps = {
	map: map,
	koth: kothMap,
	christmas: christmasMap
};

environment.changeMap(maps.christmas);

environment.onMapChange = function(map){
	for(let entity of this.serverEntities){
		if(map.name == "koth" && entity.socket){
			let ffw = createFFW();
			
			entity.pushItem(ffw);
		} else {
			entity.clearInventory();
		}
	
		entity.respawn();
	}
};

// the chat bot
let theChatBot = {
	username: "The Chat Bot",
	color: "e31e31",
};
chat.pushUser(theChatBot);

// entities
let logan = c3ds.createPhysicsEntity(environment, {x: 8.5, y: 0.1, z: 8.5}, {x: 0, y: 225*Math.PI/180, z: 0}, {x: 1.0, y: 1.0, z: 1.5}, environment.generateID(), randomColor(), "cannon", false, "null");
logan.gravity = 0;
logan.changeGravity = false;
//environment.pushServerEntity(logan);

// fingerwarmers
let ffw = createFFW();
ffw.physical.position = {
	x: 0.1,
	y: 2,
	z: 0.1
};
environment.pushServerEntity(ffw.physical);

// map switch timer
let mapSwitch = c3ds.createTimerEntity(environment, posZero, posZero, posZero, environment.generateID(), 300000, [chat, theChatBot, sockets]);
mapSwitch.onTimerEnd = function(p){
	let current = this.environment.map;
	let chat = p[0];
	let tcb = p[1];
	let sockets = p[2];
	
	if(current.name == "christmas"){
		chat.createMessage(tcb.username, tcb.color, "KOTH begins now!  Everyone has Festive Fingerwarmers, last one standing has bragging rights!  Ends in 1 minute.", sockets);
		environment.changeMap(maps.koth);
		this.amount = 30000;
		this.start();
	} else if(current.name == "koth"){
		let winners = [];
		
		for(let entity of this.environment.serverEntities){
			if(entity.socket){
				let plat = current.createObject({
					x: 0,
					y: 1.5,
					z: 0
				}, {
					x: 0,
					y: 0,
					z: 0
				}, {
					x: 6,
					y: 3,
					z: 6
				});
				
				if(c3ds.rrCol(entity, plat)){
					winners.push(chat.getUserBySocket(entity.socket).username);
				}
			}
		}
		
		let message = "Users: " + winners + " were on top.";
		if(winners.length == 1){
			message = "User: " + winners + " was on top.";
		} else if(winners.length == 0){
			message = "No one was on top.";
		}
		
		chat.createMessage(tcb.username, tcb.color, "KOTH is over!  " + message + "  KOTH begins again in 5 minutes!", sockets);
		environment.changeMap(maps.christmas);
		
		this.amount = 300000;
		this.start();
	}
}
mapSwitch.start();

// game loop (60fps)

let gravity = -0.1;

let f = 0;
let d = Date.now();

let gameLoop = c3ds.createGameLoop(20, () => {	
	// set delta
	environment.delta = Date.now() - d;
	d = Date.now();
	
	environment.gravity();
		
	// update entities
	environment.update(yborder);	
	environment.updateItems();
	
	// input
	environment.requestInputAll();
	
	//increase frame
	f++;
});
environment.expected = 1000/60;
//gameLoop.running = true;

// command loop (2fps)

let content = "", contentOld = "", client = null;
let ready = true;

let stream = fs.createReadStream(__dirname + '/command.txt');

stream.on('data', (chunk) => {	
	content += chunk;
});

stream.on('end', () => {
	contentOld = content;
	ready = true;
});

let commandLoop = c3ds.createGameLoop(2, () => {
	// Commands
	if(ready){
		if(contentOld == content || content == "") {
			contentOld = content;
			content = "";
		
			stream = fs.createReadStream(__dirname + '/command.txt');
			stream.on('data', (chunk) => {
				content += chunk;
			});

			stream.on('end', () => {
				ready = true;
			});
			
			return;
		}
		
		let contentSplit = content.toString().replace("\n", "").split(" ");

		let command = contentSplit.shift();
		let parameters = contentSplit;
		
		/* Commands start here */
		switch(command){
			case "stop": {//kick all sockets from the server and shutdown
				
				console.log("kicking sockets...");
				for(let i = 0; i < sockets.length; i++){
					sockets[i].disconnect();
				}
				
				console.log("closing server");
				io.close();
				
				break;
			}
			case "bu":
			case "bindUsername": { //bind socket to client by username for other commands which require it
				console.log("binding username");
				
				let username = combine(parameters);
				
				let user = chat.getUserByUsername(username);
				
				if(user == null){
					console.log("invalid username: [" + username + "]");
					break;
				}
				
				client = user.socket;
				
				break;
			}
			case "bindId":
			case "bindID":
			case "bi": {
				console.log("binding id");
				
				let id = combine(parameters);
				
				let entity = environment.getEntityByID(id);
				
				if(entity == null){
					console.log("invalid id: " + id);
					break;
				}
				
				client = entity.socket;
				
				break;
			}
			case "changePos": //change position of bound client
			case "changePosition":
			case "changeP":
			case "cp": {
				let entity = environment.getEntityBySocket(client);
				
				if(entity == null) break;
				
				let x = parameters[0] == "~" ? entity.position.x : parseFloat(parameters[0], 10);
				let y = parameters[1] == "~" ? entity.position.y : parseFloat(parameters[1], 10);
				let z = parameters[2] == "~" ? entity.position.z : parseFloat(parameters[2], 10);
						
				entity.position.x = x;
				entity.position.y = y;
				entity.position.z = z;
				
				console.log("User [" + chat.getUserBySocket(client).username + "] position was changed to: " + entity.position.x + ", " + entity.position.y + ", " + entity.position.z);
				break;
			}
			case "changeVelocity":
			case "changeVel":
			case "changeV":
			case "cv": {
				let entity = environment.getEntityBySocket(client);
				
				if(entity == null) break;
				
				let x = parameters[0] == "~" ? entity.velocity.x : parseFloat(parameters[0], 10);
				let y = parameters[1] == "~" ? entity.velocity.y : parseFloat(parameters[1], 10);
				let z = parameters[2] == "~" ? entity.velocity.z : parseFloat(parameters[2], 10);
				
				entity.velocity.x = x;
				entity.velocity.y = y;
				entity.velocity.z = z;
				
				console.log("User [" + chat.getUserBySocket(client).username + "] velocity was changed to: " + entity.velocity.x + ", " + entity.velocity.y + ", " + entity.velocity.z);
				break;
			}
			case "sm":
			case "sendMessage": {//send a message from the server as "Server"
				let serverUser = {
					username: "Server",
					color: "8a8a8a",
				};
				
				let message = combine(parameters);
				
				chat.createMessage(serverUser.username, serverUser.color, message, sockets);
				
				console.log("message sent from server: " + message);
				break;
			}
			case "onlineList":
			case "ol": {
				console.log("Online users:");

				for(let i = 0; i < chat.users.length; i++){
					let u = chat.users[i];
					let e = environment.getEntityBySocket(u.socket);
					
					e = e == null ? undefined : e;
					
					let uname = u.username == undefined ? "This socket has no bound user" : "[" + u.username + "]";
					let id = e == null || e.id == undefined? "This user has no bound entity" : e.id;
					
					console.log("Username " + uname + ", Entity ID: " + id);
				}
				
				break;
			}
			case "setProperty":
			case "sp": {
				// syntax: sp [property] [type] <value> (set [property] of [type] to <value>)
				// or: sp [property] (console.log [property])
				// type can be: number (num, int, float), boolean (bool), or string.  object and array not supported
				
				
				let prop = parameters[0];
				let type = parameters[1];
				let value = parameters[2];
				
				let entity = environment.getEntityBySocket(client);
				
				if(entity == null) return;
				
				if(!type || !value){
					console.log(entity[prop]);
				} else {
					if(type == "number" || type == "num" || type == "int" || type == "float"){
						value = parseFloat(value, 10);
					} else if(type == "boolean" || type == "bool"){
						if(value == "true"){
							value = true;
						} else {
							value == false;
						}
					}
					
					entity[prop] = value;
				}
				
				break;
			}
			case "changeMap":
			case "cm": {
				if(maps[parameters[0]]){
					environment.changeMap(maps[parameters[0]]);
				}
				
				break;
			}
			default:
				break;
		}
		
		contentOld = content;
		
		content = "";
			
		ready = false;
		
		stream = fs.createReadStream(__dirname + '/command.txt');
		stream.on('data', (chunk) => {
			content += chunk;
		});

		stream.on('end', () => {
			ready = true;
		});
	}

});
commandLoop.running = true;

// socket
io.on("connection", socket => {
	gameLoop.running = true;
  console.log("New socket connected"); //acknowledge existence of socket
	sockets.push(socket);

  //Bind events (have to be called in function to be able to add socket as a parameter, TODO fix this stupid shortcut)	
  socket.on("clientReady", () => {
  	clientReady(socket);
  });
  
  socket.on("disconnect", (reason) => {
  	disconnect(reason, socket);
  });

  socket.on("serverEntityCacheRequest", (id) => {
  	environment.serverEntityCacheRequest(socket, id);
  });
  
  socket.on("serverEntityDynamicRequest", (id) => {
  	environment.serverEntityDynamicRequest(socket, id);
	});
	
	socket.on("clientInputResponse", (input) => {
		environment.clientInputResponse(input, socket);
	});
	
	socket.on("clientUsername", (username) => {
		clientUsername(username, socket, sockets);
	});
	
	socket.on("clientNewMessage", (message) => {
		chat.clientNewMessage(message, socket, sockets);
	});
});

// server
initServer();


// event listeners

//on disconnect
function disconnect(reason, socket){
	console.log("socket disconnect");
	
	let client = environment.getEntityBySocket.bind(environment)(socket);
	
	if(client !== null){
		if(client.inventory){
			for(let item of client.inventory){
				item.drop({x: client.position.x, y: client.position.y, z: client.position.z});
			}
		}
		
		environment.pullServerEntity(client); //if the client intentionally disconnected, pull entity
	}
	
	sockets.pull(socket);
	
	if(sockets.length == 0){
		gameLoop.running = false;
	}
	
	let user = chat.getUserBySocket(socket);
	
	if(user !== null){
		chat.pullUser(user);
		
		chat.createMessage(theChatBot.username, theChatBot.color, "User [" + user.username + "] has foolishly left The Chat 3D.", sockets);
		console.log("User [" + user.username + "] has left.");
	}
}

// when client is ready
function clientReady(socket){		
	if(environment.checkSocket(socket)) return;
	
	// Send map data
	environment.map.sendData(socket);
	
	// Send the client the server entities (excluding itself)
	environment.sendEntities(socket);
	
	// Send the client an entity to bind to
	let clientEntity = initClientEntity(socket);
	
	socket.emit("clientEntityIDResponse", clientEntity.id);
	
	environment.pushServerEntity(clientEntity);
	
	chat.getUserBySocket(socket).color = chat.toHex(environment.getColor(socket));

	for(let entity of environment.serverEntities){
		entity.sendItems(socket);
	}
}

// when a client sends a username
function clientUsername(username, socket, sockets){
	let color = environment.getColor(socket);
	
	let tcb = chat.getUserByUsername("The Chat Bot");
	
	let time = Math.ceil((mapSwitch.amount - (new Date() - mapSwitch.started))/1000/60);
	
	if(username == null){
		username = "";
		for(let i = 0; i < 8; i++){
			let c = Math.floor(Math.random()*94)+32;
			
			username += String.fromCharCode(c);
		}
	} else if(username.length < 1){
		username = "";
		for(let i = 0; i < 8; i++){
			let c = Math.floor(Math.random()*94)+32;
			
			username += String.fromCharCode(c);
		}
	}
			
	chat.createMessage(tcb.username, tcb.color, "User [" + username + "] has joined The Chat 3D.  Map changes in " + time + " minutes!", sockets);
	
	chat.clientUsername(username, color, socket, sockets);
}


// utils (that I couldn't bother putting into another file)
function initServer(){
  app.set('port', port);
  app.use("/static/", express.static(__dirname + "/static"));
  
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
  });
  
	app.get("/up", (req, res) => {
		res.send("if you are reading this, the server is up");
	});
	
	app.get("/online", (req, res) => {
		console.log(req._parsedUrl.query);
		
		let list = JSON.stringify({
			online: onlineUsers()
		});
		
		res.send(list);
	});
	
  server.listen(port, '0.0.0.0', () => {
    console.log("server open, listening");
  });
}

//generates a random hex color
function randomColor(mode){
	return Math.floor(Math.random() * 16777216);
}

//generates random spoky color
function randomSpokyColor(){
	let colors = [{"r": 255, "g": 132, "b": 0}, {"r": 200, "g": 0, "b": 255}, {"r": 255, "g": 225, "b": 0}];
	
	let index = Math.floor((Math.random()-0.00001) * colors.length);
	let base = colors[index];
	let offset = Math.floor(Math.random() * 20);
	
	base.r += index == 1 ? offset : 0;
	base.g += offset;
	base.b += index-1 == 1 ? offset * 5 : 0;
	
	return rgbToHex(base);
}

// convert rgb to hex
function rgbToHex(color){
	let r = zeroes(color.r.toString(16));
	let g = zeroes(color.g.toString(16));
	let b = zeroes(color.b.toString(16));
	
	let hex = r + g + b;
	
	return parseInt(hex, 16);
}

//adds indexes shit idk
function zeroes(hex){
	hex = hex.replace("-", "");
	if(hex.length == 1){
		hex = "0" + hex;
	}
	
	return hex;
}

//generates a random xyz coordinate from -(a/2) to (a/2)
function randomCoords(mx, my, mz){
	return {
		x: Math.floor(Math.random() * (mx+1)) - mx/2,
		y: 2,//Math.floor(Math.random() * (my+1)) - my/2,
		z: Math.floor(Math.random() * (mz+1)) - mz/2,
	};
}

// pulls element from array (bind)
function pull(element){
	this.splice(this.indexOf(element), 1);
	
	return this;	
}

//inits a client entity
function initClientEntity(socket){
	let user = chat.getUserBySocket(socket);
	
	let face = "smiley";
	let model = "null";
	
	if(user.username.toLowerCase() == "smugbox" || user.username.toLowerCase() == "ryan"){
		//face = "smugbox";
		model = "smugbox";
	}
	
	let clientEntity = c3ds.createSocketBoundEntity(environment, randomCoords(16, 0, 16), randomCoords(0, Math.PI*2, 0), {x: 1, y: 1, z: 1}, environment.generateID(), randomColor(), model, socket, true, face); //create a new entity for the client
	
	clientEntity.gravity = gravity;
	
	clientEntity.respawn();
	
	clientEntity.position.override = true;
	clientEntity.rotation.override = true;
	clientEntity.cameraRotation.override = true;
	
	clientEntity.createTrigger(null, "onCollide", (self, out, parameters) => {
		if(out.id == logan.id){
			if(!self.interactive) return;

			self.interactive = false;
			self.locked = true;
			self.gravity = 0;
			
			self.velocity.x = 0;
			self.velocity.y = 0;
			self.velocity.z = 0;
			
			self.position.x = logan.position.x;
			self.position.y = 1;
			self.position.z = logan.position.z;
			
			self.rotation.x = 0;
			self.rotation.y = 270*Math.PI/180;
			self.rotation.z = 0;
			
			self.cameraRotation.x = self.rotation.x ;
			self.cameraRotation.y = self.rotation.y;
			self.cameraRotation.z = self.rotation.z;
			
			setTimeout((s) => {
				s.gravity = -0.01;
				s.interactive = true;
				s.locked = false;
				s.speedcap = false;
				s.force(1.5, 1, 1.5);
			}, 1000, self);
		}
		
		/*for(let i = 0; i < ghosts.length; i++){
			let g = ghosts[i];
			
			if(out.id == g.id){
				self.force(out.velocity.x*1.35, 0, out.velocity.z*1.35);
			}
		}*/
	});
	
	clientEntity.createTrigger(null, "onMapCollide", (self, out, parameters) => {
		self.speedcap = true;
		self.interactive = true;
	});
	
	clientEntity.createTrigger(null, "respawn", (self, out, parameters) => {
		self.interactive = true;
		self.speedcap = true;
	});
		
	return clientEntity;
}

function createFFW(){
	let ffw = c3ds.createItemEntityFromJSON(environment, environment.generateID(), "items/ffw.json");
	
	ffw.initPhysical();
	
	ffw.onUse = function(self, holder){
		//a bit quick-fixey, but create a "map object" to see if we should punch an entity.  this is useful because it fits right into entity collision functions without having to be rendered.
		let punch = environment.map.createObject({
			x: (Math.sin(holder.rotation.y)*(holder.size.x/2)*-2)+holder.position.x,
			y: holder.position.y,
			z: (Math.cos(holder.rotation.y)*(holder.size.z/2)*-2)+holder.position.z
		}, {
			x: 0,
			y: 0,
			z: 0
		}, {
			x: 0.01,
			y: 0.01,
			z: 0.01
		});
		
		for(let entity of holder.environment.serverEntities){
			if(entity.id == holder.id) continue;
			
			if(c3ds.rrCol(punch, entity)){
				entity.force(-2.15*Math.sin(holder.rotation.y), 0, -2.15*Math.cos(holder.rotation.y));
			}
		}
		
		setTimeout(() => {
			self.changeState("neutral");
		}, 500);
	};
	
	ffw.createTrigger(null, "respawn", (self, out) => {
		self.position = randomCoords(16, 0, 16);
		self.position.y = 2;
	});
	
	return ffw;
}

function createGhost(position, rotation){
	let ghost = c3ds.createPhysicsEntity(environment, position, rotation, {x: 1, y: 1, z: 1}, environment.generateID(), 0xe6d1be, "null", true, "boo");
	ghost.gravity = -0.0005;
	ghost.launching = false;
	
	while(ghost.checkMapCollisions(environment.map.objects)){
		ghost.position = randomCoords(16, 0, 16);
	}
	
	ghost.createTrigger(null, "onCollide", (self, out, parameters) => {
		if(out.id == logan.id){
			if(self.locked) return;
			
			
			
			self.locked = true;
			self.interactive = false;
			self.launching = true;
			self.gravity = 0;
			
			
			self.velocity.x = 0;
			self.velocity.y = 0;
			self.velocity.z = 0;
			
			self.position.x = logan.position.x;
			self.position.y = 1;
			self.position.z = logan.position.z;
			
			self.rotation.x = 0;
			self.rotation.y = 180*Math.PI/180;
			self.rotation.z = 0;
			
			setTimeout((s) => {
				let base = 270*Math.PI/180;
				
				s.gravity = -0.01;
				s.locked = false;
				s.speedcap = false;
				s.force(1.5*(base-logan.rotation.y)/base, 2, 1.5*logan.rotation.y/base);
			}, 1000, self);
		}
	});
	
	ghost.createTrigger(null, "onMapCollide", (self, out, parameters) => {
		self.speedcap = true;
		self.interactive = true;
		self.locked = false;
		self.launching = false;
		self.gravity = -0.0005;
	});
	
	ghost.createTrigger(null, "respawn", (self, out, parameters) => {
		self.interactive = true;
		self.locked = false;
		self.launcing = false;
		self.speedcap = true;
		self.velocity.y = -1;
		self.gravity = -0.0005;
	});
	
	return ghost;
}

function onlineUsers(){
	let list = [];
	
	for(let i = 0; i < chat.users.length; i++){
		let u = chat.users[i];
		let e = environment.getEntityBySocket(u.socket);
		
		let uname, id;
		if(u !== null){
			uname = !u.username ? "This socket has no bound user" : "[" + u.username + "]";
		}
		if(e !== null){
			id = !e.id ? "This user has no bound entity" : e.id;
		}
		
		list.push({
			username: uname,
			id: id
		});
	}
	
	return list;
}

//https://stackoverflow.com/a/31557814/7381705
function simpleStringify (object){
	let simpleObject = {};
	for (let prop in object ){
		if(!object.hasOwnProperty(prop)){
			continue;
		}
		if(typeof(object[prop]) == 'object'){
			continue;
		}
		if(typeof(object[prop]) == 'function'){
			continue;
		}
		simpleObject[prop] = object[prop];
	}
	return JSON.stringify(simpleObject); // returns cleaned up JSON
};

// combine array of strings by space
function combine(parameters){
	let message = "";
	
	for(let i = 0; i < parameters.length; i++){
		message += parameters[i] + " ";
	}
	
	message = message.substr(0, message.length-1);
	
	return message;
}
