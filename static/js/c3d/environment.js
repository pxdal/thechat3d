/* Environment manager for c3d */
    
//Return the renderer with the proper settings
function initRenderer(){
  let renderer = new WebGLRenderer();
  
  renderer.setSize(width, height);
  document.body.appendChild( renderer.domElement );
  
  return renderer;
};

//creates the client-side portion of the server environment
function createEnvironment(){
  return {
    scene: new Scene(), //creates the three.js scene where Object3Ds live
    entities: [],
    
    // Checks if entity exists in environment by id (returns true if taken and 
    checkID: function(id){
    	let taken = false;
    	
    	for(let i = 0; i < this.entities.length; i++){
    		let entity = this.entities[i];
    		
    		taken = entity.id == id;
    	}
    	
    	return !taken;
    },
    
    // Fetches the cache for an entity by id
    fetchEntityCache: function(id){
      if( this.checkID(id) ){
      	socket.emit("serverEntityCacheRequest", id);
      }
    },
    
    // Fetches the dynamic values for an entity by id
    fetchEntityDynamic: function(id){
    	if( this.checkID(id) ){
    		socket.emit("serverEntityDynamicRequest", id);
    	}
    },
		
		// Callback for when the server sends an entity's id
		serverEntityIDResponse: function(id){
			return this.pushEntity(createEntity(id));
		},
		
    // Callback for the serverEntityCacheResponse event, stores the values 
    serverEntityCacheResponse: function(cache){
      
    },
    
    // Callback for the serverEntityDynamicResponse event, stores values
    serverEntityDynamicResponse: function(dynamic){
    
    },
    
    // Pushes entity to entities
    pushEntity: function(entity){
    	if(checkID(entity.id)){
    		this.entities.push(entity);
    		return "pushed entity with id: " + entity.id;
    	}
    	return "id taken";
    },
    
    // Pulls entity from entities
    pullEntity: function(entity){
    	this.entities.splice(this.entities.indexOf(entity), 1);
    	return "pulled entity with id: " + entity.id;
    }
  };
}

/*
server contains map, entities, some functions

client needs scene, ability to fetch entities, uhh that's it for now
*/
