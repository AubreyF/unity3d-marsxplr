@HideInInspector
var showBox = 0;
@HideInInspector
var simplified = true;
var gameMusic : AudioSource;
var musicTracks : AudioClip[];
var zorbPhysics : PhysicMaterial;
@HideInInspector
var renderLevel = 0;
@HideInInspector
var renderAdjustMax = 0;
@HideInInspector
var renderViewCap : float = 1000;
var enteredfullscreen = false;
@HideInInspector
var renderAutoAdjust = false;
@HideInInspector
var renderAdjustTime = 8;
@HideInInspector
var showHints = true;
@HideInInspector
var serverUpdateTime = 0.00;
@HideInInspector
var colorUpdateTime = 0.00;
var colorCustom = false;
var disableHints = false;
var fogColor : Color = Color.clear;

private var useFog = true;
private var detailedObjects = true;
private var useParticles = true;
private var useTrails = true;
var useMinimap = true;
private var foliage = true;
private var terrainQuality = true;
private var terrainDetail = true;
private var terrainLighting = true;
var useMusic = 1;
var useSfx = true;
var useHypersound = 0;
private var syncFps = false;
private var playerOnlyLight = false;
private var scrollPosition : Vector2;
@HideInInspector
var camSSAO : SSAOEffect;
var camContrast : ContrastStretchEffect;

@HideInInspector
var txt : String;
@HideInInspector
var str : String;
@HideInInspector
var serverString : String;
@HideInInspector
var bannedIPs : String;
static var serverDefault : String;

var serverWelcome : String = "";

var camMode : int = 0;
var camChase : int = 0;
var camDist : float = 0;
var flightCam : boolean = false;
var gyroCam : boolean = false;

var worldGrav : float = -9.81;
var worldFog : float = 0.001;
var worldViewDist : float = 5000;
var lavaFog : float = 0.005;
var lavaAlt : float = -300.00;
var laserSpeed : int = 180.00;
var laserGrav : float = 0;
var laserRico : float = 0;
var laserLocking : boolean;

var resetTime : float;
var lasersAllowed = true;
var lasersFatal = false;
var lasersOptHit = false;
var ramoSpheres : float = 0;
var zorbSpeed : float = 7;
var zorbAgility : float = 0;
var zorbBounce : float = .5;
var minimapAllowed = true;
var hideNames = false;
var botsCanFire = true;
var botsCanDrive = true;

var firepower : int[];
var laserLock : float[];

var buggyAllowed = true;
var buggyFlightSlip = false;
var buggySmartSuspension = true;
var buggyNewPhysics = false;
var buggyAWD = true;
var buggyCG = -.40;
var buggyPower = 1.00;
var buggySpeed = 30.00;
var buggyFlightLooPower = false;
var buggyFlightDrag = 300.00;
var buggyFlightAgility = 1.00;
var buggyTr = 1.00;
var buggySh = 70.00;
var buggySl = 50.00;

var tankAllowed = true;
var tankPower = 2000.00;
var tankSpeed = 25.00;
var tankGrip = 0.1;
var tankCG = -.20;

var hoverAllowed = true;
var hoverHeight = 15.00;
var hoverHover = 100.00;
var hoverRepel = 2.50;
var hoverThrust = 220.00;

var jetAllowed = true;
var jetHDrag = 0.01;
var jetDrag = 0.001;
var jetSteer = 20;
var jetLift = .5;
var jetStall = 20;

var networkMode = 0;
var networkPhysics = 0;
var networkInterpolation : float = 0.0;	//.3;
var isAdmin = false;

function Start () {
	simplified = true;
	getPrefs();
	updatePrefs(); //Init music
	if(GameData.userName == "Aubrey (admin)") isAdmin = true;
}

/*
function OnGUI() {
	GUI.skin = Game.Skin;
	GUI.color.a = Game.GUIAlpha;
	if(Game.Controller.loadingWorld) return;
	
	if(GUI.Button(Rect(Screen.width - 50, Screen.height - 50, 40, 40), (!simplified ? ">>" : "<<"))) {
		simplified = !simplified;
		if(simplified == true) showChat = 0;
		else showChat = 1;
	}
	if (enteredfullscreen && GUI.Button(Rect(Screen.width / 2 - 50, Screen.height / 2 - 100, 280, 200),"Welcome to fullscreen mode:\n\nIf you hear a chime noise while holding\nkeyboard buttons, press \"Esc\",\nthen click your mouse, then press \"0\".\n\nClick this box to play!")) {
		enteredfullscreen = false;
		simplified = false;
	}
	if(!simplified) {
	
		//Panels To show
		var SettingsPanels = Array();
		SettingsPanels.Add("Server Settings");
		SettingsPanels.Add("Game Settings");
		SettingsPanels.Add("Player Settings");
		SettingsPanels.Add("Active Players");
		SettingsPanels.Add("Switch Vehicle");
		
		var PanelHeights = SettingsPanels;
		var openPanels = SettingsPanels;
		
		for(i=0; i < SettingsPanels.length; i++) {
			
		}
		
		//Area to fill
		var areaHeight = Screen.height - 60;
		var areaOffset = 
		
		//Fill Area
		for(i=0; i < SettingsPanels.length; i++) {
			
		}
	
	
		var buttonPositionTemp : Vector2 = Vector2(Screen.width - 180, 70);
		
		timeleft -= Time.deltaTime;
		accum += Time.timeScale/Time.deltaTime;
		++frames;
		if( timeleft <= 0.0 ) {
			fps = accum/frames;
			timeleft = fpsUpdateInterval;
			accum = 0.0;
			frames = 0;
		}
		if(!showBox) {
			var renderLevelTxt = "";
			if(renderLevel == 1)		renderLevelTxt = "Fastest";
			else if(renderLevel == 2)	renderLevelTxt = "Fast";
			else if(renderLevel == 3)	renderLevelTxt = "Simple";
			else if(renderLevel == 4)	renderLevelTxt = "Good";
			else if(renderLevel == 5)	renderLevelTxt = "Beautiful";
			else if(renderLevel == 6)	renderLevelTxt = "Fantastic";
			else renderLevelTxt = "Init";
			txt = "";
			if(showHints && !disableHints) {
				/*if(renderAutoAdjust) {
					if(Time.timeSinceLevelLoad - renderAdjustTime < 3 && renderLevelTxt != "Init") txt = "Your rendering quality\nis now set to \"" + renderLevelTxt + "\".\n\nYou can lock in at this\nlevel ~ just click here\nand select\n> Manual Adjust <";
				}
				else {* /
					if(fps < 20 && renderLevel > 1) txt = "Low Framerate: " + fps.ToString("f0") + " FPS\n\nYour game is running slow.\nYou might want to click\nthis button and Decrease (<<)\nyour \"Rendering Quality\"";
					else if (fps > 50 && renderLevel < 6) txt = "High Framerate: " + fps.ToString("f0") + " FPS\n\nYour game is running fast!\nYou might want to click\nthis button and Increase (>>)\nyour \"Rendering Quality\"";
				//}
			}
			
			if(txt != "") {
				if(GUI.Button(Rect(buttonPositionTemp.x, buttonPositionTemp.y + 30, 170, 120), txt)) showBox = 1;
			}
			else {
				if(GUI.Button(Rect(buttonPositionTemp.x, buttonPositionTemp.y + 30, 170, 40), "Game Settings:\n" + renderLevelTxt + " (" + fps.ToString("f0") + " FPS)")) showBox = 1;
			}
			
			if(Application.loadedLevelName != "Learn to Play") {
				if (GUI.Button(Rect(buttonPositionTemp.x, buttonPositionTemp.y, 80, 25), "Players" + (Game.Controller.unauthPlayers.length > 0 ? " (" + Game.Controller.unauthPlayers.length + ")!": ""))) showBox = 2;
				if (GUI.Button(Rect(buttonPositionTemp.x + 90, buttonPositionTemp.y, 80, 25), "Server")) showBox = 3;
			}
		}
		else {
			var window : Rect = Rect(buttonPositionTemp.x, buttonPositionTemp.y, 170, Screen.height - 130);
			if(showBox == 2)		GUI.Window (22, window, showDialogPlayers, "Players:");
			else if(showBox == 3)	GUI.Window (23, window, showDialogServer, "Server Settings:");
			else					GUI.Window (24, window, showDialogGame, "Game Settings:");
			//else					GUI.Window (25, window, showDialogPlayer, "Player Settings:");
		}
	}
}*/

function getPrefs() {
	renderLevel = PlayerPrefs.GetInt("renderLevel", 4);
	renderViewCap = PlayerPrefs.GetFloat("viewCap", 1000);
	Application.targetFrameRate = PlayerPrefs.GetFloat("targetFrameRate", 100);
	//renderAutoAdjust = (PlayerPrefs.GetInt("renderAutoAdjust", 1) ? true : false);
	renderAutoAdjust = false;
	showHints = (PlayerPrefs.GetInt("showHints", 1) ? true : false);
	useMusic = PlayerPrefs.GetInt("useMusic", 1);
	useSfx = (PlayerPrefs.GetInt("useSfx", 1) ? true : false);
	useHypersound = PlayerPrefs.GetInt("useHypersound", 0);
	useMinimap = (PlayerPrefs.GetInt("useMinimap", 1) ? true : false);
	superCam = (PlayerPrefs.GetInt("superCam", 1) ? true : false);
	flightCam = (PlayerPrefs.GetInt("flightCam", 1) ? true : false);
	gyroCam = (PlayerPrefs.GetInt("gyroCam", 0) ? true : false);
	camMode = PlayerPrefs.GetInt("cam", 1);
	camChase = PlayerPrefs.GetInt("camChase", 1);
	camDist = PlayerPrefs.GetFloat("camDist", .01);
	flightCam = (PlayerPrefs.GetInt("flightCam", 0) ? true : false);
	gyroCam = (PlayerPrefs.GetInt("gyroCam", 0) ? true : false);
	
	//serverDefault = packServerPrefs();
	//serverString = serverDefault;
}

