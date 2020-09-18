// Clientside script to manage server entities

/*client --request-> server

server = --request--

server --data-> client 

client = --data--
*/

// Creates an empty entity, with the exception of it's id
function createEntity(id){
	console.log("creating entity with id: " + id);
	return {
		position: null,
		rotation: null,
		id: id,
		material: null,
		geometry: null,
		mesh: null,
		scene: false,

		//Takes in cache values
		cache: function(material, geometry){
			this.material = new MeshBasicMaterial({color: material});

			this.geometry = new BoxGeometry();
			this.mesh = new Mesh( this.geometry, this.material );
		},
		
		//Takes in dynamic values
		dynamic: function(position, rotation){
			this.position = new Vector3(position.x, position.y, position.z);
			this.rotation = new Euler(rotation.x, rotation.y, rotation.z);
	
			if(this.mesh){
				this.mesh.position.setX(position.x);
				this.mesh.position.setY(position.y);
				this.mesh.position.setZ(position.z);
				
				this.mesh.rotation.set(rotation.x, rotation.y, rotation.z);
			}
		},
		
		//Whether the entity is ready to be pushed into the scene or not
		ready: function(){
			return (this.position !== null && this.rotation !== null && this.mesh !== null);
		},
		
		//Disposes of geometries and materials
		dispose: function(){
			this.material.dispose();
			this.geometry.dispose();
			this.material = undefined;
			this.geometry = undefined;	
		},
	};
}

// Creates a client controllable entity from an already existing entity
function clientEntity(entity, socket, camera){
	let client = {
		socket: socket,
		input: [],
		fps: null, //fps controls (thank you so much three.js),
		camera: camera,
		
		material: undefined, //undefine these values because we won't need them (because we don't need to render self)
		geometry: undefined,
		
		setCamera: function(){
			if(this.position && this.rotation){
				this.camera.position.setX(this.position.x);
				this.camera.position.setY(this.position.y);
				this.camera.position.setZ(this.position.z);
				
				this.camera.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
			}
		},
		
		initFps: function(domElement){
			this.fps = new FirstPersonControls(this.camera, domElement);
			this.fps.lookSpeed = 0.4;
			this.fps.movementSpeed = 20;
			this.fps.lookVertical = true;
			this.fps.contrainVertical = true;
			this.fps.verticalMin = 1.0;
			this.fps.verticalmax = 2.0;
		},
		
		bindInput: function(input){
			this.input = input;
		},
		
};
	
	return attach(entity, client);
}
