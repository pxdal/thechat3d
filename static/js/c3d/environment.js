/* Environment manager for c3d */
    
//Return the renderer with the proper settings
function initRenderer(){
  let renderer = new WebGLRenderer();
  
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize(width, height);

  document.body.appendChild( renderer.domElement );
	
  return renderer;
};

//creates the client-side portion of the server environment
function createEnvironment(socket){
	console.log("creating environment");
  return {
    scene: new Scene(), //creates the three.js scene where Object3Ds live
    entities: [], //array of client entities
    socket: socket, //socket
    clientEntity: null, //the clientEntity which this client controls
    map: null,
    
    
		// FETCH METHODS //
		
		// Fetches the cache for an entity by id
    fetchEntityCache: function(id){
      this.socket.emit("serverEntityCacheRequest", id);
    },
    
    // Fetches the dynamic values for an entity by id
    fetchEntityDynamic: function(id){
    	this.socket.emit("serverEntityDynamicRequest", id);
    },
    
    // Request the client entity be changed according to input
    sendInput: function(){
    	let client = this.clientEntity;
    	
			this.socket.emit("clientInputResponse", client.input);
		},
    
		// REQUEST METHODS //
		clientInputRequest: function(){
			this.sendInput();
		},
		
    // RESPONSE METHODS //
    
    // Callback for when an entity bound to the client is sent
		clientEntityIDResponse: function(id, camera){
			this.clientEntity = clientEntity(createEntity(id), socket, camera);
			
			this.clientEntity.setCamera();
		},
		
		// Callback for when the server sends an entity's id
		serverEntityIDResponse: function(id){
			let entity = createEntity(id);
			
			this.pushEntity(entity); //note that this needs to be pushed first in order for getEntityByID to work in callback functions
			this.initializeEntity(entity);
		},
		
    // Callback for the serverEntityCacheResponse event, stores the values 
    serverEntityCacheResponse: function(cache, id, texture, model){
      let entity = this.getEntityByID(id);
      
      entity.cache(cache.material, model, cache.size, texture);
    },
    
    // Callback for the serverEntityDynamicResponse event, stores values
    serverEntityDynamicResponse: function(dynamic, id){
    	// bypass for the fact that this.clientEntity isn't a part of this.entities
    	if(id == this.clientEntity.id){
				this.clientEntity.dynamic(dynamic.position, dynamic.rotation, dynamic.cameraRotation);
				return;
    	}
    	
    	let entity = this.getEntityByID(id);
    	
    	entity.dynamic(dynamic.position, dynamic.rotation);
    },
    
    // Callback for the serverMapDataResponse event
    serverMapDataResponse: function(objects){
    	this.map = objects;
    	this.renderMap();
    },
    
    // UPDATE METHODS (called every frame) //
    
    // Updates the positions of entities
    update: function(){
    	for(let i = 0; i < this.entities.length; i++){
    		let entity = this.entities[i];
				
    		this.fetchEntityDynamic(entity.id);	
    	}
    },
    
    // updates position of client (bypass bc clientEntity isn't in entities)
    updateClient: function(){
    	this.fetchEntityDynamic(this.clientEntity.id);
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

		// MAP METHODS //
		renderMap: function(){ //pushes map objects to scene (meant to be called once)
			for(let i = 0; i < this.map.length; i++){
				let object = this.map[i];
				
				let position = {
					x: object.position.x,
					y: object.position.y,
					z: object.position.z,
				};
				
				let size = {
					x: object.size.x,
					y: object.size.y,
					z: object.size.z,
				};	
				
				let colorDif=Math.floor(Math.random() * 0);
				
				let geometry = new BoxGeometry(size.x, size.y, size.z);
				let material = new MeshLambertMaterial({color: parseInt(object.color)}); //0x3ef1f7
				
				let objMesh = new Mesh(geometry, material);
				objMesh.position.x = position.x;
				objMesh.position.y = position.y;
				objMesh.position.z = position.z;
				
				this.scene.add( objMesh );
			}	
			
			let ambience = new AmbientLight(0x404040);
			let light = new DirectionalLight(0x753b00, 0.6);
						
			light.position.x = -0.3;
			
			this.scene.add(ambience);
			this.scene.add(light);
		},
		
    
    // UTILS //
    
    // Checks if entity exists in environment by id (returns true if available and false if taken)
    checkID: function(id){
    	let available = true;
    	
    	for(let i = 0; i < this.entities.length; i++){
				let entity = this.entities[i];
				
				available = entity.id !== id;
    	}
    	
    	return available;
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
    	let hitbox = entity.hitbox;			
			
    	if(entity.ready()){
				this.scene.add( mesh );
				
				if(debug) this.scene.add( hitbox );
			} else { console.warn("attempted to push mesh to scene but the mesh isn't complete"); }
    },
    
    // Removes entity from the scene
    pullEntityFromScene: function(id){
    	let entity = this.getEntityByID(id);
    	let mesh = entity.mesh;
    	let hitbox = entity.hitbox;
			
    	this.scene.remove( mesh );
    	if(debug) this.scene.remove( hitbox );
			
    	entity.dispose(); //dispose of materials and geometries
    },
    
    // Callback for when the server says an entity needs to be pulled
    serverEntityPull: function(id){
    	let e = this.getEntityByID(id);

    	this.pullEntityFromScene(e.id);
    	this.pullEntity(e);
    },
    
    //initializes an entity (grabs values and pushes to array)
    initializeEntity: function(entity){
    	this.fetchEntityCache(entity.id);
    	this.fetchEntityDynamic(entity.id);
    },
  };
}
