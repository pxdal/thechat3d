//The Chat 3D's server module

const fs = require("fs");

// creates a new environment for entities and map data
function createEnvironment(name){
  return {
    name: name, //optional name, more decorational than anything
    serverEntities: [], //all entities in the scene
    map: null, // map data for environment
    
    // REQUEST HANDLE METHODS //
    
    //Callback for "serverEntityCacheRequest" event, which returns entity values for the client to cache
    serverEntityCacheRequest: function(socket, id){
      let entity = this.getEntityByID(id);
      let cache = entity.cache();
      
      socket.emit("serverEntityCacheResponse", cache, id);
    },
    
    //Callback for "serverEntityDynamicRequest" event, which returns dynamic values that are expected to change
    serverEntityDynamicRequest: function(socket, id){
      let entity = this.getEntityByID(id);
      
      if(entity == null){
      	return null;
      }
      let dynamic = entity.dynamic();
      
      socket.emit("serverEntityDynamicResponse", dynamic, id);
    },

    // Callback for clientInputRequest
    clientInputResponse: function(input, socket){
    	let mode = "jump"; //modes: jump (jumps like normal), flight: applies constant up/down force (is affected by gravity)
    	let entity = this.getEntityBySocket(socket);
    	let speed = 0.01;
    	let rotSpeed = 0.04;
    	let jumpForce = 0.15;
    	let sensitivity = 100;
			
			if(input[6]){
				if(entity.cameraRotation.x > Math.PI/2 || entity.cameraRotation.x < -Math.PI/2){
					entity.cameraRotation.x = (entity.cameraRotation.x/Math.abs(entity.cameraRotation.x)) * Math.PI/2;
				} else if(entity.cameraRotation.x == Math.PI/2){
					if(input[6].y/Math.abs(input[6].y) == 1){
						entity.cameraRotation.x -= input[6].y/sensitivity;
					}
				} else if(entity.cameraRotation.x == -Math.PI/2){
					if(input[6].y/Math.abs(input[6].y) == -1){
						entity.cameraRotation.x -= input[6].y/sensitivity;
					}
				} else {
					entity.cameraRotation.x -= input[6].y/sensitivity;
				}
				
				entity.rotation.y -= input[6].x/100;
				entity.cameraRotation.y = entity.rotation.y;
			}
			
			// forward/backward
    	if(input[0]){
    		entity.force(-speed * Math.sin(entity.rotation.y), 0, -speed * Math.cos(entity.rotation.y));
    	}
    	if(input[2]){
    		entity.force(speed * Math.sin(entity.rotation.y), 0, speed * Math.cos(entity.rotation.y));
    	}
    	
			//strafing (mouse)
			if(input[1]){
				entity.force(-speed * Math.cos(entity.rotation.y), 0, speed * Math.sin(entity.rotation.y));
			}
			if(input[3]){
				entity.force(speed * Math.cos(entity.rotation.y), 0, -speed * Math.sin(entity.rotation.y));
			}

			// jump (jump)/fly (flight)
    	if(input[4]){
	  		if(entity.onGround || mode == "flight"){
	  			entity.force(0, jumpForce, 0);
	  			entity.onGround = false;
	  		}
    	}
			
			//descend (flight)
    	if(input[5]){
    		if(mode == "flight"){
    			entity.force(0, -jumpForce, 0);
    		}
    	}
    },
    
    
    // SENDERS //
    
    //Sends the id of an entity to the client for initialization
    sendServerEntityID: function(socket, entity){
    	socket.emit("serverEntityIDResponse", entity.id);
    },
    
    // Send server entities to socket
    sendEntities: function(socket){
    	for(let i = 0; i < this.serverEntities.length; i++){
    		let entity = this.serverEntities[i];

    		this.sendServerEntityID(socket, entity);
    	}
    },
    
    
    // UPDATE METHODS (run every frame)//
		
		// updates every entity's position
		update: function(yborder){
			// TODO this has to be in two seperate loops because of how collisions work, it's unintuitive and should be fixed
			for(let i = 0; i < this.serverEntities.length; i++){
				let entity = this.serverEntities[i];
				
				//check collisions of entities				
				entity.checkCollisions(this.serverEntities);
				
				//check collisions of map
				entity.checkMapCollisions(this.map.objects);
				
				if(entity.position.y < yborder){
					entity.respawn();
				}
			}
			
			for(let i = 0; i < this.serverEntities.length; i++){
				let entity = this.serverEntities[i];
				
				if(entity.type >= 1){
					if(entity.speedcap) entity.force(-entity.velocity.x/10, 0, -entity.velocity.z/10);
					entity.update();
				}
			}
		},
		
		requestInputAll: function(){
			for(let i = 0; i < this.serverEntities.length; i++){
				let entity = this.serverEntities[i];

				if(entity.socket){		
					entity.inputRequest();
				}
			}
		},
    
    // UTILS //
    
    //returns entity with the id specified
    getEntityByID: function(id){
      for(let i = 0; i < this.serverEntities.length; i++){
        let entity = this.serverEntities[i];
        
        if(entity.id == id){
          return entity;
        }
      }
      
      return null;
    },
    
    //checks if id is taken by an entity in serverEntities
    checkID: function(id){
      let taken = false;
      
      for(let i = 0; i < this.serverEntities.length; i++){
        let entity = this.serverEntities[i];
        
        taken = entity.id == id;
      }
      
      return !taken;
    },
    
    //pushes server entity to serverEntities, also checks if the id is taken
    pushServerEntity: function(entity){
			for(let i = 0; i < this.serverEntities.length; i++){
				if(this.serverEntities[i].type !== 2) continue;
				
				let s = this.serverEntities[i].socket;

				this.sendServerEntityID(s, entity);
			}
			
			this.serverEntities.push(entity);
    },
    
    //pulls server entity from serverEntities
    pullServerEntity: function(entity){
    	if(entity == null) return;
			
			for(let i = 0; i < this.serverEntities.length; i++){
				if(this.serverEntities[i].type !== 2) continue;
				
				let s = this.serverEntities[i].socket;
				
				s.emit("serverEntityPull", entity.id);
			}
	
      this.serverEntities.splice( this.serverEntities.indexOf(entity), 1 );
    },
    
    // push a map
		pushMap: function(map){
			this.map = map;
		},
		
    // generates a unique id for a new entity between 0 and 999
    generateID: function(){
    	let id;
    	
    	do {
    		id = Math.floor(Math.random() * 1000);
    	} while(!this.checkID(id));
    	
    	return id;
    },
    
    // Gets entity bound to socket
    getEntityBySocket: function(socket){
    	for(let i = 0; i < this.serverEntities.length; i++){
				let entity = this.serverEntities[i];
				
				if(entity.socket == socket){
					return entity;
				}
			}
			
			return null;
    },
    
    // Gets the color of the socket at the entity
		getColor: function(socket){
			let entity = this.getEntityBySocket(socket);
			
			if(entity == null) return 0;

			return entity.material;
		},
		
		// Applies a force to all entities, good for gravity and likewise
		forceAll: function(x, y, z){
			for(let i = 0; i < this.serverEntities.length; i++){
				let e = this.serverEntities[i];
				
				e.force(x, y, z);
			}
		},
		
		gravity: function(){
			for(let i = 0; i < this.serverEntities.length; i++){
				let entity = this.serverEntities[i];
				
				if(entity.type >= 1){
					entity.force(0, entity.gravity, 0);
				}
			}
		}
  };
}

