//The Chat 3D's server module

const fs = require("fs");

// creates a new environment for entities and map data
function createEnvironment(name){
  return {
    name: name, //optional name, more decorational than anything
    serverEntities: [], //all entities in the scene
    map: null, // map data for environment
    delta: 0, //millisecond difference between frames
		expected: 0, //expected millisecond difference between frames
		
    // REQUEST HANDLE METHODS //
    
    //Callback for "serverEntityCacheRequest" event, which returns entity values for the client to cache
    serverEntityCacheRequest: function(socket, id){
      let entity = this.getEntityByID(id);
			
			if(entity == null) return;

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
      
			if(!dynamic || dynamic == null) return;
			
      socket.emit("serverEntityDynamicResponse", dynamic, id, this.delta);
    },

    // Callback for clientInputRequest
    clientInputResponse: function(input, socket){
    	let mode = "jump"; //modes: jump (jumps like normal), flight: applies constant up/down force (is affected by gravity)
			
			let d = this.delta/this.expected;
			
			let entity = this.getEntityBySocket(socket);
    	let speed = 0.0666666666666666667*d; // 0.0125
    	let rotSpeed = 0.04*d; // 0.04
    	let jumpForce = mode == "jump" ? 0.5 : 0.01; //0.15 0.275
    	let sensitivity = 115/d; //100
			
			if(mode == "flight"){
				entity.force(0, -entity.gravity, 0);
			}
			
			if(input[6]){
				if(entity.rotation.x > Math.PI/2 || entity.rotation.x < -Math.PI/2){
					entity.rotation.x = (entity.rotation.x/Math.abs(entity.rotation.x)) * Math.PI/2;
				} else if(entity.rotation.x == Math.PI/2){
					if(input[6].y/Math.abs(input[6].y) == 1){
						entity.rotation.x -= input[6].y/sensitivity;
					}
				} else if(entity.rotation.x == -Math.PI/2){
					if(input[6].y/Math.abs(input[6].y) == -1){
						entity.rotation.x -= input[6].y/sensitivity;
					}
				} else {
					entity.rotation.x -= input[6].y/sensitivity;
				}
				
				entity.rotation.y -= input[6].x/100;
				
				entity.cameraRotation.x = entity.rotation.x;
				entity.cameraRotation.y = entity.rotation.y;
				entity.cameraRotation.z = entity.rotation.z;
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
			
			for(let item of entity.inventory){
				item.check(input);
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
				entity.checkMapCollisions(this.map.collisionMap);
				
				if(entity.position.y < yborder){
					entity.respawn();
				}
			}
			
			for(let i = 0; i < this.serverEntities.length; i++){
				let entity = this.serverEntities[i];
				
				if(entity.tracking){
					let e = this.getEntityByID(entity.tracking);
					
					if(e == null){ 
						entity.tracking = false;
					} else {
						entity.lookAt(e, entity.trackingMode);
					}
				}
				
				if(entity.type == 1 || entity.type == 2){
					if(entity.speedcap) entity.force(-entity.velocity.x/2.5, 0, -entity.velocity.z/2.5);
					entity.update();
				}
			}

			/*for(let i = 0; i < this.serverEntities.length; i++){
				let entity = this.serverEntities[i];
				
				//check collisions of entities				
				entity.checkCollisions(this.serverEntities);
				
				//check collisions of map
				entity.checkMapCollisions(this.map.collisionMap);
				
				if(entity.position.y < yborder){
					entity.respawn();
				}
				
				if(entity.tracking){
					let e = this.getEntityByID(entity.tracking);
					
					if(e == null){ 
						entity.tracking = false;
					} else {
						entity.lookAt(e, entity.trackingMode);
					}
				}
				
				if(entity.type == 1 || entity.type == 2){
					if(entity.speedcap) entity.force(-entity.velocity.x/7.5, 0, -entity.velocity.z/7.5);
					entity.update();
				}
				
			}*/
		},
		
		requestInputAll: function(){
			for(let i = 0; i < this.serverEntities.length; i++){
				let entity = this.serverEntities[i];

				if(entity.socket){		
					entity.inputRequest();
				}
			}
		},
    
		updateItems: function(){
			for(let entity of this.serverEntities){
				if(entity.inventory){
					for(let item of entity.inventory){
						item.update();
					}
				}
			}
		},
		
    // UTILS //
    
		changeMap: function(map){
			console.log("changing map...");
	
			this.pushMap(map);
			
			for(let entity of this.serverEntities){
				if(entity.socket) map.sendData(entity.socket);
			}
			
			this.onMapChange(map);
		},
		
		onMapChange: function(){},
		
		randomCoords: function(mx, my, mz){
			return {
				x: Math.floor(Math.random() * (mx+1)) - mx/2,
				y: my,//Math.floor(Math.random() * (my+1)) - my/2,
				z: Math.floor(Math.random() * (mz+1)) - mz/2,
			};
		},
		
		// takes an number value and changes it relative to delta
		deltafy: function(value){
			return value*(this.delta/this.expected);
		},
		
		// inverse deltafy
		undeltafy: function(value){
			return value*(this.expected/this.delta);
		},
		
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
				
				if(entity.type == 1 || entity.type == 2){
					entity.force(0, entity.gravity, 0);
				}
			}
		},
		
		setGravity: function(gravity){
			for(let i = 0; i < this.serverEntities.length; i++){
				let entity = this.serverEntities[i];
				
				if(entity.changeGravity){
					if(entity.type == 1 || entity.type == 2 ){
						entity.gravity = gravity;
					}
				}
			}
		},
		
		// checks if the socket already has an entity
		checkSocket: function(socket){
			for(let i = 0; i < this.serverEntities.length; i++){
				let entity = this.serverEntities[i];
				
				if (entity.type !== 2) continue;
				
				if(entity.socket == socket) return true;
			}
			
			return false;
		},
  };
}

