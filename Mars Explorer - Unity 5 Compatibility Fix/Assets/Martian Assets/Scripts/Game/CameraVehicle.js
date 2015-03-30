var guiLayer : GUILayer;

var arrow : Transform;
var lastDir : Vector3 = Vector3(1,1,1);
var lastY : float;
var sensitivityX = 15.0;
var sensitivityY = 15.0;
var rotationX = 10.0;
var rotationY = 10.0;
var heightBoost : float;
var targetHeight : float;
var gyroTation : Quaternion;

var wr : Quaternion;
private var underwater = false;
var hit : RaycastHit;
var mb : MotionBlur;
var glowEffect : GlowEffect;
var colorEffect : ColorCorrectionEffect;
var worldTime : float = 0;

function Start () {
	Time.timeScale = 1;
	transform.rotation.eulerAngles.x = 270.01;
}

function LateUpdate () {
	if (!Game.Player || !Game.PlayerVeh || !Game.PlayerVeh.ridePos) return;

	//Blur
	if(mb.enabled) {
		mb.blurAmount -= Time.deltaTime * .13;
		if(mb.blurAmount < 0) mb.enabled = false;
	}

	//Audio
	if(Game.Settings.useHypersound == 1) {
		Game.Settings.gameMusic.pitch = Mathf.Clamp(-.5 + Game.Player.GetComponent.<Rigidbody>().velocity.magnitude / 15, .8, 1.5);
	}

	//Cursor Locking
	if(Game.Settings.camMode == 0 || Input.GetButton("Fire2") || (Input.GetButton("Snipe") && !Game.Messaging.chatting)) Cursor.lockState = CursorLockMode.Locked;
	else Cursor.lockState = CursorLockMode.None;

	//Snipe Zooming
	if(Input.GetButton("Snipe") && !Game.Messaging.chatting) {
		if(Camera.main.fieldOfView == 60) Camera.main.fieldOfView = 10;
		Camera.main.fieldOfView += Input.GetAxis("Mouse ScrollWheel") * -1;
		if(Camera.main.fieldOfView > 50) Camera.main.fieldOfView = 50;
		else if(Camera.main.fieldOfView < 1.5) Camera.main.fieldOfView = 1.5;
	}
	else if(Camera.main.fieldOfView != 60) Camera.main.fieldOfView = 60;

	//Green Arrow
	var targetPos : Vector3 = transform.InverseTransformPoint(GetComponent.<Camera>().ScreenToWorldPoint(Vector3(GetComponent.<Camera>().pixelWidth - 30 - 65, 30, GetComponent.<Camera>().nearClipPlane + .05)));
	if(Vector3.Distance(targetPos, arrow.localPosition) < 0.002) arrow.localPosition = Vector3.Lerp(arrow.localPosition, targetPos, Time.deltaTime * .005);
	else arrow.localPosition = targetPos;
    arrow.rotation = Quaternion.Lerp(arrow.rotation, Quaternion.LookRotation((Game.PlayerVeh.isIt || !Game.QuarryVeh ? World.base : Game.QuarryVeh.gameObject.transform).position - Game.Player.transform.position), Time.deltaTime * 15);
	arrow.localScale = Vector3.one * Mathf.Lerp(.03, 1, Camera.main.fieldOfView / 60);

	//Hotkeys
	if(Input.GetKeyDown(KeyCode.Escape) && Game.Settings.camMode == 0) { //Unlock Cursor
		Game.Settings.camMode = 1;
		PlayerPrefs.SetInt("cam", 1);
	}
	if(!Game.Messaging.chatting) {
		if(Input.GetKeyDown(KeyCode.Alpha1)) {
			Game.Settings.camMode = 0;
			PlayerPrefs.SetInt("cam", 0);
		}
		else if(Input.GetKeyDown(KeyCode.Alpha2)) {
			Game.Settings.camMode = 1;
			PlayerPrefs.SetInt("cam", 1);
		}
		else if(Input.GetKeyDown(KeyCode.Alpha3)) {
			Game.Settings.camDist = 0;
			PlayerPrefs.SetFloat("camDist", 0);
		}
		else if(Input.GetKeyDown(KeyCode.Alpha4)) {
			Game.Settings.camDist = 20;
			PlayerPrefs.SetFloat("camDist", 20);
		}
		else if(Input.GetKeyDown(KeyCode.Alpha5)) {
			Game.Settings.camMode = 2;
			PlayerPrefs.SetInt("cam", 2);
		}
		else if(Input.GetKeyDown(KeyCode.Alpha6)) {
			Game.Settings.camMode = 3;
			PlayerPrefs.SetInt("cam", 3);
		}
		else if(Input.GetKeyDown(KeyCode.Alpha7)) {
			Game.Settings.gyroCam = (Game.Settings.gyroCam ? false : true);
			PlayerPrefs.SetInt("gyroCam", (Game.Settings.gyroCam ? 1 : 0));
		}
	}

	//Constants
	var camDist : float = Game.PlayerVeh.camOffset + Game.Settings.camDist;

	//World Entry Effect
	if(worldTime < 7) {
		worldTime = Time.time - Game.Controller.worldLoadTime;
		transform.position = Vector3.Lerp (transform.position, Game.Player.transform.position, Time.deltaTime * 1);
		wr = Quaternion.LookRotation(Game.Player.transform.position - transform.position, Vector3.up);
		if(worldTime > 1) transform.rotation = Quaternion.Slerp(transform.rotation, wr, (Time.deltaTime * .5) * Mathf.Min(1, (worldTime - 1) * .5));
	}

	//Ride
	else if(Game.Settings.camMode == 0 || Input.GetButton("Fire2") || (Input.GetButton("Snipe") &&  !Game.Messaging.chatting)) {
		transform.position = Game.PlayerVeh.ridePos.position;

		if(Input.GetButtonDown("Fire2") || Input.GetKeyDown(KeyCode.Alpha1)) {
			rotationX = 0;
			rotationY = 0;
			if(Game.Settings.gyroCam) {
				gyroTation = Quaternion.Euler(0, Game.PlayerVeh.ridePos.rotation.eulerAngles.y, 0);
			}
		}

		if(Game.Settings.gyroCam) transform.rotation = gyroTation;
		else transform.rotation = Game.PlayerVeh.ridePos.rotation;

		rotationX += Input.GetAxis("Mouse X") * (Input.GetButton("Snipe") ? .5 : 2);
		rotationY += Input.GetAxis("Mouse Y") * (Input.GetButton("Snipe") ? .5 : 2);

		if (rotationX < -360) rotationX += 360;
		else if (rotationX > 360) rotationX -= 360;
 		if (rotationY < -360) rotationY += 360;
		else if (rotationY > 360) rotationY -= 360;

		rotationX = Mathf.Clamp (rotationX, -360, 360);
		if(Game.Settings.gyroCam) rotationY = Mathf.Clamp (rotationY, -100, 100);
		else rotationY = Mathf.Clamp (rotationY, -20, 100);
		transform.localRotation *= Quaternion.AngleAxis (rotationX, Vector3.up);
		transform.localRotation *= Quaternion.AngleAxis (rotationY, Vector3.left);
	}

	//Chase
	else if(Game.Settings.camMode == 1) {

		//Smooth
		if(Game.Settings.camChase == 0) {
			transform.position = Vector3.Lerp(transform.position, (
				Game.Player.transform.position - Vector3.Normalize(Game.Player.transform.position - transform.position) * (camDist) +
				Vector3.one * (Game.PlayerVeh.camSmooth ? 0 : Mathf.Lerp(0, 15, camDist / 30))
				), Time.deltaTime * 3.5);
			transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(Game.Player.transform.position - transform.position, (Game.Settings.flightCam ? Game.Player.transform.up : Vector3.up)), Time.deltaTime * 4);
			if(Physics.Linecast(transform.position + Vector3.up * 50, transform.position + Vector3.down * 1, hit, (1 << 8)) && hit.collider.type != TerrainCollider) transform.position.y += 51 - hit.distance;
		}

		//Agile
		else if(Game.Settings.camChase == 1) {
			var dist = Vector3.Distance(Game.Player.transform.position, transform.position);
			if(Game.Player.transform.gameObject.GetComponent.<Rigidbody>() && Game.Player.transform.gameObject.GetComponent.<Rigidbody>().velocity.sqrMagnitude > .1 && Game.Player.transform.gameObject.GetComponent.<Rigidbody>().velocity.normalized.y < .8 && Game.Player.transform.gameObject.GetComponent.<Rigidbody>().velocity.normalized.y > -.8) lastDir = Vector3.Lerp(lastDir,Game.Player.transform.gameObject.GetComponent.<Rigidbody>().velocity.normalized,.1);
			else Vector3.Lerp(lastDir,Vector3(lastDir.x,0,lastDir.z), .1);
			var newPos = (Game.Player.transform.position + lastDir * -(camDist) + Vector3.up * ((camDist) / 3));
			transform.position.y += (Game.Player.transform.position.y - lastY) * Time.deltaTime;
			transform.position = Vector3.Lerp(transform.position, newPos, Time.deltaTime * 4);
			lastY = Game.Player.transform.position.y;
			transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(Game.Player.transform.position - transform.position, (Game.Settings.flightCam ? Game.Player.transform.up : Vector3.up)), Time.deltaTime * 4);
			if(Physics.Linecast(transform.position + Vector3.up * 50, transform.position + Vector3.down * 1, hit, (1 << 8)) && hit.collider.type != TerrainCollider) transform.position.y += 51 - hit.distance;
		}

		//Arcade
		else if(Game.Settings.camChase == 2) {
			if(Game.Player.transform.GetComponent.<Rigidbody>().velocity.magnitude > 0) {

				var heightDamping = 3.0;
				var distanceDamping = 10.0;
				var rotationDamping = 3.0;
				wantedRotationAngle = Quaternion.LookRotation(Game.Player.transform.GetComponent.<Rigidbody>().velocity).eulerAngles.y;
				wantedRotationAngle += Input.GetAxis("Horizontal") * Mathf.Lerp(30, 10, camDist / 30);
				wantedHeight = Game.Player.transform.position.y + Mathf.Lerp(.1, 15, camDist / 30) + heightBoost;
				targetHeight = Mathf.Lerp(.5, 3, camDist / 30);

				/*if (Physics.Raycast(transform.position + (Vector3.up * 50), Vector3.down, hit, 51, 1 << 8)) {
					print(50 - hit.distance);
					wantedHeight += (80 - hit.distance);
				}*/

				currentRotationAngle = transform.eulerAngles.y;
				currentHeight = transform.position.y;
				currentRotationAngle = Mathf.LerpAngle (currentRotationAngle, wantedRotationAngle, rotationDamping * Time.deltaTime);
				currentHeight = Mathf.Lerp (currentHeight, wantedHeight, heightDamping * Time.deltaTime);
				currentRotation = Quaternion.Euler (0, currentRotationAngle, 0);
				pos = Game.Player.transform.position;
				pos.y += targetHeight; //Look ABOVE the target
				transform.position = pos;
				transform.position -= currentRotation * Vector3.forward * camDist;
				transform.position.y = currentHeight;

				//Terrain Avoidance
				var hit : RaycastHit;
				if (Physics.Raycast(transform.position + (Vector3.up * 49.4), Vector3.down, hit, 50, 1 << 8) && hit.collider.type != TerrainCollider) { //We are under terrain
					Physics.Linecast(transform.position, Game.Player.transform.position + (Vector3.up * currentHeight), hit, (1 << 8)); //Determine how far forward we need to go to be out of it
					transform.position += currentRotation * Vector3.forward * hit.distance;
					heightBoost = hit.distance * .7;
				}
				else heightBoost = 0;

				transform.LookAt (pos);
				//transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(pos - transform.position, (Game.Settings.flightCam ? Game.Player.transform.up : Vector3.up)), Time.deltaTime * 5);
			}
		}

		//Hyper
		/*else if(Game.Settings.camChase == 3) {
			dist = Vector3.Distance(Game.Player.transform.position, transform.position); //Raise when near target
			var wantedPosition = Game.Player.transform.TransformPoint(0, height + (dist < 10 ? 40 - dist * 4 : 0), -distance);
			transform.position = Vector3.Lerp (transform.position, wantedPosition, Time.deltaTime * damping);
			var wantedRotation = Quaternion.LookRotation(Game.Player.transform.position - transform.position, Game.Player.transform.up);
			transform.rotation = Quaternion.Slerp (transform.rotation, wantedRotation, Time.deltaTime * rotationDamping);
		}*/
	}

	//Soar
	else if(Game.Settings.camMode == 2) {
		transform.position = Vector3.Lerp (transform.position, Game.Player.transform.position + (Vector3.up * 40), Time.deltaTime * 0.3);
		wr = Quaternion.LookRotation(Game.Player.transform.position - transform.position, Vector3.up);
		transform.rotation = Quaternion.Slerp (transform.rotation, wr, Time.deltaTime * 2);
	}

	//Spectate
	else if(Game.Settings.camMode == 3) {
		transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(Game.Player.transform.position - transform.position), Time.deltaTime * 1.5);
		transform.Translate(Vector3(Input.GetAxis("camX") * Time.deltaTime * 50, Input.GetAxis("camY") * Time.deltaTime * 40, Input.GetAxis("camZ") * Time.deltaTime * 50));
	}

	//Roam
	else if(Game.Settings.camMode == 4) {
		transform.position.x += Input.GetAxis("camX") * Time.deltaTime * 50;
		transform.position.y += Input.GetAxis("camY") * Time.deltaTime * 50;
		transform.position.z += Input.GetAxis("camZ") * Time.deltaTime * 50;
		rotationX += Input.GetAxis("Mouse X") * sensitivityX;
		rotationY += Input.GetAxis("Mouse Y") * sensitivityY;
		//Invoke("Adjust360andClamp", 0);
		transform.localRotation = Quaternion.AngleAxis (rotationX, Vector3.up);
		transform.localRotation *= Quaternion.AngleAxis (rotationY, Vector3.left);
	}
}

function OnPreRender () {

	if(Game.Settings.fogColor == Color.clear) return;	//Game has just initialized - don't start adding effects yet...

	if (transform.position.y < Game.Settings.lavaAlt || Physics.Raycast(transform.position + (Vector3.up * 200), Vector3.up * -1, 200, 1 << 4)) {
		RenderSettings.fogColor = World.seaFogColor;
		RenderSettings.fogDensity = Game.Settings.lavaFog;
		glowEffect.enabled = (Game.Settings.renderLevel > 2);
		glowEffect.glowTint = World.seaGlowColor;
		Camera.main.clearFlags = CameraClearFlags.SolidColor;
	}
	else {
		RenderSettings.fogColor = Game.Settings.fogColor;
		RenderSettings.fogDensity = Game.Settings.worldFog;
		glowEffect.enabled = false;
		Camera.main.clearFlags = (Camera.main.farClipPlane > 2000 ? CameraClearFlags.Skybox : CameraClearFlags.SolidColor);
	}

	colorEffect.enabled = glowEffect.enabled;
	Camera.main.backgroundColor = RenderSettings.fogColor;

}
