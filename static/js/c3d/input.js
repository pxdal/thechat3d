// Handles input from client

let listeners = []; //stores all active listeners

// creates an input listener (locks the mouse if lock = true)
function createInputListener(){
	let l = {
		keys: {},
		mouse: { //stores the mouseX and mouseY as well as the change between each between mouse movements ( amount moved/size of screen )
			position: {
				x: 0,
				y: 0,
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
			this.mouse.position.x = e.x;
			this.mouse.position.y = e.y;
			
			this.mouse.delta.x = e.movementX;
			this.mouse.delta.y = e.movementY;
		},
		keyPressed: function(){
			return Object.values(this.keys).includes(true);
		},
		createInput: function(codes){
			let out = [];
	
			for(let i = 0; i < codes.length; i++){
				let code = codes[i];
				
				out.push(this.keys[code] || false);
			}
			
			return out;
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