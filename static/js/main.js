"use strict";

// socket
const socket = io();

// whether or not to display debug info
let debug = true; //defaults to true

// environment/camera/renderer
let environment, chat, camera, renderer, stats, clock;

// camera
let fov = 75;
let aspect = window.innerWidth / window.innerHeight;
let near = 0.1;
let far = 1000;

// textures
let loader = new TextureLoader();
let textures = ["smiley.png", "stonks.png", "bigsmile.jpg"];
let textureCache = cacheTextures(textures, loader);

// main
init();

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

// called every frame
function animate(){
	// set delta
	let delta = clock.getDelta();
		
  // call next frame
  requestAnimationFrame( animate );
  
  environment.checkScene(); //adds entities to scene TODO make this not stupid
  
  environment.clientEntity.setCamera(); // sets the camera's position
  
  // if there is an input change request it
  if( keyPressed() ){
  	environment.clientEntity.bindInput(createInput(["KeyW", "KeyA", "KeyS", "KeyD"]));
  	
  	if(document.activeElement !== chat.inputElement) environment.requestInput();
  	
  	chat.handleInput(keys);
  }

  // render the scene
  renderer.render( environment.scene, camera );
	
	// fetch dynamic entity positions
	environment.updateClient();
	environment.update();
	
	// debug
	if(debug){ 
		chat.debugElement.style.visibility = "visible";
	} else {
		chat.debugElement.style.visibility = "hidden";
	}
	
	if(environment.clientEntity.position !== null){
		chat.updateDebug(environment.clientEntity.position.x, environment.clientEntity.position.y, environment.clientEntity.position.z);
	}
	
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
}

function unload(){
	renderer.dispose();
}

function serverPromptError(error){
	alert(error);
}

function clientEntityIDResponse(id){
	environment.clientEntityIDResponse(id, camera);
	clock.start();
	animate();	
}

// bind event listeners

//socket
socket.on("serverPromptError", serverPromptError);
socket.on("serverEntityIDResponse", environment.serverEntityIDResponse.bind(environment)); //bind environment so "this" calls aren't screwed
socket.on("serverEntityCacheResponse", (cache, id) => {
	environment.serverEntityCacheResponse(cache, id, textureCache.bigsmile);
});
socket.on("serverEntityDynamicResponse", environment.serverEntityDynamicResponse.bind(environment));
socket.on("serverEntityPull", environment.serverEntityPull.bind(environment));
socket.on("serverNewMessage", chat.serverNewMessage.bind(chat));
server.on("serverMapDataResponse", environment.serverMapSend.bind(environment));
socket.on("clientEntityIDResponse", clientEntityIDResponse);

//window
window.addEventListener("unload", unload);
window.addEventListener("resize", resize);



