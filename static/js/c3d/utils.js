//Pads string with leading zeroes because it doesn't natively do that B)
function zeroes( string, width ){
	let stringW = string.length;
	let padW = width - stringW;
	
	if(padW <= 0){
		return string;
	}
	
	let zeroes = "";
	
	for(let i = 0; i < padW; i++){
		zeroes += "0";
	}
	
	return zeroes + string;
}

//Attach the properties of child object to parent object, overwriting parent properties if child has them
function attach(parent, child){
	let ckeys = Object.keys(child);
	let cvalues = Object.values(child);

	for(let i = 0; i < ckeys.length; i++){
		let key = ckeys[i];
		let value = cvalues[i];
		
		parent[key] = value;
	}
	
	return parent; //it doesn't need to return but it does
}
