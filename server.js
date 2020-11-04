// white noise

// load modules
const path = require("path");
const http = require("http");
const express = require("express");
const socket = require("socket.io");
const fs = require("fs");
const c3ds = require("./c3ds"); //"chat 3d server" module

// globals
const app = express();
const server = http.Server(app);
const io = socket(server);

let sockets = []; //stores sockets
sockets.pull = pull; //TODO this is stupid

let port = 8080; //set to 80 for public

// main

// constants
const yborder = -25;

// environment (+map)
let environment = c3ds.createEnvironment("testEnvironment"); //I should probably remove the name there's no point
let chat = c3ds.createChat();
let map = c3ds.createMap();

map.loadDataFromFile("maps/halloween.json");

environment.pushMap(map);


// the chat bot
let theChatBot = {
	username: "The Chat Bot",
	color: "fa5c00", //e31e31
};
chat.pushUser(theChatBot);

// test entities
let logan = c3ds.createPhysicsEntity({x: -1.0, y: 0.1, z: 7.0}, {x: -90*Math.PI/180, y: 270*Math.PI/180, z: -90*Math.PI/180}, {x: 1.0, y: 1.0, z: 1.5}, environment.generateID(), randomColor(), "cannon", false, "null");
logan.gravity = 0;

environment.pushServerEntity(logan);

let ghostUser = {
	username: "Ghost",
	color: "e6d1be",
}
chat.pushUser(ghostUser);

let ghosts = [];

let g = createGhost(randomCoords(16, 0, 16), randomCoords(0, Math.PI*2, 0));
	
ghosts.push(g);
environment.pushServerEntity(g);

// game loop (65fps)

let gravity = -0.01;

let f = 0;

let mRate = 7800; //2 min
let eRate = 650;
let ghostTimer = 0;
let ghostActive = null;

let gameLoop = c3ds.createGameLoop(65, () => {	
	// gravity
	environment.gravity();
	
	// input
	environment.requestInputAll();
	
	// boo!
	if(f % mRate == 0){
		chat.createMessage(ghostUser.username, ghostUser.color, "Boo!", sockets);
	}

	if(f % eRate == 0){
		ghostTimer = 650;
		ghostActive = Math.floor(Math.random() * (ghosts.length-0.001));
	}
	
	if(ghostTimer > 0 && ghosts[ghostActive]){
		let g = ghosts[ghostActive];
		let target;
		if(environment.getEntityBySocket(sockets[ghostActive]) && !g.launching){ 
			target = environment.getEntityBySocket(sockets[ghostActive]);

			g.lookAt(target);
			
			if(true/*g.position.x < 9.4 && g.position.x > -9.4*/){
				g.force(-0.015 * Math.sin(g.rotation.y), 0, 0);
			}
			if(true/*g.position.z < 9.4 && g.position.z > -9.4*/){
				g.force(0, 0, -0.015 * Math.cos(g.rotation.y));
			}
			
			/*if(g.position.x > 9.4 || g.position.x < -9.4){
				g.position.x = Math.sign(g.position.x) * 9.35;
			}
			
			if(g.position.z > 9.4 || g.position.z < -9.4){
				g.position.z = Math.sign(g.position.z) * 9.35;
			}*/
		}
		
		ghostTimer--;
	}
	
	// update entities
	environment.update(yborder);
	
	//increase frame
	f++;
});


// command loop (2fps)

let content = "", contentOld = "", client = null;
let ready = true;

let stream = fs.createReadStream(__dirname + '/command.txt');

stream.on('data', (chunk) => {	
	content += chunk;
});

