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
			}
			this.mesh.rotation.set(rotation.x, rotation.y, rotation.z);
		},
		
		//Whether the entity is ready to be pushed into the scene or not
		ready: function(){
			return (this.position !== null && this.rotation !== null && this.mesh !== null);
		}
	};
}

// Creates a client controllable entity from an already existing entity
function clientEntity(entity, socket, camera){
	let client = {
		socket: socket,
		input: [],
		fps: new THREE.FirstPersonControls(camera, window), //fps controls (thank you so much three.js),
		
		material: undefined, //undefine these values because we won't need them (because we don't need to render self)
		geometry: undefined,
		
		bindInput: function(input){
			this.input = input;
		},
		
		// Sends a request to the server to change entity position from input
		requestInput: function(){
			this.socket.emit("clientInputRequest", this.input);
		},
	};
	
	return attach(entity, client);
}
