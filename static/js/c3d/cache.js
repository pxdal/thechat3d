// manages textures

function createTextureCache(){
	return {
		path: "",
		tcache: [],
		loader: new TextureLoader(),
		
		// sets the current loading path
		setPath: function(path){
			if(path[path.length-1] !== "/"){
				console.warn("C3D: The path you've set doesn't end in a forward slash!  Paths should use forward slashes, and end with them, or there may be caching issues.");
			}
			
			this.path = path;
		},
		
		// combine the path and the file
		pathTo: function(file){
			return this.path + file;
		},
		
		// caches textures from path
		cache: function(files){
			for(let i = 0; i < files.length; i++){
				let t = this.loader.load( this.pathTo(files[i]) );
				
				this.tcache[ files[i].replace(".", "").replace("png", "").replace("jpg", "").replace("jpeg", "") ] = t;
			}
		},
		
		// load the texture for the filename (can also directly access with this.cache)
		load: function(name){
			return this.tcache[name];
		}
	};
}

function createObjModelCache(){
	return {
		path: "",
		mcache: [],
		loader: new OBJLoader(),
		mtlLoader: new MTLLoader(),
		
		setPath: function(path){
			if(path[path.length-1] !== "/"){
				console.warn("C3D: The path you've set doesn't end in a forward slash!  Paths should use forward slashes, and end with them, or there may be caching issues.");
			}
			
			this.path = path;
		},
		
		pathTo: function(file){
			return this.path + file;
		},
		
		pathToMaterial: function(file){
			return this.path.replace("models", "textures") + file.replace(".obj", "") + "/";
		},
		
		// returns true if model is in cache
		search: function(model){
			return Object.keys(this.mcache).includes(model);
		},
		
		cache: function(files, callback){
			if(files.length <= 0){
				callback();
				return;
			}
			
			this.cacheModelLoop(files, 0, callback);
		},
		
		cacheModelLoop: function(files, index, callback){	
			/*let file = files[index];
			
			this.loader.setPath(this.path);
			
			this.loader.load( file, (object) => {
				this.mcache[ file.replace(".", "").replace("obj", "") ] = object;

				if(index+1 !== files.length){
					this.cacheModelLoop(files, index+1, callback);
				} else {
					callback();
				}
			});*/
			
			let file = files[index];
			
			this.mtlLoader.setPath(this.path.replace("models", "textures") + file.replace(".obj", "" + "/"));
			
			console.log(this.path.replace("models", "textures") + file.replace(".obj", ""));	
			
			this.mtlLoader.load("obj.mtl", (materials) => {
				materials.preload();
				
				this.loader.setMaterials(materials);
				
				this.loader.setPath(this.path);
				
				this.loader.load( file,  (object) => {
					let child = object.children[0];
					
					this.mcache[ file.replace(".", "").replace("obj", "") ] = child;
					
					if(index+1 !== files.length){
						this.cacheModelLoop(files, index+1, callback);
					} else {
						callback();
					}
				}, () => {},
				(error) => {
					console.log(error);
				});
			}, () => {},
			(error) => {
				console.log(error);
			});
		},
		
		load: function(name){
			let n = this.mcache[name].clone();
			
			// assign values which aren't cloned
			n.modelPosition = this.mcache[name].modelPosition;
			n.modelRotation = this.mcache[name].modelRotation;
			n.modelScale = this.mcache[name].modelScale;
			n.invertX = this.mcache[name].invertX;
			n.invertY = this.mcache[name].invertY;
			n.invertZ = this.mcache[name].invertZ;
			
			return n;
		},
		
		// returns the reference to the cached model (good for settings permanent values like modelPosition)
		loadRef: function(name){
			return this.mcache[name];
		}
	};
}

function createGLTFModelCache(){
	return {
		path: "",
		loader: new GLTFLoader(),
		mcache: [],
		
		// sets the path
		setPath: function(path){
			if(path[path.length-1] !== "/"){
				console.warn("C3D: The path you've set doesn't end in a forward slash!  Paths should use forward slashes, and end with them, or there may be caching issues.");
			}
			
			this.path = path;
		},
		
		// returns path to file
		pathTo: function(file){
			return this.path + file;
		},
		
		// returns true if model is in cache
		search: function(model){
			return Object.keys(this.mcache).includes(model);
		},
		
		// caches files and calls callback when complete
		cache: function(files, callback){
			if(files.length <= 0){
				callback();
				return;
			};
			
			this.cacheModelLoop(files, 0, callback);
		},
		
		// loop for cache
		cacheModelLoop: function(files, index, callback){
			let file = files[index];
			
			this.loader.setPath(this.path);
			
			this.loader.load( file, (gltf) => {
				this.mcache[file.replace(".", "").replace("glb", "").replace("gltf", "")] = gltf.scene;
				
				if(index+1 !== files.length){
					this.cacheModelLoop(files, index+1, callback);
				} else {
					callback();
				}
			});
		},
		
		// returns a clone of the model
		load: function(name){
			let n = this.mcache[name].clone();
			
			// assign values which aren't cloned
			n.modelPosition = this.mcache[name].modelPosition;
			n.modelRotation = this.mcache[name].modelRotation;
			n.modelScale = this.mcache[name].modelScale;
			n.invertX = this.mcache[name].invertX;
			n.invertY = this.mcache[name].invertY;
			n.invertZ = this.mcache[name].invertZ;
			
			return n;
		},
		
		// returns the reference to the cached model (good for settings permanent values like modelPosition)
		loadRef: function(name){
			return this.mcache[name];
		}
	};
}