// Create a new chat manager (completely seperate from environment because there's really no reason to relate the two)
function createChat(){
	return {
		users: [],
		
		
		// CLIENT //
		
		// Callback for when the chat receives a username request
		clientUsername: function(username, color, socket, sockets){
			if(this.checkSocket(socket)) return; // check if user already has socket

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
		},
		
		// checks if socket already has a user and returns true if it does, otherwise false
		checkSocket: function(socket){
			for(let i = 0; i < this.users.length; i++){
				let user = this.users[i];
				
				if(user.socket == socket) return true;
			}
			
			return false;
		},
	};
}

// creates a base server entity (pretty useless, mainly just used to define base values for other extensions of this class)
function createServerEntity(environment, position, rotation, size, id){
  return {
		environment: environment,
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

// creates an item entity from format
function createItemEntity(environment, id, template){
	let n = {
		type: 5,
		name: template.name,
		settings: {
			usekey: template.usekey,
			useinterval: template.useinterval,
			model: template.model,
			hud: {
				usekeystring: template.hud.usekeystring,
				path: template.hud.path,
				neutral: template.hud.neutral,
				use: template.hud.use
			},
		},
		state: "neutral",
		physical: null, //physical form of the object, which is set when initPhysical is called
		holder: null,//entity holding the item
		inInventory: false,
		lastUse: template.useinterval, //time, in frames, since last use (set to useinterval to prevent not being able to use on pickup)
		
		initPhysical: function(){
			this.physical = createPhysicsEntity(this.environment, {x: 0, y: 0, z: 0}, {x: 0, y: 0, z: 0}, {x: 0.5, y: 0.5, z: 0.5}, environment.generateID(), 0xffffff, this.settings.model, true, null);
			this.physical.item = this;
		
			this.physical.createTrigger(null, "onCollide", (self, obj, parameters) => {
				if(obj.pushItem){
					let p = obj.pushItem(self.item);
					
					if(p) this.environment.pullServerEntity(self);
				}
			});
		},
		
		update: function(){
			this.lastUse++;
		},
		
		// uses item if input matches and use interval 
		check: function(input){
			if(input[this.settings.usekey] && this.lastUse >= this.settings.useinterval){
				this.use();
			}
		},
		
		changeState: function(state){
			this.state = state;
			
			if(!this.holder) return;
			
			if(this.holder.socket){
				this.holder.socket.emit("clientItemStateChange", this.settings.hud, this.state);
			}
			
		},
		
		use: function(){
			this.lastUse = 0;
			
			this.changeState("use");
			
			this.onUse(this, this.holder);
		},
		
		// removes item from entity's inventory and pushes physical self into environment, with the position being in front of the entity, out of it's collision range, with velocity
		drop: function(position, velocity){
			if(this.holder !== null){ 
				if(position){
					this.physical.position.x = position.x;
					this.physical.position.y = position.y;
					this.physical.position.z = position.z;
				}
				
				this.holder.pullItem(this);
			}
			
			if(velocity){
				this.physical.force(velocity.x, velocity.y, velocity.z);
			}
			
			this.environment.pushServerEntity(this.physical);
		},
		
		onHolster: function(){}, //action called when item is picked up
		onUse: function(){}, //action called when item is used
	};
	
	return extend(createServerEntity(environment, template.position, template.rotation, template.size, id), n);
}

function createItemEntityFromJSON(environment, id, path){
	console.log("Loading item from " + path + " ...");
	
	let data = fs.readFileSync(path);
	
	data = JSON.parse(data);
	
	return createItemEntity(environment, id, data);
}

// Create an entity that has physics
function createPhysicsEntity(environment, position, rotation, size, id, material, model, interactive, face){
	let n = {
		type: 1,
		visible: true, //visiblity (defaults to true)
		interactive: interactive,
		gravity: -0.1,
		changeGravity: true, //whether or not it can be affected by gravity
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
		colliding: {
			x: false,
			y: false,
			z: false
		},
		material: material,
		model: model,
		tracking: false, //set id of entity and run this.lookAt
		trackingMode: "normal",
		inventory: [],
		inventoryLimit: 1,
		
		// adds an item to the inventory
		pushItem: function(item){
			if(this.inventory.length < this.inventoryLimit){
				this.inventory.push(item);
				item.holder = this;
			
				this.sendItem(item);
				
				return true;
			} else {
				return false;
			}
		},
		
		pullItem: function(item){
			this.inventory.splice(this.inventory.indexOf(item), 1);
			
			this.sendPullItem(item);
			
			item.holder = null;
		},
		
		sendItem: function(item){
			for(let entity of this.environment.serverEntities){
				if(entity.socket){
					entity.socket.emit("serverItemPush", item.holder.id, [item.id, item.settings.model, item.settings.hud, item.state, item.name]);
				}
			}
		},
		
		sendItems: function(socket){
			for(let item of this.inventory){
				socket.emit("serverItemPush", item.holder.id, [item.id, item.settings.model, item.settings.hud, item.state]);
			}
		},
		
		sendPullItem: function(item){
			for(let entity of this.environment.serverEntities){
				if(entity.socket){ 
					entity.socket.emit("serverItemPull", item.holder.id, [item.id]);
				}
			}
		},
		
		clearInventory: function(){
			for(let item of this.inventory){
				this.pullItem(item);
			}
		},
		
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
				
				this.velocity.x -= (obj.position.x - this.position.x)/10;
				this.velocity.z -= (obj.position.z - this.position.z)/10;
			}
			
			this.checkTriggers("onCollide", obj);
    },
    
		// TODO: this is stupid fix it
    onMapCollide: function(obj){
    	/*
			{
				position: position,
				rotation: rotation,
				size: size,
				color: color
			}
			*/
			
			/*
			// const.
			let n = 90 * Math.PI/180;
			
			// throttle
			let tx = this.velocity.x * (obj.rotation.y/n);
			let ty = this.velocity.y * (obj.rotation.x/n);
			let tz = this.velocity.z * (obj.rotation.y/n);*/
			
			// apply
			/*console.log("p: " + obj.position.x + ", " + obj.position.y + ", " + obj.position.z);
			console.log("r: " + obj.rotation.x + ", " + obj.rotation.y + ", " + obj.rotation.z);*/
			/*
			//this.velocity.x = tx;
			this.velocity.y = ty;
			//this.velocity.z = tz;
			
			if(ty == 0) this.onGround = true;*/
			
				
			
			//quick math constants
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
				
				if(dy < 0){ 
					this.snapTo(obj, "py");
				} else {
					this.snapTo(obj, "ny");
				}
    	} else {
				if(horizontal > horizontall || horizontal < -horizontall){
					this.velocity.x = 0;
					
					if(dx < 0){
						this.snapTo(obj, "px");
					} else {
						this.snapTo(obj, "nx");
					}
				}
				if(horizontal < horizontall && horizontal > -horizontall){
					this.velocity.z = 0;
					
					if(dz < 0){
						this.snapTo(obj, "pz");
					} else {
						this.snapTo(obj, "nz");
					}
				}
			}
			
			this.checkTriggers("onMapCollide");
    },
		
		// moves self so it's perfectly aligned with one of the sides of an object
		snapTo: function(object, side){
			let sign = side[0] == "p" ? 1 : -1;
			let axis = side[1];
			
			this.position[axis] = object.position[axis] + sign*(object.size[axis]/2) + sign*(this.size[axis]/2);
		},
		
		// returns position in the next frame using oldVelocity (for checking collisions)
    nextFrame: function(){
    	return {
    		position: {
    			x: this.position.x+this.velocity.x,
    			y: this.position.y+this.velocity.y,
    			z: this.position.z+this.velocity.z,
    		},
    		size: {
					x: this.size.x,
					y: this.size.y,
					z: this.size.z
				},
    	};
    },
		
		// check if it's colliding with entities
    checkCollisions: function(objects){
			if(!this.enabled) return;
			
    	for(let i = 0; i < objects.length; i++){
    		let obj = objects[i];
    		
    		if(obj.id == this.id) continue;
    		
				if(obj.nextFrame){
					if( rrCol(this.nextFrame(), obj.nextFrame()) ){
						this.onCollide(obj);
					}
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
    		
				if( rrCol(this.nextFrame(), obj)){
    			colliding = true;
					this.onMapCollide(obj);
    		}
    	}
			
			return colliding;
    },
		
		respawn: function(){
			let map = this.environment.map;
			
			this.velocity.x = 0;
			this.velocity.y = 0;
    	this.velocity.z = 0;
    	
			if(!map.spawn){
				this.position = this.environment.randomCoords(16, 2, 16);
			} else if(map.spawn.type == "field"){
				this.position = this.environment.randomCoords(map.spawn.x, map.spawn.y, map.spawn.z);
			} else if(map.spawn.type == "exact"){
				this.position.x = map.spawn.x;
				this.position.y = map.spawn.y;
				this.position.z = map.spawn.z;
			}
			
			this.checkTriggers("respawn");
    },
		
		lookAt: function(entity, mode){
			let dx = this.position.x - entity.position.x;
			let dz = this.position.z - entity.position.z;
			
			if(mode == "cinematic"){
				this.rotation.y += this.rotation.y-Math.atan2(dx, dz);
			} else if(mode == "normal" || !mode){
				this.rotation.y = Math.atan2(dx, dz);
			}
		},
	};
	
	return extend(createServerEntity(environment, position, rotation, size, id), n);
}

