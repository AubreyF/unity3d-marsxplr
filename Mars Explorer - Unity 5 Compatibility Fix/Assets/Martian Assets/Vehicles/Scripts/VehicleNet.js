var vehicle : Vehicle;
var simulatePhysics : boolean = true;
var updatePosition : boolean = true;
var physInterp = 0.1;
var ping : float;
var jitter : float;
var calcPing : float = 0.00;
var rpcPing : float = 0.00;
var lastPing : float = -1.00;
var pingCheck : int = Random.Range(15, 20);
var wePinged : boolean = false;
var autoInterp : float = 0.00;
private var m : int;
private var p : Vector3;
private var r : Quaternion;
var states = new State[15];

class State extends System.Object {
    var p : Vector3;
    var r : Quaternion;
    var t : float = 0.0;
    var m : float = 0.0;
    var n : float = 0.0;
    //var s : float = 0.0;
 	function State(p : Vector3, r : Quaternion, t : float, m : float, n : float) {	//, s : float) {
        this.p = p;
        this.r = r;
        this.t = t;
        //this.s = s;
        this.m = m;
        this.n = n;
    }
}

function Start() {
	vehicle.GetComponent.<NetworkView>().observed = this;
}

function Update() {
//try {
	
	if(/*Game.Settings.networkInterpolation > 0 &&*/ vehicle.networkMode == 2 && Time.time > lastPing + pingCheck) {
		if(lastPing < 0) lastPing = Time.time;
		else {
			GetComponent.<NetworkView>().RPC("sT", RPCMode.All, 0.0);
		}
	}
	
	if(!updatePosition || !states[14] || states[14].t == 0.0 || !vehicle.myRigidbody || !Game.Player || !Game.Player.GetComponent.<Rigidbody>()) return;
	
	if(Game.Settings.networkPhysics == 0) {
		physInterp = .1;
	}
	else if(Game.Settings.networkPhysics == 1) {
		physInterp = .2;
	}
	
	if(Game.Settings.networkPhysics == 2) simulatePhysics = false;
	else simulatePhysics = (Vector3.Distance(vehicle.myRigidbody.position, Game.Player.GetComponent.<Rigidbody>().position) < 40);
	
	/*
	//jitter = Mathf.Lerp(jitter, Mathf.Abs(ping - (Network.time - states[0].t)), Time.deltaTime * .3);
	var prevJitter : float = jitter;
	//jitter = 0.0;
	//for (i=0; i<states.length-2; i++) if(states[i].t - states[i+1].t > jitter) jitter = states[i].t - states[i+1].t;
	//jitter = Mathf.Lerp(prevJitter, jitter, Time.deltaTime * .3);
	var jitterSum = 0.0;
	for (i=0; i<states.length-1; i++) jitterSum += states[i].t - states[i+1].t;
	jitter = Mathf.Lerp(prevJitter, (jitterSum / 14) - (1 / Network.sendRate), Time.deltaTime * .3);
	ping = Mathf.Lerp(ping, Network.time - states[0].s, Time.deltaTime * .3);
	*/
	
	vehicle.myRigidbody.isKinematic = !simulatePhysics;
	vehicle.myRigidbody.interpolation = RigidbodyInterpolation.None;	//(simulatePhysics || Game.Settings.networkPhysics == 1 ? RigidbodyInterpolation.Interpolate : RigidbodyInterpolation.None);
	
	//Interpolation
	if(Game.Settings.networkInterpolation > 0) var interpolationTime : float = Network.time - Game.Settings.networkInterpolation;
	else {
		autoInterp = Mathf.Max(.1, Mathf.Lerp(autoInterp, ping * 1.5 + (jitter * 8), Time.deltaTime * .15));
		interpolationTime = Network.time - autoInterp;
	}
	
	if (states[0].t > interpolationTime) {												// Target playback time should be present in the buffer
		for (i=1; i<states.length-1; i++) {												// Go through buffer and find correct state to play back
			if (states[i] && (states[i].t <= interpolationTime || i == states.length-3)) {
				var rhs : State = states[i-1];											// The state one slot newer than the best playback state
				var lhs : State = states[i];											// The best playback state (closest to .1 seconds old)
				var l : float = rhs.t - lhs.t;											// Use the time between the two slots to determine if interpolation is necessary
				var t : float = 0.0;													// As the time difference gets closer to 100 ms, t gets closer to 1 - in which case rhs is used
				if (l > 0.0001) t = ((interpolationTime - lhs.t) / l);					// if t=0 => lhs is used directly
				vehicle.velocity = Vector3.Lerp(vehicle.velocity, ((rhs.p - states[i + 2].p) / (rhs.t - states[i + 2].t)), Time.deltaTime * .3);
				if(simulatePhysics) {
					//vehicle.transform.position = Vector3.Lerp(vehicle.transform.position, Vector3.Lerp(lhs.p, rhs.p, t), physInterp);
					//vehicle.transform.rotation = Quaternion.Slerp(vehicle.transform.rotation, Quaternion.Slerp(lhs.r, rhs.r, t), physInterp);
					vehicle.myRigidbody.MovePosition(Vector3.Lerp(vehicle.transform.position, Vector3.Lerp(lhs.p, rhs.p, t), physInterp));
					vehicle.myRigidbody.MoveRotation(Quaternion.Slerp(vehicle.transform.rotation, Quaternion.Slerp(lhs.r, rhs.r, t), physInterp));
					vehicle.myRigidbody.velocity = vehicle.velocity;
				}
				else {
					vehicle.myRigidbody.position = Vector3.Lerp(lhs.p, rhs.p, t);
					vehicle.myRigidbody.rotation = Quaternion.Slerp(lhs.r, rhs.r, t);
				}
				vehicle.isResponding = true;
				vehicle.netCode = "";
				return;
			}
		}
	}
	
	//Extrapolation
	else {
		var extrapolationLength : float = (interpolationTime - states[0].t);
		vehicle.velocity = Vector3.Lerp(vehicle.velocity, ((states[0].p - states[2].p) / (states[0].t - states[2].t)), Time.deltaTime * .3);
		if (extrapolationLength < 1) {
			if(!simulatePhysics) {
				vehicle.myRigidbody.position = states[0].p + (vehicle.velocity * extrapolationLength);
				vehicle.myRigidbody.rotation = states[0].r;
			}
			vehicle.isResponding = true;
			if(extrapolationLength < .3) vehicle.netCode = ">";
			else vehicle.netCode = " (Delayed)";
		}
		else {
			vehicle.netCode = " (Not Responding)";
			vehicle.isResponding = false;
		}
		/*vehicle.velocity = ((states[0].p - states[1].p) / (states[0].t - states[1].t));
		if (extrapolationLength < .5 && states[0] && states[1]) {
			if(!simulatePhysics) {
				vehicle.transform.position = states[0].p + (vehicle.velocity * extrapolationLength);
				vehicle.transform.rotation = states[0].r;
			}
			vehicle.isResponding = true;
			if(extrapolationLength < .3) vehicle.netCode = ">";
			else vehicle.netCode = " (Delayed)";
		}
		else {
			vehicle.netCode = " (Not Responding)";
			vehicle.isResponding = false;
		}*/
		//if(simulatePhysics && states[0].t > states[1].t) vehicle.myRigidbody.velocity = vehicle.velocity;
	}
	
/*}
catch (e : System.Exception) {
	Debug.Log("Interpolation Error in " + vehicle.gameObject.name + ": " + e.ToString());
}*/
}

