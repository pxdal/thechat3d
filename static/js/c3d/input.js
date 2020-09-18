// Handles input from client

let keys = {}; //stores whether keycodes are true/falseinst

// event listeners
function keydown(e){
	keys[e.code] = true;
}

function keyup(e){
	keys[e.code] = false;
}

// bind events
window.addEventListener("keyup", keyup);
window.addEventListener("keydown", keydown);
