/* Environment manager for c3d */
    
//Return the renderer with the proper settings
function initRenderer(){
  let renderer = new WebGLRenderer();
  
  renderer.setSize(width, height);
  document.body.appendChild( renderer.domElement );
  
  return renderer;
};

//creates the client-side portion of the server environment
function createEnvironment(socket){
  return {
    scene: new Scene(), //creates the three.js scene where Object3Ds live
    entities: [],
    socket: socket,
    
    // Checks if entity exists in environment by id (returns true if available and false if taken)
    checkID: function(id){
    	let taken = false;
    	
    	for(let i = 0; i < this.entities.length; i++){
    		let entity = this.entities[i];
    		
    		taken = entity.id == id;
    	}
    	
    	return !taken;
    },
    
    //returns entity with the id specified
    getEntityByID: function(id){
      for(let i = 0; i < this.entities.length; i++){
        let entity = this.entities[i];
        
        if(entity.id == id){
          return entity;
        }
      }
      
      return null;
    },
    
    // Fetches the cache for an entity by id
    fetchEntityCache: function(id){
    	console.log("cache attempting fetch");
      if( this.checkID(id) ){
      	this.socket.emit("serverEntityCacheRequest", this.socket, id);
      }
    },
    
    // Fetches the dynamic values for an entity by id
    fetchEntityDynamic: function(id){
    	console.log("dynamic attemping fetch");
    	if( this.checkID(id) ){
    		this.socket.emit("serverEntityDynamicRequest", this.socket, id);
    	}
    },
		
		// Callback for when the server sends an entity's id
		serverEntityIDResponse: function(id){
			let entity = createEntity(id);
			
			this.pushEntity(entity); //note that this needs to be pushed first in order for getEntityByID to work in callback functions
			this.initializeEntity(entity);
		},
		
    // Callback for the serverEntityCacheResponse event, stores the values 
    serverEntityCacheResponse: function(cache, id){
    	console.log("received a cache response from the server");
      let entity = this.getEntityByID(id);
      
      entity.cache(cache.material, cache.geometry);
    },
    
    // Callback for the serverEntityDynamicResponse event, stores values
    serverEntityDynamicResponse: function(dynamic, id){
    	console.log("received a dynamic response from the server");
    	let entity = this.getEntityByID(id);
    	
    	entity.dynamic(new Vector3(dynamic.x, dynamic.y, dynamic.z), new Euler(dynamic.rx, dynamic.ry, dynamic.rz));
    },
    
    // Pushes entity to entities
    pushEntity: function(entity){
    	if(this.checkID(entity.id)){
    		this.entities.push(entity);
    		return entity;
    	}
    	return "id taken";
    },
    
    // Pulls entity from entities
    pullEntity: function(entity){
    	this.entities.splice(this.entities.indexOf(entity), 1);
    	return entity;
    },
    
    //initializes an entity (grabs values and pushes to array)
    initializeEntity: function(entity){
    	console.log("initialize entity has been called");
    	this.fetchEntityCache(this.socket, entity.id);
    	this.fetchEntityDynamic(this.socket, entity.id);
    }
  };
}
