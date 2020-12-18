// HUD manager

function createHUDManager(HUDElement){
	return {
		HUDElement: HUDElement,
		HUDImage: null,
		
		init: function(){
			this.HUDElement.id = "hud-div";
			
			this.HUDImage = document.createElement("img");
			
			this.HUDImage.style.position = "absolute";
			this.HUDImage.style.bottom = "10px";
			
			this.HUDElement.appendChild(this.HUDImage);
			
			document.body.appendChild(this.HUDElement);
		},
		
		setHUDImage: function(src){
			this.HUDImage.src = src;
			
			this.onResize();
		},
		
		onResize: function(){
			let poll = window.setInterval(function () {
				if (this.HUDImage.naturalWidth) {
					window.clearInterval(poll);
					this.HUDImage.style.left = window.innerWidth/2 - this.HUDImage.naturalWidth/2 + "px";
				}
			}.bind(this), 10);	
		},
	};
}