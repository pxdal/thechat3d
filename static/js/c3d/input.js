// Handles input from client

let keys = {}; //stores whether keycodes are true/falseinst

// event listeners
function keydown(e){
	keys[e.code] = true;
}

function keyup(e){
	keys[e.code] = false;
}

// Creates an array of specific keys (meant for sending input data to the server)
function createInput(codes){
	let out = [];
	
	for(let i = 0; i < codes.length; i++){
		let code = codes[i];
		
		out.push(keys[code] || false);
	}
	
	return out;
}

// bind events
window.addEventListener("keyup", keyup);
window.addEventListener("keydown", keydown);
