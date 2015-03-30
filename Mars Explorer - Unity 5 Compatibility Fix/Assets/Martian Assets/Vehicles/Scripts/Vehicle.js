var camOffset : int = 2;
var ridePos : Transform;
var terrainMask : LayerMask = ~1<<4;

var laserAimer : GameObject;
var laserAimerLocked : GameObject;
var laserLock : GameObject;
var bubbles : ParticleEmitter;

var vehId = 0;
var networkMode = 0;
@System.NonSerialized
var shortName : String;
@System.NonSerialized
var isIt = 0;
@System.NonSerialized
var lastTag : float = 0.00;
private var startTime : float;
@System.NonSerialized
var lastReset : float = 0.00;
@System.NonSerialized
var score : int;
@System.NonSerialized
var scoreTime : int;
//@System.NonSerialized
var input : Vector4;
//@System.NonSerialized
var specialInput = false;
var inputThrottle : boolean;
@System.NonSerialized
var zorbBall = false;
@System.NonSerialized
var brakes = false;
@System.NonSerialized
var camSmooth : boolean;
@System.NonSerialized
var velocity : Vector3;

var isBot : boolean = false;
@System.NonSerialized
var isPlayer : boolean = false;
@System.NonSerialized
var isResponding = false;
@System.NonSerialized
var netCode = " (No Connection)";
@System.NonSerialized
var vehObj : GameObject;
@System.NonSerialized
var myRigidbody : Rigidbody;
@System.NonSerialized
var ramoSphere : GameObject;
var ramoSphereObj : GameObject;
@System.NonSerialized
var ramoSphereScale : float;
private var marker : GameObject;
private var markerQuarry : GameObject;
@System.NonSerialized
var vehicleNet : VehicleNet = null;
@System.NonSerialized
var netKillMode : int = 0;
private var updateTick : float = 0;

var vehicleColor : Color;
var vehicleAccent : Color;
var materialMain : Material[];
var materialAccent : Material[];
private var updateColor = false;

function Start() {
	if(GetComponent.<NetworkView>().viewID.isMine) {
		var vehicleLocal : VehicleLocal = gameObject.AddComponent(VehicleLocal);
		vehicleLocal.vehicle = this;
	}
	if(GetComponent.<NetworkView>().viewID.isMine && !isBot) {
		marker = Instantiate(Game.objectMarkerMe, transform.position, transform.rotation);
		marker.transform.parent = transform;
		isPlayer = true;
		Game.PlayerVeh = this;
		var vehicleMe : VehicleMe = gameObject.AddComponent(VehicleMe);
		vehicleMe.vehicle = this;
		vehicleColor.r = PlayerPrefs.GetFloat("vehColR");
		vehicleColor.g = PlayerPrefs.GetFloat("vehColG");
		vehicleColor.b = PlayerPrefs.GetFloat("vehColB");
		vehicleAccent.r = PlayerPrefs.GetFloat("vehColAccR");
		vehicleAccent.g = PlayerPrefs.GetFloat("vehColAccG");
		vehicleAccent.b = PlayerPrefs.GetFloat("vehColAccB");
		if(Game.Settings.colorCustom) Game.Settings.saveVehicleColor();
		setColor();
	}
	else {
		Destroy(laserAimer);
		Destroy(laserAimerLocked);
		marker = Instantiate(Game.objectMarker, transform.position, transform.rotation);
		marker.transform.parent = transform;
		markerQuarry = Instantiate(Game.objectMarkerQuarry, transform.position, transform.rotation);
		markerQuarry.transform.parent = transform;

		if(isBot && GetComponent.<NetworkView>().viewID.isMine) {
			var vehicleBot : VehicleBot = gameObject.AddComponent(VehicleBot);
			vehicleBot.vehicle = this;
			vehicleColor = Game.PlayerVeh.vehicleColor;
			vehicleAccent = Game.PlayerVeh.vehicleAccent;
		}
		else {
			vehicleNet = gameObject.AddComponent(VehicleNet);
			vehicleNet.vehicle = this;
		}
	}

	gameObject.AddComponent(Rigidbody);
	myRigidbody = GetComponent.<Rigidbody>();
	myRigidbody.interpolation = RigidbodyInterpolation.Interpolate;

	if(Game.Players.ContainsKey(name)) Game.Players.Remove(name);
	Game.Players.Add(name, this);

	for(var plrE : DictionaryEntry in Game.Players) plrE.Value.setColor();	//Make sure everyone is colored correctly

	vehObj.BroadcastMessage("InitVehicle", this);
	lastTag = Time.time;
	startTime = Time.time;
	Game.Settings.updateObjects();

	//Force-Refresh Everyone's NetworkView - http://forum.unity3d.com/viewtopic.php?t=35724&postdays=0&postorder=asc&start=105
	GetComponent.<NetworkView>().enabled = false;
	yield;
	GetComponent.<NetworkView>().enabled = true;
}

