// manages the chat portion of tc3d, as of right now it's pretty much completely seperate from the rest of the project, and similar to the chat's.

function createChat(socket){
	return {
		domElement: document.createElement("div"),
		messageBoxElement: document.createElement("div"),
		input: document.createElement("input"),
		username: null, //client username 
		socket: socket,
		
		// Gets the username for the client
		setUsername: function(){
			this.username = prompt("What's your username?");
			
			socket.emit("clientUsername", this.username);
		},
		
		// Initializes the input text box
		initInput: function(){
			this.input.type = "text";
			this.input.autocomplete = "off";
			this.input.placeholder = "type t to chat";
			this.input.style.position = "static";
		},
		
		// initializes the dom element, and appends it to domElement
		initDomElement: function(dom){
			this.domElement.style.position = "absolute";
			this.domElement.style.top = "0px";
			this.domElement.style.left = "0px";
			this.domElement.style.width = "270px";
			this.domElement.style.height = "200px";
			this.messageBoxElement.style.overflow = "auto";
			this.messageBoxElement.style.width = this.domElement.style.width;
			this.messageBoxElement.style.height = "100%";
			this.domElement.appendChild(this.input);
			this.domElement.appendChild(this.messageBoxElement);
		
			dom.appendChild(this.domElement);
		},
		
		//Callback for when a message is received from the server
		serverNewMessage: function(content){
			let username = content.username;
			let color = content.color;
			let message = content.message;
			
			console.log(color);
			
			let contentElement = this.initContentElement(username, color, message); //paragraph element appended to div

			this.appendContent(contentElement);
			
			contentElement.scrollIntoView(false);
		},
		
		// gets data from this.input and sends it to the server
		newMessage: function(){
			let message = this.input.value;
			
			if(message.length < 1) return;
			
			this.input.value = "";
			
			this.socket.emit("clientNewMessage", message);
		},
		
		initContentElement: function(username, color, message){
			let contentElement = document.createElement("div");
			let messageElement = document.createElement("span");
			
			let content = "[" + username + "]: " + message;
			
			messageElement.style = "color: #" + color;
			messageElement.appendChild( document.createTextNode( content ) );

			contentElement.appendChild(messageElement);
			
			return contentElement;
		},
		
		appendContent: function(contentElement){
			this.messageBoxElement.appendChild(contentElement);
		},
	};
}