// Create a new chat manager (completely seperate from environment because there's really no reason to relate the two)
function createChat(){
	return {
		users: [],
		
		
		// CLIENT //
		
		// Callback for when the chat receives a username request
		clientUsername: function(username, color, socket, sockets){
			if(username == null){
				username = "";
				for(let i = 0; i < 8; i++){
					let c = Math.floor(Math.random()*94)+32;
					
					username += String.fromCharCode(c);
				}
			} else if(username.length < 1){
				username = "";
				for(let i = 0; i < 8; i++){
					let c = Math.floor(Math.random()*94)+32;
					
					username += String.fromCharCode(c);
				}
			}
			
			let tcb = this.getUserByUsername("The Chat Bot");
			
			this.createMessage(tcb.username, tcb.color, "User [" + username + "] has joined The Chat 3D", sockets);
			
			console.log("User: [" + username + "] has joined");
			
			return this.pushUser( this.createUser(username, color, socket) );
		},
		
		// Callback for when a client sends a new message
		clientNewMessage: function(message, socket, sockets){
			let user = this.getUserBySocket(socket);
			
			let content = {
				username: user.username,
				color: user.color,
				message: message,
			};
			
			console.log("User: [" + content.username + "] sent message: \"" + content.message + "\"");
			
			this.sendMessage(content, sockets);
		},
		
		// sends message to all sockets
		sendMessage: function(content, sockets){
			for(let i = 0; i < sockets.length; i++){
				let s = sockets[i];
				s.emit("serverNewMessage", content);
			}
		},
		
		
		// UTILS //
		
		// Creates a new server message and sends it out to all sockets
		createMessage: function(username, color, message, sockets){
			let content = {
				username: username,
				color: color,
				message: message,
			};
			
			this.sendMessage(content, sockets);
		},
		
		// creates a user
		createUser: function(username, color, socket){
			color = this.toHex(color); 
			
			return {
				username: username,
				color: color,
				socket: socket,
			};
		},
		
		// pushes a user to users
		pushUser: function(user){
			this.users.push(user);
			return user;
		},
		
		// pulls a user from users
		pullUser: function(user){
			this.users.splice(this.users.indexOf(user), 1);
		},
		
		// gets a user by the socket
		getUserBySocket: function(socket){
			for(let i = 0; i < this.users.length; i++){
				let user = this.users[i];
				
				if(user.socket == socket){
					return user;
				}
			}
			
			return null;
		},
		
		// Returns the socket of the username
		getUserByUsername: function(username){
			for(let i = 0; i < this.users.length; i++){
				let user = this.users[i];
				
				if(user.username == username){
					return user;
				}
			}
			
			return null;
		},
		
		// filters out special characters and replaces them with html entities (based off of the function made by the guy who fixed the chat)
		htmlEntities: function(content){
			return content.toString().replace(/&/g, "&#38;").replace(/</g, "&#60;").replace(/>/g, "&#62;").replace(/"/g, "&#34;").replace(/'/g, "&#39;").replace(/\//g, "&#47;").replace(/\\/g, "&#92;");
		},
		
		// converts integer to hex
		toHex: function( number ){
			let str = number.toString(16);

			let strw = str.length;
			let padw = 6 - strw;

			let zeroes = "";
			
			for(let i = 0; i < padw; i++){
				zeroes += "0";
			}
			
			return zeroes + str;
		}
	};
}

// creates a base server entity (pretty useless, mainly just used to define base values for other extensions of this class)
function createServerEntity(position, rotation, size, id){
  return {
		type: 0,
		enabled: true, // whether or not the entity is enabled (will stay in serverEntities but will be invisible and won't be updated)
		position: position,
    rotation: rotation,
		size: size,
    id: id,
    onGround: false, //gamestate which stores whether or not the entity is touching the ground
		triggers: [], //triggers for other entities/map objects

    //Returns entity values that the server expects the client to cache (static values)
    cache: function(){
    	let entity = this;
    	
      return {
				size: entity.size,
      };
    },
    
    //Returns entity values that the server expects to change often (dynamic values)
    dynamic: function(){
      let entity = this;
      
      //note that the vectors are turned into x, y, z values because it's not as big, so the server can send them faster
      return {
      	position: entity.position,
      	rotation: entity.rotation
      };
    },
		
		//function to call at the start (or in some cases within) a triggerable function.  this will then fire all outputs when the function is called
		checkTriggers: function(action, parameters){
			for(let i = 0; i < this.triggers.length; i++){
				let trigger = this.triggers[i];
				
				if(trigger.action == action){
					trigger.output(this, parameters, trigger.parameters); // passes this and the entities to output by default
				}
			}
		},
		
		// create a trigger
		createTrigger: function(parameters, action, output){
			let t = {
				parameters: parameters,
				action: action,
				output: output
			};
			
			this.triggers.push(t);
		}
	};
}

// Create an entity that has physics
function createPhysicsEntity(position, rotation, size, id, material, model, interactive, face){
	let n = {
		type: 1,
		visible: true, //visiblity (defaults to true)
		interactive: interactive,
		gravity: -0.01,
		locked: false,
		speedcap: true, //whether or not to apply a cap to it's velocity (looking to change this to a value in the future)
		face: face,
		velocity: { //velocity defaults to 0
			x: 0,
			y: 0,
			z: 0,
		},
		oldVelocity: {
			x: 0,
			y: 0,
			z: 0,
		},
		material: material,
		model: model,
		
		// sets visibility
		setVisibility(visibility){
			this.checkTriggers("setVisibility");
			
			this.visible = visibility;
		},
		
		// store current velocity into oldVelocity (called before every velocity change)
    storeVelocity: function(){
    	this.oldVelocity.x = this.velocity.x;
    	this.oldVelocity.y = this.velocity.y;
    	this.oldVelocity.z = this.velocity.z;
    },
    
    // apply a vector of force to this entity
    force: function(x, y, z){
			this.checkTriggers("force");
			
			if(this.locked) return;
			
    	this.storeVelocity();
    	
    	this.velocity.x += x;
    	this.velocity.y += y;
    	this.velocity.z += z;
    },
    
    // update position from velocity
    update: function(){
			if(this.enabled){
				this.position.x += this.velocity.x;
				this.position.y += this.velocity.y;
				this.position.z += this.velocity.z;
			}
		},
    
    // returns true if self is colliding with another rectangular object (no rotation assumed)
    rrCollision: function(object){
    	return (this.position.x+this.size.x/2 > object.position.x-object.size.x/2 && this.position.x-this.size.x/2 < object.position.x+object.size.x/2 && this.position.z+this.size.z/2 > object.position.z-object.size.z/2 && this.position.z-this.size.z/2 < object.position.z+object.size.z/2 && this.position.y+this.size.y/2 > object.position.y-object.size.y && this.position.y-this.size.y/2 < object.position.y+object.size.y);
    },
		
		cache: function(){
			if(!this.visible) return;
			
			let entity = this;
			
			return {
				material: entity.material,
				model: entity.model,
				face: entity.face,
				size: entity.size,
			};
		},
		
		// callback for when it's colliding with another object TODO: this is stupid fix it
    onCollide: function(obj){			
    	if(this.interactive){
				this.storeVelocity();
				
				//this.velocity.x = obj.oldVelocity.x;
				//this.velocity.y = obj.oldVelocity.y;
				//this.velocity.z = obj.oldVelocity.z;
				
				if(this.position.x - obj.position.x == 0) this.position.x -= 0.001;
				if(this.position.z - obj.position.z == 0) this.position.z += 0.001;
				
				this.velocity.x -= (obj.position.x - this.position.x)/60;
				this.velocity.z -= (obj.position.z - this.position.z)/60;
			}
			
			this.checkTriggers("onCollide", obj);
    },
    
		// TODO: this is stupid fix it
    onMapCollide: function(face){
    	
			
			/*//quick math constants
    	let dx = obj.position.x-this.position.x;
    	let dy = obj.position.y-this.position.y;
    	let dz = obj.position.z-this.position.z;
    	
    	//angles
    	let horizontal = Math.atan( dx/dz )*180/Math.PI;
			let horizontall = Math.atan( obj.size.x/obj.size.z )*180/Math.PI;
			
			let vertical = Math.atan( Math.sqrt(dx*dx + dz*dz)/dy )*180/Math.PI;
			
			let h = horizontal > horizontall || horizontal < -horizontall ? 90-horizontal : horizontal;
			let w = horizontal > horizontall || horizontal < -horizontall ? obj.size.x : obj.size.z;
			let o = (w / ((obj.size.y+1)/(obj.size.y/2)) )/Math.cos(h*Math.PI/180);
			
			let verticall = Math.abs( Math.atan( o/(obj.size.y/ ((w+1)/(w/2)) ) ) )*180/Math.PI;

    	//choke velocity based on axis of face
    	if(Math.abs(vertical) < verticall){
				this.onGround = true;
				this.velocity.y = 0;
    	} else if(horizontal < horizontall && horizontal > -horizontall){
    		this.velocity.z = 0;
    	} else if(horizontal > horizontall || horizontal < -horizontall){
    		this.velocity.x = 0;
    	}
			
			this.checkTriggers("onMapCollide");*/
    },
		
		// returns position in the next frame using oldVelocity (for checking collisions)
    nextFrame: function(){
    	return {
    		position: {
    			x: this.position.x+this.oldVelocity.x,
    			y: this.position.y+this.oldVelocity.y,
    			z: this.position.z+this.oldVelocity.z,
    		},
    		size: this.size,
    	};
    },
		
		// check if it's colliding with entities
    checkCollisions: function(objects){
			if(!this.enabled) return;
			
    	for(let i = 0; i < objects.length; i++){
    		let obj = objects[i];
    		
    		if(obj.id == this.id) continue;
    		
    		if( rrCol(this.nextFrame(), obj.nextFrame()) ){
    			this.onCollide(obj);
    		}
    	}
    },
    
    checkMapCollisions: function(objects){
			if(!this.enabled) return;
			
			let colliding = false;
			
    	this.onGround = false;
    
    	for(let i = 0; i < objects.length; i++){
    		let obj = objects[i];
    		
    		if(obj.id == this.id) continue;
    		
    		if( rrCol(this.nextFrame(), obj) ){
    			colliding = true;
					this.onMapCollide(obj);
    		}
    	}
			
			return colliding;
    },
		
		respawn: function(){
    	this.checkTriggers("respawn");
			
			this.velocity.x = 0;
    	this.velocity.z = 0;
    	this.position.x = 0.1;
    	this.position.y = 50;
    	this.position.z = -0.1;
    },
		lookAt: function(entity){
			let dx = this.position.x - entity.position.x;
			let dz = this.position.z - entity.position.z;
			
			this.rotation.y = Math.atan2(dx, dz);
		},
	};
	
	return extend(createServerEntity(position, rotation, size, id), n);
}

// Create an entity controlled by a socket
function createSocketBoundEntity(position, rotation, size, id, material, geometry, socket, interactive, face){
	let n = {
		type: 2,
		socket: socket,
		cameraRotation: {
			x: rotation.x,
			y: rotation.y,
			z: rotation.z
		},
		
		//Returns entity values that the server expects to change often (dynamic values)
    dynamic: function(){
      let entity = this;
      
      //note that the vectors are turned into x, y, z values because it's not as big, so the server can send them faster
      return {
      	position: entity.position,
      	rotation: entity.rotation,
				cameraRotation: entity.cameraRotation,
      };
    },
		
		inputRequest: function(){	
			if(!this.enabled || !this.interactive) return;
			
			this.socket.emit("clientInputRequest");
		},
	};
	
	return extend(createPhysicsEntity(position, rotation, size, id, material, geometry, interactive, face), n);
}

function createGameLoop(fps, callback){
	return setInterval(callback, 1000/fps);
}

// Creates a map for the environment, can either be fed data at start or given with loadData functions
function createMap(data){
	return {
		data: data == undefined ? false : data,
		parsed: null,
		objects: [],
		collisionMap: [],
		
		// SEND METHODS //
		
		sendData: function(socket){
			socket.emit("serverMapDataResponse", this.objects);
		},
		
		// LOAD METHODS //
		
		loadDataFromFile: function(filename){ //note: must be from root of server
			console.log("Reading map data from " + filename + "...");
			
			let data = fs.readFileSync(filename);
			
			this.loadData(data);
		},
		
		loadData: function(data){ //feeds data to this.data and parses (mainly just a callback for other load functions)
			console.log("Loading map data...");
			
			this.data = data;
			
			this.parseData();
		},
		
		
		// UTILITY METHODS //
		
		parseData: function(){ //stores object data from map
			console.log("Parsing map data...");
			
			this.parsed = JSON.parse(this.data);
			
			this.objects = this.parsed.objects;
			
			console.log(this.objects.length + " objects parsed, map ready.");
		},
		
		// Creates a map object from data
		createObject: function(position, rotation, size){
			return {
				position: position,
				rotation: rotation,
				size: size,
			};
		},
		
		// Splits cubes into different faces for collision detection
		createCollisionMap: function(){
			if(this.objects.length == 0) return console.log("cannot create collision map without parsed map data");
			
			for(let i = 0; i < this.objects.length; i++){
				let obj = this.objects[i];
				
				let nx = this.createObject({
					x: obj.position.x-obj.size.x/2,
					y: obj.position.y,
					z: obj.position.z
				}, {
					x: 0,
					y: 0,
					z: 0
				});
				let px = this.createObject();
			}
		},
	};
}

// returns true if obj1 and obj2 are colliding, and are cubes (NOTE: assumes position is center of cube)
function rrCol(obj1, obj2){
	return (obj1.position.x+obj1.size.x/2 > obj2.position.x-obj2.size.x/2 && obj1.position.x-obj1.size.x/2 < obj2.position.x+obj2.size.x/2 && obj1.position.z+obj1.size.z/2 > obj2.position.z-obj2.size.z/2 && obj1.position.z-obj1.size.z/2 < obj2.position.z+obj2.size.z/2 && obj1.position.y+obj1.size.y/2 > obj2.position.y-obj2.size.y/2 && obj1.position.y-obj1.size.y/2 < obj2.position.y+obj2.size.y/2);
}

//Attach the properties of child object to parent object, overwriting parent properties if child has them (essentially extends)
function extend(parent, child){
	let ckeys = Object.keys(child);
	let cvalues = Object.values(child);

	for(let i = 0; i < ckeys.length; i++){
		let key = ckeys[i];
		let value = cvalues[i];
		
		parent[key] = value;
	}
	
	return parent; //it doesn't need to return but it does
}

// module
module.exports = {
  createServerEntity: createServerEntity,
	createPhysicsEntity: createPhysicsEntity,
	createSocketBoundEntity: createSocketBoundEntity,
  createEnvironment: createEnvironment,
  createChat: createChat,
  createGameLoop: createGameLoop,
  createMap: createMap,
};