function OnSerializeNetworkView(stream : BitStream, info : NetworkMessageInfo) {
	
	//We are the server, and have to keep track of relaying messages between connected clients
	if(stream.isWriting) {
		if(GetComponent.<NetworkView>().stateSynchronization == NetworkStateSynchronization.Off) {
			Debug.Log("sNv NvS: " + gameObject.name);
			return;
		}
		
		if(!states[0]) return;
		p = states[0].p;
		r = states[0].r;
		m = (Network.time - states[0].t) * 1000;	//m is the number of milliseconds that transpire between the packet's original send time and the time it is resent from the server to all the other clients
		stream.Serialize(p);
		stream.Serialize(r);
		stream.Serialize(m);
		/*if(f) {
			stream.Serialize(i);
			f = false;
		}*/
	}
	
	//New packet recieved - add it to the states array for interpolation!
	else {
		if(GetComponent.<NetworkView>().stateSynchronization == NetworkStateSynchronization.Off) {
			Debug.Log("sNv NvN: " + gameObject.name);
			return;
		}
		
		stream.Serialize(p);
		stream.Serialize(r);
		stream.Serialize(m);
		
		var state : State = new State(p, r, info.timestamp - (m > 0 ? (parseFloat(m) / 1000) : 0), m, Network.time - info.timestamp);
		
		if(states[0] && state.t == states[0].t) state.t += .01;	//Bizarre - dragonhere
		
		if(!states[0] || state.t > states[0].t) {
			
			var png : float = Network.time - state.t;
			jitter = Mathf.Lerp(jitter, Mathf.Abs(ping - png), 1 / Network.sendRate);
			ping = Mathf.Lerp(ping, png, 1 / Network.sendRate);
			
			for (k=states.length-1; k>0; k--) states[k] = states[k-1];
			states[0] = state;
			
		}
		//else Debug.Log(vehicle.name + ": Out-of-order state received and ignored (" + ((states[0].t - state.t) * 1000) + ")" + states[0].t + "---" + state.t + "---" + m);
		
		/*var lastI : Vector3 = i;
		stream.Serialize(i);
		if(i == Vector3.zero) i = lastI;	//Vector3 not included in stream
		else f = true;						//Vector3 was included in stream
		if(i.x == -2) i = Vector3.zero;		//Vector3 is zero, but flag has been set so we can differentiate it from unset Vector3
		vehicle.input = i;*/
	}
	
}