// Create an entity controlled by a socket
function createSocketBoundEntity(environment, position, rotation, size, id, material, geometry, socket, interactive, face){
	let n = {
		type: 2,
		socket: socket,
		cameraRotation: {
			x: rotation.x,
			y: rotation.y,
			z: rotation.z,
			override: false
		},
		
		//Returns entity values that the server expects to change often (dynamic values)
    dynamic: function(){
      let entity = this;
      
      //note that the vectors are turned into x, y, z values because it's not as big, so the server can send them faster
      let data = {
      	position: {
					x: entity.position.x,
					y: entity.position.y,
					z: entity.position.z,
					override: entity.position.override
				},
      	rotation: {
					x: entity.rotation.x,
					y: entity.rotation.y,
					z: entity.rotation.z,
					override: entity.rotation.override
				},
				cameraRotation: {
					x: entity.cameraRotation.x,
					y: entity.cameraRotation.y,
					z: entity.cameraRotation.z,
					override: entity.cameraRotation.override
				},
				velocity: {
					x: entity.velocity.x,
					y: entity.velocity.y,
					z: entity.velocity.z
				}
      };
			
			this.position.override = false;
			this.rotation.override = false;
			this.cameraRotation.override = false;
		
			return data;
    },
		
		inputRequest: function(){	
			if(!this.enabled || !this.interactive) return;
			
			this.socket.emit("clientInputRequest");
		},
	};
	
	return extend(createPhysicsEntity(environment, position, rotation, size, id, material, geometry, interactive, face), n);
}

