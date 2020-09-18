//The Chat 3D's server module

// creates a new environment for entities and map data
function createEnvironment(name){
  return {
    name: name, //optional name, more decorational than anything
    serverEntities: [], //all entities in the scene
    
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
    
    //Sends the id of an entity to the client for initialization
    sendServerEntityID: function(socket, entity){
    	socket.emit("serverEntityIDResponse", entity.id);
    },
    
    //Callback for "serverEntityCacheRequest" event, which returns entity values for the client to cache
    serverEntityCacheRequest: function(socket, id){
      let entity = this.getEntityByID(id);
      let cache = entity.cache();
      
      socket.emit("serverEntityCacheResponse", cache, id);
    },
    
    //Callback for "serverEntityDynamicRequest" event, which returns dynamic values that are expected to change
    serverEntityDynamicRequest: function(socket, id){
      let entity = this.getEntityByID(id);
      let dynamic = entity.dynamic();
      
      socket.emit("serverEntityDynamicResponse", dynamic, id);
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
    
    // Send server entities to socket (excluding the socket's entity, if it has one)
    sendEntities: function(socket){
    	let client = this.serverEntities.indexOf(this.getEntityBySocket(socket));
    	
    	let entities = this.serverEntities.splice(client, 1);
    	
    	for(let i = 0; i < entities.length; i++){
    		let entity = entities[i];
    		
    		this.sendServerEntityID(socket, entity);
    	}
    }
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
};
