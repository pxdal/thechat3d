// Handles input from client

let listeners = []; //stores all active listeners

// creates an input listener (locks the mouse if lock = true)
function createInputListener(){
	let l = {
		callbacks: {},
		keys: {},
		mouse: { //stores the mouseX and mouseY as well as the change between each between mouse movements ( amount moved/size of screen )
			down: false,
			up: true,
			position: {
				x: 0,
				y: 0,
				px: 0,
				py: 0,
			},
			delta: {
				x: 0,
				y: 0,
			},
		},
		keydown: function(e){
			this.keys[e.code] = true;
		},
		keyup: function(e){
			this.keys[e.code] = false;
		},
		mousemove: function(e){
			this.mouse.position.px = this.mouse.position.x;
			this.mouse.position.py = this.mouse.position.y;
			
			this.mouse.position.x += e.movementX;
			this.mouse.position.y += e.movementY;
		},
		mousedown: function(e){
			this.mouse.down = true;
			this.mouse.up = false;
		},
		mouseup: function(e){
			this.mouse.down = false;
			this.mouse.up = true;
		},
		calculateDelta: function(sensitivity){
			this.mouse.delta.x = (this.mouse.position.x-this.mouse.position.px)*sensitivity;
			this.mouse.delta.y = (this.mouse.position.y-this.mouse.position.py)*sensitivity;
			
			this.mouse.position.px = this.mouse.position.x;
			this.mouse.position.py = this.mouse.position.y;
		},
		keyPressed: function(){
			return Object.values(this.keys).includes(true);
		},
		createInput: function(codes){
			let out = [];
			
			for(let i = 0; i < codes.length; i++){
				let code = codes[i];
				
				if(code == "MousePos"){
					out.push(this.mouse.position || false);
				} else if(code == "MouseDelta"){
					out.push(this.mouse.delta || false);
				} else if(code == "MouseDown"){
					out.push(this.mouse.down);
				} else if(code == "MouseUp"){
					out.push(this.mouse.up);
				} else {
					out.push(this.keys[code] || false);
				}
			}
			
			return out;
		},
		addCallback: function(e, callback){
			this.removeCallback(e);
			
			this.callbacks[e] = callback;
			
			window.addEventListener(e, callback);
		},
		removeCallback: function(e){
			if(this.callbacks[e]){
				window.removeEventListener(e, this.callbacks[e]);
			}
		},
	};
	
	listeners.push(l);
	
	return l;
}

// event listeners
function keydown(e){
	for(let i = 0; i < listeners.length; i++){
		listeners[i].keydown(e);
	}
}

function keyup(e){
	for(let i = 0; i < listeners.length; i++){
		listeners[i].keyup(e);
	}
}

function mousemove(e){
	for(let i = 0; i < listeners.length; i++){
		listeners[i].mousemove(e);
	}
}

function mousedown(e){
	for(let i = 0; i < listeners.length; i++){
		listeners[i].mousedown(e);
	}
}

function mouseup(e){
	for(let i = 0; i < listeners.length; i++){
		listeners[i].mouseup(e);
	}
}

// Creates an array of specific inputs (meant for sending input data to the server)
function createInput(codes){
	let out = [];
	
	for(let i = 0; i < codes.length; i++){
		let code = codes[i];
		
		out.push(keys[code] || false);
	}
	
	return out;
}

// bind events
window.addEventListener("keydown", keydown);
window.addEventListener("keyup", keyup);

window.addEventListener("mousemove", mousemove);
window.addEventListener("mousedown", mousedown);
window.addEventListener("mouseup", mouseup);