var vehicle : Vehicle;
private var rocketFireTime = 0.00;

function Update () {
	//Input Assignments
	if(Input.GetButtonDown("Jump") && (!Game.Messaging || !Game.Messaging.chatting) && Time.time > Game.Controller.kpTime) {
		GetComponent.<NetworkView>().RPC("sI", RPCMode.All, vehicle.specialInput ? false : true);
		Game.Controller.kpTime = Time.time + Game.Controller.kpDur;
	}
	//if(Input.GetButtonDown("Fire3") && (!Game.Messaging || !Game.Messaging.chatting)) networkView.RPC("sB", RPCMode.All, vehicle.brakes ? false : true);
	if(Input.GetButton("Fire3") && !vehicle.brakes) GetComponent.<NetworkView>().RPC("sB", RPCMode.All, true);
	else if(!Input.GetButton("Fire3") && vehicle.brakes) GetComponent.<NetworkView>().RPC("sB", RPCMode.All, false);
	vehicle.input.x = Input.GetAxis("Horizontal");
	vehicle.input.y = Input.GetAxis("Vertical");
	vehicle.input.z = Input.GetAxis("Throttle");
	vehicle.input.w = Input.GetAxis("Yaw");
	if(vehicle.inputThrottle) {
		vehicle.input.z = (vehicle.input.z + 1) * .5;
	}
	else {
		if(vehicle.input.x > -.1 && vehicle.input.x < .1) vehicle.input.x = vehicle.input.w;
		if(vehicle.input.y > -.1 && vehicle.input.y < .1) vehicle.input.y = vehicle.input.z;
	}

	//Weapons Locking
	if(Game.Settings.laserLocking) {
		var hit : RaycastHit;
		if(Physics.Raycast(transform.position + transform.forward * (((Game.Settings.laserLock[vehicle.vehId]) + vehicle.camOffset * .1) * 15), transform.forward, hit, Mathf.Infinity, 1 << 14) && (vehicle.isIt || hit.transform.gameObject.GetComponent(Vehicle).isIt)) {
			laserLock = hit.transform.gameObject;
			vehicle.laserAimer.SetActive(false);
			vehicle.laserAimerLocked.SetActive(true);
		}
		else {
			laserLock = null;
			vehicle.laserAimer.SetActive(true);
			vehicle.laserAimerLocked.SetActive(false);
		}
	}
	else {
		vehicle.laserAimer.SetActive(false);
		vehicle.laserAimerLocked.SetActive(false);
		laserLock = null;
	}

	//Firing
	if (
		vehicle.ridePos &&
		Game.Settings.lasersAllowed &&
		rocketFireTime < Time.time &&
		Game.Settings.firepower[vehicle.vehId] > 0 &&
		(laserLock || 													//Autofiring With Weapons Lock
			(Input.GetButton("Fire1") && !Input.GetMouseButton(0)) ||	//Firing with Joystick
			(Input.GetButton("Fire1") && (Input.GetButton("Fire2") || Input.GetButton("Snipe") || Game.Settings.camMode == 0)) ||		//Firing with mouse while inside vehicle
			(Input.GetButton("Fire1") && ((Input.mousePosition.x > Screen.width * .25 && Input.mousePosition.x < Screen.width - 200)))	//Firing with mouse while outside vehicle
		)
	) {
		if(laserLock) {
			var snipe = (Game.Settings.firepower[vehicle.vehId] > 2 || (Game.Settings.firepower[vehicle.vehId] > 1 && (laserLock.GetComponent.<Rigidbody>().velocity.sqrMagnitude > 500 || Vector3.Distance(transform.position, laserLock.transform.position) > 500)));
			GetComponent.<NetworkView>().RPC((snipe ? "fSl" : "fRl"), RPCMode.All, GetComponent.<NetworkView>().viewID, Network.time + "", vehicle.ridePos.position + vehicle.transform.up * -.1, laserLock.GetComponent.<NetworkView>().viewID);
		}
		else {
			if(Game.Settings.camMode == 0 || Input.GetButton("Fire2") || Input.GetButton("Snipe")) var rang = GetComponent.<Camera>().main.transform.rotation;
			else rang = vehicle.ridePos.rotation;
			snipe = ((Input.GetButton("Snipe") && Game.Settings.firepower[vehicle.vehId] > 1) || Game.Settings.firepower[vehicle.vehId] > 2);
			GetComponent.<NetworkView>().RPC((snipe ? "fS" : "fR"), RPCMode.All, GetComponent.<NetworkView>().viewID, Network.time + "", vehicle.ridePos.position + vehicle.transform.up * -.1, rang.eulerAngles);
		}
		rocketFireTime = Time.time + ((snipe ? (Game.Settings.firepower[vehicle.vehId] > 2 ? .5 : 2) : .25));
	}

	//Bounds Checking
	if(vehicle.myRigidbody.position.y < -300) {
		vehicle.myRigidbody.velocity = vehicle.myRigidbody.velocity.normalized;
		vehicle.myRigidbody.isKinematic = true;
		vehicle.transform.position = World.base.position;
		vehicle.myRigidbody.isKinematic = false;
		if(Game.Messaging) Game.Messaging.broadcast(name + " fell off the planet");
	}
	if(vehicle.myRigidbody.velocity.magnitude > 500) vehicle.myRigidbody.velocity = vehicle.myRigidbody.velocity * .5;
}

function FixedUpdate() {
	if(vehicle.ramoSphere && vehicle.zorbBall) {
		if(vehicle.input.y || vehicle.input.x) {
			GetComponent.<Rigidbody>().AddForce(Vector3.Scale(Vector3(1,0,1), Camera.main.transform.TransformDirection(Vector3(vehicle.input.x * Mathf.Max(0,Game.Settings.zorbSpeed + Game.Settings.zorbAgility),0,vehicle.input.y * Game.Settings.zorbSpeed))), ForceMode.Acceleration);
			GetComponent.<Rigidbody>().AddTorque(Camera.main.transform.TransformDirection(Vector3(vehicle.input.y,0,-vehicle.input.x)) * Game.Settings.zorbSpeed, ForceMode.Acceleration);
		}
	}
}

function OnPrefsUpdated() {
	if(Game.Settings.renderLevel > 4) {
		var lt : Light = gameObject.GetComponentInChildren(Light);
		if(lt) lt.enabled = true;
	}
	if(Game.Settings.renderLevel > 3) {
	    for (var tr : TrailRenderer in gameObject.GetComponentsInChildren(TrailRenderer)) {
			tr.enabled = true;
		}
	}
}
