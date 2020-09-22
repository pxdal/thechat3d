//The Chat 3D's server module

// creates a new environment for entities and map data
function createEnvironment(name){
  return {
    name: name, //optional name, more decorational than anything
    serverEntities: [], //all entities in the scene
    
    
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
      	console.log("A dynamic request was made for an invalid entity: " + id);
      	return null;
      }
      let dynamic = entity.dynamic();
      
      socket.emit("serverEntityDynamicResponse", dynamic, id);
    },
           
    // Callback for clientInputRequest
    clientInputRequest: function(input, socket){
    	let entity = this.getEntityBySocket(socket);
    	let speed = 0.06;
    	let rotSpeed = 0.04;
    	
    	if(input[0]){
    		entity.position.x -= speed * Math.sin(entity.rotation.y);
    		entity.position.z -= speed * Math.cos(entity.rotation.y);
    	}
    	if(input[2]){
    		entity.position.x += speed * Math.sin(entity.rotation.y);
    		entity.position.z += speed * Math.cos(entity.rotation.y);
    	}
    	
    	if(input[1]){
    		entity.rotation.y += rotSpeed;
    	}
    	if(input[3]){
    		entity.rotation.y -= rotSpeed;
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
      if( this.checkID( entity.id ) ){
        this.serverEntities.push(entity);
        return "pushed entity with id: " + entity.id;
      } else {
        return "id taken";
      }
    },
    
    //pulls server entity from serverEntities
    pullServerEntity: function(entity){
      this.serverEntities.splice( this.serverEntities.indexOf(entity), 1 );
      return "pulled entity with id: " + entity.id;
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
			
			return entity.material;
		},
		
  };
}

// Create a new chat manager (completely seperate from environment because there's really no reason to relate the two)
function createChat(){
	return {
		users: [],
		
		
		// CLIENT //
		
		// Callback for when the chat receives a username request
		clientUsername: function(username, color, socket){
			if(username == null){
				socket.emit("serverPromptError", "You have to type something...reload to try again.  (if you did type something and you're seeing this, try not to use weird characters.");
				return null;
			} else if(username.length < 1){
				socket.emit("serverPromptError", "You have to type something...reload to try again.  (if you did type something and you're seeing this, try not to use weird characters.");
				return;
			}
			
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
		
	};
}

// creates a server entity
function createServerEntity(position, rotation, id, material, geometry, socket){
  return {
    position: position,
    rotation: rotation,
    id: id,
    material: material,
    geometry: geometry,
    socket: socket, //socket the entity is bound too (optional, only for entities bound to clients)
    
    //Returns entity values that the server expects the client to cache (static values)
    cache: function(){
    	let entity = this;
    	
      return {
        material: entity.material,
        geometry: entity.geometry,
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
  };
}

// module
module.exports = {
  createServerEntity: createServerEntity,
  createEnvironment: createEnvironment,
  createChat: createChat,
};
