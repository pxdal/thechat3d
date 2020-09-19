// manages the chat portion of tc3d, as of right now it's pretty much completely seperate from the rest of the project, and similar to the chat's.

function createChat(socket){
	return {
		domElement: document.createElement("div"),
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
		},
		
		// initializes the dom element, and appends it to domElement
		initDomElement: function(dom){
			this.domElement.style.position = "absolute";
			this.domElement.style.top = "0px";
			this.domElement.style.left = "0px";
			this.domElement.style.width = "250px";
			this.domElement.style.height = "100px";
			this.domElement.appendChild(this.input);
			
			dom.appendChild(this.domElement);
		},
		
		//Callback for when a message is received from the server
		serverNewMessage: function(content){
			let messageElement = document.createElement("p");
			let messageNode = document.createTextNode(content);
			
			messageElement.appendChild(messageNode);
			
			div.appendChild(messageElement);
		},
		
		// gets data from this.input and sends it to the server
		newMessage: function(){
			let message = this.input.value;
			
			this.input.value = "";
			
			this.socket.emit("clientNewMessage", message);
		}
	};
}
