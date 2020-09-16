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
		cache: function(col, geometry){
			this.material = new MeshBasicMaterial({color: col});
			console.log(this.material);
			this.geometry = new BoxGeometry();
			this.mesh = new Mesh( this.geometry, this.material );
			console.log("static values cached in entity, material color: 0x" + zeroes(this.material.color.toString(16), 6) + ", geometry id: " + this.geometry.uuid);
		},
		
		//Takes in dynamic values
		dynamic: function(position, rotation){
			this.position = position;
			this.rotation = rotation;
			this.mesh.position = this.position;
			this.mesh.rotation = this.rotation;
			console.log("dynamic values cached in entity, position: " + this.position.toArray() + ", rotation: " + this.rotation.toArray());
		},
	};
}
