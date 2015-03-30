var lag : float;
var explosion : Transform;
var launchVehicle : Vehicle;
var targetVehicle : Vehicle;
var speedX : int;
var laserID : String;
private var strtPos;
private var stage = -1;
var mask : LayerMask = -1;
var maskOpt : LayerMask = -1;

function Start() {
	//Init
	name = "lsr#" + laserID;
	velocity = Game.Settings.laserSpeed * speedX + Mathf.Max(0, 
		launchVehicle.transform.InverseTransformDirection(launchVehicle.velocity).z *
		(targetVehicle ? 1 : Vector3.Dot(transform.forward, launchVehicle.transform.forward))
	);
	
	//AutoTargeting
	//if(Game.QuarryVeh && !launchVehicle || Game.QuarryVeh != launchVehicle) targetVehicle = Game.QuarryVeh;
	if(targetVehicle) {
		var bgn : Vector3 = transform.position;
		if(targetVehicle.GetComponent.<NetworkView>().isMine) { //Local vehicle, high precision
			var refvel : Vector3 = targetVehicle.gameObject.GetComponent.<Rigidbody>().velocity;
			var reftme : float = Time.time;
			yield new WaitForSeconds(Time.fixedDeltaTime * 5); //Allow target to move so we can analyze it's acceleration
			var pos : Vector3 = targetVehicle.transform.position;
			var vel : Vector3 = targetVehicle.gameObject.GetComponent.<Rigidbody>().velocity;
			var accel : Vector3 = (vel - refvel) * 1 / (Time.time - reftme); //Accelleration over 1 second
		}
		else {	//Remote vehicle, just make it look good
			var refpos : Vector3 = targetVehicle.transform.position;
			reftme = Time.time;
			yield new WaitForSeconds(Time.fixedDeltaTime * 5); //Allow target to move so we can analyze it's velocity
			refvel = (targetVehicle.transform.position - refpos) * 1 / (Time.time - reftme); //velocity over 1 second
			refpos = targetVehicle.transform.position;
			reftme = Time.time;
			yield new WaitForSeconds(Time.fixedDeltaTime * 5); //Allow target to move so we can analyze it's acceleration
			pos = targetVehicle.transform.position;
			vel = (targetVehicle.transform.position - refpos) * 1 / (Time.time - reftme); //velocity over 1 second
			accel = (vel - refvel) * 1 / (Time.time - reftme); //Accelleration over 1 second
		}
		
		var dur : float = 0;
		while(true) {
			pos += vel * Time.fixedDeltaTime;
			vel += accel * Time.fixedDeltaTime;
			dur += Time.fixedDeltaTime;
			if(dur > 10 || Vector3.Distance(bgn, pos) < dur * velocity) break;
		}
		transform.LookAt(pos);
	}
	
	//Lag Compensation
	//Unnecessary when autotargeting, as hits are calculated on target client
	else if(lag > 0) GetComponent.<Rigidbody>().position += GetComponent.<Rigidbody>().transform.TransformDirection(0, 0, velocity * lag);	//Position extrapolation for non authoratative firing instances
	
	//Begin Run
	GetComponent.<Rigidbody>().velocity = GetComponent.<Rigidbody>().transform.TransformDirection(0, 0, velocity);
	strtPos = GetComponent.<Rigidbody>().position;
	stage = 0;
	
	//Cleanup
	yield new WaitForSeconds(Mathf.Lerp(13, 5, Game.Settings.laserSpeed * speedX * .003));
	Destroy(gameObject);
}