function showDialogGame() {
	GUILayout.Label("Resolution:");
	if (GUILayout.Button((!Screen.fullScreen ? "Enter" : "Exit") + " Fullscreen (0)")) toggleFullscreen();
	if(Screen.fullScreen || Application.platform == RuntimePlatform.OSXPlayer || Application.platform == RuntimePlatform.WindowsPlayer) {
		GUILayout.BeginHorizontal();
		if ((Screen.resolutions[0].width < Screen.width || Screen.resolutions[0].height < Screen.height) && GUILayout.Button("<<",GUILayout.Width(28)) ) {
			for(i=Screen.resolutions.length-1;i>=0;i--) {
	    		if(Screen.resolutions[i].width >= Screen.width) continue;
	    		Screen.SetResolution(Screen.resolutions[i].width, Screen.resolutions[i].height, Screen.fullScreen);
	    		break;
			}
		}
		GUILayout.Label(Screen.width + "X" + Screen.height);
		if ((Screen.resolutions[Screen.resolutions.length - 1].width > Screen.width || Screen.resolutions[Screen.resolutions.length - 1].height > Screen.height) && GUILayout.Button(">>",GUILayout.Width(28)) ) {
			for (var res in Screen.resolutions) {
	    		if(res.width <= Screen.width) continue;
	    		Screen.SetResolution(res.width, res.height, Screen.fullScreen);
	    		break;
			}
		}
		GUILayout.EndHorizontal();
	}
	
	GUILayout.FlexibleSpace();
	GUILayout.Space(20);
	GUILayout.Label("Rendering Quality:");
	
	GUILayout.BeginHorizontal();
	if(renderLevel == 1)		GUILayout.Label("Fastest");
	else if(renderLevel == 2)	GUILayout.Label("Fast");
	else if(renderLevel == 3)	GUILayout.Label("Simple");
	else if(renderLevel == 4)	GUILayout.Label("Good");
	else if(renderLevel == 5)	GUILayout.Label("Beautiful");
	else if(renderLevel == 6)	GUILayout.Label("Fantastic");
	
	GUILayout.Label("(" + Game.Controller.fps.ToString("f0") + " FPS)");
	
	GUILayout.EndHorizontal();
	
	//if(!renderAutoAdjust) {
		GUILayout.BeginHorizontal();
		if(renderLevel > 1) {
			if (GUILayout.Button ("<<")) {
				renderLevel --;
				PlayerPrefs.SetInt("renderLevel", renderLevel);
				updatePrefs();
			}
		}
		
		if(renderLevel > 1 && renderLevel < 6) GUILayout.Space(5);
		
		if(renderLevel < 6) {
			if (GUILayout.Button(">>")) {
				renderLevel ++;
				PlayerPrefs.SetInt("renderLevel", renderLevel);
				updatePrefs();
			}
		}
		GUILayout.EndHorizontal();
		/*if (GUILayout.Button("> Auto Adjust <")) {
			renderAutoAdjust = true;
			renderAdjustMax = 0; //Give the Automatic FPS adjuster a chance to lock on to a higher game quality setting without the minimap
			PlayerPrefs.SetInt("renderAutoAdjust", (renderAutoAdjust ? 1 : 0));
		}*/
	/*}
	else {
		if (GUILayout.Button("< Manual Adjust >")) {
			renderAutoAdjust = false;
			PlayerPrefs.SetInt("renderAutoAdjust", (renderAutoAdjust ? 1 : 0));
		}
	}*/
	
	GUILayout.Space(10);
	GUILayout.Label("Visibility Cap:   (" + (renderViewCap == 1000 ? "MAX" : Mathf.Floor(renderViewCap)) + ")");
	cg = GUILayout.HorizontalSlider(renderViewCap, 200, 1000);
	if(renderViewCap != cg) {
		renderViewCap = cg;
		PlayerPrefs.SetFloat("viewCap", cg);
		updatePrefs();
	}
	
	GUILayout.Space(5);
	GUILayout.Label("FPS Cap:   (" + (Application.targetFrameRate == -1 ? "MAX" : Application.targetFrameRate) + ")");
	
	/*
	if(GUILayout.Toggle((syncFps == 0), "Sync to Screen") != (syncFps == 0)) {
		syncFps = (syncFps == 1 ? 0 : 1);
		PlayerPrefs.SetInt("syncFps", (syncFps ? 1 : 0));
		updatePrefs();
	}*/
	
	if(Application.targetFrameRate == -1) Application.targetFrameRate = 100;
	cg = GUILayout.HorizontalSlider(Application.targetFrameRate, 10, 100);
	if(Application.targetFrameRate != cg) {
		Application.targetFrameRate = cg;
		PlayerPrefs.SetFloat("targetFrameRate", cg);
	}
	if(!Application.targetFrameRate || Application.targetFrameRate == 100) Application.targetFrameRate = -1;
	
	GUILayout.FlexibleSpace();
	GUILayout.Space(20);
	GUILayout.Label("Interface:");
	
	if(minimapAllowed && GUILayout.Toggle(useMinimap, "Enable Minimap") != useMinimap) {
		useMinimap = (useMinimap ? false : true);
		PlayerPrefs.SetInt("useMinimap", (useMinimap ? 1 : 0));
		//if(!useMinimap) renderAdjustMax = 0; //Give the Automatic FPS adjuster a chance to lock on to a higher game quality setting without the minimap
		updatePrefs();
	}
	
	if(GUILayout.Toggle(showHints, "Enable Settings Advisor") != showHints) {
		showHints = (showHints ? false : true);
		PlayerPrefs.SetInt("showHints", (showHints ? 1 : 0));
		updatePrefs();
	}
	
	GUILayout.FlexibleSpace();	
	GUILayout.Space(20);
	GUILayout.Label("Audio:");
	
	if(GUILayout.Toggle(useSfx, "Sound Effects Enabled") != useSfx) {
		useSfx = (useSfx ? false : true);
		PlayerPrefs.SetInt("useSfx", (useSfx ? 1 : 0));
	}

	if(GUILayout.Toggle((useMusic == 0), "No Music") != (useMusic == 0)) {
		useMusic = 0;
		PlayerPrefs.SetInt("useMusic", 0);
		updatePrefs();
	}
	if(GUILayout.Toggle((useMusic == 1), "Classic") != (useMusic == 1)) {
		useMusic = 1;
		PlayerPrefs.SetInt("useMusic", 1);
		updatePrefs();
	}
	if(GUILayout.Toggle((useMusic == 2), "Ambient") != (useMusic == 2)) {
		useMusic = 2;
		PlayerPrefs.SetInt("useMusic", 2);
		updatePrefs();
	}
	if(GUILayout.Toggle((useMusic == 3), "Carefree") != (useMusic == 3)) {
		useMusic = 3;
		PlayerPrefs.SetInt("useMusic", 3);
		updatePrefs();
	}
	
	if(GUILayout.Toggle((useHypersound == 1), "HyperSound") != (useHypersound == 1)) {
		useHypersound = (useHypersound == 1 ? 0 : 1);
		PlayerPrefs.SetInt("useHypersound", (useHypersound ? 1 : 0));
		updatePrefs();
	}
}

