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
		
		setPath: function(path){
			if(path[path.length-1] !== "/"){
				console.warn("C3D: The path you've set doesn't end in a forward slash!  Paths should use forward slashes, and end with them, or there may be caching issues.");
			}
			
			this.path = path;
		},
		
		pathTo: function(file){
			return this.path + file;
		},
		
		
		cache: function(files, callback){
			this.cacheModelLoop(files, 0, callback);
		},
		
		cacheModelLoop: function(files, index, callback){
			this.loader.load( this.pathTo(files[index]), (object) => {
				this.mcache[ files[index].replace(".", "").replace("obj", "") ] = object;
				
				if(index+1 !== files.length){ 
					this.cacheModelLoop(files, index+1, callback);
				} else {
					callback();
				}
			});
		},
		
		load: function(name){
			return this.mcache[name];
		}
	};
}