// creates a stopwatch which counts up infinitely by rate (recommended rate is 1 ms for precision)
function createStopwatchEntity(environment, position, rotation, size, id, rate){
	let n = {
		type: 3,
		time: 0,
		interval: null,
		rate: rate,
		
		onTick: function(){}, //function which will be called when stopwatch ticks, can be set by programmer
		
		start: function(){
			this.interval = setInterval(() => {
				this.time++;
				this.onTick();
			}, this.rate);
		},
		
		dynamic: function(){
			return;
		}
	};
	
	return extend(createServerEntity(environment, position, rotation, size, id), n);
}

// counts down from amount to 0 (sadly only by milliseconds, rate cannot be set unlike stopwatch)
function createTimerEntity(environment, position, rotation, size, id, amount, parameters){
	let n = {
		type: 4,
		timeout: null,
		amount: amount,
		parameters: parameters,
		started: 0, //time in Date form when it was started
		
		onTimerEnd: function(){}, //function which will be called when timer hits zero, can be set by programmer
		
		start: function(){
			this.time = this.amount;
			this.started = new Date();
			
			this.timeout = setTimeout(() => {
				clearTimeout(this.timeout);
				this.onTimerEnd(this.parameters);
			}, this.amount);
		},
		
		dynamic: function(){
			return;
		}
	};
	
	return extend(createServerEntity(environment, position, rotation, size, id), n);
}

