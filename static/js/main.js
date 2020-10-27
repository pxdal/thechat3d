"use strict";

// socket
const socket = io();

// whether or not to display debug info
let debug = false; //defaults to false

// environment/camera/renderer
let environment, chat, camera, listener, audioLoader, music, renderer, stats, clock, pog;

// camera
let fov = 75;
let aspect = window.innerWidth / window.innerHeight;
let near = 0.1;
let far = 1000;

// textures
let cubeMapLoader = new THREE.CubeTextureLoader();

let textures = ["smiley.png", "stonks.png", "space.jpg", "ahh.png", "smugbox.png"];
let halloweenTextures = ["stolen_skybox.png", "spoky.png"];

let textureCache = createTextureCache();
let modelCache = createModelCache();

// load textures
textureCache.setPath("static/media/textures/ordinary/");
textureCache.cache(textures);

textureCache.setPath("static/media/textures/halloween_event/");
textureCache.cache(halloweenTextures);

// load models
let models = ["cannon.obj", "smugbox.obj"];

modelCache.setPath("static/media/models/ordinary/");
modelCache.cache(models);

cubeMapLoader.setPath('static/media/textures/halloween_event/bg/');

pog = cubeMapLoader.load( [
	'px.jpg',
	'nx.jpg',
	'py.jpg',
	'ny.jpg',
	'pz.jpg',
	'nz.jpg'
] );

// input
let inputListener = createInputListener();

// main
init();

// methods
function init(){
  // environment
  environment = createEnvironment(socket);
	//set bg
	environment.scene.background = pog;
	
	// chat
	chat = createChat(socket);
	chat.initInput();
	chat.initDomElement(document.body);
	
  // camera + audio listener
  camera = new PerspectiveCamera( fov, aspect, near, far );
  listener = new AudioListener();
  camera.add( listener );
	
	// music
  music = new Audio( listener );
  audioLoader = new AudioLoader();
    
  // clock
  clock = new Clock( false );
  
  // stats
  stats = createStats();
	document.body.append( stats.dom );
	
  // renderer
  renderer = initRenderer();
		  
	// input
	inputListener.addCallback("click", (e) => {
		renderer.domElement.requestPointerLock = renderer.domElement.requestPointerLock || renderer.domElement.mozRequestPointerLock;
		
		renderer.domElement.requestPointerLock();
	});
	
	chat.setUsername();
		
  socket.emit("clientReady");
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
  if( inputListener.keyPressed() ){
		if(!music.source){
			audioLoader.load( "static/media/sounds/c3d-whitenoise.ogg", function(buffer){
				music.setBuffer(buffer);
				music.setLoop(true);
				music.setVolume( 0.1 );
				music.play();
			});  
		}
	
  	chat.handleInput(inputListener.keys);
  }

	if(document.activeElement !== chat.inputElement && document.pointerLockElement === renderer.domElement){
		environment.clientEntity.bindInput(inputListener.createInput(["KeyW", "KeyA", "KeyS", "KeyD", "Space", "ShiftLeft", "MouseDelta"]));
	
		inputListener.calculateDelta(0.5);
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
		chat.updateDebug(environment.clientEntity.position.x, environment.clientEntity.position.y, environment.clientEntity.position.z, environment.clientEntity.rotation.x);
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
	environment.serverEntityCacheResponse(cache, id, cache.face == "null" ? false : textureCache.load(cache.face), cache.model == "null" ? null : modelCache.load(cache.model));
});
socket.on("serverEntityDynamicResponse", environment.serverEntityDynamicResponse.bind(environment));
socket.on("serverEntityPull", environment.serverEntityPull.bind(environment));
socket.on("serverNewMessage", chat.serverNewMessage.bind(chat));
socket.on("serverMapDataResponse", environment.serverMapDataResponse.bind(environment));
socket.on("clientEntityIDResponse", clientEntityIDResponse);
socket.on("clientInputRequest", environment.clientInputRequest.bind(environment));

//window
window.addEventListener("unload", unload);
window.addEventListener("resize", resize);