function Update() {
	bubbles.emit = (transform.position.y < Game.Settings.lavaAlt - 2 || Physics.Raycast(transform.position + (Vector3.up * 200), Vector3.down, 198,  1 << 4));
	bubbles.maxEnergy = bubbles.minEnergy = (bubbles.emit ? 5 : 0);

	if(isBot || !GetComponent.<NetworkView>().isMine) {
		if(isIt && markerQuarry && !markerQuarry.activeSelf) {
			markerQuarry.SetActive(true);
			marker.SetActive(false);
		}
		else if(!isIt && markerQuarry && markerQuarry.activeSelf) {
			markerQuarry.SetActive(false);
			marker.SetActive(true);
		}
		if(isIt && Game.Player) Game.Controller.quarryDist = Vector3.Distance(transform.position, Game.Player.transform.position);
	}

	if(updateColor) {
		updateColor = false;
		var isGreen : boolean = (isIt && Game.Players.Count > 1 ? true : false);
		if(materialMain.length > 0) {
			var targetColor : Color = (isGreen ? Game.Controller.vehicleIsItColor : vehicleColor);
			materialMain[0].color = Color.Lerp(materialMain[0].color, targetColor, Time.deltaTime * 2);
			materialMain[0].color.a = .5;
			if(materialAccent.length > 0) materialMain[0].SetColor ("_SpecColor", materialAccent[0].color);
			else materialMain[0].SetColor ("_SpecColor", vehicleAccent);
			if(materialMain[0].color.r < targetColor.r - .05 || materialMain[0].color.r > targetColor.r + .05 || materialMain[0].color.g < targetColor.g - .05 || materialMain[0].color.g > targetColor.g + .05 || materialMain[0].color.b < targetColor.b - .05 || materialMain[0].color.b > targetColor.b + .05) updateColor = true;
			if(materialMain.length > 1) for(i = 1; i < materialMain.length; i++) materialMain[i].color = materialMain[0].color;
		}
		if(materialAccent.length > 0) {
			targetColor = (isGreen ? Game.Controller.vehicleIsItAccent : vehicleAccent);
			materialAccent[0].color = Color.Lerp(materialAccent[0].color, targetColor, Time.deltaTime * 2);
			materialAccent[0].color.a = .5;
			materialAccent[0].SetColor ("_SpecColor", materialMain[0].color);
			if(materialAccent[0].color.r < targetColor.r - .05 || materialAccent[0].color.r > targetColor.r + .05 || materialAccent[0].color.g < targetColor.g - .05 || materialAccent[0].color.g > targetColor.g + .05 || materialAccent[0].color.b < targetColor.b - .05 || materialAccent[0].color.b > targetColor.b + .05) updateColor = true;
			if(materialAccent.length > 1) for(i = 1; i < materialAccent.length; i++) materialAccent[i].color = materialAccent[0].color;
		}
	}

	if(Time.time > updateTick) {
		updateTick = Time.time + 1;
		if(!Game.Players.ContainsKey(name)) Game.Players.Add(name, this);	//Dragonhere: this helps to prevent multi-quarry syndrome
	}
}

function FixedUpdate() {
	if(ramoSphereScale != 0 && ramoSphere) {
		ramoSphere.transform.localScale = Vector3.Lerp (ramoSphere.transform.localScale, Vector3.one * ramoSphereScale, Time.fixedDeltaTime);
		if(ramoSphere.transform.localScale.x > ramoSphereScale - .01 && ramoSphere.transform.localScale.x < ramoSphereScale + .01) ramoSphereScale = 0;
	}
}

