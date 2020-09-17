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

// main
let environment = c3ds.createEnvironment("testEnvironment");
let stuff = {
	position: {
		x:  1, 
		y:  0, 
		z: -5
	},
	rotation: {
		x: 0,
		y: 0,
		z: 0,
	},
	id: "logan",
	material: 0x00ff00,
	geometry: "box",
};

let i = 0;

let logan = c3ds.createServerEntity(stuff.position, stuff.rotation, stuff.id, stuff.material, stuff.geometry);
environment.pushServerEntity(logan);

setInterval(() => {
	stuff.rotation.x = i;	
	stuff.rotation.z = i;
	
	logan.rotation = stuff.rotation;
	
	i += 0.01;
}, 17);

// socket
io.on("connection", socket => {
  console.log("New socket connected"); //acknowledge existence of socket
  environment.sendServerEntityID(socket, logan);
  
  //Bind events (have to be called in function to be able to add socket as a parameter
  socket.on("serverEntityCacheRequest", (id) => {
  	environment.serverEntityCacheRequest(socket, id); //make sure to bind all functions to environment so this calls aren't fucked up
  });
  socket.on("serverEntityDynamicRequest", (id) => {
  	environment.serverEntityDynamicRequest(socket, id);
	});
});

// server
initServer();


// utils (that I couldn't bother putting into another file)
function initServer(){
  app.set('port', 8080);
  app.use("/static/", express.static(__dirname + "/static"));
  
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
  });
  
  server.listen(8080, () => {
    console.log("server started");
  });
}

