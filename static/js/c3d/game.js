// creates game/render loops

function createGameLoop(gameLoop, framerate, parameters){
	let l = {
		running: false,
		
		loopFunction: gameLoop,
		parameters: parameters,
		
		loop: null
	};
	
	l.loop = window.setInterval((l) => {
		if(l.running){
			l.loopFunction(l.parameters);
		}
	}, Math.floor(1000/framerate), l);
	
	return l;
}