// counts up in seconds until date is reached, good for consistent countdowns for events
function createCountdownEntity(environment, position, rotation, size, id, date){
	let n = {
		date: date,
		time: 0,
		interval: null,
		
		onCountdownEnd: function(){}, //function which will be called when countdown hits zero, can be set by programmer
		onTick: function(){}, //function which will be called when countdown ticks, can be set by programmer
		
		start: function(){
			this.interval = setInterval(() => {
				this.check();
				this.onTick();
			}, 1000);
		},
		
		check: function(){
			let current = Date.now();
			let elapsed = this.date - current;
			
			this.time = elapsed;
			
			if(elapsed <= 0){
				clearInterval(this.interval);
				this.onCountdownEnd();
			}
		},
		
		dynamic: function(){
			return;
		}
	};
	
	return extend(createServerEntity(environment, position, rotation, size, id), n);
}

function createGameLoop(fps, callback, mode){
	let l = {
		running: false,
		fps: fps,
		mode: mode,
		
		callback: callback,
		
		loopFunction: function(l){
			if(l.running){
				l.callback();
			}
			if(l.mode == "strict"){
				setTimeout(l.loopFunction, 1000/l.fps, l);
			}
		},
		
		loop: null
	};
	
	l.loop = setInterval(l.loopFunction, 1000/l.fps, l);
	
	return l;
}

