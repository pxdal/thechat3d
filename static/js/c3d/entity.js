// Clientside script to manage server entities


// Creates an empty entity, with the exception of it's id
function createEntity(id){
	return {
		position: new Vector3(0, 0, 0),
		rotation: new Euler(0, 0, 0, "YXZ"),
		oldRotation: {x: 0, y: 0, z: 0},
		modelPosition: {x: 0, y: 0, z: 0},
		modelRotation: {x: 0, y: 0, z: 0},
		axis: {
			x: new Vector3(1, 0, 0),
			y: new Vector3(0, 1, 0),
			z: new Vector3(0, 0, 1)
		},
		size: null,
		id: id,
		material: null,
		geometry: null,
		model: null,
		mesh: null,
		scene: false,
		hitbox: null,
		
		//Takes in cache values
		cache: function(material, model, size, face){
			this.material = new MeshBasicMaterial({color: material});
			
			this.size = size;
			
			let mat = this.materialTexture();
			
			let vertShader = document.getElementById("blend-v-shader").innerHTML;
			let fragShader = document.getElementById("blend-f-shader").innerHTML;
			
			let uniforms = {
				tOne: { type: "t", value: mat},
				tSec: { type: "t", value: face}
			};
			
			let faceMaterial;
			
			if(face){
				faceMaterial = new ShaderMaterial({
					uniforms: uniforms,
					vertexShader: vertShader,
					fragmentShader: fragShader
				});
			} else {
				faceMaterial = this.material;
			}
			
			let materials = [
				this.material,
				this.material,
				this.material,
				this.material,
				this.material,
				faceMaterial,
			];
			
			this.geometry = new BoxGeometry(this.size.x, this.size.y, this.size.z);
			
			let hitboxMat = new MeshBasicMaterial({color: material, transparent: true, opacity: 0.3});
			this.hitbox = new Mesh( this.geometry, hitboxMat);
			
			if(model == null){
				this.mesh = new Mesh( this.geometry, materials );
			} else {
				if(model.modelPosition){
					this.modelPosition.x = model.modelPosition.x;
					this.modelPosition.y = model.modelPosition.y;
					this.modelPosition.z = model.modelPosition.z;
				}
				
				if(model.modelRotation){ 
					this.modelRotation.x = model.modelRotation.x;
					this.modelRotation.y = model.modelRotation.y;
					this.modelRotation.z = model.modelRotation.z;
				}

				if(model.modelScale){
					model.scale.set(model.modelScale.x, model.modelScale.y, model.modelScale.z);
				}
				
				this.model = model;
				this.mesh = this.model;
			}
		},
		
		//Takes in dynamic values
		dynamic: function(position, rotation){
			this.position.x = position.x;
			this.position.y = position.y;
			this.position.z = position.z;
			
			this.oldRotation.x = this.rotation.x;
			this.oldRotation.y = this.rotation.y;
			this.oldRotation.z = this.rotation.z;
			
			let _360 = Math.PI*2;
			
			let invertX = this.mesh.invertX ? _360 : rotation.x*2; //set to rotation*2 bc it will be decreased by rotation, effectively making it either invert rotation or rotation
			let invertY = this.mesh.invertY ? _360 : rotation.y*2;
			let invertZ = this.mesh.invertZ ? _360 : rotation.z*2;
			
			this.rotation.x = invertX-rotation.x+this.modelRotation.x;
			this.rotation.y = invertY-rotation.y+this.modelRotation.y;
			this.rotation.z = invertZ-rotation.z+this.modelRotation.z;
			
			
			if(this.mesh){				
				this.mesh.position.setX(this.position.x+this.modelPosition.x);
				this.mesh.position.setY(this.position.y+this.modelPosition.y);
				this.mesh.position.setZ(this.position.z+this.modelPosition.z);
				
				this.mesh.setRotationFromEuler(this.rotation);
				
				this.hitbox.position.setX(this.position.x);
				this.hitbox.position.setY(this.position.y);
				this.hitbox.position.setZ(this.position.z);
			}
		},
		
		//Whether the entity is ready to be pushed into the scene or not
		ready: function(){
			return (this.position !== null && this.rotation !== null && this.mesh !== null);
		},
		
		//returns texture for material
		materialTexture: function(){
			let s = 1;
			let data = new Uint8Array( 3 * s );

			let r = Math.floor( this.material.color.r * 255 );
			let g = Math.floor( this.material.color.g * 255 );
			let b = Math.floor( this.material.color.b * 255 );

			for (let i = 0; i < s; i++) {

				let stride = i * 3;

				data[ stride ] = r;
				data[ stride + 1 ] = g;
				data[ stride + 2 ] = b;
			}

			return new DataTexture(data, 1, 1, THREE.RGBFormat);
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
		cameraRotation: new Euler(0, 0, 0, "YXZ"),
		
		material: undefined, //undefine these values because we won't need them (because we don't need to render self)
		geometry: undefined,
		
		//Takes in dynamic values
		dynamic: function(position, rotation, cameraRotation){
			this.position.x = position.x;
			this.position.y = position.y;
			this.position.z = position.z;

			this.cameraRotation.x = cameraRotation.x;
			this.cameraRotation.y = cameraRotation.y;
			this.cameraRotation.z = cameraRotation.z;
		},
		
		setCamera: function(){
			if(this.position && this.cameraRotation && this.camera){
				this.camera.position.setX(this.position.x);
				this.camera.position.setY(this.position.y);
				this.camera.position.setZ(this.position.z);
				
				this.camera.setRotationFromEuler(this.cameraRotation);
			}
		},
		
		bindInput: function(input){
			this.input = input;
		},		
	};
	
	return attach(entity, client);
}
