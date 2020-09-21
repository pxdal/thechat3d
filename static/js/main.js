"use strict";

// socket
const socket = io();

// environment/camera/renderer
let environment, chat, camera, renderer, stats, clock;

// camera
let fov = 75;
let aspect = window.innerWidth / window.innerHeight;
let near = 0.1;
let far = 1000;

init();

// main
//clock.start();
//animate();

// methods
function init(){
  // environment
  environment = createEnvironment(socket);
  environment.scene.background = new THREE.Color( 0x000000 );
	
	// chat
	chat = createChat(socket);
	chat.initInput();
	chat.initDomElement(document.body);
	
  // camera
  camera = new PerspectiveCamera( fov, aspect, near, far );
  
  // clock
  clock = new Clock( false );
  
  // stats
  stats = createStats();
	document.body.append( stats.dom );
	
  // renderer
  renderer = initRenderer();
  
  socket.emit("clientReady");
  
  chat.setUsername();
}

function animate(){
	// set delta
	let delta = clock.getDelta();
		
  // call next frame
  requestAnimationFrame( animate );
  
  environment.checkScene(); //adds entities to scene TODO make this not stupid
  
  environment.clientEntity.setCamera();
  // if there is an input change request it
  if(Object.values(keys).includes(true)){
  	environment.clientEntity.bindInput(createInput(["KeyW", "KeyA", "KeyS", "KeyD"]));
  	
  	if(document.activeElement !== chat.input) environment.requestInput();
  	
  	//TODO make this less unintuitive
  	if(keys.KeyT){
  		chat.input.focus();
  	}

  	if(keys.Enter){
  		if(document.activeElement !== chat.input) return;
  		
  		chat.input.blur();
  		
  		if(chat.username !== null){
  			chat.newMessage();
  		}
  	}
  }
  
  // Update fps controls (not active rn)
	//environment.clientEntity.fps.update(delta);

  // render the scene
  renderer.render( environment.scene, camera );
	
	// fetch dynamic entity positions
	environment.updateClient();
	environment.update();
	
	// update stats
	stats.update();
}

function createStats(){
	let stats = new Stats();
	
	//throw fps counter to top right
	stats.dom.style.left = "unset";
	stats.dom.style.right = "0px";
	stats.showPanel( 0 );
	
	return stats;
}

// event handlers
function resize(){
  //set aliases
  width = window.innerWidth;
  height = window.innerHeight;
  
  //update renderer
  renderer.setSize( width, height );
  
  //update camera
  camera.aspect = width/height;
  camera.updateProjectionMatrix();
  
  /*if(environment.clientEntity.fps){
		//Update fps controls
		environment.clientEntity.fps.handleResize();
	}*/
}

function unload(){
	renderer.dispose();
}

// bind event listeners

//socket
socket.on("serverPromptError", (error) => {
	alert(error);
});

socket.on("serverEntityIDResponse", environment.serverEntityIDResponse.bind(environment)); //bind environment so "this" calls aren't screwed
socket.on("serverEntityCacheResponse", environment.serverEntityCacheResponse.bind(environment));
socket.on("serverEntityDynamicResponse", environment.serverEntityDynamicResponse.bind(environment));
socket.on("serverEntityPull", environment.serverEntityPull.bind(environment));
socket.on("serverNewMessage", chat.serverNewMessage.bind(chat));
socket.on("clientEntityIDResponse", (id) => {
	console.log("client id: " + id);
	environment.clientEntityIDReponse(id, camera);
	clock.start();
	animate();
});

//window
window.addEventListener("unload", unload);
window.addEventListener("resize", resize);