// Creates a map for the environment, can either be fed data at start or given with loadData functions
function createMap(data){
	return {
		name: "",
		data: data == undefined ? false : data,
		parsed: null,
		objects: [],
		spawn: {},
		collisionMap: [],
		
		// SEND METHODS //
		
		sendData: function(socket){
			socket.emit("serverMapDataResponse", this.objects);
			//socket.emit("serverMapDataResponse", this.collisionMap);
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
			
			this.name = this.parsed.name;
			
			this.objects = this.parsed.objects;
			this.spawn = this.parsed.spawn;
			
			console.log(this.objects.length + " objects parsed\ncreating collision map...");
			
			//this.collisionMap = this.createCollisionMap();
			this.collisionMap = this.objects;
			
			console.log(this.collisionMap.length + " faces parsed, map ready.");
		},
		
		// Creates a map object from data
		createObject: function(position, rotation, size, color){
			return {
				position: position,
				rotation: rotation,
				size: size,
				color: color
			};
		},
		
		createFace: function(position, rotation, size){
			return this.createObject({
				x: position.x,
				y: position.y,
				z: position.z
			}, {
				x: rotation.x,
				y: rotation.y,
				z: rotation.z
			}, {
				x: size.x,
				y: size.y,
				z: 0
			}, 0xFFFFFF);
		},
		
		// Splits cubes into different faces for collision detection
		createCollisionMap: function(){
			if(this.objects.length == 0) return console.log("cannot create collision map without parsed map data");
			
			let n = 90*Math.PI/180;
			
			let cmap = [];
			
			for(let i = 0; i < this.objects.length; i++){
				let obj = this.objects[i];
				
				let nx = this.createFace({
					x: obj.position.x-obj.size.x/2,
					y: obj.position.y,
					z: obj.position.z
				}, {
					x: obj.rotation.x,
					y: obj.rotation.y+n,
					z: obj.rotation.z
				}, {
					x: obj.size.z,
					y: obj.size.y
				});
				
				let px = this.createFace({
					x: obj.position.x+obj.size.x/2,
					y: obj.position.y,
					z: obj.position.z
				}, {
					x: obj.rotation.x,
					y: obj.rotation.y+n,
					z: obj.rotation.z
				}, {
					x: obj.size.z,
					y: obj.size.y
				});
				
				let nz = this.createFace({
					x: obj.position.x,
					y: obj.position.y,
					z: obj.position.z-obj.size.z/2
				}, {
					x: obj.rotation.x,
					y: obj.rotation.y,
					z: obj.rotation.z
				}, {
					x: obj.size.x,
					y: obj.size.y
				});
				
				let pz = this.createFace({
					x: obj.position.x,
					y: obj.position.y,
					z: obj.position.z+obj.size.z/2
				}, {
					x: obj.rotation.x,
					y: obj.rotation.y,
					z: obj.rotation.z
				}, {
					x: obj.size.x,
					y: obj.size.y
				});
				
				let ny = this.createFace({
					x: obj.position.x,
					y: obj.position.y-obj.size.y/2,
					z: obj.position.z
				}, {
					x: obj.rotation.x+n,
					y: obj.rotation.y,
					z: obj.rotation.z
				}, {
					x: obj.size.x,
					y: obj.size.z
				});
				
				let py = this.createFace({
					x: obj.position.x,
					y: obj.position.y+obj.size.y/2,
					z: obj.position.z
				}, {
					x: obj.rotation.x+n,
					y: obj.rotation.y,
					z: obj.rotation.z
				}, {
					x: obj.size.x,
					y: obj.size.z
				});
				
				cmap.push(nx, px, ny, py, nz, pz);
			}
			
			return cmap;
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
	createTimerEntity: createTimerEntity,
	createStopwatchEntity: createStopwatchEntity,
	createCountdownEntity: createCountdownEntity,
	createItemEntity: createItemEntity,
	createItemEntityFromJSON: createItemEntityFromJSON,
  createEnvironment: createEnvironment,
  createChat: createChat,
  createGameLoop: createGameLoop,
  createMap: createMap,
	rrCol: rrCol
};
