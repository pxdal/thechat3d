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
