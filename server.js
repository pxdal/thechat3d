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
	position: new THREE.Vector3(1, 0, -5),
	rotation: new THREE.Euler(0, 0, 0),
	id: "logan",
	material: new THREE.MeshBasicMaterial({color: 0x00ff00}),
	geometry: new THREE.BoxGeometry(),
};

let logan = c3ds.createServerEntity(stuff.position, stuff.rotation, stuff.id, stuff.material, stuff.geometry);
environment.pushServerEntity(logan);

// socket
io.on("connection", socket => {
  console.log("New socket connected"); //acknowledge existence of socket
  environment.sendServerEntityID(socket, logan);
  
  //Bind events
  socket.on("serverEntityCacheRequest", environment.serverEntityCacheRequest.bind(environment)); //make sure to bind all functions to environment so this calls aren't fucked up
  socket.on("serverEntityDynamicRequest", environment.serverEntityDynamicRequest.bind(environment));
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

