var camOffset : int = 2;
var ridePos : Transform;
var mass : int;
var drag : float;
var angularDrag : float;
var shortName : String;
var inputThrottle : boolean;

var materialMain : MeshRenderer[];
var materialAccent : MeshRenderer[];

function InitVehicle(veh : Vehicle) {
	veh.camOffset = camOffset;
	veh.ridePos = ridePos;
	veh.shortName = shortName;
	veh.myRigidbody.mass = mass;
	veh.myRigidbody.drag = drag;
	veh.myRigidbody.angularDrag = angularDrag;
	if(materialMain.length > 0) {
		var mats : Array = new Array();
		for(var mat : MeshRenderer in materialMain) mats.Add(mat.material);
		veh.materialMain = mats.ToBuiltin(Material);
	}
	if(materialAccent.length > 0) {
		mats = new Array();
		for(var mat : MeshRenderer in materialAccent) mats.Add(mat.material);
		veh.materialAccent = mats.ToBuiltin(Material);
	}
	veh.inputThrottle = inputThrottle;
	Destroy(this);
}