"use strict";

let self = {a: 0, b: 1}; //global client entity

// socket
const socket = io();

// environment/camera/renderer
let environment, camera, renderer, stats, clock;

// camera
let fov = 75;
let aspect = window.innerWidth / window.innerHeight;
let near = 0.1;
let far = 1000;

init();

// main
clock.start();
animate();

// methods
function init(){
  // environment
  environment = createEnvironment(socket);
  environment.scene.background = new THREE.Color( 0x000000 );
	
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
}

function animate(){
	// set delta
	let delta = clock.getDelta();
		
  // call next frame
  requestAnimationFrame( animate );
  
  // Check for input if a key is being pressed
  if( Object.values(keys).includes(true) ){
  	if(keys.KeyW){
  		
  	} else if(keys.KeyS){
  	
  	}
  	
  	if(keys.KeyA){
  		
  	} else if(keys.KeyD){
  	
  	}
  }
  
  try {
		if(self.fps){
			// updates camera
			self.fps.update(delta);
		}
	} catch( e ) { console.warn("an entity hasn't been sent to the client yet"); }
  
  // render the scene
  renderer.render( environment.scene, camera );
	
	// fetch dynamic entity positions
	environment.update();
	
	// update stats
	stats.update();
}

function createStats(){
	let stats = new Stats();
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
  
  if(self.fps){
		//Update fps controls
		self.fps.handleResize();
	}
}

function unload(){
	renderer.dispose();
}

// bind event listeners

//socket
socket.on("serverEntityIDResponse", environment.serverEntityIDResponse.bind(environment)); //bind environment so "this" calls aren't screwed
socket.on("serverEntityCacheResponse", environment.serverEntityCacheResponse.bind(environment));
socket.on("serverEntityDynamicResponse", environment.serverEntityDynamicResponse.bind(environment));
socket.on("clientEntityIDResponse", (id) => {
	environment.clientEntityIDReponse(id, camera, self);
});

//window
window.addEventListener("resize", resize);



