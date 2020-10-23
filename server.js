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
let environment = c3ds.createEnvironment("testEnvironment");
let chat = c3ds.createChat();
let map = c3ds.createMap();

map.loadDataFromFile("map.json");

environment.pushMap(map);


// the chat bot
let theChatBot = {
	username: "The Chat Bot",
	color: "e31e31",
};
chat.pushUser(theChatBot);

// test entity
let logan = c3ds.createPhysicsEntity({x: 1, y: 0.5, z: 2}, {x: 0, y: 0, z: 0}, {x: 0.3, y: 0.3, z: 0.3}, environment.generateID(), randomColor(), "box");
//environment.pushServerEntity(logan);
 
// game loop (60fps)

let gravity = -0.01;

let gameLoop = c3ds.createGameLoop(65, () => {	
	// gravity
	environment.forceAll(0, gravity, 0);
	
	// input
	environment.requestInputAll();
	
	// update entities
	environment.update(yborder);
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
	
	sockets.pull(socket);
	
	let user = chat.getUserBySocket(socket);
	
	if(user !== null){
		chat.createMessage(theChatBot.username, theChatBot.color, "User [" + user.username + "] has foolishly left The Chat 3D.", sockets);
		console.log("User [" + user.username + "] has left.");
	}
	
	if(client !== null){
		for(let i = 0; i < sockets.length; i++){
			let s = sockets[i];
			
			s.emit("serverEntityPull", client.id);
		}
	}
}

// when client is ready
function clientReady(socket){
	// Send the client the server entities (excluding itself)
	environment.sendEntities(socket);
	
	// Send the client an entity to bind to
	let clientEntity = initClientEntity(socket);

	socket.emit("clientEntityIDResponse", clientEntity.id);
	
	// Send the new client entity to the other sockets
	for(let i = 0; i < sockets.length; i++){
		let s = sockets[i];
		
		if(s !== socket){
			environment.sendServerEntityID(s, clientEntity);
		}
	}
	
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
	
	let index = (sockets.length-1) % colors.length;
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
	
	console.log(r + ", " + g + ", " + b);
	
	let hex = r + g + b;
	
	console.log(hex);
	
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
	let clientEntity = c3ds.createSocketBoundEntity(randomCoords(16, 0, 16), randomCoords(0, Math.PI*2, 0), {x: 1, y: 1, z: 1}, environment.generateID(), randomSpokyColor(), null, socket); //create a new entity for the client
	
	environment.pushServerEntity(clientEntity);
	
	return clientEntity;
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
