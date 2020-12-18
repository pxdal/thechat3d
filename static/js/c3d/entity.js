// Clientside script to manage server entities


// Creates an empty entity, with the exception of it's id
function createEntity(id){
	return {
		position: new Vector3(0, 0, 0), //position as vector3
		rotation: new Euler(0, 0, 0, "YXZ"), //rotation (in YXZ)
		modelPosition: {x: 0, y: 0, z: 0}, //position of model (if present)
		modelRotation: {x: 0, y: 0, z: 0}, //rotation of model (if present)
		size: {
			x: 1,
			y: 1,
			z: 1
		}, //size
		id: id, //id
		material: null, //material
		geometry: null, //geometry
		model: null, //model (if it has one)
		mesh: null, //mesh of the entity
		scene: false, //whether or not the entity has been added to the scene
		hitbox: null, //the hitbox mesh
		smoothing: true, //whether to apply smoothing or not (smoothing makes entities appear to move more smoothly, no smoothing more accurately depicts entities)
		
		//Takes in cache values
		cache: function(material, model, size, face, thecone){
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
			
			thecone.position.setX(thecone.modelPosition.x);
			thecone.position.setY(thecone.modelPosition.y);
			thecone.position.setZ(thecone.modelPosition.z);
			
			thecone.scale.set(thecone.modelScale.x, thecone.modelScale.y, thecone.modelScale.z);
			
			if(model == null){
				this.model = new THREE.Object3D();
				
				this.model.add(new Mesh( this.geometry, materials ));
				this.model.add(thecone);
				
				this.mesh = this.model;
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

				/*if(model.modelScale){
					model.scale.set(model.modelScale.x, model.modelScale.y, model.modelScale.z);
				}*/
				
				this.model = new THREE.Object3D();
				
				this.model.add(model);
				this.model.add(thecone);
				
				//this.model = model;
				
				this.mesh = this.model;
			}
		},
		
		// moves self from one point to another over a series of amount milliseconds at fps
		glide: function(position, amount, fps){
			let f = amount/(1000/fps); //amount of frames in amount
			
			let rx = (position.x-this.position.x)/f, //rate of change
					ry = (position.y-this.position.y)/f,
					rz = (position.z-this.position.z)/f; 
			
			let fc = 0;

			let glider = window.setInterval(() => {
				this.position.x += rx;
				this.position.y += ry;
				this.position.z += rz;
				
				fc++;

				if(fc == f){ 
					window.clearInterval(glider);
				}
			}, 1000/fps);
		},
		
		//Takes in dynamic values
		dynamic: function(position, rotation){
			if(!this.smoothing){
				this.position.x = position.x;
				this.position.y = position.y;
				this.position.z = position.z;
			} else {
				this.glide(position, 50, 60); //move to position in 50 ms at 60 fps (makes motion appear smoother, albeit not perfect because it doesn't account for potential server lag)
			}
			
			let _360 = Math.PI*2;
			
			/*let invertX = this.mesh.invertX ? _360 : rotation.x*2; //set to rotation*2 bc it will be decreased by rotation, effectively making it either invert rotation or rotation
			let invertY = this.mesh.invertY ? _360 : rotation.y*2;
			let invertZ = this.mesh.invertZ ? _360 : rotation.z*2;*/
			
			this.rotation.x = /*invertX-*/rotation.x/*+this.modelRotation.x*/;
			this.rotation.y = /*invertY-*/rotation.y/*+this.modelRotation.y*/;
			this.rotation.z = /*invertZ-*/rotation.z/*+this.modelRotation.z*/;
			
			
			if(this.mesh){				
				this.mesh.position.setX(this.position.x);
				this.mesh.position.setY(this.position.y);
				this.mesh.position.setZ(this.position.z);
				
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
		
		addModel: function(obj){
			this.model.add(obj);
		},
	};
}

// Creates a client controllable entity from an already existing entity
function clientEntity(entity, socket, camera, HUDManager){
	let client = {
		socket: socket,
		input: [],
		camera: camera,
		cameraRotation: new Euler(0, 0, 0, "YXZ"),
		
		material: undefined, // undefine these values because we won't need them (because we don't need to render self)
		geometry: undefined,
		
		HUDManager: HUDManager,
		
		prediction: true, // whether or not to use clientside prediction (predicting where self will be instead of waiting for the server)
		actualPosition: {
			x: 0,
			y: 0,
			z: 0
		},
		actualVelocity: {
			x: 0,
			y: 0,
			z: 0
		},
		correction: 0.35, //if desired, what percent per frame to adjust prediction to match server (0-1; lower = less noticeable, more innacurate)
		limit: 0.5, //how far to let client deviate before snapping it into position
		delta: 0,
		expected: 1000/20,
		velocity: {
			x: 0,
			y: 0,
			z: 0
		},
		speed: 0.0153846154,
		jumpForce: 0.18,
		sensitivity: 125,
		onGround: false,
		gravity: -0.01,
		jumping: false,
		
		//Takes in cache values
		cache: function(material, model, size, face){
			this.size = size;
		},
		
		addItem: function(hud, state){
			let img = hud[state];
			
			if(typeof img == "object"){ // if the image is an array, pick a random one from the array to use
				img = hud.path + img[Math.floor(Math.random() * img.length)];
			} else {
				img = hud.path + img;
			}
			
			this.HUDManager.setHUDImage(img);
		},
		
		pullItem: function(){
			this.HUDManager.setHUDImage("");
		},
		
		//Takes in dynamic values
		dynamic: function(position, rotation, velocity, cameraRotation, delta, smoothing){
			this.delta = delta;
			
			this.actualPosition = position;
			this.actualVelocity = velocity;
			
			if(!this.prediction){
				if(!smoothing){
					this.position.x = position.x;
					this.position.y = position.y;
					this.position.z = position.z;
				} else {
					this.glide(position, 50, 60);
				}
				
				this.cameraRotation.x = cameraRotation.x;
				this.cameraRotation.y = cameraRotation.y;
				this.cameraRotation.z = cameraRotation.z;
			} else {
				if(position.override){ //set this.position to position if server requests an override
					this.position.x = position.x;
					this.position.y = position.y;
					this.position.z = position.z;
				}
				//if(rotation.override){ //set this.rotation to rotation if server requests an override
					this.rotation.x = rotation.x;
					this.rotation.y = rotation.y;
					this.rotation.z = rotation.z;
				//}
				//if(cameraRotation.override){ //set this.cameraRotation to cameraRotation if server requests an override
					this.cameraRotation.x = cameraRotation.x;
					this.cameraRotation.y = cameraRotation.y;
					this.cameraRotation.z = cameraRotation.z;
				//}
			}
		},
		
		// moves self according to this.input (doesn't affect serverside)
		handleInput: function(){
			let d = this.delta/this.expected;
			
			let speed = this.speed*d;
			
			/*if(this.input[6]){
				if(this.rotation.x > Math.PI/2 || this.rotation.x < -Math.PI/2){
					this.rotation.x = (this.rotation.x/Math.abs(this.rotation.x)) * Math.PI/2;
				} else if(this.rotation.x == Math.PI/2){
					if(this.input[6].y/Math.abs(this.input[6].y) == 1){
						this.rotation.x -= this.input[6].y/this.sensitivity;
					}
				} else if(this.rotation.x == -Math.PI/2){
					if(this.input[6].y/Math.abs(this.input[6].y) == -1){
						this.rotation.x -= this.input[6].y/this.sensitivity;
					}
				} else {
					this.rotation.x -= this.input[6].y/this.sensitivity;
				}
				
				this.rotation.y -= this.input[6].x/100;
				
				this.cameraRotation.x = this.rotation.x;
				this.cameraRotation.y = this.rotation.y;
				this.cameraRotation.z = this.rotation.z;
			}*/
			
			// forward/backward
    	if(this.input[0]){
    		this.force(-speed * Math.sin(this.rotation.y), 0, -speed * Math.cos(this.rotation.y));
    	}
    	if(this.input[2]){
    		this.force(speed * Math.sin(this.rotation.y), 0, speed * Math.cos(this.rotation.y));
    	}
    	
			//strafing (mouse)
			if(this.input[1]){
				this.force(-speed * Math.cos(this.rotation.y), 0, speed * Math.sin(this.rotation.y));
			}
			if(this.input[3]){
				this.force(speed * Math.cos(this.rotation.y), 0, -speed * Math.sin(this.rotation.y));
			}

			// jump (jump)/fly (flight)
    	if(this.input[4]){
	  		if(this.onGround){
	  			this.force(0, this.jumpForce, 0);
	  			this.onGround = false;
					this.jumping = true;
	  		}
    	}
		},
		
		force: function(x, y, z){
			this.velocity.x += x;
			this.velocity.y += y;
			this.velocity.z += z;
		},
		
		update: function(map){
			this.force(0, this.gravity, 0);
			
			this.checkMapCollisions(map);
			
			if(this.position.y < -25) this.respawn();
			
			this.force(-this.velocity.x/7.5, 0, -this.velocity.z/7.5);
			
			this.correct(this.correction, this.limit, this.actualPosition, this.actualVelocity);
			
			this.position.x += this.velocity.x;
			this.position.y += this.velocity.y;
			this.position.z += this.velocity.z;
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
		
		checkMapCollisions: function(objects){
			let colliding = false;
			
    	this.onGround = false;
			
    	for(let i = 0; i < objects.length; i++){
    		let obj = objects[i];
    		
    		if(obj.id == this.id) continue;
    		
				if( this.rrCol(this.nextFrame(), obj)){
    			colliding = true;
					this.onMapCollide(obj);
    		}
    	}
			
			return colliding;
    },
		
		onMapCollide: function(obj){
			//quick math constants
    	let dx = obj.position.x-this.position.x;
    	let dy = obj.position.y-this.position.y;
    	let dz = obj.position.z-this.position.z;
    	
    	//angles
    	let horizontal = Math.atan( dx/dz )*180/Math.PI;
			let horizontall = Math.atan( obj.size.x/obj.size.z )*180/Math.PI;
			
			let vertical = Math.atan( Math.sqrt(dx*dx + dz*dz)/dy )*180/Math.PI;
			
			let h = horizontal > horizontall || horizontal < -horizontall ? 90-horizontal : horizontal;
			let w = horizontal > horizontall || horizontal < -horizontall ? obj.size.x : obj.size.z;
			let o = (w / ((obj.size.y+1)/(obj.size.y/2)) )/Math.cos(h*Math.PI/180);
			
			let verticall = Math.abs( Math.atan( o/(obj.size.y/ ((w+1)/(w/2)) ) ) )*180/Math.PI;

    	//choke velocity based on axis of face
    	if(Math.abs(vertical) < verticall){
				this.onGround = true;
				this.jumping = false;
				
				this.velocity.y = 0;
				
				if(dy < 0){ 
					this.snapTo(obj, "py");
				} else {
					this.snapTo(obj, "ny");
				}
    	} else {
				if(horizontal > horizontall || horizontal < -horizontall){
					this.velocity.x = 0;
					
					if(dx < 0){
						this.snapTo(obj, "px");
					} else {
						this.snapTo(obj, "nx");
					}
				}
				if(horizontal < horizontall && horizontal > -horizontall){
					this.velocity.z = 0;
					
					if(dz < 0){
						this.snapTo(obj, "pz");
					} else {
						this.snapTo(obj, "nz");
					}
				}
			}
		},
		
		snapTo: function(object, side){
			let sign = side[0] == "p" ? 1 : -1;
			let axis = side[1];
			
			this.position[axis] = object.position[axis] + sign*(object.size[axis]/2) + sign*(this.size[axis]/2);
		},
		
		// move self percentage closer to position
		correct: function(percentage, limit, position, velocity){
			let dx = position.x-this.position.x;
			let dy = position.y-this.position.y;
			let dz = position.z-this.position.z;
			
			let rx = dx*percentage;
			let ry = dy*percentage;
			let rz = dz*percentage;
			
			if(Math.abs(dx) <= limit || limit == 0){ 
				this.position.x += rx;
			} else {
				this.position.x = position.x;
				this.velocity.x = 0;
			}
			if(!this.jumping){
				if(Math.abs(dy) <= limit || limit == 0) {
					this.position.y += ry;
				} else {
					this.position.y = position.y;
					this.velocity.y = 0;
				}
			}
			if(Math.abs(dz) <= limit || limit == 0) {
				this.position.z += rz;
			} else {
				this.position.z = position.z;
				this.velocity.z = 0;
			}
		},
		
		rrCol: function(obj1, obj2){
			return (obj1.position.x+obj1.size.x/2 > obj2.position.x-obj2.size.x/2 && obj1.position.x-obj1.size.x/2 < obj2.position.x+obj2.size.x/2 && obj1.position.z+obj1.size.z/2 > obj2.position.z-obj2.size.z/2 && obj1.position.z-obj1.size.z/2 < obj2.position.z+obj2.size.z/2 && obj1.position.y+obj1.size.y/2 > obj2.position.y-obj2.size.y/2 && obj1.position.y-obj1.size.y/2 < obj2.position.y+obj2.size.y/2);
		},
		
		nextFrame: function(){
    	return {
    		position: {
    			x: this.position.x+this.velocity.x,
    			y: this.position.y+this.velocity.y,
    			z: this.position.z+this.velocity.z,
    		},
    		size: {
					x: this.size.x,
					y: this.size.y,
					z: this.size.z
				},
    	};
    },
		
		respawn: function(){
			this.velocity.x = 0;
			this.velocity.y = 0;
    	this.velocity.z = 0;
    	this.position.x = 0.1;
    	this.position.y = 30;
    	this.position.z = -0.1;
    },
	};
	
	return attach(entity, client);
}