function OnGUI() {
	if(!myRigidbody || (netCode != "" && Time.time < startTime + 5)) return;
	GUI.skin = Game.Skin;
	GUI.color.a = Game.GUIAlpha;
	GUI.depth = -1;
	if(GetComponent.<NetworkView>().isMine && !isBot) {
		GUI.Button(Rect((Screen.width * 0.5) - 75,Screen.height - 30,150,20), (myRigidbody.velocity.magnitude < 0.05 ? "Static" : Mathf.RoundToInt(myRigidbody.velocity.magnitude * 2.23) + " MPH") + "     " + Mathf.RoundToInt(myRigidbody.transform.position.y) + " ALT" + (!isIt ? "     " + Mathf.RoundToInt(Game.Controller.quarryDist) + " DST" : ""), "hudText");
	}
	GUI.depth = 5;
	var pos : Vector3 = Camera.main.WorldToScreenPoint(transform.position);
	if((GetComponent.<NetworkView>().isMine && !isBot) || !Game.Settings.hideNames || (Vector3.Distance(Vector3(pos.x,pos.y,0), Input.mousePosition) < 40 && !Physics.Linecast(transform.position, Camera.main.transform.position, 1 << 8))) {
		if(pos.z > 0 || (GetComponent.<NetworkView>().isMine && !isBot)) {
			if(pos.z < 0) pos.z = 0;
			var sizeX = Mathf.Max(50, Mathf.Min(150,Screen.width * .16) - pos.z / 1.5);
			var sizeY = Mathf.Max(20, Mathf.Min(50,Screen.width * .044) - (pos.z * 0.2));

			if((pos.z <= 1 || pos.y < sizeY * 1.9) && (GetComponent.<NetworkView>().isMine && !isBot)) {
				if(pos.z <= 1) pos.x = Screen.width / 2;
				pos.y = sizeY + 100;
			}
			GUI.Button(
				Rect(pos.x - sizeX*.5,Screen.height - pos.y + (sizeY*1), sizeX, sizeY),
				name + "\n" + shortName + " " + score + netCode, "player_nametag" + (isIt ? "_it" : ""));
		}
	}
}

function OnPrefsUpdated() {
	if(laserAimer) laserAimer.GetComponent.<ParticleEmitter>().emit = true;
	if(laserAimerLocked) laserAimerLocked.GetComponent.<ParticleEmitter>().emit = true;
	if(Game.Settings.ramoSpheres != 0) {
		yield new WaitForSeconds (1);
		var tnsor : Vector3 = GetComponent.<Rigidbody>().inertiaTensor;
		var cg : Vector3 = GetComponent.<Rigidbody>().centerOfMass;
		if(!ramoSphere) {
			ramoSphere = Instantiate(ramoSphereObj, transform.position, transform.rotation);
			ramoSphere.transform.parent = transform;
			//(ramoSphere.collider as SphereCollider).attachedRigidbody = myRigidbody;
			var colliders = vehObj.GetComponentsInChildren(Collider);
			for (var cldr : Collider in colliders) {
				Physics.IgnoreCollision(ramoSphere.GetComponent.<Collider>(), cldr);
			}
		}
		ramoSphere.GetComponent.<Collider>().active = false; //DRAGONHERE - MAJOR UNITY BUG: We need to set this all the time, as colliders that are instantiated using a prefab and are then thrown inside of rightbodies are not properly initialized until some of their settings are toggled
		ramoSphereScale = (((Game.Settings.ramoSpheres) * 15) + camOffset * 1);
		if(ramoSphere.GetComponent.<Collider>().isTrigger == zorbBall) {
			ramoSphere.GetComponent.<Collider>().isTrigger = !zorbBall;
			ramoSphere.transform.localScale = Vector3.zero;
			ramoSphere.GetComponent.<Collider>().SetActive(true);
			//ramoSphere.SendMessage("colorSet", zorbBall); //ANOTHER UNITY BUG - for some reason, SendMessage isn't working like it should...
			ramoSphere.GetComponent("RamoSphere").colorSet(zorbBall);
		}
		else ramoSphere.GetComponent.<Collider>().SetActive(true);
		GetComponent.<Rigidbody>().inertiaTensor = tnsor;
		GetComponent.<Rigidbody>().centerOfMass = cg;
	}
	else if(ramoSphere) {
		ramoSphereScale = 0.1;
		yield new WaitForSeconds (2);
		Destroy(ramoSphere);
	}

	if(Game.Settings.laserLock[vehId] > 0) {
		laserLock.SetActive(true);
		laserLock.transform.localScale = Vector3.one * ((((Game.Settings.laserLock[vehId]) + camOffset * .1) * 10));
	}
	else {
		laserLock.SetActive(false);
		laserLock.transform.localScale = Vector3.zero;
	}
}

function OnCollisionEnter(collision : Collision) {
	if(ramoSphere && ramoSphere.GetComponent.<Collider>().isTrigger == false) ramoSphere.SendMessage("OnCollisionEnter", collision);
}

