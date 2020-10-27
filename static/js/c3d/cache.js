// manages textures

function createTextureCache(){
	return {
		path: "",
		cache: [],
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
				
				this.cache[ files[i].replace(".", "").replace("png", "").replace("jpg", "").replace("jpeg", "") ] = t;
			}
		},
		
		// load the texture for the filename (can also directly access with this.cache)
		load: function(name){
			return this.cache[name];
		}
	};
}

function createModelCache(){
	return {
		path: "",
		cache: [],
		loader: new OBJLoader(),
		
		setPath: function(path){
			if(path[path.length-1] !== "/"){
				console.warn("C3D: The path you've set doesn't end in a forward slash!  Paths should use forward slashes, and end with them, or there may be caching issues.");
			}
			
			this.path = path;
		},
		
		pathTo: function(file){
			return this.path + file;
		},
		
		
		cache: function(files){
			for(let i = 0; i < files.length; i++){
				let t = this.loader.load( this.pathTo(files[i]), (object) => {
					this.cache[ files[i].replace(".", "").replace("obj", "") ] = t;
				});
			}
		},
		
		load: function(name){
			return this.cache[name];
		}
	};
}