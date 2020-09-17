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
			console.log("static values cached in entity, material color: 0x" + this.material.color.getHexString() + ", geometry id: " + this.geometry.uuid);
		},
		
		//Takes in dynamic values
		dynamic: function(position, rotation){
			this.position = new Vector3(position.x, position.y, position.z);
			this.rotation = new Euler(rotation.x, rotation.y, rotation.z);
			this.mesh.position.setX(position.x);
			this.mesh.position.setY(position.y);
			this.mesh.position.setZ(position.z);
			this.mesh.rotation.set(rotation.x, rotation.y, rotation.z);
			console.log("dynamic values cached in entity, position: " + this.mesh.position.toArray() + ", rotation: " + this.mesh.rotation.toArray());
		},
		
		//Whether the entity is ready to be pushed into the scene or not
		ready: function(){
			return (this.position !== null && this.rotation !== null && this.mesh !== null);
		}
	};
}