function showDialogPlayer() {
	GUILayout.Space(20);
	//GUILayout.FlexibleSpace();
	
	if(resetTime > 0) GUILayout.Label("Reset In " + (10 - (Time.time - resetTime)));
	else if (resetTime > -1 && GUILayout.Button("Reset My Position (/r)")) {
		resetTime = Time.time;
		Game.Player.rigidbody.isKinematic = true;
		Game.Messaging.broadcast(Game.Player.name + " Resetting in 10 seconds...");
	}
	
	if(zorbSpeed != 0) {
		GUILayout.Space(10);
		if(GUILayout.Button((!Game.PlayerVeh.zorbBall ? "Activate" : "Deactivate") + " My Xorb (/x)")) Game.Player.networkView.RPC("sZ", RPCMode.All, !Game.PlayerVeh.zorbBall);
	}
	
	//GUILayout.FlexibleSpace();
	GUILayout.Space(20);
	
	//GUILayout.BeginScrollView(Vector2.zero, GUILayout.Height(270));
	GUILayout.Label("Camera Mode:");
	
	//Ride (1, alt)
	//Chase (2)
	//Soar (5)
	//Spectate
	//Wander
	
	//Distance (3-4)
	//GyRide (6)
	//HyperCam
	
	if(GUILayout.Toggle((camMode == 0), "Ride (1, alt)") != (camMode == 0)) {
		camMode = 0;
		PlayerPrefs.SetInt("cam", 0);
	}
	if(GUILayout.Toggle((camMode == 1), "Chase (2)") != (camMode == 1)) {
		camMode = 1;
		PlayerPrefs.SetInt("cam", 1);
	}
	if(GUILayout.Toggle((camMode == 2), "Soar(5)") != (camMode == 2)) {
		camMode = 2;
		PlayerPrefs.SetInt("cam", 2);
	}
	if(GUILayout.Toggle((camMode == 3), "Spectate(6)") != (camMode == 3)) {
		camMode = 3;
		PlayerPrefs.SetInt("cam", 3);
	}
	if(GUILayout.Toggle((camMode == 4), "Roam") != (camMode == 4)) {
		camMode = 4;
		PlayerPrefs.SetInt("cam", 4);
	}
	
	if(GUILayout.Toggle(gyroCam, "GyRide Enabled (7)") != gyroCam) {
		gyroCam = (gyroCam ? false : true);
		PlayerPrefs.SetInt("gyroCam", (gyroCam ? 1 : 0));
	}
	
	if(GUILayout.Toggle(flightCam, "HyperCam Enabled") != flightCam) {
		flightCam = (flightCam ? false : true);
		PlayerPrefs.SetInt("flightCam", (flightCam ? 1 : 0));
	}
	
	if(camMode == 0) {
		GUILayout.Space(10);
		GUILayout.Label("(Press (2) or (esc) keys to unlock your cursor)");
		GUILayout.Space(10);
	}
	
	else if(camMode == 1) {
		GUILayout.Space(5);
		GUILayout.Label("Chase Strategy:");
		if(GUILayout.Toggle((camChase == 0), "Smooth") != (camChase == 0)) {
			camChase = 0;
			PlayerPrefs.SetInt("camChase", 0);
		}
		if(GUILayout.Toggle((camChase == 1), "Agile") != (camChase == 1)) {
			camChase = 1;
			PlayerPrefs.SetInt("camChase", 1);
		}
		if(GUILayout.Toggle((camChase == 2), "Arcade") != (camChase == 2)) {
			camChase = 2;
			PlayerPrefs.SetInt("camChase", 2);
		}
		GUILayout.Space(5);
		GUILayout.Label("Chase Distance: (3-4)");
		cg = GUILayout.HorizontalSlider(camDist, 0, 20);
		if(camDist != cg) {
			camDist = cg;
			PlayerPrefs.SetFloat("camDist", cg);
		}
		/*GUILayout.BeginHorizontal();
		cg = GUILayout.HorizontalSlider(camDist, 0, 20);
		if(camDist != cg) {
			camDist = cg;
			PlayerPrefs.SetFloat("camDist", cg);
		}
		GUILayout.Label("Distance",GUILayout.Width(65));
		GUILayout.EndHorizontal();*/
	}
	
	else if(camMode == 3 || camMode == 4) {
		GUILayout.Space(10);
		GUILayout.Label("(Move camera with UIOJKL keys)");
		GUILayout.Space(10);
	}
		
	GUILayout.FlexibleSpace();
	//GUILayout.EndScrollView();
		
	GUILayout.FlexibleSpace();
	GUILayout.Space(20);
	GUILayout.Label("Vehicle Color:");
	if(Game.PlayerVeh.isIt && Game.Players.Count > 1) GUILayout.Label("(You are quarry, and therefore green)");
	
	if(GUILayout.Button((colorCustom ? "Random Coloring" : "Randomize Coloring"))) {
		ramdomizeVehicleColor();
	}
	
	GUILayout.BeginHorizontal();
	cg = GUILayout.HorizontalSlider(Game.PlayerVeh.vehicleColor.r, 0, 1);
	if(Game.PlayerVeh.vehicleColor.r != cg) {
		Game.PlayerVeh.vehicleColor.r = cg;
		updateVehicleAccent();
		updateVehicleColor();
	}
	GUILayout.Label("Red",GUILayout.Width(65));
	GUILayout.EndHorizontal();
	GUILayout.BeginHorizontal();
	cg = GUILayout.HorizontalSlider(Mathf.Min(Mathf.Lerp(.1, .8, ((Game.PlayerVeh.vehicleColor.r + Game.PlayerVeh.vehicleColor.b) / 2)), Game.PlayerVeh.vehicleColor.g), 0, Mathf.Lerp(.1, .8, ((Game.PlayerVeh.vehicleColor.r + Game.PlayerVeh.vehicleColor.b) / 2)));
	if(Game.PlayerVeh.vehicleColor.g != cg) {
		Game.PlayerVeh.vehicleColor.g = cg;
		updateVehicleAccent();
		updateVehicleColor();
	}
	GUILayout.Label("Green",GUILayout.Width(65));
	GUILayout.EndHorizontal();
	GUILayout.BeginHorizontal();
	cg = GUILayout.HorizontalSlider(Game.PlayerVeh.vehicleColor.b, 0, 1);
	if(Game.PlayerVeh.vehicleColor.b != cg) {
		Game.PlayerVeh.vehicleColor.b = cg;
		updateVehicleAccent();
		updateVehicleColor();
	}
	GUILayout.Label("Blue",GUILayout.Width(65));
	GUILayout.EndHorizontal();
	
	GUILayout.Space(5);
	GUILayout.Label("Accent Color:");
	
	GUILayout.BeginHorizontal();
	cg = GUILayout.HorizontalSlider(Game.PlayerVeh.vehicleAccent.r, 0, 1);
	if(Game.PlayerVeh.vehicleAccent.r != cg) {
		Game.PlayerVeh.vehicleAccent.r = cg;
		updateVehicleColor();
	}
	GUILayout.Label("Red",GUILayout.Width(65));
	GUILayout.EndHorizontal();
	GUILayout.BeginHorizontal();
	cg = GUILayout.HorizontalSlider(Game.PlayerVeh.vehicleAccent.g, 0, 1);
	if(Game.PlayerVeh.vehicleAccent.g != cg) {
		Game.PlayerVeh.vehicleAccent.g = cg;
		updateVehicleColor();
	}
	GUILayout.Label("Green",GUILayout.Width(65));
	GUILayout.EndHorizontal();
	GUILayout.BeginHorizontal();
	cg = GUILayout.HorizontalSlider(Game.PlayerVeh.vehicleAccent.b, 0, 1);
	if(Game.PlayerVeh.vehicleAccent.b != cg) {
		Game.PlayerVeh.vehicleAccent.b = cg;
		updateVehicleColor();
	}
	GUILayout.Label("Blue",GUILayout.Width(65));
	GUILayout.EndHorizontal();
	
	GUILayout.FlexibleSpace();
}

function showDialogPlayers () {
	GUILayout.FlexibleSpace();
	
	if(Game.Controller.isHost && Game.Controller.unauthPlayers.length > 0) {
		GUILayout.Label("Joining Players:");
		
		for(i = 0; i < Game.Controller.unauthPlayers.length; i++) {
			GUILayout.Space(10);
			GUILayout.Label(Game.Controller.unauthPlayers[i].n);
			GUILayout.TextArea(Game.Controller.unauthPlayers[i].p.externalIP);
			GUILayout.BeginHorizontal();
			if(GUILayout.Button("Evict")) {
				networkView.RPC("dN", Game.Controller.unauthPlayers[i].p, 2);
				if(Network.isServer) Network.CloseConnection(Game.Controller.unauthPlayers[i].p, true);
				else networkView.RPC("cC", RPCMode.Server, Game.Controller.unauthPlayers[i].p, Game.Controller.unauthPlayers[i].n, 0);
			}
			else if(GUILayout.Button("Invite") && !Game.Controller.authenticatedPlayers[Game.Controller.unauthPlayers[i].p]) {
				if(Network.isServer) Game.Controller.authenticatedPlayers.Add(Game.Controller.unauthPlayers[i].p, 1);
				else networkView.RPC("pI", RPCMode.Server, Game.Controller.unauthPlayers[i].p, Game.Controller.unauthPlayers[i].n);
			}
			GUILayout.EndHorizontal();
		}
		
		GUILayout.FlexibleSpace();
		
		GUILayout.Space(20);
		GUILayout.Label("Active Players:");
	}
	
	var gos : GameObject[];
	var veh : Vehicle;
	var vehNet : VehicleNet;
	for(var plrE : DictionaryEntry in Game.Players) {
		veh = plrE.Value;
		go = veh.gameObject;
    	vehNet = go.GetComponentInChildren(VehicleNet);
        GUILayout.Space(10);
		GUILayout.Label(plrE.Key + (veh.isPlayer ? " (Me)" : ""));
		GUILayout.TextArea(
			(go.networkView.isMine ? "" : (vehNet ? Mathf.RoundToInt(vehNet.ping * 1000) + " png - " + Mathf.RoundToInt(vehNet.jitter * 1000) + " jtr" + veh.netCode + "\n" : "")) +
			(vehNet && veh.networkMode == 2 ? Mathf.RoundToInt(vehNet.calcPing) + " CalcPng - " + Mathf.RoundToInt(vehNet.rpcPing) + " TmstmpOfst\n" : "" ) +
			(Network.isServer ? go.networkView.owner.externalIP + " " + go.networkView.owner.ipAddress : "") + 
			"\n" + go.networkView.viewID.ToString() + " " + veh.networkMode /*+ "/" + go.networkView.owner.ToString()*/
		, GUILayout.Height(30));
		GUILayout.BeginHorizontal();
		if((Game.Controller.isHost || isAdmin) && !veh.isBot && !go.networkView.isMine && GUILayout.Button("Evict")) {
			Game.Messaging.broadcast(go.name + " was evicted by " + Game.Player.name);
			if(Network.isServer) {
				networkView.RPC("dN", plrE.Value.networkView.owner, 2);
				plrE.Value.networkView.RPC("dN", RPCMode.All, 2);
				Network.CloseConnection(plrE.Value.networkView.owner, true);
			}
			else {
				networkView.RPC("cC", RPCMode.Server, plrE.Value.networkView.owner, plrE.Key, 1);
			}
		}
		else if((Game.Controller.isHost || isAdmin) && !veh.isBot && !go.networkView.isMine && GUILayout.Button("Ban")) {
			Game.Messaging.broadcast(go.name + " was banned by " + Game.Player.name);
			if(Network.isServer) {
				bannedIPs += (bannedIPs != "" ? "\n" : "") + plrE.Value.networkView.owner.ipAddress + " " + go.name;
				networkView.RPC("dN", plrE.Value.networkView.owner, 2);
				plrE.Value.networkView.RPC("dN", RPCMode.All, 2);
				Network.CloseConnection(plrE.Value.networkView.owner, true);
				Game.Controller.registerHost();
			}
			else {
				networkView.RPC("cC", RPCMode.Server, plrE.Value.networkView.owner, plrE.Key, 2);
			}
		}
		GUILayout.EndHorizontal();
		GUILayout.FlexibleSpace();
    } 
    
    if(Game.Controller.isHost) {
	    GUILayout.Space(20);
		GUILayout.Label("Banned Players:");
		if(bannedIPs != "" && GUILayout.Button("Unban All")) {
			bannedIPs = "";
			Game.Controller.registerHost();
			updateServerPrefs();
		}
		cm = GUILayout.TextField(bannedIPs);
		if(cm != bannedIPs) {
			bannedIPs = cm;
			updateServerPrefs();
		}
	}
}

