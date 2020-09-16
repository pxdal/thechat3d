"use strict";

// socket
const socket = io();

// environment/camera/renderer
let environment, camera, renderer;

// camera
let fov = 75;
let aspect = window.innerWidth / window.innerHeight;
let near = 0.1;
let far = 1000;

init();

// main
animate();

// methods
function init(){
  // environment
  environment = createEnvironment(socket);
  environment.scene.background = new THREE.Color( 0x000000 );
 
  // camera
  camera = new PerspectiveCamera( fov, aspect, near, far );
  
  // renderer
  renderer = initRenderer();
}

function animate(){
  // call next frame
  requestAnimationFrame( animate );
  
  // render the scene
  renderer.render( environment.scene, camera );
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

// bind event listeners

//socket
socket.on("serverEntityIDResponse", environment.serverEntityIDResponse.bind(environment)); //bind environment so "this" calls aren't screwed
socket.on("serverEntityCacheResponse", environment.serverEntityCacheResponse.bind(environment));
socket.on("serverEntityDynamicResponse", environment.serverEntityDynamicResponse.bind(environment));

//window
window.addEventListener("resize", resize);



