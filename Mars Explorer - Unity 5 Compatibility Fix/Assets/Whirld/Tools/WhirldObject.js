var data : WhirldData[];
var params : Hashtable;

function Awake() {
	Activate();
}

function OnSceneGenerated() {
	Activate();
}

//Futile, as HashTables aren't serialized inside AssetBUndles anyway ;(
/*function OnSaveScene() {
	Activate();
	//data = null;
}*/

function Activate() {
	if(!params && data.Length > 0) {
		params = new Hashtable();
		for(var dat : WhirldData in data) {
			if(dat.o)	params.Add(dat.n, dat.o);
			else		params.Add(dat.n, dat.v);
		}
	}
}