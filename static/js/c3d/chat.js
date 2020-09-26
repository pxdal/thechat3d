// manages the chat portion of tc3d, as of right now it's pretty much completely seperate from the rest of the project, and similar to the chat's.

function createChat(socket){
	return {
		domElement: document.createElement("div"), //main dom element
		messageBoxElement: document.createElement("div"), //message box element
		inputElement: document.createElement("input"), //input element
		debugElement: document.createElement("span"), //debug element
		username: null, //client username 
		socket: socket,
		
		// Gets the username for the client
		setUsername: function(){
			this.username = prompt("What's your username?");
			
			socket.emit("clientUsername", this.username);
		},
		
		// Initializes the input text box
		initInput: function(){
			this.inputElement.type = "text";
			this.inputElement.autocomplete = "off";
			this.inputElement.placeholder = "type t to chat";
			this.inputElement.style.position = "static";
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
			this.debugElement.style.color = "white";
			this.debugElement.style.position = "absolute";
			this.debugElement.style.left = "285px";
			this.debugElement.style.top = "5px";
			this.debugElement.style.visibility = "hidden";
			this.domElement.appendChild(this.inputElement);
			this.domElement.appendChild(this.messageBoxElement);
			
			dom.appendChild(this.debugElement);
					
			dom.appendChild(this.domElement);
		},
		
		// Update debug elememt
		updateDebug: function(x, y, z){
			this.debugElement.textContent = "x: " + x.toFixed(2) + ", y: " + y.toFixed(2) + ", z: " + z.toFixed(2);
		},
		
		// Callback for when a message is received from the server
		serverNewMessage: function(content){
			let username = content.username;
			let color = content.color;
			let message = content.message;

			let contentElement = this.initContentElement(username, color, message); //paragraph element appended to div

			this.appendContent(contentElement);
			
			contentElement.scrollIntoView(false);
		},
		
		// gets data from this.input and sends it to the server
		newMessage: function(){
			let message = this.inputElement.value;
			
			if(message.length < 1) return;
			
			this.inputElement.value = "";
			
			this.socket.emit("clientNewMessage", message);
		},
		
		// Initializes a message element to be appended to message box
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
		
		handleInput: function(input){
			if(input.KeyT){
				this.inputElement.focus();
			}

			if(input.Enter){
				if(document.activeElement !== this.inputElement) return;
				
				this.inputElement.blur();
				
				if(this.username !== null){
					this.newMessage();
				}
			}
		}
	};
}
