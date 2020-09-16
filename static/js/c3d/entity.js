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
			this.material = material;
			this.geometry = geometry;
			console.log("static values cached in entity, material color: " + this.material.color + ", geometry id: " + this.geometry.uuid);
		},
		
		//Takes in dynamic values
		dynamic: function(position, rotation){
			this.position = position;
			this.rotation = rotation;
			console.log("dynamic values cached in entity, position: " + this.position.toArray() + ", rotation: " + this.rotation.toArray());
		},
		
		//creates the entity's mesh (recall this whenever material or geometry is changed)
		mesh: function(){
			this.mesh = new Mesh( this.geometry, this.material );
		},
	};
}
