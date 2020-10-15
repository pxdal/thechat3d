// Clientside script to manage server entities


// Creates an empty entity, with the exception of it's id
function createEntity(id){
	return {
		position: null,
		rotation: null,
		id: id,
		material: null,
		geometry: null,
		mesh: null,
		scene: false,

		//Takes in cache values
		cache: function(material, geometry, face){
			this.material = new MeshBasicMaterial({color: material});
			
			// create a buffer with color data

			/*let size = 1;
			let data = new Uint8Array( 4 * size );

			let r = Math.floor( this.material.color.r * 255 );
			let g = Math.floor( this.material.color.g * 255 );
			let b = Math.floor( this.material.color.b * 255 );

			for (let i = 0; i < size; i++) {

				let stride = i * 3;

				data[ stride ] = r;
				data[ stride + 1 ] = g;
				data[ stride + 2 ] = b;
			}

			let materialTexture = new DataTexture(data, 1, 1, THREE.RGBFormat);
			
			let vertShader = document.getElementById("blend-v-shader").innerHTML;
			let fragShader = document.getElementById("blend-f-shader").innerHTML;
			
			let uniforms = {
				tOne: { type: "t", value: materialTexture},
				tSec: { type: "t", value: face}
			};

			let faceMaterial = new ShaderMaterial({
				uniforms: uniforms,
				vertexShader: vertShader,
				fragmentShader: fragShader
			});*/
			
			let faceMaterial = new MeshBasicMaterial({map: face});
			
			let materials = [
				this.material,
				this.material,
				this.material,
				this.material,
				this.material,
				faceMaterial,
			];
			
			this.geometry = new BoxGeometry();
			this.mesh = new Mesh( this.geometry, materials);
		},
		
		//Takes in dynamic values
		dynamic: function(position, rotation){
			this.position = new Vector3(position.x, position.y, position.z);
			this.rotation = new Euler(0, 0, 0, "YXZ");
			
			this.rotation.x = rotation.x;
			this.rotation.y = rotation.y;
			this.rotation.z = rotation.z;
			
			if(this.mesh){
				this.mesh.position.setX(position.x);
				this.mesh.position.setY(position.y);
				this.mesh.position.setZ(position.z);
				
				this.mesh.setRotationFromEuler(this.rotation);
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
		camera: camera,
		
		material: undefined, //undefine these values because we won't need them (because we don't need to render self)
		geometry: undefined,
		
		setCamera: function(){
			if(this.position && this.rotation && this.camera){
				this.camera.position.setX(this.position.x);
				this.camera.position.setY(this.position.y);
				this.camera.position.setZ(this.position.z);
				
				this.camera.setRotationFromEuler(this.rotation);
			}
		},
		
		bindInput: function(input){
			this.input = input;
		},		
	};
	
	return attach(entity, client);
}