//Called when we ram a quarry, and will become quarry
function OnRam(other : GameObject) {
	var veh : Vehicle = other.GetComponent(Vehicle);
	if(!veh || veh.isIt != 1 || !veh.isResponding || (Time.time - lastTag) < 3 || (Time.time - veh.lastTag) < 3) return;
	lastTag = Time.time;
	GetComponent.<NetworkView>().RPC("sQ", RPCMode.All, 1);
}

function OnLaserHit(isFatal : boolean) {
	if(isFatal && Game.Settings.lasersFatal && Vector3.Distance(transform.position, World.base.position) > 10) {
		myRigidbody.isKinematic = true;
		GetComponent.<NetworkView>().RPC("lR", RPCMode.All);
	}
}

@RPC
function lR() {
	if(Time.time - lastReset < 3 || !myRigidbody || !World.base) return; //We are already resetting...
	lastReset = Time.time;
	if(isPlayer || isBot) {
		myRigidbody.isKinematic = true;
	}
	Game.Controller.mE(transform.position);
	Game.Controller.mE(World.base.position);
	ramoSphereScale = 0.01;
	yield new WaitForSeconds(2);
	if(ramoSphere) Destroy(ramoSphere);
	if(isPlayer || isBot) {
		transform.position = World.base.position;
		myRigidbody.isKinematic = false;
	}
	OnPrefsUpdated(); //Rebuild a new ramosphere
}

@RPC
function fR (LaunchedByViewID : NetworkViewID, id : String, pos : Vector3, ang : Vector3, info : NetworkMessageInfo) {
	var btemp = Instantiate(Game.objectRocket, pos, Quaternion.Euler(ang));
	var r : Rocket = btemp.GetComponent("Rocket");
	r.laserID = id;
	if(info.networkView.isMine != true) r.lag = (Network.time - info.timestamp);
	r.launchVehicle = this;
}

@RPC
function fS (LaunchedByViewID : NetworkViewID, id : String, pos : Vector3, ang : Vector3, info : NetworkMessageInfo) {
	var btemp = Instantiate(Game.objectRocketSnipe, pos, Quaternion.Euler(ang));
	var r : Rocket = btemp.GetComponent("Rocket");
	r.laserID = id;
	if(info.networkView.isMine != true) r.lag = (Network.time - info.timestamp);
	r.launchVehicle = this;
}

@RPC
function fRl (LaunchedByViewID : NetworkViewID, id : String, pos : Vector3, targetViewID : NetworkViewID, info : NetworkMessageInfo) {
	var btemp = Instantiate(Game.objectRocket, pos, Quaternion.identity);
	var r : Rocket = btemp.GetComponent("Rocket");
	r.laserID = id;
	if(info.networkView.isMine != true) r.lag = (Network.time - info.timestamp);
	r.launchVehicle = this;
	for(var plrE : DictionaryEntry in Game.Players) if(plrE.Value.networkView.viewID == targetViewID) {
		r.targetVehicle = plrE.Value;
		break;
	}
}

@RPC
function fSl (LaunchedByViewID : NetworkViewID, id : String, pos : Vector3, targetViewID : NetworkViewID, info : NetworkMessageInfo) {
	var btemp = Instantiate(Game.objectRocketSnipe, pos, Quaternion.identity);
	var r : Rocket = btemp.GetComponent("Rocket");
	r.laserID = id;
	if(info.networkView.isMine != true) r.lag = (Network.time - info.timestamp);
	r.launchVehicle = this;
	for(var plrE : DictionaryEntry in Game.Players) if(plrE.Value.networkView.viewID == targetViewID) {
		r.targetVehicle = plrE.Value;
		break;
	}
}

@RPC
function lH (n : String, pos : Vector3) {
	var go : GameObject = gameObject.Find("lsr#" + n);
	if(go) go.GetComponent(Rocket).laserHit(gameObject, transform.TransformPoint(pos), Vector3.up);
	//else Debug.Log("LaserHitFail");
}