function showDialogServer() {
	if((Game.Controller.isHost || isAdmin)) {
		if(GUILayout.Button(">> Default All <<")) {
			Game.Controller.networkView.RPC("sSS", RPCMode.All, serverDefault);
		}
		
		GUILayout.Space(20);
		GUILayout.Label("Server Name:");
		var cm = GUILayout.TextField(Game.Controller.serverName, 45);
		if(cm != Game.Controller.serverName) {
			Game.Controller.serverName = cm;
			updateServerPrefs();
		}
		
		GUILayout.Space(20);
		GUILayout.Label("Server Features:");
		
		Game.Controller.serverHidden = GUILayout.Toggle(Game.Controller.serverHidden, "Hide Server from List");
		if(Game.Controller.serverHidden && Game.Controller.hostRegistered) {
			Game.Controller.unregisterHost();
			updateServerPrefs();
		}
		else if(!Game.Controller.serverHidden && !Game.Controller.hostRegistered) {
			Game.Controller.registerHostSet();
			updateServerPrefs();
		}
		
		GUILayout.BeginHorizontal();
		GUILayout.Label("Password?");
		cm = GUILayout.TextField(Game.Controller.serverPassword);
		if(cm != Game.Controller.serverPassword) {
			Game.Controller.serverPassword = cm;
			updateServerPrefs();
		}
		GUILayout.EndHorizontal();
		
		GUILayout.Label("Welcome Message:"); 
		cm = GUILayout.TextField(serverWelcome);
		if(cm != serverWelcome) {
			serverWelcome = cm;
			updateServerPrefs();
		}
		
		GUILayout.Space(20);
		GUILayout.Label("Game Features:");
		
		if(GUILayout.Toggle(minimapAllowed, "Minimap enabled") != minimapAllowed) {
			minimapAllowed = (minimapAllowed ? false : true);
			updateServerPrefs();
		}
		
		if(GUILayout.Toggle(hideNames, "Camouflage Badges") != hideNames) {
			hideNames = (hideNames ? false : true);
			updateServerPrefs();
		}
		
		if(GUILayout.Toggle((ramoSpheres != 0), "RORBs Enabled") != (ramoSpheres != 0)) {
			ramoSpheres = ((ramoSpheres != 0) ? 0 : .5);
			if(ramoSpheres != 0) zorbSpeed = 7;
			updateServerPrefs();
		}
		
		if(ramoSpheres != 0) {
			GUILayout.BeginHorizontal();
			cg = GUILayout.HorizontalSlider(ramoSpheres, 0.001, 1);
			if(ramoSpheres != cg) {
				ramoSpheres = cg;
				updateServerPrefs();
			}
			GUILayout.Label("Size",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			
			if(GUILayout.Toggle((zorbSpeed != 0), "XORBs Available") != (zorbSpeed != 0)) {
				zorbSpeed = ((zorbSpeed != 0) ? 0 : 7);
				updateServerPrefs();
			}
			
			if(zorbSpeed != 0) {
				
				GUILayout.BeginHorizontal();
				cg = GUILayout.HorizontalSlider(zorbSpeed, 0.001, 14);
				if(zorbSpeed != cg) {
					zorbSpeed = cg;
					updateServerPrefs();
				}
				GUILayout.Label("X Speed",GUILayout.Width(65));
				GUILayout.EndHorizontal();
				
				GUILayout.BeginHorizontal();
				cg = GUILayout.HorizontalSlider(zorbAgility, -7, 7);
				if(zorbAgility != cg) {
					zorbAgility = cg;
					updateServerPrefs();
				}
				GUILayout.Label("X Agility",GUILayout.Width(65));
				GUILayout.EndHorizontal();
				
				GUILayout.BeginHorizontal();
				cg = GUILayout.HorizontalSlider(zorbBounce, 0, 1);
				if(zorbBounce != cg) {
					zorbBounce = cg;
					updateServerPrefs();
				}
				GUILayout.Label("X Bounce",GUILayout.Width(65));
				GUILayout.EndHorizontal();
				
			}
			
			GUILayout.Space(10);
		}
		
		if(GUILayout.Toggle(lasersAllowed, "Lasers enabled") != lasersAllowed) {
			lasersAllowed = (lasersAllowed ? false : true);
			updateServerPrefs();
		}
		
		if(lasersAllowed) {
			if(ramoSpheres != 0 && GUILayout.Toggle(lasersOptHit, "L Hit ORBs") != lasersOptHit) {
				lasersOptHit = (lasersOptHit ? false : true);
				updateServerPrefs();
			}
			if(GUILayout.Toggle(lasersFatal, "L Hits Rematerialize") != lasersFatal) {
				lasersFatal = (lasersFatal ? false : true);
				updateServerPrefs();
			}
			
			GUILayout.BeginHorizontal();
			cg = GUILayout.HorizontalSlider(laserSpeed, 20, 340);
			if(laserSpeed != cg) {
				laserSpeed = cg;
				updateServerPrefs();
			}
			GUILayout.Label("Lsr Spd",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			
			GUILayout.BeginHorizontal();
			cg = GUILayout.HorizontalSlider(laserGrav, 0, 1);
			if(laserGrav != cg) {
				laserGrav = cg;
				updateServerPrefs();
			}
			GUILayout.Label("Lsr Gvt",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			
			GUILayout.BeginHorizontal();
			cg = GUILayout.HorizontalSlider(laserRico, 0, 1);
			if(laserRico != cg) {
				laserRico = cg;
				updateServerPrefs();
			}
			GUILayout.Label("Lsr Rco",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			
			GUILayout.Space(10);
		}
		
		GUILayout.BeginHorizontal();
		cg = GUILayout.HorizontalSlider(worldGrav, -.81, -18.81);
		if(worldGrav != cg) {
			worldGrav = cg;
			updateServerPrefs();
		}
		GUILayout.Label("Gravity",GUILayout.Width(65));
		GUILayout.EndHorizontal();
		
		GUILayout.BeginHorizontal();
		cg = GUILayout.HorizontalSlider(worldViewDist,  300,  9700);
		if(worldViewDist != cg) {
			worldViewDist = cg;
			updateServerPrefs();
		}
		GUILayout.Label("Visibility",GUILayout.Width(65));
		GUILayout.EndHorizontal();
		
		if(World.sea) {
			GUILayout.BeginHorizontal();
			cg = GUILayout.HorizontalSlider(lavaFog, 0.015, -0.01);
			if(lavaFog != cg) {
				lavaFog = cg;
				updateServerPrefs();
			}
			GUILayout.Label("Sea Vis",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			
			GUILayout.BeginHorizontal();
			cg = GUILayout.HorizontalSlider(lavaAlt, -100, 100);
			if(lavaAlt != cg) {
				lavaAlt = cg;
				updateServerPrefs();
			}
			GUILayout.Label("Sea Alt",GUILayout.Width(65));
			GUILayout.EndHorizontal();
		}
		
		GUILayout.Space(20);
		GUILayout.Label("Bots:");
		
		if(GUILayout.Toggle(botsCanFire, "Can Fire") != botsCanFire) {
			botsCanFire = (botsCanFire ? false : true);
			updateServerPrefs();
		}
		
		if(GUILayout.Toggle(botsCanDrive, "Can Drive") != botsCanDrive) {
			botsCanDrive = (botsCanDrive ? false : true);
			updateServerPrefs();
		}
		
		GUILayout.Space(10);
		
		GUILayout.BeginHorizontal();
		if(Game.Controller.botsInGame < 10) {
			if(GUILayout.Button("Add Bot")) Game.Controller.addBot();
		}
		if(Game.Controller.botsInGame > 0) {
			if(Game.Controller.botsInGame != 10) GUILayout.Space(5);
			if(GUILayout.Button("Axe Bot")) Game.Controller.axeBot();
		}
		GUILayout.EndHorizontal();
		
		GUILayout.Space(20);
		GUILayout.Label("Buggy:");
		
		if(GUILayout.Toggle(buggyAllowed, "Available") != buggyAllowed) {
			buggyAllowed = (buggyAllowed ? false : true);
			updateServerPrefs();
		}
		if(buggyAllowed) {
			/*if(GUILayout.Toggle(buggyNewPhysics, "Beta Physics") != buggyNewPhysics) {
				buggyNewPhysics = (buggyNewPhysics ? false : true);
				updateServerPrefs();
			}*/
			if(GUILayout.Toggle(buggyFlightSlip, "Stall Blending") != buggyFlightSlip) {
				buggyFlightSlip = (buggyFlightSlip ? false : true);
				updateServerPrefs();
			}
			if(GUILayout.Toggle(buggyFlightLooPower, "Powered Loops") != buggyFlightLooPower) {
				buggyFlightLooPower = (buggyFlightLooPower ? false : true);
				updateServerPrefs();
			}
			/*if(GUILayout.Toggle(buggyAWD, "All Wheel Drive") != buggyAWD) {
				buggyAWD = (buggyAWD ? false : true);
				updateServerPrefs();
			}*/
			if(GUILayout.Toggle(buggySmartSuspension, "Smart Suspension") != buggySmartSuspension) {
				buggySmartSuspension = (buggySmartSuspension ? false : true);
				updateServerPrefs();
			}
			
			GUILayout.BeginHorizontal();
			cg = GUILayout.HorizontalSlider(buggyFlightDrag, 50, 550);
			if(buggyFlightDrag != cg) {
				buggyFlightDrag = cg;
				updateServerPrefs();
			}
			GUILayout.Label("Fl Speed",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			
			GUILayout.BeginHorizontal();
			cg = GUILayout.HorizontalSlider(buggyFlightAgility, .5, 1.5);
			if(buggyFlightAgility != cg) {
				buggyFlightAgility = cg;
				updateServerPrefs();
			}
			GUILayout.Label("Fl Agility",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			
			GUILayout.BeginHorizontal();
			cg = GUILayout.HorizontalSlider(buggyCG, -.1, -.7);
			if(buggyCG != cg) {
				buggyCG = cg;
				updateServerPrefs();
			}
			GUILayout.Label("Stability",GUILayout.Width(65));
			GUILayout.EndHorizontal();
		
			GUILayout.BeginHorizontal();
			cg = GUILayout.HorizontalSlider(buggyPower, .5, 1.5);
			if(buggyPower != cg) {
				buggyPower = cg;
				updateServerPrefs();
			}
			GUILayout.Label("Power",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			
			GUILayout.BeginHorizontal();
			cg = GUILayout.HorizontalSlider(buggySpeed, 5, 55);
			if(buggySpeed != cg) {
				buggySpeed = cg;
				updateServerPrefs();
			}
			GUILayout.Label("Speed",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			
			GUILayout.BeginHorizontal();
			cg = GUILayout.HorizontalSlider(buggyTr, .1, 1.9);
			if(buggyTr != cg) {
				buggyTr = cg;
				updateServerPrefs();
			}
			GUILayout.Label("Traction",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			
			/*GUILayout.BeginHorizontal();
			cg = GUILayout.HorizontalSlider(buggySl, 20, 80);
			if(buggySl != cg) {
				buggySl = cg;
				updateServerPrefs();
			}
			GUILayout.Label("Slip",GUILayout.Width(65));
			GUILayout.EndHorizontal();*/
			
			GUILayout.BeginHorizontal();
			cg = GUILayout.HorizontalSlider(buggySh, 20, 120);
			if(buggySh != cg) {
				buggySh = cg;
				updateServerPrefs();
			}
			GUILayout.Label("Shocks",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			
			if(lasersAllowed) {
				GUILayout.BeginHorizontal();
				cg = GUILayout.HorizontalSlider(firepower[0], 0, 3);
				if(firepower[0] != cg) {
					firepower[0] = cg;
					updateServerPrefs();
				}
				GUILayout.Label("Firepower",GUILayout.Width(65));
				GUILayout.EndHorizontal();
				
				GUILayout.BeginHorizontal();
				cg = GUILayout.HorizontalSlider(laserLock[0], 0, 1);
				if(laserLock[0] != cg) {
					laserLock[0] = cg;
					updateServerPrefs();
				}
				GUILayout.Label("Lsr Lck",GUILayout.Width(65));
				GUILayout.EndHorizontal();
			}
			
			
		}
		
		GUILayout.Space(20);
		GUILayout.Label("Tank:");
		
		if(GUILayout.Toggle(tankAllowed, "Available") != tankAllowed) {
			tankAllowed = (tankAllowed ? false : true);
			updateServerPrefs();
		}
		
		if(tankAllowed) {
			GUILayout.BeginHorizontal();
			cg = GUILayout.HorizontalSlider(tankCG, 1, -1.4);
			if(tankCG != cg) {
				tankCG = cg;
				updateServerPrefs();
			}
			GUILayout.Label("Stability",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			
			GUILayout.BeginHorizontal();
			cg = GUILayout.HorizontalSlider(tankGrip, 0, .2);
			if(tankGrip != cg) {
				tankGrip = cg;
				updateServerPrefs();
			}
			GUILayout.Label("Grip",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			
			GUILayout.BeginHorizontal();
			cg = GUILayout.HorizontalSlider(tankSpeed, 10, 40);
			if(tankSpeed != cg) {
				tankSpeed = cg;
				updateServerPrefs();
			}
			GUILayout.Label("Speed",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			
			GUILayout.BeginHorizontal();
			cg = GUILayout.HorizontalSlider(tankPower, 500, 3500);
			if(tankPower != cg) {
				tankPower = cg;
				updateServerPrefs();
			}
			GUILayout.Label("Power",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			
			if(lasersAllowed) {
				GUILayout.BeginHorizontal();
				cg = GUILayout.HorizontalSlider(firepower[2], 0, 3);
				if(firepower[2] != cg) {
					firepower[2] = cg;
					updateServerPrefs();
				}
				GUILayout.Label("Firepower",GUILayout.Width(65));
				GUILayout.EndHorizontal();
				
				GUILayout.BeginHorizontal();
				cg = GUILayout.HorizontalSlider(laserLock[2], 0, 1);
				if(laserLock[2] != cg) {
					laserLock[2] = cg;
					updateServerPrefs();
				}
				GUILayout.Label("Lsr Lck",GUILayout.Width(65));
				GUILayout.EndHorizontal();
			}
		}
		
		GUILayout.Space(20);
		GUILayout.Label("Hovercraft:");
		
		if(GUILayout.Toggle(hoverAllowed, "Available") != hoverAllowed) {
			hoverAllowed = (hoverAllowed ? false : true);
			updateServerPrefs();
		}
		
		if(hoverAllowed) {		
			GUILayout.BeginHorizontal();
			cg = GUILayout.HorizontalSlider(hoverHeight, 5, 25);
			if(hoverHeight != cg) {
				hoverHeight = cg;
				updateServerPrefs();
			}
			GUILayout.Label("Height",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			
			GUILayout.BeginHorizontal();
			cg = GUILayout.HorizontalSlider(hoverHover, 20, 180);
			if(hoverHover != cg) {
				hoverHover = cg;
				updateServerPrefs();
			}
			GUILayout.Label("Hover",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			
			GUILayout.BeginHorizontal();
			cg = GUILayout.HorizontalSlider(hoverRepel, .5, 4.5);
			if(hoverRepel != cg) {
				hoverRepel = cg;
				updateServerPrefs();
			}
			GUILayout.Label("Repulsion",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			
			GUILayout.BeginHorizontal();
			cg = GUILayout.HorizontalSlider(hoverThrust, 20, 420);
			if(hoverThrust != cg) {
				hoverThrust = cg;
				updateServerPrefs();
			}
			GUILayout.Label("Thrust",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			
			if(lasersAllowed) {
				GUILayout.BeginHorizontal();
				cg = GUILayout.HorizontalSlider(firepower[1], 0, 3);
				if(firepower[1] != cg) {
					firepower[1] = cg;
					updateServerPrefs();
				}
				GUILayout.Label("Firepower",GUILayout.Width(65));
				GUILayout.EndHorizontal();
				
				GUILayout.BeginHorizontal();
				cg = GUILayout.HorizontalSlider(laserLock[1], 0, 1);
				if(laserLock[1] != cg) {
					laserLock[1] = cg;
					updateServerPrefs();
				}
				GUILayout.Label("Lsr Lck",GUILayout.Width(65));
				GUILayout.EndHorizontal();
			}
		}
		
		GUILayout.Space(20);
		GUILayout.Label("Jet:");
		
		if(GUILayout.Toggle(jetAllowed, "Available") != jetAllowed) {
			jetAllowed = (jetAllowed ? false : true);
			updateServerPrefs();
		}
		
		if(jetAllowed) {
			GUILayout.BeginHorizontal();
			cg = GUILayout.HorizontalSlider(jetHDrag, .005, .015);
			if(jetHDrag != cg) {
				jetHDrag = cg;
				updateServerPrefs();
			}
			GUILayout.Label("HoverDrag",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			
			GUILayout.BeginHorizontal();
			cg = GUILayout.HorizontalSlider(jetDrag, .0005, .0015);
			if(jetDrag != cg) {
				jetDrag = cg;
				updateServerPrefs();
			}
			GUILayout.Label("Drag",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			
			GUILayout.BeginHorizontal();
			cg = GUILayout.HorizontalSlider(jetSteer, 5, 35);
			if(jetSteer != cg) {
				jetSteer = cg;
				updateServerPrefs();
			}
			GUILayout.Label("Agility",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			
			GUILayout.BeginHorizontal();
			cg = GUILayout.HorizontalSlider(jetLift, .1, .9);
			if(jetLift != cg) {
				jetLift = cg;
				updateServerPrefs();
			}
			GUILayout.Label("Lift",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			
			GUILayout.BeginHorizontal();
			cg = GUILayout.HorizontalSlider(jetStall, 1, 39);
			if(jetStall != cg) {
				jetStall = cg;
				updateServerPrefs();
			}
			GUILayout.Label("Stall",GUILayout.Width(65));
			GUILayout.EndHorizontal();
						
			if(lasersAllowed) {
				GUILayout.BeginHorizontal();
				cg = GUILayout.HorizontalSlider(firepower[3], 0, 3);
				if(firepower[3] != cg) {
					firepower[3] = cg;
					updateServerPrefs();
				}
				GUILayout.Label("Firepower",GUILayout.Width(65));
				GUILayout.EndHorizontal();
				
				GUILayout.BeginHorizontal();
				cg = GUILayout.HorizontalSlider(laserLock[3], 0, 1);
				if(laserLock[3] != cg) {
					laserLock[3] = cg;
					updateServerPrefs();
				}
				GUILayout.Label("Lsr Lck",GUILayout.Width(65));
				GUILayout.EndHorizontal();
			}
		}
		
		GUILayout.Space(20);
		GUILayout.Label("Network Mode:");
		
		if(GUILayout.Toggle((networkMode == 0), "UDP") != (networkMode == 0)) {
			networkMode = 0;
			updateServerPrefs();
		}
		if(GUILayout.Toggle((networkMode == 1), "RDC") != (networkMode == 1)) {
			networkMode = 1;
			updateServerPrefs();
		}
		if(GUILayout.Toggle((networkMode == 2), "RPC") != (networkMode == 2)) {
			networkMode = 2;
			updateServerPrefs();
		}
		
		if(networkMode == 0) GUILayout.Label("\"UDP\" is the fastest mode, but may result in players with \"No Connection\"");
		else if(networkMode == 1) GUILayout.Label("\"RDC\" sacrifices speed for reliability");
		else GUILayout.Label("\"RPC\" guarantees reliability at the expense of speed");
		
		GUILayout.Space(20);
		GUILayout.Label("Network Physics:");
		
		if(GUILayout.Toggle((networkPhysics == 0), "Advanced") != (networkPhysics == 0)) {
			networkPhysics = 0;
			updateServerPrefs();
		}
		if(GUILayout.Toggle((networkPhysics == 1), "Enhanced") != (networkPhysics == 1)) {
			networkPhysics = 1;
			updateServerPrefs();
		}
		if(GUILayout.Toggle((networkPhysics == 2), "Simplified") != (networkPhysics == 2)) {
			networkPhysics = 2;
			updateServerPrefs();
		}
		
		if(networkPhysics == 0) GUILayout.Label("\"Advanced\" is optimized for smooth movement and realistic collisions over the internet");
		else if(networkPhysics == 1) GUILayout.Label("\"Enhanced\" provides maximum movement precision at the cost of higher processor and network load");
		else GUILayout.Label("\"Simplified\" provides smooth movement and maximum framerates in games which don't need highly accurate vehicle collisions");
		
		GUILayout.Space(20);
		GUILayout.Label("Network Interpolation:");
		
		GUILayout.BeginHorizontal();
		cg = GUILayout.HorizontalSlider(networkInterpolation, 0, .5);
		if(networkInterpolation != cg) {
			networkInterpolation = cg;
			updateServerPrefs();
		}
		GUILayout.Label((networkInterpolation < 0.01 ? "Auto" : (networkInterpolation * 1000) + " ms"), GUILayout.Width(65));
		GUILayout.EndHorizontal();
		//GUILayout.Label("Don't alter this haphazardly! Automatic @ left, 500 ms @ right");
		
	} else {
	
		GUILayout.Space(20);
		GUILayout.Label("(NOTE: all these parameters are adjustable only by the server host. You can't change anything in this window)");
		GUILayout.Space(60);
		
		GUILayout.Toggle(minimapAllowed, "Minimap enabled");
		GUILayout.Toggle(hideNames, "Camouflage Badges");
		
		GUILayout.Toggle((ramoSpheres != 0), "RORBs Enabled");
		if(ramoSpheres != 0) {
			GUILayout.BeginHorizontal();
			GUILayout.HorizontalSlider(ramoSpheres, 0.001, 1);
			GUILayout.Label("Size",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			
			GUILayout.Toggle((zorbSpeed != 0), "XORBs Available");			
			if(zorbSpeed != 0) {
				GUILayout.BeginHorizontal();
				GUILayout.HorizontalSlider(zorbSpeed, 0.001, 14);
				GUILayout.Label("X Speed",GUILayout.Width(65));
				GUILayout.EndHorizontal();
				GUILayout.BeginHorizontal();
				GUILayout.HorizontalSlider(zorbAgility, -7, 7);
				GUILayout.Label("X Agility",GUILayout.Width(65));
				GUILayout.EndHorizontal();
				GUILayout.BeginHorizontal();
				GUILayout.HorizontalSlider(zorbBounce, 0, 1);
				GUILayout.Label("X Bounce",GUILayout.Width(65));
				GUILayout.EndHorizontal();
			}
			GUILayout.Space(10);
		}
		
		GUILayout.Toggle(lasersAllowed, "Lasers enabled");
		if(lasersAllowed) {
			if(ramoSpheres != 0) GUILayout.Toggle(lasersOptHit, "L Hit ORBs");
			GUILayout.Toggle(lasersFatal, "L Hits Rematerialize");
			GUILayout.BeginHorizontal();
			GUILayout.HorizontalSlider(laserSpeed, 20, 340);
			GUILayout.Label("Lsr Spd",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			GUILayout.BeginHorizontal();
			GUILayout.HorizontalSlider(laserGrav, 0, 1);
			GUILayout.Label("Lsr Gvt",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			GUILayout.BeginHorizontal();
			GUILayout.HorizontalSlider(laserRico, 0, 1);
			GUILayout.Label("Lsr Rco",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			GUILayout.Space(10);
		}
		
		GUILayout.BeginHorizontal();
		GUILayout.HorizontalSlider(worldGrav, -.81, -18.81);
		GUILayout.Label("Gravity",GUILayout.Width(65));
		GUILayout.EndHorizontal();
		
		GUILayout.BeginHorizontal();
		GUILayout.HorizontalSlider(worldViewDist,  500,  9500);
		GUILayout.Label("Visibility",GUILayout.Width(65));
		GUILayout.EndHorizontal();
		
		if(World.sea) {
			GUILayout.BeginHorizontal();
			GUILayout.HorizontalSlider(lavaFog, 0.015, -0.01);
			GUILayout.Label("Lava Fog",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			
			GUILayout.BeginHorizontal();
			GUILayout.HorizontalSlider(lavaAlt, -100, 100);
			GUILayout.Label("Lava Alt",GUILayout.Width(65));
			GUILayout.EndHorizontal();
		}
		
		GUILayout.Space(20);
		GUILayout.Label("Bots:");
		GUILayout.Toggle(botsCanFire, "Can Fire");	
		GUILayout.Toggle(botsCanDrive, "Can Drive");
		
		GUILayout.Space(20);
		GUILayout.Label("Buggy:");
		GUILayout.Toggle(buggyAllowed, "Available");
		if(buggyAllowed) {
			//GUILayout.Toggle(buggyNewPhysics, "Beta Physics");
			GUILayout.Toggle(buggyFlightSlip, "Stall Blending");
			GUILayout.Toggle(buggyFlightLooPower, "Powered Loops");
			//GUILayout.Toggle(buggyAWD, "All Wheel Drive");
			GUILayout.Toggle(buggySmartSuspension, "Smart Suspension");
			GUILayout.BeginHorizontal();
			GUILayout.HorizontalSlider(buggyFlightDrag, 50, 550);
			GUILayout.Label("Fl Speed",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			GUILayout.BeginHorizontal();
			GUILayout.HorizontalSlider(buggyFlightAgility, .5, 1.5);
			GUILayout.Label("Fl Agility",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			GUILayout.BeginHorizontal();
			GUILayout.HorizontalSlider(buggyCG, -.1, -.7);
			GUILayout.Label("Stability",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			GUILayout.BeginHorizontal();
			GUILayout.HorizontalSlider(buggyPower, .5, 1.5);
			GUILayout.Label("Power",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			GUILayout.BeginHorizontal();
			GUILayout.HorizontalSlider(buggySpeed, 5, 55);
			GUILayout.Label("Speed",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			GUILayout.BeginHorizontal();
			GUILayout.HorizontalSlider(buggyTr, .1, 1.9);
			GUILayout.Label("Traction",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			/*GUILayout.BeginHorizontal();
			GUILayout.HorizontalSlider(buggySl, 20, 80);
			GUILayout.Label("Slip",GUILayout.Width(65));
			GUILayout.EndHorizontal();*/
			GUILayout.BeginHorizontal();
			GUILayout.HorizontalSlider(buggySh, 20, 120);
			GUILayout.Label("Shocks",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			if(lasersAllowed) {
				GUILayout.BeginHorizontal();
				GUILayout.HorizontalSlider(firepower[0], 0, 3);
				GUILayout.Label("Firepower",GUILayout.Width(65));
				GUILayout.EndHorizontal();
				GUILayout.BeginHorizontal();
				GUILayout.HorizontalSlider(laserLock[0], 0, 1);
				GUILayout.Label("Lsr Lck",GUILayout.Width(65));
				GUILayout.EndHorizontal();
			}
		}

		GUILayout.Space(20);
		GUILayout.Label("Tank:");
		GUILayout.Toggle(tankAllowed, "Available");
		if(tankAllowed) {
			GUILayout.BeginHorizontal();
			GUILayout.HorizontalSlider(tankCG, 1, -1.4);
			GUILayout.Label("Stability",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			GUILayout.BeginHorizontal();
			GUILayout.HorizontalSlider(tankGrip, 0, .2);
			GUILayout.Label("Grip",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			GUILayout.BeginHorizontal();
			GUILayout.HorizontalSlider(tankSpeed, 10, 40);
			GUILayout.Label("Speed",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			GUILayout.BeginHorizontal();
			GUILayout.HorizontalSlider(tankPower, 500, 3500);
			GUILayout.Label("Power",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			if(lasersAllowed) {
				GUILayout.BeginHorizontal();
				GUILayout.HorizontalSlider(firepower[2], 0, 3);
				GUILayout.Label("Firepower",GUILayout.Width(65));
				GUILayout.EndHorizontal();
				GUILayout.BeginHorizontal();
				GUILayout.HorizontalSlider(laserLock[2], 0, 1);
				GUILayout.Label("Lsr Lck",GUILayout.Width(65));
				GUILayout.EndHorizontal();
			}
		}
		
		GUILayout.Space(20);
		GUILayout.Label("Hovercraft:");
		GUILayout.Toggle(hoverAllowed, "Available");
		if(hoverAllowed) {
			GUILayout.BeginHorizontal();
			GUILayout.HorizontalSlider(hoverHeight, 5, 25);
			GUILayout.Label("Height",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			GUILayout.BeginHorizontal();
			GUILayout.HorizontalSlider(hoverHover, 20, 180);
			GUILayout.Label("Hover",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			GUILayout.BeginHorizontal();
			GUILayout.HorizontalSlider(hoverRepel, .5, 4.5);
			GUILayout.Label("Repulsion",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			GUILayout.BeginHorizontal();
			GUILayout.HorizontalSlider(hoverThrust, 20, 420);
			GUILayout.Label("Thrust",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			if(lasersAllowed) {
				GUILayout.BeginHorizontal();
				GUILayout.HorizontalSlider(firepower[1], 0, 3);
				GUILayout.Label("Firepower",GUILayout.Width(65));
				GUILayout.EndHorizontal();
				GUILayout.BeginHorizontal();
				GUILayout.HorizontalSlider(laserLock[1], 0, 1);
				GUILayout.Label("Lsr Lck",GUILayout.Width(65));
				GUILayout.EndHorizontal();
			}
		}
		
		
		GUILayout.Space(20);
		GUILayout.Label("Jet:");
		GUILayout.Toggle(jetAllowed, "Available");
		if(jetAllowed) {
			GUILayout.BeginHorizontal();
			GUILayout.HorizontalSlider(jetHDrag, .005, .015);
			GUILayout.Label("HoverDrag",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			GUILayout.BeginHorizontal();
			GUILayout.HorizontalSlider(jetDrag, .0005, .0015);
			GUILayout.Label("Drag",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			GUILayout.BeginHorizontal();
			GUILayout.HorizontalSlider(jetSteer, 5, 35);
			GUILayout.Label("Agility",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			GUILayout.BeginHorizontal();
			GUILayout.HorizontalSlider(jetLift, .1, .9);
			GUILayout.Label("Lift",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			GUILayout.BeginHorizontal();
			GUILayout.HorizontalSlider(jetStall, 1, 39);
			GUILayout.Label("Stall",GUILayout.Width(65));
			GUILayout.EndHorizontal();
			if(lasersAllowed) {
				GUILayout.BeginHorizontal();
				GUILayout.HorizontalSlider(firepower[3], 0, 3);
				GUILayout.Label("Firepower",GUILayout.Width(65));
				GUILayout.EndHorizontal();
				GUILayout.BeginHorizontal();
				GUILayout.HorizontalSlider(laserLock[3], 0, 1);
				GUILayout.Label("Lsr Lck",GUILayout.Width(65));
				GUILayout.EndHorizontal();
			}
		}
		
		GUILayout.Space(20);
		GUILayout.Label("Networking:");
		GUILayout.Toggle((networkMode == 0), "UDP");
		GUILayout.Toggle((networkMode == 1), "RDC");
		GUILayout.Toggle((networkMode == 2), "RPC");
		GUILayout.Toggle((networkPhysics == 0), "Advanced");
		GUILayout.Toggle((networkPhysics == 1), "Enhanced");
		GUILayout.Toggle((networkPhysics == 2), "Simplified");
		GUILayout.BeginHorizontal();
		GUILayout.HorizontalSlider(networkInterpolation, 0, .5);
		GUILayout.Label((networkInterpolation < 0.01 ? "Auto" : (networkInterpolation * 1000) + " ms"), GUILayout.Width(65));
		GUILayout.EndHorizontal();
	}
	
	GUILayout.Label("nTime: " + Mathf.RoundToInt(Network.time));
	
	GUILayout.Space(20);
	GUILayout.Label("Settings I/O:");
	serverString = GUILayout.TextField(serverString);
	if(Game.Controller.isHost) {
		if(GUILayout.Button("Apply Custom\nSettings")) {
			Game.Controller.networkView.RPC("sSS", RPCMode.All, serverString);
		}
	}
}

function updatePrefs() {
	
	/*
	1 Fastest
	2 Fast
	3 Simple
	4 Good
	5 Beautiful
	6 Fantastic
	*/
	
	renderLevel = PlayerPrefs.GetInt("renderLevel", 4); //This can be automatically overwritten by the _Core GUI, so make sure it is whatever the user set it to when entering a game.
	
	//Laser Locking
	laserLocking = false;
	for(i=0; i<laserLock.length; i++) {
		if(laserLock[i] > 0) {
			laserLocking = true;
			break;
		}
	}
	
	//LOD Distance
	if(renderLevel > 4)			World.lodDist = 1000;
	else if(renderLevel > 3)	World.lodDist = 400;
	else if(renderLevel > 2)	World.lodDist = 75;
	else						World.lodDist = 0;
	
	//Rendering Effects
	if(renderLevel > 4) {
		camContrast.enabled = true;

		if(renderLevel > 5) {
			camSSAO.enabled = true;
			camSSAO.m_Downsampling = 2;
		}
		else {
			camSSAO.enabled = false;
			//camSSAO.m_Downsampling = 2;
		}
	}
	else {
		camSSAO.enabled = false;
		camContrast.enabled = false;
	}
	
	/*if(Game.Settings.networkPhysics == 1) {
		Network.sendRate = 20;
	}
	else */if(Game.Settings.networkPhysics == 2) {
		Network.sendRate = 10;
	}
	else {
		Network.sendRate = 15;
	}
	
	if(!ramoSpheres) zorbSpeed = 0;
	
	if(useMusic == 0) {
		gameMusic.enabled = false;
		if(gameMusic.isPlaying) gameMusic.Stop();
	}
	else {
		gameMusic.enabled = true;
		gameMusic.pitch = 1;
		gameMusic.clip = musicTracks[useMusic-1];
		if(!gameMusic.isPlaying) gameMusic.Play();
	}
	
	GameObject.Find("MiniMap").camera.enabled = (minimapAllowed ? useMinimap : false);
	
	/*if(renderLevel == 1)		QualitycurrentLevel = QualityLevel.Fastest;
	else if(renderLevel == 2)	QualitycurrentLevel = QualityLevel.Fast;
	else if(renderLevel == 3)	QualitycurrentLevel = QualityLevel.Simple;
	else if(renderLevel == 4)	QualitycurrentLevel = QualityLevel.Good;
	else if(renderLevel == 5)	QualitycurrentLevel = QualityLevel.Beautiful;
	else 						QualitycurrentLevel = QualityLevel.Fantastic;*/
	QualitySettings.currentLevel = renderLevel - 1;
	
	Time.fixedDeltaTime = (renderLevel > 3 ? 0.02 : 0.025);
	
	//RenderSettings.fog = (renderLevel > 1 ? true : false);
	//Camera.main.farClipPlane = 1300 - ((6 - renderLevel) * 150);
	Camera.main.farClipPlane = (renderViewCap == 1000 ? worldViewDist : Mathf.Min(renderViewCap, worldViewDist));
	worldFog = Mathf.Lerp(.007, .0003, Camera.main.farClipPlane / 6000);
	
	if(World.terrains) for (var trn : Terrain in World.terrains) {
			
		//Details: Rocks, trees, etc
		trn.treeCrossFadeLength = 30;
		if(renderLevel > 4) {	//Fantastic, Beautiful
			trn.detailObjectDistance = 300;
			trn.treeDistance = 600;
			trn.treeMaximumFullLODCount = 100;
			trn.treeBillboardDistance = 150;
		}
		else if(renderLevel > 3) {	//Good
			trn.detailObjectDistance = 200;
			trn.treeDistance = 500;
			trn.treeMaximumFullLODCount = 50;
			trn.treeBillboardDistance = 100;
		}
		else if(renderLevel > 2) {	//Simple
			trn.detailObjectDistance = 150;
			trn.treeDistance = 300;
			trn.treeMaximumFullLODCount = 10;
			trn.treeBillboardDistance = 75;
		}
		else {					//Fast, Fastest
			trn.detailObjectDistance = 0;
			trn.treeDistance = 0;
			trn.treeMaximumFullLODCount = 0;
			trn.treeBillboardDistance = 0;
		}
		
		//Textures
		trn.basemapDistance = 1500;
		/*if(renderLevel > 3) {
			trn.basemapDistance = 900;
		}
		else if(renderLevel > 1) {
			trn.basemapDistance = 300;
		}
		else {
			trn.basemapDistance = 150;
		}*/
		
		//Heightmap Resolution
		if(renderLevel > 5) {
			trn.heightmapMaximumLOD = 0;
			trn.heightmapPixelError = 5;
		}
		else if(renderLevel > 2) {
			trn.heightmapMaximumLOD = 0;
			trn.heightmapPixelError = 15;
		}
		else if(renderLevel > 1) {
			trn.heightmapMaximumLOD = 0;
			trn.heightmapPixelError = 50;
		}
		else {
			trn.heightmapMaximumLOD = 1;
			trn.heightmapPixelError = 50;
		}
		
		//if(renderLevel > 4) trn.lighting = TerrainLighting.Pixel;
		//else trn.lighting = TerrainLighting.Lightmap;
	}
	
	Physics.gravity = Vector3(0, worldGrav, 0);
	if(World.sea) World.sea.position.y = lavaAlt;
	zorbPhysics.bounciness = zorbBounce;
	
	updateObjects();
}

function updateServerPrefs() {
	serverUpdateTime = Time.time + 3;
	updatePrefs();
}

function ramdomizeVehicleColor() {
	while(!Game.PlayerVeh) yield;
	Game.PlayerVeh.vehicleColor.r = Random.value * .7;
	Game.PlayerVeh.vehicleColor.b = Random.value * .7;
	Game.PlayerVeh.vehicleColor.g = Random.value * Mathf.Lerp(.1, .8, ((Game.PlayerVeh.vehicleColor.r + Game.PlayerVeh.vehicleColor.b) / 2))  * .7;
	colorCustom = false;
	updateVehicleAccent();
	saveVehicleColor();
	Game.PlayerVeh.setColor();
}

function updateVehicleAccent() {
	//var offset : float = (Game.PlayerVeh.vehicleColor.r + Game.PlayerVeh.vehicleColor.g + Game.PlayerVeh.vehicleColor.b > 1 ? -.2 : .2);
	var offset : float = -.25;
	Game.PlayerVeh.vehicleAccent.r = Mathf.Max(0, Game.PlayerVeh.vehicleColor.r + offset);
	Game.PlayerVeh.vehicleAccent.g = Mathf.Max(0, Game.PlayerVeh.vehicleColor.g + offset);
	Game.PlayerVeh.vehicleAccent.b = Mathf.Max(0, Game.PlayerVeh.vehicleColor.b + offset);
}

function updateVehicleColor() {
	colorUpdateTime = Time.time + 3;
	colorCustom = true;
	Game.PlayerVeh.setColor();
}

function saveVehicleColor() {
	PlayerPrefs.SetInt("vehColCustom", (colorCustom ? 1 : 0));
	PlayerPrefs.SetFloat("vehColR", Game.PlayerVeh.vehicleColor.r);
	PlayerPrefs.SetFloat("vehColG", Game.PlayerVeh.vehicleColor.g);
	PlayerPrefs.SetFloat("vehColB", Game.PlayerVeh.vehicleColor.b);
	PlayerPrefs.SetFloat("vehColAccR", Game.PlayerVeh.vehicleAccent.r);
	PlayerPrefs.SetFloat("vehColAccG", Game.PlayerVeh.vehicleAccent.g);
	PlayerPrefs.SetFloat("vehColAccB", Game.PlayerVeh.vehicleAccent.b);
	Game.Player.networkView.RPC("sC", RPCMode.Others, Game.PlayerVeh.vehicleColor.r, Game.PlayerVeh.vehicleColor.g, Game.PlayerVeh.vehicleColor.b, Game.PlayerVeh.vehicleAccent.r, Game.PlayerVeh.vehicleAccent.g, Game.PlayerVeh.vehicleAccent.b);
}

function packServerPrefs() {
	return
		"lasr:" + (lasersAllowed ? 1 : 0) + ";" +
		"lsrh:" + (lasersFatal ? 1 : 0) + ";" +
		"lsro:" + (lasersOptHit ? 1 : 0) + ";" +
		"mmap:" + (minimapAllowed ? 1 : 0) + ";" +
		"camo:" + (hideNames ? 1 : 0) + ";" +
		"rorb:" + ramoSpheres + ";" +
		"xspd:" + zorbSpeed + ";" +
		"xagt:" + zorbAgility + ";" +
		"xbnc:" + zorbBounce + ";" +
		"grav:" + (worldGrav * -1) + ";" +
		"wvis:" + worldViewDist + ";" +
		"lfog:" + lavaFog + ";" +
		"lalt:" + lavaAlt + ";" +
		"lspd:" + laserSpeed + ";" +
		"lgvt:" + laserGrav + ";" +
		"lrco:" + laserRico + ";" +
		
		"botfire:" + (botsCanFire ? 1 : 0) + ";" +
		"botdrive:" + (botsCanDrive ? 1 : 0) + ";" +
		
		"bugen:" + (buggyAllowed ? 1 : 0) + ";" +
		//"bugxphy:" + (buggyNewPhysics ? 1 : 0) + ";" +
		"bugflsl:" + (buggyFlightSlip ? 1 : 0) + ";" +
		"bugflpw:" + (buggyFlightLooPower ? 1 : 0) + ";" +
		"bugawd:" + (buggyAWD ? 1 : 0) + ";" +
		"bugspn:" + (buggySmartSuspension ? 1 : 0) + ";" +
		"bugfldr:" + buggyFlightDrag + ";" +
		"bugflag:" + buggyFlightAgility + ";" +
		"bugcg:" + buggyCG + ";" +
		"bugpow:" + buggyPower + ";" +
		"bugspd:" + buggySpeed + ";" +
		"bugtr:" + buggyTr + ";" +
		"bugsl:" + buggySl + ";" +
		"bugsh:" + buggySh + ";" +
		"bugfp:" + firepower[0] + ";" +
		"bugll:" + laserLock[0] + ";" +
		
		"tnken:" + (tankAllowed ? 1 : 0) + ";" +
		"tnkpow:" + tankPower + ";" +
		"tnkgrp:" + tankGrip + ";" +
		"tnkspd:" + tankSpeed + ";" +
		"tnkcg:" + tankCG + ";" +
		"tnkfp:" + firepower[2] + ";" +
		"tnkll:" + laserLock[2] + ";" +
		
		"hvren:" + (hoverAllowed ? 1 : 0) + ";" +
		"hvrhe:" + hoverHeight + ";" +
		"hvrhv:" + hoverHover + ";" +
		"hvrrp:" + hoverRepel + ";" +
		"hvrth:" + hoverThrust + ";" +
		"hvrfp:" + firepower[1] + ";" +
		"hvrll:" + laserLock[1] + ";" +
		
		"jeten:" + (jetAllowed ? 1 : 0) + ";" +
		"jethd:" + jetHDrag + ";" +
		"jetd:" + jetDrag + ";" +
		"jets:" + jetSteer + ";" +
		"jetl:" + jetLift + ";" +
		"jetss:" + jetStall + ";" +
		"jetfp:" + firepower[3] + ";" +
		"jetll:" + laserLock[3] + ";" +
		
		"netm:"	+ networkMode + ";" +
		"netph:" + networkPhysics + ";" +
		"netin:" + networkInterpolation + ";" +
	"";
}

function updateObjects() {
	/*var meshRenderer : MeshRenderer;
    for (var go : GameObject in GameObject.FindGameObjectsWithTag("renderSimple")) {
    	meshRenderer = go.GetComponent(MeshRenderer);
    	meshRenderer.enabled = (renderLevel > 2 ? false : true);
    }
    for (var go : GameObject in GameObject.FindGameObjectsWithTag("renderDetailed")) {
    	meshRenderer = go.GetComponent(MeshRenderer);
    	meshRenderer.enabled = (renderLevel > 2 ? true : false);
    }
    for (var go : GameObject in GameObject.FindGameObjectsWithTag("renderNoParticles")) {
    	meshRenderer = go.GetComponent(MeshRenderer);
    	meshRenderer.enabled = (renderLevel < 4 ? true : false);
    }
    
    var particleEmitter : ParticleEmitter;
   	var trailRenderer : TrailRenderer;
	for (var go : GameObject in FindObjectsOfType(GameObject)) {
		particleEmitter = go.GetComponent(ParticleEmitter);
		if(particleEmitter) particleEmitter.emit = (renderLevel > 3 ? true : false);
		
		trailRenderer = go.GetComponent(TrailRenderer);
		if(trailRenderer) trailRenderer.enabled = false; //(renderLevel > 3 ? true : false);
	}*/
	
	for (var pE : ParticleEmitter in FindObjectsOfType(ParticleEmitter)) {
		pE.emit = (renderLevel >= 3 ? true : false);
	}
	
    for (var light : Light in FindObjectsOfType(Light)) {	//GameObject.FindGameObjectsWithTag("light")
    	if(light.name != "VehicleLight") continue;			//light = go.GetComponent(Light);
    	light.enabled = false;
   	}
   	
   	for (var go : GameObject in FindObjectsOfType(GameObject)) go.SendMessage("OnPrefsUpdated", SendMessageOptions.DontRequireReceiver);
}

function toggleFullscreen() {
	var resolution = Screen.resolutions[Screen.resolutions.length - 1];
	if(!Screen.fullScreen) {
		Screen.SetResolution (resolution.width, resolution.height, true);
		if(/*Application.platform == RuntimePlatform.WindowsWebPlayer || Application.platform == RuntimePlatform.OSXWebPlayer || */Application.platform == RuntimePlatform.OSXDashboardPlayer) {
			enteredfullscreen = true;
			//simplified = true;
		}
	}
	else {
		if(Application.platform == RuntimePlatform.WindowsWebPlayer || Application.platform == RuntimePlatform.OSXWebPlayer || Application.platform == RuntimePlatform.OSXDashboardPlayer) {
			Screen.fullScreen = false;
		}
		else {
			resolution = Screen.resolutions[Screen.resolutions.length - 2];
			Screen.SetResolution (resolution.width, resolution.height, false);
		}
		if(enteredfullscreen) {
			enteredfullscreen = false;
			//simplified = false;
		}
	}
}