function FixedUpdate() {
	if(stage != 0 || !launchVehicle || !Game.Settings) return;
	if(Game.Settings.laserGrav != 0) GetComponent.<Rigidbody>().velocity.y -= Game.Settings.laserGrav * speedX * Time.deltaTime * 20;
	var hits : RaycastHit[];
	var vector : Vector3 = transform.position - strtPos;
    hits = Physics.RaycastAll (strtPos, vector, vector.magnitude, (Game.Settings.lasersOptHit ? maskOpt : mask ));
    for (var i=0; i<hits.length; i++) {
        var collision : RaycastHit = hits[i];
		
		//Launch vehicle is immune to hits
		if(collision.collider.transform.root.gameObject == launchVehicle.gameObject) continue;
		
		//Non-authoratative game instances DO NOT detect vehicle laser hits. Hits are detected on authoratative instance, and then broadcast to other clients with lH RPC
		if(((targetVehicle && !targetVehicle.GetComponent.<NetworkView>().isMine) || (!targetVehicle && !launchVehicle.GetComponent.<NetworkView>().isMine)) && collision.rigidbody) continue;
		
		//We are the instance if this laser on the firer's computer, & we tagged another vehicle
		if(((targetVehicle && targetVehicle.GetComponent.<NetworkView>().isMine) || (!targetVehicle && launchVehicle.GetComponent.<NetworkView>().isMine)) && collision.rigidbody) {
			var veh : Vehicle = collision.transform.root.gameObject.GetComponent(Vehicle);
			if(veh && veh.isResponding) {
				//Determine where we hit them
				veh.gameObject.GetComponent.<NetworkView>().RPC("lH", RPCMode.Others, laserID, collision.transform.InverseTransformPoint(collision.point));
				//We are quarry, and made a tag
				if(launchVehicle.isIt == 1 && (Time.time - veh.lastTag) > 3) {
					launchVehicle.gameObject.GetComponent.<NetworkView>().RPC("iS", RPCMode.All, veh.gameObject.name);
					veh.lastTag = Time.time;
				}
				//They were quarry, and we tagged them
				else if(veh.isIt == 1 && (Time.time - launchVehicle.lastTag) > 3 && (Time.time - veh.lastTag) > 3) launchVehicle.gameObject.GetComponent.<NetworkView>().RPC("sQ", RPCMode.All, 2);
				//They weren't quarry, and we weren't supposed to shoot them
				else if(veh.isIt == 0 && launchVehicle.isIt == 0) launchVehicle.gameObject.GetComponent.<NetworkView>().RPC("dS", RPCMode.All, veh.gameObject.name);
			}
		}
		
		if(collision.rigidbody || Game.Settings.laserRico == 0) {
			laserHit(collision.transform.root.gameObject, collision.point, collision.normal);
		}
		else {
			GetComponent.<Rigidbody>().position = collision.point /*+ rigidbody.velocity.normalized * -.1*/;// + collision.normal;
			GetComponent.<Rigidbody>().velocity = Game.Settings.laserRico * Vector3.Lerp(Vector3.Scale(GetComponent.<Rigidbody>().velocity, collision.normal), Vector3.Reflect(GetComponent.<Rigidbody>().velocity, collision.normal), Game.Settings.laserRico);
		}
    }
    
    strtPos = GetComponent.<Rigidbody>().position;
}

function laserHit(go : GameObject, pos : Vector3, norm : Vector3) {
	//if(stage == 1) return; //We already collided with a vehicle on a non-authoratative instance - ignore the collision message that the authoratative vehicle is sending us...
	stage = 1;
	
	GetComponent.<Rigidbody>().position = pos;
	GetComponent.<Rigidbody>().velocity = Vector3.zero;
	go.BroadcastMessage("OnLaserHit", launchVehicle.GetComponent.<NetworkView>().isMine, SendMessageOptions.DontRequireReceiver);
	var colliders : Collider[] = Physics.OverlapSphere(pos, 10);
	for (var hit in colliders) {
	 	if (hit.attachedRigidbody) {
		  	hit.attachedRigidbody.AddExplosionForce(350 + speedX * 300, pos, 1, 2);
		}
	}
	Instantiate(explosion, pos, Quaternion.FromToRotation(Vector3.up, norm)); //transform.rotation
}