@RPC
function sP(pos : Vector3, rot : Quaternion, info : NetworkMessageInfo) {
	if(!vehicleNet) return;
	if(GetComponent.<NetworkView>().stateSynchronization != NetworkStateSynchronization.Off) {
		Debug.Log("sP NvN: " + gameObject.name);
		return;
	}
	vehicleNet.rpcPing = (Network.time - info.timestamp);

	if(vehicleNet.states[0] && vehicleNet.states[0].t >= info.timestamp) {
		Debug.Log("sP OoO: " + vehicleNet.states[0].t + " * " + Time.time);
		return;
	}

	for (k=vehicleNet.states.length-1; k>0; k--) vehicleNet.states[k] = vehicleNet.states[k-1];
	vehicleNet.states[0] = new State(pos, rot, info.timestamp, 0, 0);

	var png : float = Network.time - vehicleNet.states[0].t;
	vehicleNet.jitter = Mathf.Lerp(vehicleNet.jitter, Mathf.Abs(vehicleNet.ping - png), 1 / Network.sendRate);
	vehicleNet.ping = Mathf.Lerp(vehicleNet.ping, png, 1 / Network.sendRate);

	//vehicleNet.states[0] = new State(pos, rot, Time.time, ((Network.time - info.timestamp) > 0 && (Network.time - info.timestamp) < 10 ? info.timestamp : Network.time - vehicleNet.calcPing));
}

@RPC
function sT(time : float, info : NetworkMessageInfo) {
	if(!vehicleNet && !GetComponent.<NetworkView>().isMine) return;
	/*Game.Messaging.broadcast(gameObject.name);
	Game.Messaging.broadcast(time + "t");
	Game.Messaging.broadcast(Network.time + "t");
	Game.Messaging.broadcast(Network.time - info.timestamp + "");
	var nTime : float = Network.time;*/

	//We are recieving the ping back
	//Debug.Log(name + time + networkView.viewID);

	if(time > 0) {
		vehicleNet.calcPing = Mathf.Lerp(vehicleNet.calcPing, (Time.time - vehicleNet.lastPing) / (vehicleNet.wePinged ? 1 : 2), .5);
		vehicleNet.wePinged = false;
	}

	//We are authoratative instance, and are being "pinged".
	else if(GetComponent.<NetworkView>().isMine) {
		GetComponent.<NetworkView>().RPC("sT", RPCMode.Others, 1.0);
	}

	//We are a non authorative instance. Get ready to measure the time diff!
	else {
		vehicleNet.lastPing = Time.time;
		vehicleNet.wePinged = (info.sender == Network.player ? true : false);
	}
}

@RPC
function s4(x : int, y : int, z : int, w : int) {
	input = new Vector4(x / 10, y / 10, z / 10, w / 10);
}

@RPC
function sI(input : boolean) {
	specialInput = input;
	gameObject.BroadcastMessage("OnSetSpecialInput", SendMessageOptions.DontRequireReceiver);
}

@RPC
function sB(input : boolean) {
	brakes = input;
}

@RPC
function sZ(input : boolean) {
	zorbBall = input;
	OnPrefsUpdated();
}

@RPC
function sQ(mode : int) {
	for(var plrE : DictionaryEntry in Game.Players) {
		//if(plrE.Value.isIt == 1) var prevName : String = go.name;
		plrE.Value.isIt = 0;
		plrE.Value.setColor();
	}
	isIt = 1;
	Game.QuarryVeh = this;
	setColor();
	if(mode) {
		if(mode == 1) Game.Controller.msg(gameObject.name + " rammed the Quarry", parseInt(chatOrigins.Server));
		else if(mode == 2) Game.Controller.msg(gameObject.name + " is now the Quarry", parseInt(chatOrigins.Server));
		else if(mode == 3) Game.Controller.msg(gameObject.name + " Defaulted to Quarry", parseInt(chatOrigins.Server));
		lastTag = Time.time;
	}
}

@RPC
function iS(name : String) {
	score += 1;
	Game.Controller.msg(gameObject.name + " Got  " + name, parseInt(chatOrigins.Server));
}

@RPC
function dS(name : String) {
	score -= 1;
	//Game.Controller.msg(gameObject.name + " Lasered NQ (" + name + ")", 0);
}

@RPC
function iT() {
	scoreTime += 1;
}

@RPC
function sS(s : int) {
	score = s;
}

@RPC
function sC(cR : float, cG : float, cB : float, aR : float, aG : float, aB : float) {
	vehicleColor.r = cR;
	vehicleColor.g = cG;
	vehicleColor.b = cB;
	vehicleAccent.r = aR;
	vehicleAccent.g = aG;
	vehicleAccent.b = aB;
	updateColor = true;
}

function setColor() {
	updateColor = true;
}

@RPC
function dN(rsn : int) {
	netKillMode = rsn;
}
