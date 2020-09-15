// Clientside script to manage server entities

/*client --request-> server

server = --request--

server --data-> client 

client = --data--
*/

// Creates an empty entity, with the exception of it's id
function createEntity(id){
	return {
		position: null,
		rotation: null,
		id: id,
		material: null,
		geometry: null,
	};
}
