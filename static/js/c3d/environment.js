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
    clientEntity: null,
    
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
      
      	this.socket.emit("serverEntityCacheRequest", id);
    	
    },
    
    // Fetches the dynamic values for an entity by id
    fetchEntityDynamic: function(id){
    	
    		this.socket.emit("serverEntityDynamicRequest", id);
    	
    },
		
		// Callback for when an entity bound to the client is sent
		clientEntityIDReponse: function(id, camera){
			this.clientEntity = clientEntity(createEntity(id), socket, camera);
			
			this.clientEntity.initFps(window);
			this.clientEntity.setCamera();
		},
		
		// Callback for when the server sends an entity's id
		serverEntityIDResponse: function(id){
			let entity = createEntity(id);
			
			this.pushEntity(entity); //note that this needs to be pushed first in order for getEntityByID to work in callback functions
			this.initializeEntity(entity);
		},
		
    // Callback for the serverEntityCacheResponse event, stores the values 
    serverEntityCacheResponse: function(cache, id){
      let entity = this.getEntityByID(id);
      
      entity.cache(cache.material, cache.geometry);
    },
    
    // Callback for the serverEntityDynamicResponse event, stores values
    serverEntityDynamicResponse: function(dynamic, id){
    	if(id == this.clientEntity.id){
				this.clientEntity.dynamic(dynamic.position, dynamic.rotation);
				return;
    	}
    	
    	let entity = this.getEntityByID(id);
    	
    	entity.dynamic(dynamic.position, dynamic.rotation);
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
    
    // Renders entity to scene
    pushEntityToScene: function(id){
    	let entity = this.getEntityByID(id);
    	let mesh = entity.mesh;
    	
    	if(entity.ready()){
				console.log("pushing mesh: " + entity.id + " to scene");
				this.scene.add( mesh );
			} else { console.log("attempted to push mesh to scene but the mesh isn't complete"); }
    },
    
    // Removes entity from the scene
    pullEntityFromScene: function(id){
    	let entity = this.getEntityByID(id);
    	let mesh = entity.mesh;
    	
    	this.scene.remove( mesh );
    	
    	entity.dispose(); //dispose of materials and geometries
    },
    
    //initializes an entity (grabs values and pushes to array)
    initializeEntity: function(entity){
    	this.fetchEntityCache(entity.id);
    	this.fetchEntityDynamic(entity.id);
    },
    
    // Updates the positions of entities
    update: function(){
    	for(let i = 0; i < this.entities.length; i++){
    		let entity = this.entities[i];
				
    		this.fetchEntityDynamic(entity.id);	
    	}
    },
    
    // Callback for when the server says an entity needs to be pulled
    serverEntityPull: function(id){
    	let e = this.getEntityByID(id);

    	this.pullEntityFromScene(e.id);
    	this.pullEntity(e);
    },
    
    // checks if entities are pushed to the scene
    checkScene: function(){
    	for(let i = 0; i < this.entities.length; i++){
    		let entity = this.entities[i];
    		
    		if(entity.ready){
		  		if(!entity.scene && entity.ready()){
		  	 		this.pushEntityToScene(entity.id);
		  			entity.scene = true;
		  		}
		  	}
    	}
    },
    
    updateClient: function(){
    	this.fetchEntityDynamic(this.clientEntity.id);
    },
    
    requestInput: function(){
    	let client = this.clientEntity;
    	
			this.socket.emit("clientInputRequest", client.input);
		}
  };
}
