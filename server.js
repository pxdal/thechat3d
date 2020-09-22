// load modules
const path = require("path");
const http = require("http");
const express = require("express");
const socket = require("socket.io");
const THREE = require("three.js");
const c3ds = require("./c3ds"); //"chat 3d server" module

// globals
const app = express();
const server = http.Server(app);
const io = socket(server);
let sockets = []; //stores sockets
sockets.pull = pull; //TODO this is stupid

// main
let environment = c3ds.createEnvironment("testEnvironment");
let chat = c3ds.createChat();

// socket
io.on("connection", socket => {
  console.log("New socket connected"); //acknowledge existence of socket
	sockets.push(socket);

  //Bind events (have to be called in function to be able to add socket as a parameter, TODO fix this stupid shortcut)	
  socket.on("clientReady", () => {
  	clientReady();
  });
  
  socket.on("disconnect", () => {
  	disconnect();
  });

  socket.on("serverEntityCacheRequest", (id) => {
  	environment.serverEntityCacheRequest(socket, id);
  });
  
  socket.on("serverEntityDynamicRequest", (id) => {
  	environment.serverEntityDynamicRequest(socket, id);
	});
	
	socket.on("clientInputRequest", (input) => {
		environment.clientInputRequest(input, socket);
	});
	
	socket.on("clientUsername", (username) => {
		clientUsername(username);
	});
	
	socket.on("clientNewMessage", (message) => {
		chat.clientNewMessage(message, socket, sockets);
	});
});

// server
initServer();


// event listeners

//on disconnect
function disconnect(reason){
	console.log("socket disconnect");
		
	let client = environment.getEntityBySocket.bind(environment)(socket);
	
	environment.pullServerEntity(client); //if the client intentionally disconnected, pull entity
	
	sockets.pull(socket);
	
	let user = chat.getUserBySocket(socket);
	
	if(user !== null){
		chat.createMessage("TheChatBot", "e31e31", "User [" + user.username + "] has foolishly left The Chat 3D.");
	}
			
	for(let i = 0; i < sockets.length; i++){
		let s = sockets[i];
		
		s.emit("serverEntityPull", client.id);
	}
}

// when client is ready
function clientReady(){
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
}

// when a client sends a username
function clientUsername(username){
	let color = environment.getColor(socket);
		
	chat.clientUsername(username, color, socket);
	
	chat.newMessage("The Chat Bot", "e31e31", "User [" + username + "] has joined The Chat 3D.");
}


// utils (that I couldn't bother putting into another file)
function initServer(){
  app.set('port', 80);
  app.use("/static/", express.static(__dirname + "/static"));
  
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
  });
  
  server.listen(80, '0.0.0.0', () => {
    console.log("server open, listening");
  });
}

//generates a random hex color
function randomColor(mode){
	return Math.floor(Math.random() * 16777216);
}

//generates a random xyz coordinate from -(a/2) to (a/2)
function randomCoords(mx, my, mz){
	return {
		x: Math.floor(Math.random() * (mx+1)) - mx/2,
		y: Math.floor(Math.random() * (my+1)) - my/2,
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
	let clientEntity = c3ds.createServerEntity(randomCoords(16, 0, 16), randomCoords(0, Math.PI*2, 0), environment.generateID(), randomColor(), null, socket); //create a new entity for the client
	
	environment.pushServerEntity(clientEntity);
	
	return clientEntity;
}