stream.on('end', () => {
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
			case "stop": //kick all sockets from the server and shutdown
				
				console.log("kicking sockets...");
				for(let i = 0; i < sockets.length; i++){
					sockets[i].disconnect();
				}
				
				console.log("closing server");
				io.close();
				
				break;
			case "bindUsername": //bind socket to client by username for other commands which require it
				console.log("binding username");
				
				let username = combine(parameters);
				
				let user = chat.getUserBySocket(username);
				
				if(user == null){
					console.log("invalid username: [" + username + "]");
					break;
				}
				
				client = user.socket;
				
				break;
			case "changePos": //change position of bound client
				if(client == null) break;
				
				let entity = environment.getEntityBySocket(client);
				
				let x = parameters[0] == "~" ? entity.position.x : parameters[0];
				let y = parameters[1] == "~" ? entity.position.y : parameters[1];
				let z = parameters[2] == "~" ? entity.position.z : parameters[2];
				
				entity.position.x = x;
				entity.position.y = y;
				entity.position.z = z;
				
				console.log("User: " + chat.getUserBySocket(client).username + "'s position was changed to: " + entity.position.x + ", " + entity.position.y + ", " + entity.position.z);
				break;
			case "sendMessage": //send a message from the server as "Server"
				let serverUser = {
					username: "Server",
					color: "8a8a8a",
				};
				
				let message = combine(parameters);
				
				chat.createMessage(serverUser.username, serverUser.color, message, sockets);
				
				console.log("message sent from server: " + message);
				break;
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


// socket
io.on("connection", socket => {
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
	
	environment.pullServerEntity(client); //if the client intentionally disconnected, pull entity
	
	let g = ghosts.shift();
	environment.pullServerEntity(g);
	
	sockets.pull(socket);
	
	let user = chat.getUserBySocket(socket);
	
	if(user !== null){
		chat.createMessage(theChatBot.username, theChatBot.color, "User [" + user.username + "] has foolishly left The Chat 3D.", sockets);
		console.log("User [" + user.username + "] has left.");
	}
}

// when client is ready
function clientReady(socket){
	// Send the client the server entities (excluding itself)
	environment.sendEntities(socket);
	
	// Send the client an entity to bind to
	let clientEntity = initClientEntity(socket);
	
	socket.emit("clientEntityIDResponse", clientEntity.id);
	
	environment.pushServerEntity(clientEntity);
	
	chat.getUserBySocket(socket).color = chat.toHex(environment.getColor(socket));
	
	let g = createGhost(randomCoords(16, 0, 16), randomCoords(0, Math.PI*2, 0));
	ghosts.push(g);
	environment.pushServerEntity(g);
		
	// Send map data
	environment.map.sendData(socket);
}

// when a client sends a username
function clientUsername(username, socket, sockets){
	let color = environment.getColor(socket);
	
	chat.clientUsername(username, color, socket, sockets);
}


// utils (that I couldn't bother putting into another file)
function initServer(){
  app.set('port', port);
  app.use("/static/", express.static(__dirname + "/static"));
  
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
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
		y: 0.75,//Math.floor(Math.random() * (my+1)) - my/2,
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
	
	let face = "spoky";
	let model = "null";
	
	if(user.username.toLowerCase() == "smugbox" || user.username.toLowerCase() == "ryan"){
		face = "smugbox";
		//model = "smugbox";
	}
	
	let clientEntity = c3ds.createSocketBoundEntity(randomCoords(16, 0, 16), randomCoords(0, Math.PI*2, 0), {x: 1, y: 1, z: 1}, environment.generateID(), randomSpokyColor(), model, socket, true, face); //create a new entity for the client
	
	while(clientEntity.checkMapCollisions(environment.map.objects)){
		clientEntity.position = randomCoords(16, 0, 16);
	}
	
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
			self.rotation.y = 180*Math.PI/180;
			self.rotation.z = 0;
			
			self.cameraRotation.x = self.rotation.x ;
			self.cameraRotation.y = self.rotation.y;
			self.cameraRotation.z = self.rotation.z;
			
			setTimeout((s) => {
				s.gravity = -0.01;
				s.interactive = true;
				s.locked = false;
				s.speedcap = false;
				s.force(0, 2, 2);
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
		self.velocity.y = -1;
	});
	
	return clientEntity;
}

function createGhost(position, rotation){
	let ghost = c3ds.createPhysicsEntity(position, rotation, {x: 1, y: 1, z: 1}, environment.generateID(), 0xe6d1be, "null", true, "boo");
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
				s.gravity = -0.01;
				s.locked = false;
				s.speedcap = false;
				s.force(0, 2, 2);
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

// combine array of strings by space
function combine(parameters){
	let message = "";
	
	for(let i = 0; i < parameters.length; i++){
		message += parameters[i] + " ";
	}
	
	message = message.substr(0, message.length-1);
	
	return message;
}
