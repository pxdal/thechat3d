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

function createModelCache(){
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
		
		cache: function(files, callback){
			this.cacheModelLoop(files, 0, callback);
		},
		
		cacheModelLoop: function(files, index, callback){	
			let file = files[index];
			
			this.loader.setPath(this.path);
			
			this.loader.load( file, (object) => {
				this.mcache[ file.replace(".", "").replace("obj", "") ] = object;
					
				if(index+1 !== files.length){
					this.cacheModelLoop(files, index+1, callback);
				} else {
					callback();
				}
			});
			
			/*let file = files[index];
			
			this.mtlLoader.setPath(this.path.replace("models", "textures") + file.replace(".obj", "" + "/"));
			
			console.log(this.path.replace("models", "textures") + file.replace(".obj", ""));	
			
			this.mtlLoader.load("obj.mtl", function(materials){
				materials.preload();
				
				this.loader.setMaterials(materials);
				
				this.loader.setPath(this.path);
				
				this.loader.load( file, function(object){
					console.log(object.children);
		
					this.mcache[ file.replace(".", "").replace("obj", "") ] = object;
					
					if(index+1 !== files.length){
						this.cacheModelLoop(files, index+1, callback);
					} else {
						callback();
					}
				}.bind(this));
			}.bind(this));*/
		},
		
		load: function(name){
			return this.mcache[name];
		}
	};
}