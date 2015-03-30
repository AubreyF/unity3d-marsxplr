var vehicle : Vehicle;
private var p : Vector3;
private var r : Quaternion;
private var m : int = 0;
var syncPosTimer : float = 0.00;
var syncInpTimer : float = 0.00;
var inputS : Vector4;
private var prevPos : Vector3 = Vector3.zero;

function Start() {
	vehicle.GetComponent.<NetworkView>().observed = this;
	vehicle.netCode = "";
	vehicle.isResponding = true;
}

function Update() {
	if(vehicle.networkMode == 2 && Time.time > syncPosTimer) {
		syncPosTimer = Time.time + (1 / Network.sendRate);
		GetComponent.<NetworkView>().RPC("sP", RPCMode.Others, vehicle.myRigidbody.position, vehicle.myRigidbody.rotation);
	}
	
	if(Time.time > syncInpTimer && vehicle.input != inputS) {
		syncInpTimer = Time.time + 1;
		inputS = vehicle.input;
		GetComponent.<NetworkView>().RPC("s4", RPCMode.Others, Mathf.RoundToInt(inputS.x * 10), Mathf.RoundToInt(inputS.y * 10), Mathf.RoundToInt(inputS.z * 10), Mathf.RoundToInt(inputS.w * 10));
	}
}

function FixedUpdate() {
	vehicle.velocity = vehicle.myRigidbody.velocity;
	
	//Terrain Penetration
	var hit : RaycastHit;
    if(prevPos != Vector3.zero) var hits : RaycastHit[] = Physics.RaycastAll(prevPos, (vehicle.transform.position - prevPos).normalized, (vehicle.transform.position - prevPos).magnitude, vehicle.terrainMask);
	if(hits && hits.length > 0) for (var i=0; i<hits.length; i++) {
		if(hits[i].transform.root != transform.root) {
	    	hit = hits[i];
	    	break;
	    }
	}
    if(hit.point != Vector3.zero) {
   		if((prevPos - transform.position).sqrMagnitude < 500) vehicle.transform.position = hit.point + hit.normal * .1;
   		else prevPos = vehicle.transform.position;	//We were teleporting
   	}
	else prevPos = vehicle.transform.position;
}

function OnTriggerStay (other : Collider) {
	if(other.gameObject.layer == 14) return;
	if(other.attachedRigidbody) vehicle.OnRam(other.attachedRigidbody.gameObject);
}

function OnCollisionStay(collision : Collision) {
	vehicle.vehObj.BroadcastMessage("OnCollisionStay", collision, SendMessageOptions.DontRequireReceiver);
	if(collision.collider.transform.root == transform.root) return;
	if(collision.transform.parent && collision.transform.parent.gameObject.GetComponent.<Rigidbody>()) {
		vehicle.OnRam(collision.transform.parent.gameObject); //we hit a tank track or something - and it wasn't one of ours
	}
	else if(collision.rigidbody) {
		vehicle.OnRam(collision.gameObject);
	}
}

function OnSerializeNetworkView(stream : BitStream) {
	if(GetComponent.<NetworkView>().stateSynchronization == NetworkStateSynchronization.Off) {
		Debug.Log("sNv NvL: " + gameObject.name);
		return;
	}
	
	p = vehicle.myRigidbody.position;
	r = vehicle.myRigidbody.rotation;
	stream.Serialize(p);
	stream.Serialize(r);
	m = 0;
	stream.Serialize(m);
	
	/*if(Time.time - 0.25 > syncInpTimer) {
		syncInpTimer = Time.time;
		var i : Vector3 = new Vector3(vehicle.input.x, vehicle.input.y, vehicle.input.z);
		if(i==Vector3.zero) i.x = -2;
		stream.Serialize(i);
	}*/
}