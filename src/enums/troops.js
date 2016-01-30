module.exports.getTroopKey = function(number){
	switch(global.tribe){
		case "Romans":
			switch(number){
				case 0: return "Legionnaires"; break;
				case 1: return "Praetorian"; break;
				case 2: return "Imperian"; break;
				case 3: return "Equites Legati"; break;
				case 4: return "Equites Imperatoris"; break;
			}
			break;
	}
}

module.exports.getTroopNumber = function(name){
	switch(global.tribe){
		case "Romans":
			switch(name){
				case "Legionnaires": return 0; break;
				case "Praetorian": return 1; break;
				case "Imperian": return 2; break;
				case "Equites Legati": return 3; break;
				case "Equites Imperatoris": return 4; break;
				case "Equites Caesaris": return 5; break;
				case "Ram": return 6; break;
				case "Fire Catapult": return 7; break;
				case "Senator": return 8; break;
				case "Settler": return 9; break;
				case "Hero": return 10; break;
			}
	}
}

module.exports.getNumberOfTroops = function(troops){
	var sum = 0;
	for(var i = 0; i < 11; i++){
		sum += troops[i] || 0;
	}
	return sum;
}