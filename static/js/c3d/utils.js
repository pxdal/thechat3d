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
	
	let pkeys = Object.keys(parent);
	let pvalues = Object.values(parent);
	
	let final = {};
	
	for(let i = 0; i < pkeys.length; i++){
		let key = pkeys[i];
		let value = pvalues[i];
		
		final[key] = value; 
	}
	
	for(let i = 0; i < ckeys.length; i++){
		let key = ckeys[i];
		let value = cvalues[i];
		
		final[key] = value;
	}
	
	return final;
}
