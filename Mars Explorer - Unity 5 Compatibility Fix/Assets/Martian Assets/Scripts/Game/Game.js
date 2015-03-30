var GameSkin : GUISkin;
static var Skin : GUISkin;
var hudTextStyle : GUIStyle;
var GUIPanels : GUIPanel[];
class GUIPanel extends System.Object {
    var name : String;
    var active : boolean = true;
    var open : boolean;
    var important : boolean;
    var minHeight : int = 300;
    var maxHeight : int;
    var curHeight : float;
    var desHeight : float;
    var scrollPos : Vector2;
    var openTime : float;
}
private var closePanel : float;
var GameVehicles : GameObject[];
var GameWorlds : GameWorldDesc[];
//var worldMaterials : Material[];
//var worldTerrainTextures : Texture2D[];
private var whirldIn : WhirldIn = new WhirldIn();
@System.NonSerialized
var WorldIsCustom = false;
@System.NonSerialized
var WorldDesc : GameWorldDesc = new GameWorldDesc();
var WorldEntryEffect : GameObject;
var objectVehicleObj: GameObject;
static var objectVehicle : GameObject;
var objectMarkerObj: GameObject;
static var objectMarker : GameObject;
var objectMarkerQuarryObj: GameObject;
static var objectMarkerQuarry : GameObject;
var objectMarkerMeObj: GameObject;
static var objectMarkerMe : GameObject;
var objectRocketObj: GameObject;
static var objectRocket : GameObject;
var objectRocketSnipeObj: GameObject;
static var objectRocketSnipe : GameObject;

var isHost : boolean = false;
var isRegistered : boolean = false;

var cursor : Texture2D;
var cursorLook : Texture2D;
var cursorOffset : Vector2;
@System.NonSerialized
var kpDur : float = .1;
@System.NonSerialized
var kpTime : float;

private var hostPanelTab = 0;
private var windowVehicleHeight = 0;
private var scrollPosition : Vector2;
private var killServer = false;
private var netKillMode = 0;
private var GameVehicleID : int;
@System.NonSerialized
var quarryDist : float;
@System.NonSerialized
var botsInGame : int = 0;
static var GUIAlpha : float = 0;
private var GuiAnimate : int = -1;
static var Player : GameObject;
static var PlayerVeh : Vehicle;
static var QuarryVeh : Vehicle;
static var CameraVehicle : CameraVehicle;
static var Messaging : Messaging;
static var Settings : Settings;
static var Controller : Game;
//@System.NonSerialized
var worldLoaded : boolean = false;
//@System.NonSerialized
var loadingWorld : boolean = true;
@System.NonSerialized
var worldLoadTime : float;
@System.NonSerialized
var hostRegistered = false;
@System.NonSerialized
var serverName : String = "";
@System.NonSerialized
var serverPassword : String = "";
private var authTime : float;
private var authUpdateTime : float = 2;
@System.NonSerialized
var serverHidden : boolean = false;
@System.NonSerialized
var authenticatedPlayers : Hashtable = new Hashtable();
private var authenticatingPlayers : Array = new Array();
@System.NonSerialized
static var Players : Hashtable;
var unauthPlayers : Array = new Array();
class unauthPlayer extends System.Object {
    var p : NetworkPlayer;
    var n : String;
    var t : float;
    function unauthPlayer(p : NetworkPlayer, n :  String, t : float) {
    	this.p = p;
    	this.n = n;
    	this.t = t;
    }
}
var vehicleIsItColor : Color;
var vehicleIsItAccent : Color;

//FPS Counter
private var fpsTime : float;		// FPS accumulated over the interval
private var fpsFrames : int;		// Frames drawn over the interval
private var heavyTickRate = 2;
@HideInInspector
var fps : float;
@HideInInspector

function Start() {
	//Network.minimumAllocatableViewIDs = 3;
	if(Network.peerType == NetworkPeerType.Disconnected) Network.InitializeServer(9, 2500, false); //We are running in the editor, and have started the game in world load mode
	if(Network.isServer) isHost = true;

	objectVehicle = objectVehicleObj;
	objectMarker = objectMarkerObj;
	objectMarkerQuarry = objectMarkerQuarryObj;
	objectMarkerMe = objectMarkerMeObj;
	objectRocket = objectRocketObj;
	objectRocketSnipe = objectRocketSnipeObj;
	Skin = GameSkin;
	CameraVehicle = Camera.main.GetComponent("CameraVehicle");
	Settings = gameObject.GetComponent("Settings");
	Messaging = gameObject.GetComponent("Messaging");
	Controller = gameObject.GetComponent("Game");
	if(GameData.userName == "") GameData.userName = "MarsRacer";
	Settings.bannedIPs = GameData.masterBlacklist;
	Settings.networkMode = GameData.networkMode;
	Players = new Hashtable();

	botsInGame = 0;
	worldLoaded = false;

	if(!GameData.gameWorlds) GameData.gameWorlds = GameWorlds;
	//whirldIn = new WhirldIn();
	//whirldIn.worldTerrainTextures = worldTerrainTextures;
	Init();
}

function OnDisable() {
	if(whirldIn) whirldIn.Cleanup();	//Unload whatever AssetBundles we were using
}

function Init() {

	yield;	//Wait for Server to send us players via RPC - Probably totally unnecessary
	Network.isMessageQueueRunning = true;	//We are now ready to recieve RPC calls!

	//Allow World to Load
	while(worldLoaded == false) yield;
	Settings.fogColor = RenderSettings.fogColor;
	GuiAnimate = 1;
	while(GuiAnimate != 0) yield;
	yield new WaitForSeconds (.25);
	GuiAnimate = -1;
	loadingWorld = false;
	worldLoadTime = Time.time;
	var worldOBJ : GameObject = GameObject.Find(whirldIn.worldName);
	var objs = worldOBJ.GetComponentsInChildren(Transform);
	if((whirldIn.worldParams["ccc"] != 1) && objs.length > 15) worldOBJ.AddComponent(CombineChildren);
	yield; //Give the combine children script a chance to create the optimized world meshes before we start assigning layers to everything...
	/*for (var tr : Transform in objs) {
		if(tr.gameObject.layer == 0) tr.gameObject.layer = 8;
		if(tr.gameObject.tag == "Untagged") tr.gameObject.tag = "TerrainObject";
	}*/

	//Ensure standard world components are present
	if(GameObject.Find("Base")) World.base = GameObject.Find("Base").transform;
	else World.base = GameObject.Instantiate(Resources.Load("Base"), Vector3.up * 5, Quaternion.identity).transform;

	World.terrains = FindObjectsOfType(Terrain);

	if(whirldIn.worldParams["env"] && whirldIn.worldParams["env"] == "space") {
		//usedSkybox = RenderSettings.skybox = SkyboxSpace;
		//RenderSettings.fogColor = Color(.07, .02, .095, 1);
	}
	else {
		if(GameObject.Find("Sea")) {
			World.sea = GameObject.Find("Sea").transform;
			Settings.lavaAlt = World.sea.position.y;
		}
		/*else {
			Settings.lavaAlt = -10;
			World.sea = GameObject.Instantiate(Resources.Load("Sea"), Vector3(0, Settings.lavaAlt, 0), Quaternion.identity).transform;
		}*/
		if(!GameObject.Find("Floor") && !FindObjectOfType(Terrain) && !World.sea && !whirldIn.worldParams["nofloor"] && whirldIn.worldParams["floor"] != "0") GameObject.Instantiate(Resources.Load("Floor"), Vector3.zero/*Vector3.down * 100*/, Quaternion.identity);
	}

	var thereisalight : boolean = false;
	for (var light : Light in FindObjectsOfType(Light)) if(light.gameObject.name != "VehicleLight") thereisalight = true;
	if(!thereisalight) GameObject.Instantiate(Resources.Load("Light"));	//Make sure there is a light in the scene

	//Add Player!
	mE(World.base.transform.position);
	yield new WaitForSeconds(1); //Give server settings a chance to load
	if(Settings.buggyAllowed) veh = 0;
	else if(Settings.tankAllowed) veh = 2;
	else if(Settings.hoverAllowed) veh = 1;
	else if(Settings.jetAllowed) veh = 3;
	else veh = 0;
	GameVehicleID = veh;
	var temp : String = GameData.userName;
	var i = 1;
	while((i == 1 && GameObject.Find(temp) != null) || (GameObject.Find(temp + " " + i) != null)) i += 1;
	GetComponent.<NetworkView>().RPC("iV", RPCMode.All, Network.AllocateViewID(), Settings.networkMode, GameVehicleID, (i != 1 ? temp + " " + i : temp), 0, (isHost ? 1 : 0), 0, 0);

	if(isHost) {
		if(!Network.isServer) {
			sSHS(); //Send dedicated server my default settings
		}

		if(Network.isServer) {
			Game.Messaging.broadcast("You are hosting a server!\n" + (serverPassword != "" ? "Password: " + serverPassword + "\n" : "") + "IP: " + Network.player.ipAddress + "\n" + (Network.player.externalIP ? "External: " + Network.player.externalIP : "" ) + "\nPort: " + Network.player.port);
			yield new WaitForSeconds(1);
			registerHostSet();
		}
		else {
			Game.Messaging.broadcast("You are hosting a game on a dedicated server!\n" + (serverPassword != "" ? "Password: " + serverPassword + "\n" : "") + "IP: " + Network.connections[0].ipAddress + "\n" + (Network.connections[0].externalIP ? "External: " + Network.connections[0].externalIP : "" ) + "\nPort: " + Network.connections[0].port);
		}

		if(whirldIn.worldParams["message"]) {
			Settings.serverWelcome = whirldIn.worldParams["message"];
			GetComponent.<NetworkView>().RPC("msg", RPCMode.All, Settings.serverWelcome, parseInt(chatOrigins.Remote));
		}
		if(whirldIn.worldParams["marsxplr"]) GetComponent.<NetworkView>().RPC("sSS", RPCMode.All, whirldIn.worldParams["marsxplr"]);
	}
	else {
		Game.Messaging.broadcast((i != 1 ? temp + " " + i : temp) + " has joined!");
	}

	//Init Game Prefs
	Settings.serverDefault = Settings.packServerPrefs();
	Settings.serverString = Settings.serverDefault;
	Settings.updatePrefs();

	//Randomize new player colors if they are not custom
	yield;
	Settings.colorCustom = (PlayerPrefs.GetInt("vehColCustom") == 1 ? true : false);
	if(!Settings.colorCustom) Settings.ramdomizeVehicleColor();
}

function Update() {
	Application.runInBackground = true;

	/*if(Settings.renderLevel != 0 && Settings.renderAutoAdjust && Time.timeSinceLevelLoad - Settings.renderAdjustTime > 0) {
		if(Settings.fps < 25 && Settings.renderLevel > 1) { //Decrease Quality
			renderAdjustMax = Settings.renderLevel;
			Settings.renderLevel --;
			Settings.renderAdjustTime = Time.timeSinceLevelLoad + 4;
			PlayerPrefs.SetInt("renderLevel", Settings.renderLevel);
			Settings.updatePrefs();
		}
		else if(Settings.fps > 35 && Settings.renderLevel < 6 && (Settings.renderLevel == 1 || renderAdjustMax == 0 || Settings.renderLevel < renderAdjustMax - 1 || Settings.fps > 75)) { //Increase Quality
			Settings.renderLevel ++;
			Settings.renderAdjustTime = Time.timeSinceLevelLoad + 4;
			PlayerPrefs.SetInt("renderLevel", Settings.renderLevel);
			Settings.updatePrefs();
		}
	}*/

	if(Settings.resetTime > 0 && (10 - (Time.time - Settings.resetTime)) < 1) {
		if(Game.PlayerVeh.ramoSphere) Destroy(Game.PlayerVeh.ramoSphere);
		Game.Player.transform.position = World.base.position;
		Game.Player.transform.rotation = World.base.rotation;
		Game.Player.GetComponent.<Rigidbody>().isKinematic = false;
		Game.Player.GetComponent.<Rigidbody>().velocity = Vector3.zero;
		Settings.resetTime = -10;
		Settings.updatePrefs(); //Rebuild a new ramosphere
	}
	else if(Settings.resetTime < -1) Settings.resetTime += Time.deltaTime;

	if(Settings.serverUpdateTime != 0 && Settings.serverUpdateTime < Time.time) {
		Settings.serverString = Settings.packServerPrefs();
		GetComponent.<NetworkView>().RPC("sSS", RPCMode.Others, Settings.serverString);
		if(isHost && Network.isServer == false) sSHS(); //Send dedicated server my default settings
		Settings.serverUpdateTime = 0;
	}

	if(Settings.colorUpdateTime != 0 && Settings.colorUpdateTime < Time.time) {
		Settings.colorUpdateTime = 0;
		Settings.saveVehicleColor();
	}

	//Fade GUI Out
	if(GuiAnimate == 1) {
		if(GUIAlpha <= 0) {
			GUIAlpha = 0;
			GuiAnimate = 0;
		}
		else GUIAlpha = GUIAlpha - Time.deltaTime * .35;
	}
	//Fade GUI In
	else if(GuiAnimate == -1) {
		GUIAlpha = 0;
		GuiAnimate = -2;
	}
	else if(GuiAnimate == -2) {
		if(GUIAlpha >= 1) {
			GUIAlpha = 1;
			GuiAnimate = 0;
		}
		else GUIAlpha += Time.deltaTime * .35;
	}

	//Let server know that we are knocking at the door
	if(Network.peerType != NetworkPeerType.Disconnected && !isHost && WorldDesc.url == "" && Time.time - authUpdateTime > 1 && Time.timeSinceLevelLoad > 3) {
		GetComponent.<NetworkView>().RPC("lMI", RPCMode.Others, Network.player, GameData.userName); //Sent to all others (and not just server) as we want the "pseudohost" of dedicated servers to be able to let us in if necessary
		authUpdateTime = Time.time;
	}

	if(worldLoaded == false) {
		if(CameraVehicle.mb.blurAmount < 1) CameraVehicle.mb.blurAmount += Time.deltaTime;
	}

	//Handle toggling fullscreen
	if(Input.GetKeyDown(KeyCode.Alpha0) && !Messaging.chatting && Time.time > kpTime) {
		kpTime = Time.time + kpDur;
		Settings.toggleFullscreen();
	}

	fpsFrames++;
	if(Time.time > fpsTime) {
		fps = fpsFrames / heavyTickRate;
		fpsTime = Time.time + heavyTickRate;
		fpsFrames = 0;

		//Prune Unauth Players list
		if(isHost) for(i = 0; i < unauthPlayers.length; i++) if(Time.time - unauthPlayers[i].t > 2) unauthPlayers.RemoveAt(i);

		//Prune Players list
		for(var plrE : DictionaryEntry in Players) {
			if(!plrE.Value) {
				Debug.Log(plrE.Key + " null - removed from players list");
				Players.Remove(plrE.Key);
				break; //Don't want to continue iterating through players, as the hashtable is now out of sync.
			}
			/*
			else if(plrE.Value.initTime == 0.0 || plrE.Value.initTime > Time.time - 5) {
				continue;
			}
			else if(plrE.Value.lastSync < Time.time - 15) {
				plrE.Value.networkView.RPC("dN", 3);
				networkView.RPC("dN", plrE.Value.networkView.owner, 3);
				networkView.RPC("msg", RPCMode.Others, plrE.Key + " disconnected due to 15 seconds of unresponsiveness", 2);
			}
			else if(plrE.Value.lastInput < Time.time - 300) {
				plrE.Value.networkView.RPC("dN", 4);
				networkView.RPC("dN", plrE.Value.networkView.owner, 4);
				networkView.RPC("msg", RPCMode.Others, plrE.Key + " disconnected due to 5 minutes of inactivity", 2);
			}
			//cC(plrE.Value.networkView.owner, plrE.Key, 1);
			Network.CloseConnection(plrE.Value.networkView.owner, true);*/
		}

		//Prune Ghosts
		for (var go in GameObject.FindGameObjectsWithTag("Player")) {
			var found : boolean = false;
			for(var plrE : DictionaryEntry in Players) {
				if(plrE.Key == go.name) {
					found = true;
					break;
				}
			}
			if(!found) {	//This vehicle is deserted
				Destroy(go);
				Debug.Log("Abandoned vehicle destroyed: " + go.name);
				break;
			}
		}
	}
}

function OnGUI() {
	//Cursor Locking
	if(CursorLockMode.Locked) {
		GUI.depth = -999;
		GUI.Label(Rect (Screen.width / 2 - cursorOffset.x, Screen.height / 2 - cursorOffset.y, cursor.width, cursor.height), (Game.Settings.lasersAllowed && Game.Settings.firepower[PlayerVeh.vehId] > 0 ? cursor : cursorLook));
	}

	//Basic Setup
	GUI.skin = Skin;
	GUI.color.a = GUIAlpha;
	GUI.depth = 1;

	//World Setup
	if(loadingWorld) {
		GUI.Window (3, Rect(Screen.width / 2 - 300, Screen.height / 2 - 250, 600, 500), WindowServerSetup, "", "windowChromeless");
		return;
	}

	//Exit Game
	var hght = (Game.Settings.simplified ? 40 : 25);
	var wdth = (Game.Settings.simplified ? 40 : Mathf.Min(Mathf.Max(170,Screen.width / 4),250));
	if(isHost) {
		if(worldLoaded) {
			if(killServer == false) {
				if (GUI.Button(Rect(10, 10, wdth, hght), (Game.Settings.simplified ? "<<" : "<<  Stop Hosting Game"))) {
					if(Network.isServer == false || Network.connections.length < 1) {
						netKillMode = 1;
						Network.Disconnect();
						unregisterHost();
					}
					else {
						killServer = true;
						//simplified = true;
					}
				}
			} else {
				if (GUI.Button(Rect(10, 10, wdth, hght),(Game.Settings.simplified ? "<<" : "<<  Confirm Stop"))) {
					netKillMode = 1;
					Network.Disconnect();
					unregisterHost();
				}
				if (GUI.Button(Rect(Screen.width / 2 - 125, Screen.height / 2 - 100, 250, 200), "Notice:\n\nYou are hosting this game.\nIf you stop hosting, all the players\nin this game will be disconnected.\n\nIf you really want to, press \"Confirm Stop\".\n Otherwise, click this button to cancel\nthe stop and continue hosting!")) {
					killServer = false;
					simplified = false;
				}
			}
		}
	}
	else {
		if (GUI.Button(Rect(10, 10, wdth, hght),(Game.Settings.simplified ? "<<" : "<  Exit Game"))) {
			netKillMode = 1;
			Network.Disconnect();
		}
	}

	//Hide GUI Button
	if(GUI.Button(Rect(Screen.width - 50, Screen.height - 50, 40, 40), (!Settings.simplified ? ">>" : "<<"))) {
		Settings.simplified = !Settings.simplified;
		//if(Settings.simplified == true) Settings.showChat = 0;
		//else Settings.showChat = 1;
	}
	if (Settings.enteredfullscreen && GUI.Button(Rect(Screen.width / 2 - 125, Screen.height / 2 - 100, 250, 200),"Welcome to fullscreen mode!\n\nIf you hear a chime noise while holding\nkeyboard buttons; press \"Esc\",\nthen click your mouse, then press \"0\".\n\n{Click this box to play}")) {
		Settings.enteredfullscreen = false;
		//Settings.simplified = false;
	}

	//Player related stuff beyond this point
	if(!Player || Settings.simplified) return;

	//Hud Text
	if(PlayerVeh.vehId == 3/*PlayerVeh.inputThrottle*/) GUI.Button(Rect((Screen.width * 0.5) - 200,Screen.height - 63,400,20), "{Hold Q for no throttle & E for full throttle}", hudTextStyle);
	if(Messaging.chatting) GUI.Button(Rect((Screen.width * 0.5) - 200,Screen.height - 50,400,20), "{Keyboard Shortcuts Locked ~ Press \"Tab\" to unlock}", hudTextStyle);
	else if(CursorLockMode.Locked) GUI.Button(Rect((Screen.width * 0.5) - 200,Screen.height - 50,400,20), "{Cursor Locked ~ " + (Input.GetButton("Fire2") ? "Release \"Alt\" to unlock" : (Input.GetButton("Snipe") ? "Release \"Shift\" to unlock" : "Press \"2\" to unlock")) + "}", hudTextStyle);
	else if(Settings.camMode == 3 || Settings.camMode == 4) GUI.Button(Rect((Screen.width * 0.5) - 200,Screen.height - 50,400,20), "{Use the UIOJKL keys to adjust camera position}", hudTextStyle);

	if(Event.current.type != EventType.Layout) {

		//Vehicle Switching
		if(!GUIPanels[4].active) {
			if(Vector3.Distance(Player.transform.position, World.base.transform.position) < 20 && Settings.resetTime > -1) {
				GUIPanels[4].openTime = Time.time;
				GUIPanels[4].open = true;
				GUIPanels[4].active = true;
			}
		}
		else {
			if(!(Vector3.Distance(Player.transform.position, World.base.transform.position) < 20 && Settings.resetTime > -1)) {
				GUIPanels[4].active = false;
			}
		}

		//Settings Advisor
		if(!GUIPanels[5].active) {
			if(Settings.showHints && ((fps < 20 && Settings.renderLevel > 1) || (fps > 55 && Settings.renderLevel < 5))) {
				GUIPanels[5].openTime = Time.time;
				GUIPanels[5].open = true;
				GUIPanels[5].active = true;
			}
		}
		else {
			if(!Settings.showHints || !((fps < 20 && Settings.renderLevel > 1) || (fps > 55 && Settings.renderLevel < 5)) && Time.time > GUIPanels[5].openTime + 3) {
				GUIPanels[5].active = false;
			}
		}

	}

	//Build SidePanels
	var liquidPanels = 0;
	var solidPanels = 0;
	var buttonHeight = 25;
	var panelSpacing = 5;
	var areaHeight = Screen.height - 60;
	var areaOffset = panelSpacing * 2;
	var areaOffsetDes = areaOffset;

	//Calc SidePanel Heights
	for(i=0; i < GUIPanels.length; i++) {
		if(!GUIPanels[i].active) continue;
		if(GUIPanels[i].open) {
			liquidPanels++;
		}
		else {
			solidPanels++;
		}
	}

	/* //Handle Min and Max Heights
	for(i=0; i < GUIPanels.length; i++) {
		if(!GUIPanels[i].active) continue;
		if(GUIPanels[i].open) {
			liquidPanels++;
		}
		else {
			solidPanels++;
		}
	}*/

	//Area to fill
	for(i=0; i < GUIPanels.length; i++) {
		if(!GUIPanels[i].active && GUIPanels[i].curHeight <= buttonHeight) continue;
		if(GUIPanels[i].open && GUIPanels[i].active) {
			GUIPanels[i].desHeight = (areaHeight - ((solidPanels + liquidPanels) * panelSpacing + solidPanels * buttonHeight)) / liquidPanels;
			if(GUIPanels[i].maxHeight > 0 && GUIPanels[i].desHeight > GUIPanels[i].maxHeight) GUIPanels[i].desHeight = GUIPanels[i].maxHeight;
			else if(GUIPanels[i].minHeight > 0 && GUIPanels[i].desHeight < GUIPanels[i].minHeight) GUIPanels[i].desHeight = GUIPanels[i].minHeight;
		}
		else {
			GUIPanels[i].desHeight = buttonHeight;
		}
		if(GUIPanels[i].curHeight > GUIPanels[i].desHeight - 1 && GUIPanels[i].curHeight < GUIPanels[i].desHeight + 1) GUIPanels[i].curHeight = GUIPanels[i].desHeight;
		else GUIPanels[i].curHeight = Mathf.Lerp(GUIPanels[i].curHeight, GUIPanels[i].desHeight, Time.deltaTime * 3);

		//We are a button
		if(GUIPanels[i].curHeight < buttonHeight * 1.5) {
			var txt = GUIPanels[i].name;
			if(i == 1) txt += " (" + fps.ToString("f0") + " FPS)";
			else if(i == 3 && isHost && unauthPlayers.length > 0) txt = "* " + txt + " (" + unauthPlayers.length + ") *";
			if(Event.current.type != EventType.Layout && GUI.Button(Rect(Screen.width - 180, areaOffset, 170, GUIPanels[i].curHeight), txt)) {
				GUIPanels[i].open = !GUIPanels[i].open;
				GUIPanels[i].openTime = Time.time;
				GUI.FocusWindow(20 + i);
			}
		}

		//We are a panel
		else {
			GUI.Window(20 + i, Rect(Screen.width - 180, areaOffset, 170, GUIPanels[i].curHeight), GUIPanel, GUIPanels[i].name + ":", (GUIPanels[i].important ? "boldWindow" : "Window"));
		}

		areaOffset += GUIPanels[i].curHeight + panelSpacing;
		areaOffsetDes += GUIPanels[i].desHeight + panelSpacing;
	}

	//Close oldest panel if we are flowing out of the area
	if(Event.current.type != EventType.Layout) {
		if(areaOffsetDes > areaHeight + panelSpacing * 4) {
			closePanel += Time.deltaTime;
			if(closePanel > 1.5) {
				var oldestI = -1;
				for(i=0; i < GUIPanels.length; i++) {
					if(GUIPanels[i].open && GUIPanels[i].openTime > 0 && GUIPanels[i].openTime < Time.time - .5 && (oldestI == -1 || GUIPanels[i].openTime < GUIPanels[oldestI].openTime)) oldestI = i;
				}
				if(oldestI != -1) GUIPanels[oldestI].open = false;
			}
		}
		else closePanel = 0;
	}
}

function GUIPanel(id : int) {
	var i : int = id - 20;
	var closeButtonStyle = GUI.skin.GetStyle("close_button");
	if (GUI.Button(Rect (closeButtonStyle.padding.left, closeButtonStyle.padding.top, closeButtonStyle.normal.background.width, closeButtonStyle.normal.background.height), "", "close_button")) GUIPanels[i].open = false;
	GUILayout.Space(5);
	GUIPanels[i].scrollPos = GUILayout.BeginScrollView(GUIPanels[i].scrollPos);

	if(i == 0) Settings.showDialogServer();
	else if(i == 1) Settings.showDialogGame();
	else if(i == 2) Settings.showDialogPlayer();
	else if(i == 3) Settings.showDialogPlayers();
	else if(i == 4) showDialogVehicles();
	else if(i == 5) showDialogRenderHints();
	else GUILayout.Label("{Unknown Panel}");

	GUILayout.Space(5);
	GUILayout.EndScrollView();
}

function showDialogVehicles() {
	if(GameVehicleID == null) return;
	GUILayout.FlexibleSpace();
	GUILayout.Space(5);
	GUILayout.Label("You are currently commanding a " + GameVehicles[GameVehicleID].name + ":");
	GUILayout.Space(10);
	GUILayout.FlexibleSpace();

	var i = -1;
	for(var veh in GameVehicles) {
		i++;
		if(i == GameVehicleID) continue;
		if(i == 0 && !Settings.buggyAllowed) GUILayout.Label("(Buggy unavailable)", GUILayout.Height(25));
		else if(i == 1 && !Settings.hoverAllowed) GUILayout.Label("(Hovercraft unavailable)", GUILayout.Height(25));
		else if(i == 2 && !Settings.tankAllowed) GUILayout.Label("(Tank unavailable)", GUILayout.Height(25));
		else if(i == 3 && !Settings.jetAllowed) GUILayout.Label("(Jet unavailable)", GUILayout.Height(25));
		else if(GUILayout.Button(">> Switch to a " + veh.name, GUILayout.Height(40))) {
			Settings.resetTime = -10;
			setVeh(i);
		}
	}

	GUILayout.Space(10);
	GUILayout.FlexibleSpace();
	GUILayout.Label("(You can only switch when at this location)");
}

function showDialogRenderHints() {
	if(fps < 20)	GUILayout.Label("Low Framerate: " + fps.ToString("f0") + " FPS\n\nClick \"Game Settings\" above and decrease (<<) the Rendering Quality to speed up your framerate");
	else			GUILayout.Label("High Framerate: " + fps.ToString("f0") + " FPS\n\nClick \"Game Settings\" above and increase (>>) the Rendering Quality to make everything look nicer");
	GUILayout.Space(5);
	if(GUILayout.Toggle(Settings.showHints, "Enable Settings Advisor") != Settings.showHints) {
		Settings.showHints = (Settings.showHints ? false : true);
		PlayerPrefs.SetInt("showHints", (Settings.showHints ? 1 : 0));
		Settings.updatePrefs();
	}
}

function OnPlayerConnected(player : NetworkPlayer) {
	//Make sure they aren't banned
	if(Settings.bannedIPs != "") {
		var banned = Settings.bannedIPs.Split("\n"[0]);
		for (var dat : String in banned) {
			val = dat.Split(" "[0]);
			if(val[0] == player.ipAddress) {
				//Game.Messaging.broadcast(player.ipAddress + " attempted to rejoin");
				GetComponent.<NetworkView>().RPC("dN", player, 2);
				Network.CloseConnection(player, true);
			}
		}
	}

	//Authenticate them if necessary
	while(serverPassword != "") {
		if(authenticatedPlayers.ContainsKey(player)) break; //They sent the right password in an RPC - let them join the game
		var playerIsConnected = false;
		for (var plyr : NetworkPlayer in Network.connections) {
			if(plyr == player) {
				playerIsConnected = true;
			}
		}
		if(!playerIsConnected) return; //They gave up, and are no longer connected
		yield;
	}

	//Sync Vehicles
	for(var plrE : DictionaryEntry in Players) {
		var veh : Vehicle = plrE.Value;
		GetComponent.<NetworkView>().RPC("iV", player, veh.GetComponent.<NetworkView>().viewID, veh.networkMode, veh.vehId, veh.gameObject.name, (veh.isBot ? 1 : 0), veh.isIt, veh.score, (veh.specialInput ? 1 : 0));
		veh.GetComponent.<NetworkView>().RPC("sC", player, veh.vehicleColor.r, veh.vehicleColor.g, veh.vehicleColor.b, veh.vehicleAccent.r, veh.vehicleAccent.g, veh.vehicleAccent.b);
	}

	//Sync Server Prefs
	if(Settings.serverString != Settings.serverDefault) {
		Settings.serverString = Settings.packServerPrefs();
		GetComponent.<NetworkView>().RPC("sSS", player, Settings.serverString);
	}

	//Send Them World
	GetComponent.<NetworkView>().RPC("lW", player, "url=" + WorldDesc.url);

	//Welcome them!
	if(Settings.serverWelcome != "") GetComponent.<NetworkView>().RPC("msg", player, Settings.serverWelcome, parseInt(chatOrigins.Remote));

	//Force-Refresh Everyone's NetworkViews
	//http://forum.unity3d.com/viewtopic.php?t=35724&postdays=0&postorder=asc&start=105
	for(var plrE : DictionaryEntry in Players) {
		if(!plrE.Value) continue;
		plrE.Value.networkView.enabled = false;
		yield;
		plrE.Value.networkView.enabled = true;
	}

	//Update Master Server Listing
	yield new WaitForSeconds(5);
	registerHost();
}

function OnPlayerDisconnected (player : NetworkPlayer) {
	var pName : String = "";

	for(var plrE : DictionaryEntry in Players) if(plrE.Value.networkView.owner == player) {
		GetComponent.<NetworkView>().RPC("pD", RPCMode.All, plrE.Key);
		break;
	}

	Network.RemoveRPCs(player);
	Network.DestroyPlayerObjects(player);
	yield new WaitForSeconds(1);
	eSI();
	registerHost();
}

function WindowServerSetup (id : int) {
	if(!isHost && WorldDesc.url == "") {
		GUILayout.FlexibleSpace();
		GUILayout.FlexibleSpace();
		GUILayout.FlexibleSpace();
		GUILayout.Label("This Game is Password Protected:");
		GUILayout.FlexibleSpace();
		GUILayout.BeginHorizontal();
		GUILayout.Space(40);
		GUILayout.Label("Password:", GUILayout.Width(80));
		serverPassword = GUILayout.PasswordField(serverPassword, "*"[0]);
		GUILayout.Space(40);
		GUILayout.EndHorizontal();
		if(authTime > 1 && authTime < Time.time - 3) {
			GUILayout.FlexibleSpace();
			GUILayout.Label("Authentication Failed - please try a different password");
		}
		GUILayout.FlexibleSpace();
		GUILayout.Label("(The host can invite you directly into their game if they desire)");
		GUILayout.FlexibleSpace();
		GUILayout.BeginHorizontal();
		GUILayout.Space(40);
		if(GUILayout.Button((authTime > 1 && authTime > Time.time - 3 ? "Authenticating..." : ">> Authenticate"), GUILayout.Height(40))) {
			authTime = Time.time;
			GetComponent.<NetworkView>().RPC("cP", RPCMode.All, Network.player, serverPassword);
		}
		GUILayout.Space(40);
		GUILayout.EndHorizontal();
		GUILayout.Space(5);
		GUILayout.BeginHorizontal();
		GUILayout.FlexibleSpace();
		if(GUILayout.Button("<< Cancel", GUILayout.Height(25), GUILayout.Width(150))) {
			netKillMode = 1;
			Network.Disconnect();
		}
		GUILayout.FlexibleSpace();
		GUILayout.EndHorizontal();
	}
	else if(whirldIn.status == WhirldInStatus.Success || worldLoaded == true) {
		if(whirldIn.status == WhirldInStatus.Success && !worldLoaded) {
			worldLoaded = true;
			Settings.simplified = false;
			scrollPosition = Vector2.zero;
			if(whirldIn.info != "") msg(whirldIn.info, parseInt(chatOrigins.Server));
		}

		GUILayout.Label("\n\n\nWorld Loaded Successfully...\n\n\n");
		GUILayout.BeginHorizontal();
		GUILayout.Space(40);
		GUILayout.Button("<< Cancel", GUILayout.Height(40));
		GUILayout.Space(40);
		GUILayout.EndHorizontal();
		GUILayout.Space(40);
	}
	else if(whirldIn.status != WhirldInStatus.Idle) {
		if(whirldIn.status == WhirldInStatus.Working) {
			var threadList : String = "";
			for(var thread : DictionaryEntry in whirldIn.threads) {
				if(thread.Value != "") {
					threadList += "\n" + thread.Key + ": ";
					try {
						var boo : float = thread.Value;
						threadList += Mathf.RoundToInt(thread.Value * 100) + "%";
					}
					catch(e) {
						threadList += thread.Value;
					}
				}
			}
			scrollPosition = GUILayout.BeginScrollView(scrollPosition);
			GUILayout.Label(
				"Loading World:\n\n" +
				(whirldIn.statusTxt == "" ? "Initializing Whirld Library..." : "" + whirldIn.statusTxt + "...") + (whirldIn.progress > 0 && whirldIn.progress < 1 ? " (" + whirldIn.progress * 100 + "%)" : "") + "\n" +
				threadList
				);
			GUILayout.EndScrollView();
		}
		else {
			GUILayout.Label("World Loading Error:\n" + whirldIn.status);
		}

		GUILayout.BeginHorizontal();
		GUILayout.Space(40);
		if(GUILayout.Button((whirldIn.status == WhirldInStatus.Working ? "<< Cancel" : "<< Retry"), GUILayout.Height(40))) {
			whirldIn.Cleanup();
			whirldIn = null;
			whirldIn = new WhirldIn();
		}
		GUILayout.Space(40);
		GUILayout.EndHorizontal();
		GUILayout.Space(40);
	}
	else if(!isHost) {
		GUILayout.Space(150);
		GUILayout.Label("Initializing connection with game server...");
		netKillMode = 1;
		Network.Disconnect();
	}
	else {		//Getting ready to host a game
		//if(!whirldIn.defaultMaterial) whirldIn.defaultMaterial = worldMaterials[0];
		if(serverName == "" && GUI.GetNameOfFocusedControl() != "serverName") serverName = GameData.userName + "'s Game";
		if(WorldDesc.name == "" && GUI.GetNameOfFocusedControl() != "worldName") WorldDesc.name = "Custom World";

		GUILayout.Space(40);
		var tabs : String[] = Array("Select a World","Use Custom World","Server Settings").ToBuiltin(String);
		hostPanelTab = GUILayout.SelectionGrid(hostPanelTab, tabs, tabs.length, GUILayout.Height(30));
		GUILayout.Space(20);

		//Selecting a ready to go world
		if(hostPanelTab == 0) {
			/*if(WorldIsCustom) {
				GUILayout.BeginHorizontal();
				GUILayout.Space(70);
				scrollPosition = GUILayout.BeginScrollView(scrollPosition);
				GUILayout.Label("You have a custom world specified in the \"Use Custom World\" tab. To turn it off and use a ready made world, disable the option below:");
				GUILayout.Space(10);
				WorldIsCustom = GUILayout.Toggle(WorldIsCustom, "Use Custom World");
				GUILayout.EndScrollView();
				GUILayout.Space(70);
				GUILayout.EndHorizontal();
			}
			else {*/
				GUILayout.Label("Have fun hosting your game!\n Customize your game's settings in the panels enumerated above,\nand specify a world to explore from the list below:");
				GUILayout.Space(20);
				GUILayout.BeginHorizontal();
				GUILayout.Space(115);
				scrollPosition = GUILayout.BeginScrollView(scrollPosition);
				if(WorldIsCustom && GUILayout.Toggle(true, "Using Custom World") != true && false) WorldIsCustom = false;
				GUILayout.BeginHorizontal();
				i = 0;
				for (var Gworld : GameWorldDesc in GameData.gameWorlds) {
					if(!Gworld.featured) continue;
					if(!WorldIsCustom && WorldDesc && WorldDesc.name == Gworld.name) GUILayout.Toggle(true, Gworld.name, GUILayout.Width(170), GUILayout.Height(22));
			        else if(GUILayout.Toggle(false, Gworld.name, GUILayout.Width(170), GUILayout.Height(22))) {
						WorldIsCustom = false;
						WorldDesc.name = Gworld.name;
						WorldDesc.url = Gworld.url;
						//WorldDesc.format = Gworld.format;
					}
					i++;
					if(i % 2 == 0) {
						GUILayout.EndHorizontal();
						GUILayout.BeginHorizontal();
					}
			    }
			    GUILayout.EndHorizontal();
				GUILayout.Space(20);
				GUILayout.FlexibleSpace();
				GUILayout.BeginHorizontal();
				i = 0;
				for (var Gworld : GameWorldDesc in GameData.gameWorlds) {
					if(Gworld.featured) continue;
					if(!WorldIsCustom && WorldDesc && WorldDesc.name == Gworld.name) GUILayout.Toggle(true, Gworld.name, GUILayout.Width(170));
			        else if(GUILayout.Toggle(false, Gworld.name, GUILayout.Width(170))) {
						WorldIsCustom = false;
						WorldDesc.name = Gworld.name;
						WorldDesc.url = Gworld.url;
						//WorldDesc.format = Gworld.format;
					}
					i++;
					if(i % 2 == 0) {
						GUILayout.EndHorizontal();
						GUILayout.BeginHorizontal();
					}
			    }
			    GUILayout.EndHorizontal();
			    GUILayout.EndScrollView();
				GUILayout.EndHorizontal();
			//}
		}

		//Using a custom world
		else if(hostPanelTab == 1) {
			GUILayout.Space(20);
			if(WorldIsCustom) {
				GUILayout.BeginHorizontal();
				GUILayout.Space(150);
				WorldIsCustom = GUILayout.Toggle(WorldIsCustom, "Use Custom World");
				GUILayout.Space(150);
				GUILayout.EndHorizontal();

				GUILayout.BeginHorizontal();
				GUILayout.Space(70);
				scrollPosition = GUILayout.BeginScrollView(scrollPosition);
				GUILayout.Space(10);
				//if(WorldDesc.url == "") WorldDesc.url = "http://";
				GUILayout.BeginHorizontal();
				GUILayout.Label("World Name:", GUILayout.Width(80));
				GUI.SetNextControlName("worldName");
				WorldDesc.name = GUILayout.TextField(WorldDesc.name);
				GUILayout.EndHorizontal();
				GUILayout.BeginHorizontal();
				GUI.SetNextControlName("worldUrl");
				GUILayout.Label("World Url:", GUILayout.Width(80));
				var tmp : String = WorldDesc.url;
				WorldDesc.url = GUILayout.TextField(WorldDesc.url);
				if(WorldDesc.url != tmp) WorldDesc.name = "Custom World";
				GUILayout.EndHorizontal();
				/*GUILayout.BeginHorizontal();
				GUILayout.Label("Format:", GUILayout.Width(80));
				for (var fmt : WorldFormats in WorldFormats.GetValues(WorldFormats)) {
					 if(GUILayout.Toggle(((WorldDesc && WorldDesc.format == fmt) ? true : false), fmt.ToString())) {
						WorldDesc.format = fmt;
					}
				}
				GUILayout.EndHorizontal();*/
				GUILayout.EndScrollView();
				GUILayout.Space(70);
				GUILayout.EndHorizontal();
			}
			else {
				GUILayout.BeginHorizontal();
				GUILayout.Space(150);
				scrollPosition = GUILayout.BeginScrollView(scrollPosition);
				WorldIsCustom = GUILayout.Toggle(WorldIsCustom, "Use Custom World");
				GUILayout.EndScrollView();
				GUILayout.Space(150);
				GUILayout.EndHorizontal();
				GUILayout.Space(20);
				GUILayout.Label("Mars Explorer incorporates the Unity Whirld system -\nan open source framework which enables you to design your own game worlds,\nand play them inside Mars Exporer!\n\nIf you have a custom world, enable \"Use Custom World\" above to use it in your game.");
			}

			GUILayout.Space(40);
			GUILayout.BeginHorizontal();
			GUILayout.Space(150);
			if(GUILayout.Button(">> Learn About the Whirld System")) Application.OpenURL("http://www.unifycommunity.com/wiki/index.php?title=whirld");
			GUILayout.Space(150);
			GUILayout.EndHorizontal();
		}

		//Specifying Server Settings
		else {
			GUILayout.BeginHorizontal();
			GUILayout.Space(150);
			scrollPosition = GUILayout.BeginScrollView(scrollPosition);

			GUILayout.Space(10);

			GUILayout.Label("Your Game's Name:");
			GUI.SetNextControlName("serverName");
			serverName = GUILayout.TextField(serverName, 45);

			/*GUILayout.Space(20);
			GUILayout.Label("Default World Material:");
			for (var mat : Material in worldMaterials) {
				if(GUILayout.Toggle(whirldIn.defaultMaterial.name == mat.name ? true : false, mat.name)) {
					whirldIn.defaultMaterial = mat;
				}
			}*/

			GUILayout.Space(20);

			serverHidden = GUILayout.Toggle(serverHidden, "Hide This Game From List");
			if(serverHidden == false) {
				var usePass : boolean = GUILayout.Toggle((serverPassword == "" ? false : true), "Password Protect This Game");
				if(usePass) {
					serverPassword = (serverPassword == "" ? "1" : serverPassword);
					GUILayout.BeginHorizontal();
					GUILayout.Label("Password:", GUILayout.Width(80));
					serverPassword = GUILayout.TextField((serverPassword == "1" ? "" : serverPassword), 45);
					if(usePass && serverPassword == "") serverPassword = "1";
					GUILayout.EndHorizontal();
					//GUILayout.Label("(Your game will be visible in the list, but friends will need this password to join your game)");
				}
				else serverPassword = "";
			}
			else {
				GUILayout.Label("(Your game will not be shown in the server list. Friends will need to \"Direct Connect\" to your IP Address)");
				serverPassword = "";
			}

			GUILayout.EndScrollView();
			GUILayout.Space(150);
			GUILayout.EndHorizontal();
		}

		GUILayout.FlexibleSpace();

		if(WorldDesc.url != "" && WorldDesc.url != "http://") {
			if(GUILayout.Button(">> Begin Hosting Game! <<", GUILayout.Height(40))) {
				serverName = LanguageFilter(serverName);
				if(serverPassword == "1") {
					serverPassword = "";
					while(serverPassword.length < 5) serverPassword += Random.Range(0, 9);
				}
				LoadWorld();
			}
			GUILayout.Space(5);
			GUILayout.BeginHorizontal();
			GUILayout.FlexibleSpace();
			if(GUILayout.Button("<< Cancel", GUILayout.Height(25), GUILayout.Width(150))) {
				netKillMode = 1;
				Network.Disconnect();
			}
			GUILayout.FlexibleSpace();
			GUILayout.EndHorizontal();
		}
		else {
			if(GUILayout.Button("<< Cancel Hosting Game", GUILayout.Height(40))) {
				netKillMode = 1;
				Network.Disconnect();
			}
			GUILayout.Space(32);
		}
	}
}

function addBot() {
	botsInGame += 1;
	Messaging.broadcast(Player.name + " added " + (botsInGame == 1 ? "a bot" : "bot " + botsInGame));
	materilizationEffect(World.base.transform.position);
	var temp : String = GameData.userName + "'s bot" + (botsInGame == 1 ? "" : " " + botsInGame);
	yield new WaitForSeconds (2);
	GetComponent.<NetworkView>().RPC("iV", RPCMode.All, Network.AllocateViewID(), Settings.networkMode, GameVehicleID, temp, 1, 0, 0, 0);

	//var i = 1;
	//while((i == 1 && GameObject.Find(temp) != null) || (GameObject.Find(temp + " " + i) != null)) i += 1;
	//bot.rigidbody.isKinematic = true;
	//yield new WaitForSeconds (2);
	//if(!bot) return;
	//bot.rigidbody.isKinematic = false;
	//bot.rigidbody.useGravity = true;
}

function axeBot() {
	var bot : GameObject = GameObject.Find(Player.name + "'s bot" + (botsInGame != 1 ? " " + botsInGame : ""));
	if(!bot) return;
	Messaging.broadcast(Player.name + " removed " + (botsInGame == 1 ? "the last bot" : ("bot " + botsInGame)));
	botsInGame -= 1;
	materilizationEffect(bot.transform.position);
	bot.GetComponent.<Rigidbody>().isKinematic = true;

	Network.Destroy(bot.GetComponent.<Rigidbody>().GetComponent.<NetworkView>().viewID);

	yield new WaitForSeconds(.5);
	eSI();
	//renderAdjustMax = 0; //Give the autorender settings algorithym a chance to take advantage of new settings...
}

function setVeh(setVehicleTo : int) {
	Messaging.broadcast(Player.name + " switched to a " + GameVehicles[setVehicleTo].name);
	GameVehicleID = setVehicleTo;
	var isIt : int = PlayerVeh.isIt;
	var score : int = PlayerVeh.score;
	var specialInput : int = (PlayerVeh.specialInput ? 1 : 0);
	var name : String = Player.name;
	Network.Destroy(Player.GetComponent.<Rigidbody>().GetComponent.<NetworkView>().viewID);
	GetComponent.<NetworkView>().RPC("iV", RPCMode.All, Network.AllocateViewID(), Settings.networkMode, GameVehicleID, name, 0, isIt, score, specialInput);
}

@RPC
function eSI() { //Ensure Someone is It
	if(!Player) return;
	var gos : GameObject[];
	var Veh : Vehicle;
	for(var plrE : DictionaryEntry in Players) if(plrE.Value.isIt == 1) return;
	Player.GetComponent.<NetworkView>().RPC("sQ", RPCMode.All, 3);
}

function materilizationEffect(position : Vector3) {
	GetComponent.<NetworkView>().RPC("mE", RPCMode.All, position);
}

@RPC
function mE(position : Vector3) {
	Instantiate(WorldEntryEffect, position, Quaternion(0,0,0,1));
}

function registerHost() {
	if(serverHidden || !Network.isServer) return;
	yield new WaitForSeconds(1);
	var playerList : String = "";
	var lagCount : int;
	var lagVal : float;
	var botCount : int;
	for(var plrE : DictionaryEntry in Players) {
		if(!plrE.Value) continue;

		if(plrE.Value.isBot) {
			botCount += 1;
		}
		else {
			playerList += (playerList == "" ? "" : ",") + plrE.Value.name;
			if(!plrE.Value.networkView.isMine) {
				var vehNet : VehicleNet = plrE.Value.gameObject.GetComponent(VehicleNet);
				if(vehNet) {
					lagCount += 1;
					lagVal += vehNet.ping;
				}
			}
		}
	}
	if(botCount > 0) playerList += ",and " + botCount + " bots";
	if(Settings.bannedIPs != "") {
		var bannedIPs : String = "";
		var banned = Settings.bannedIPs.Split("\n"[0]);
		for (var dat : String in banned) {
			if(dat == "") continue;
			val = dat.Split(" "[0]);
			bannedIPs += (bannedIPs == "" ? "," : "") + val[0];
		}
		bannedIPs = ";b=" + bannedIPs;
	}
	MasterServer.RegisterHost(GameData.gameName, serverName, "v=" + GameData.gameVersion + ";w=" + WorldDesc.name + ";p=" + playerList + ";u=" + WorldDesc.url + (lagCount > 0 ? ";s=" + Mathf.RoundToInt((lagVal / lagCount) * 1000) : "") + (serverPassword != "" ? ";l=1" : "") + bannedIPs);
}
function registerHostSet() {
	if(serverHidden == true) return;
	hostRegistered = true;
	while(hostRegistered == true) {
    	registerHost();
		yield new WaitForSeconds(60);
	}
}
function unregisterHost() {
	//if(serverHidden) return;
	hostRegistered = false;
	MasterServer.UnregisterHost();
}

function OnDisconnectedFromServer (info : NetworkDisconnection) {
	if (!Network.isServer && netKillMode != 1) {
		GameData.errorMessage = "\n\nDisconnected from Game Server:\n\n";
		if(info == NetworkDisconnection.LostConnection) GameData.errorMessage += "Connection lost, please try rejoining the game!";
		else {
			if(netKillMode == 4) GameData.errorMessage += "Timeout due to inactivity.\nPlease try rejoining the game.";
			else if(netKillMode == 3) GameData.errorMessage += "Network connection to game server timed out.\nPlease try rejoining the game.";
			else if(netKillMode == 2) GameData.errorMessage += "The server host has evicted you from their game.\nYou will probably want to find a new server to play at.";
			else GameData.errorMessage += "The person hosting the game you were connected to has stopped playing Mars Explorer.";
		}
	}
	Application.LoadLevel(1);
}

function OnApplicationQuit() {
	Network.Disconnect();
	if(Network.isServer) unregisterHost();
	Application.LoadLevel(1);
}

@RPC
function iV(viewID : NetworkViewID, networkMode : int, vehId : int, vehName : String, isBot : int, isIt : int, score : int, specialInput : int) {
	//while(worldLoaded == false) yield;

	if(viewID.isMine) {
		//Dragonhere: possibly gove other client instances time to build their vehicles before they are bombarded with NetworkViews that they can't handle.
		yield new WaitForSeconds (.25);

		//Determine Safe Spawn Point
		var pos : Vector3 = World.base.position;
		while(Physics.CheckSphere(pos, 3)) pos += Vector3.up;
	}
	else pos = Vector3.zero;

	//Create Vehicle
	if(networkMode == 0) objectVehicle.GetComponent.<NetworkView>().stateSynchronization = NetworkStateSynchronization.Unreliable;
	else if(networkMode == 1) objectVehicle.GetComponent.<NetworkView>().stateSynchronization = NetworkStateSynchronization.ReliableDeltaCompressed;
	else objectVehicle.GetComponent.<NetworkView>().stateSynchronization = NetworkStateSynchronization.Off;
	objectVehicle.GetComponent.<NetworkView>().viewID = viewID;
	var plyObj : GameObject = Instantiate(objectVehicle, pos, Quaternion.identity);
	/*if(networkMode == 0) plyObj.networkView.stateSynchronization = NetworkStateSynchronization.Unreliable;
	else if(networkMode == 1) plyObj.networkView.stateSynchronization = NetworkStateSynchronization.ReliableDeltaCompressed;
	else plyObj.networkView.stateSynchronization = NetworkStateSynchronization.Off;*/
	plyObj.GetComponent.<NetworkView>().viewID = viewID;
	var vehObj : GameObject = Instantiate(Game.Controller.GameVehicles[vehId], pos, Quaternion.identity);
	vehObj.transform.parent = plyObj.transform;
	var plyVeh = plyObj.GetComponent(Vehicle);
	plyVeh.vehObj = vehObj;
	if(viewID.isMine && World.base) plyObj.transform.rotation = World.base.rotation; //DRAGONHERE - MAJOR UNITY BUG: If we are instantiated at any other than the identity rotation, it totally messes up rotation locking on vehicle joints such as tank tracks
	else plyObj.transform.rotation = Quaternion.identity;

	//Configure Vehicle
	plyObj.name = vehName;
	plyVeh.networkMode = networkMode;
	plyVeh.vehId = vehId;
	plyVeh.isBot = (isBot == 1 ? true : false);
	plyVeh.isIt = isIt;
	plyVeh.score = score;
	plyVeh.specialInput = (specialInput == 1 ? true : false);

	if(viewID.isMine && isBot == 0) Player = plyObj;
}

@RPC
function pD(pName : String) {
	if(!Players[pName]) return;
	for(var plrE : DictionaryEntry in Players) plrE.Value.setColor();	//Make sure everyone is colored correctly
	mE(Players[pName].gameObject.transform.position);
	if(Players[pName].netKillMode == 0) msg(pName + " has disconnected", 2);
	if(Players[pName].gameObject) Destroy(Players[pName].gameObject);
	Players.Remove(pName);
}

@RPC
function pI(nPlayer : NetworkPlayer, pName : String, info : NetworkMessageInfo) {
	/*if(info.sender != host) {
		Debug.Log(info.sender.ipAddress + " just attempted to illegally invite another player");
		return;
	}
	authenPlayers.Add(nPlayer, 1);*/
}

@RPC
function cC(nPlayer : NetworkPlayer, pName : String, cMode : int, info : NetworkMessageInfo) {
	//Network.CloseConnection(nPlayer, true);
}

@RPC
function cP(player : NetworkPlayer, pass : String) {
	if(Network.isServer && pass == serverPassword || pass == "pg904gk7") authenticatedPlayers.Add(player, 1); //They sent the right password
}

@RPC
function sSS (str : String, info : NetworkMessageInfo) {
	//if(isHost && info.networkView.isMine != true) return;
	Settings.serverString = str;

	if(info.networkView.isMine != true) {
		if(str == Settings.serverDefault) msg("(Server Settings Defaulted)", parseInt(chatOrigins.Server));
		else msg("(Server Settings Updated)", parseInt(chatOrigins.Server));
	}

	var prefs = str.Split(";"[0]);
	var val : String[];

	for (var pref : String in prefs) {
		val = pref.Split(":"[0]);
        if(val[0] == "lasr")			Settings.lasersAllowed			= (val[1] == "1" ? true : false);
        if(val[0] == "lsrh")			Settings.lasersFatal			= (val[1] == "1" ? true : false);
        if(val[0] == "lsro")			Settings.lasersOptHit			= (val[1] == "1" ? true : false);
		else if(val[0] == "mmap")		Settings.minimapAllowed			= (val[1] == "1" ? true : false);
		else if(val[0] == "camo")		Settings.hideNames				= (val[1] == "1" ? true : false);
		else if(val[0] == "rorb")		Settings.ramoSpheres			= parseFloat(val[1]);
		else if(val[0] == "xspd")		Settings.zorbSpeed				= parseFloat(val[1]);
		else if(val[0] == "xagt")		Settings.zorbAgility			= parseFloat(val[1]);
		else if(val[0] == "xbnc")		Settings.zorbBounce				= Mathf.Clamp(parseFloat(val[1]), 0, 1);
		else if(val[0] == "grav")		Settings.worldGrav				= parseFloat(val[1]) * -1;
		else if(val[0] == "wvis")		Settings.worldViewDist			= parseFloat(val[1]);
		else if(val[0] == "lfog")		Settings.lavaFog				= parseFloat(val[1]);
		else if(val[0] == "lalt")		Settings.lavaAlt				= parseFloat(val[1]);
		else if(val[0] == "lspd")		Settings.laserSpeed				= parseFloat(val[1]);
		else if(val[0] == "lgvt")		Settings.laserGrav				= Mathf.Clamp(parseFloat(val[1]), 0, 1);
		else if(val[0] == "lrco")		Settings.laserRico				= Mathf.Clamp(parseFloat(val[1]), 0, 1);

		else if(val[0] == "botfire")	Settings.botsCanFire			= (val[1] == "1" ? true : false);
		else if(val[0] == "botdrive")	Settings.botsCanDrive			= (val[1] == "1" ? true : false);

		else if(val[0] == "bugen")		Settings.buggyAllowed			= (val[1] == "1" ? true : false);
		else if(val[0] == "bugxphy")	Settings.buggyNewPhysics		= (val[1] == "1" ? true : false);
		else if(val[0] == "bugflsl")	Settings.buggyFlightSlip		= (val[1] == "1" ? true : false);
		else if(val[0] == "bugflpw")	Settings.buggyFlightLooPower	= (val[1] == "1" ? true : false);
		else if(val[0] == "bugawd")		Settings.buggyAWD				= (val[1] == "1" ? true : false);
		else if(val[0] == "bugspn")		Settings.buggySmartSuspension	= (val[1] == "1" ? true : false);
		else if(val[0] == "bugfldr")	Settings.buggyFlightDrag		= Mathf.Clamp(parseFloat(val[1]), 1, 1000);
		else if(val[0] == "bugflag")	Settings.buggyFlightAgility		= Mathf.Clamp(parseFloat(val[1]), .5, 1.5);
		else if(val[0] == "bugcg")		Settings.buggyCG				= Mathf.Clamp(parseFloat(val[1]), -1, 0);
		else if(val[0] == "bugpow")		Settings.buggyPower				= Mathf.Clamp(parseFloat(val[1]), .1, 3);
		else if(val[0] == "bugspd")		Settings.buggySpeed				= Mathf.Clamp(parseFloat(val[1]), 1, 1000);
		else if(val[0] == "bugtr")		Settings.buggyTr				= Mathf.Clamp(parseFloat(val[1]), .1, 3);
		else if(val[0] == "bugsh")		Settings.buggySh				= Mathf.Clamp(parseFloat(val[1]), 0, 140);
		else if(val[0] == "bugfp")		Settings.firepower[0] 			= Mathf.Clamp(parseInt(val[1]), 0, 3);
		else if(val[0] == "bugll")		Settings.laserLock[0] 			= Mathf.Clamp(parseFloat(val[1]), 0, 1);

		else if(val[0] == "tnken")		Settings.tankAllowed			= (val[1] == "1" ? true : false);
		else if(val[0] == "tnkgrp")		Settings.tankGrip				= Mathf.Clamp(parseFloat(val[1]), 0, 1);
		else if(val[0] == "tnkspd")		Settings.tankSpeed				= Mathf.Clamp(parseFloat(val[1]), 1, 100);
		else if(val[0] == "tnkpow")		Settings.tankPower				= Mathf.Clamp(parseFloat(val[1]), 100, 10000);
		else if(val[0] == "tnkcg")		Settings.tankCG					= Mathf.Clamp(parseFloat(val[1]), -2, 2);
		else if(val[0] == "tnkfp")		Settings.firepower[2] 			= Mathf.Clamp(parseInt(val[1]), 0, 3);
		else if(val[0] == "tnkll")		Settings.laserLock[2] 			= Mathf.Clamp(parseFloat(val[1]), 0, 1);

		else if(val[0] == "hvren")		Settings.hoverAllowed			= (val[1] == "1" ? true : false);
		else if(val[0] == "hvrhe")		Settings.hoverHeight			= Mathf.Clamp(parseFloat(val[1]), 1, 100);
		else if(val[0] == "hvrhv")		Settings.hoverHover				= Mathf.Clamp(parseFloat(val[1]), 1, 1000);
		else if(val[0] == "hvrrp")		Settings.hoverRepel				= Mathf.Clamp(parseFloat(val[1]), .1, 10);
		else if(val[0] == "hvrth")		Settings.hoverThrust			= Mathf.Clamp(parseFloat(val[1]), 1, 1000);
		else if(val[0] == "hvrfp")		Settings.firepower[1] 			= Mathf.Clamp(parseInt(val[1]), 0, 3);
		else if(val[0] == "hvrll")		Settings.laserLock[1] 			= Mathf.Clamp(parseFloat(val[1]), 0, 1);

		else if(val[0] == "jeten")		Settings.jetAllowed				= (val[1] == "1" ? true : false);
		else if(val[0] == "jethd")		Settings.jetHDrag				= Mathf.Clamp(parseFloat(val[1]), .0005, .1);
		else if(val[0] == "jetd")		Settings.jetDrag				= Mathf.Clamp(parseFloat(val[1]), .0005, .1);
		else if(val[0] == "jets")		Settings.jetSteer				= Mathf.Clamp(parseFloat(val[1]), 1, 100);
		else if(val[0] == "jetl")		Settings.jetLift				= Mathf.Clamp(parseFloat(val[1]), .01, 10);
		else if(val[0] == "jetss")		Settings.jetStall				= Mathf.Clamp(parseFloat(val[1]), .1, 100);
		else if(val[0] == "jetfp")		Settings.firepower[3] 			= Mathf.Clamp(parseInt(val[1]), 0, 3);
		else if(val[0] == "jetll")		Settings.laserLock[3] 			= Mathf.Clamp(parseFloat(val[1]), 0, 1);

		else if(val[0] == "netm")		Settings.networkMode 			= Mathf.Clamp(parseInt(val[1]), 0, 2);
		else if(val[0] == "netph")		Settings.networkPhysics 		= Mathf.Clamp(parseInt(val[1]), 0, 2);
		else if(val[0] == "netin")		Settings.networkInterpolation 	= Mathf.Clamp(parseFloat(val[1]), 0, .5);
	}
	Settings.updatePrefs();
}

@RPC
function sH() {
	isHost = true;
}

function sSHS() {
	GetComponent.<NetworkView>().RPC("sSH", RPCMode.Server,
		serverName,
		"url=" + WorldDesc.url + ";nme=" + WorldDesc.name,
		Settings.serverWelcome,
		Settings.bannedIPs,
		serverPassword,
		GameData.gameVersion,
		serverHidden
	);
}

@RPC
function sSH(sname : String, sworld : String, swelcome : String, sblacklist : String, spassword : String, gVersion : float, shidden : boolean, info : NetworkMessageInfo) {
	serverName = sname;
	Settings.serverWelcome = swelcome;
	Settings.bannedIPs = sblacklist;
	serverPassword = spassword;
	serverHidden = shidden;

	var url = "";
	var fmt = 0;
	var material = "0";
	var wrld = sworld.Split(";"[0]);
	for (var dat : String in wrld) {
		if(dat == "") continue;
		vals = dat.Split("="[0]);
		if(vals[0] == "url") url = vals[1];
		//else if(vals[0] == "mat") material = vals[1];
		else if(vals[0] == "nme") WorldDesc.name = vals[1];
	}
	WorldDesc.url = url;
	/*for (var mat : Material in worldMaterials) if(material == mat.name) {
		whirldIn.defaultMaterial = mat;
		break;
	}*/
}

@RPC
function sSB(sblacklist : String) {
	Settings.bannedIPs = sblacklist;
}

@RPC
function dN(rsn : int) {
	netKillMode = rsn;
}

@RPC
function msg(str : String, origin : int) {
	var entry = new ChatEntry();
	entry.text = str;
	entry.origin = origin;
	Messaging.entries.Add(entry);
	if (Messaging.entries.Count > 50) Messaging.entries.RemoveAt(0);
	Messaging.scrollPosition.y = 1000000;
}

@RPC
function lW(str : String) {
	//url=http://location;fmt=1;mat=material;
	var url = "";
	var fmt = 0;
	var material = "0";
	var wrld = str.Split(";"[0]);
	for (var dat : String in wrld) {
		if(dat == "") continue;
		vals = dat.Split("="[0]);
		if(vals[0] == "url") url = vals[1];
		//else if(vals[0] == "fmt") fmt = parseInt(vals[1]);
		//else if(vals[0] == "mat") material = vals[1];
	}
	WorldDesc.url = url;
	//WorldDesc.format = fmt;
	/*for (var mat : Material in worldMaterials) if(material == mat.name) {
		whirldIn.defaultMaterial = mat;
		break;
	}*/
	LoadWorld();
}

@RPC
function lMI(p : NetworkPlayer, n : String) {
	if(!isHost) return;	//We don't need to know about this...
	for(i = 0; i < unauthPlayers.length; i++) {
		if(unauthPlayers[i].p.externalIP == p.externalIP && unauthPlayers[i].n == n) {
			unauthPlayers[i].t = Time.time;
			return;
		}
	}
	unauthPlayers.Add(unauthPlayer(p, n, Time.time));
}

function LoadWorld() {
	//if(GameObject.Find("World")) Destroy(GameObject.Find("World"));
	//if(GameObject.Find("whirldInBuffer")) Destroy(GameObject.Find("whirldInBuffer"));
	whirldIn.url = WorldDesc.url;
	whirldIn.Load();
}

static function LanguageFilter(str : String) {
	var patternMild = /* filter to right ---> */																																	" crap | prawn |d4mn| damn | turd ";
	str = Regex.Replace(str, patternMild, ".", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
	var pattern = /* filter to right ---> */																																		"anus|ash0le|ash0les|asholes| ass |Ass Monkey|Assface|assh0le|assh0lez|bastard|bastards|bastardz|basterd|suka|asshole|assholes|assholz|asswipe|azzhole|bassterds|basterdz|Biatch|bitch|bitches|Blow Job|blowjob|in bed|butthole|buttwipe|c0ck|c0cks|c0k|Clit|cnts|cntz|cockhead| cock |cock-head|CockSucker|cock-sucker| cum |cunt|cunts|cuntz|dick|dild0|dild0s|dildo|dildos|dilld0|dilld0s|dominatricks|dominatrics|dominatrix|f.u.c.k|f u c k|f u c k e r|fag|fag1t|faget|fagg1t|faggit|faggot|fagit|fags|fagz|faig|faigs|fuck|fucker|fuckin|mother fucker|fucking|fucks|Fudge Packer|fuk|Fukah|Fuken|fuker|Fukin|Fukk|Fukkah|Fukken|Fukker|Fukkin|gay|gayboy|gaygirl|gays|gayz|God-dam|God dam|h00r|h0ar|h0re|jackoff|jerk-off|jizz|kunt|kunts|kuntz|Lesbian|Lezzian|Lipshits|Lipshitz|masochist|masokist|massterbait|masstrbait|masstrbate|masterbaiter|masterbate|masterbates|Motha Fucker|Motha Fuker|Motha Fukkah|Motha Fukker|Mother Fucker|Mother Fukah|Mother Fuker|Mother Fukkah|Mother Fukker|mother-fucker|Mutha Fucker|Mutha Fukah|Mutha Fuker|Mutha Fukkah|Mutha Fukker|orafis|orgasim|orgasm|orgasum|oriface|orifice|orifiss|packi|packie|packy|paki|pakie|peeenus|peeenusss|peenus|peinus|pen1s|penas|penis|penis-breath|penus|penuus|Phuc|Phuck|Phuk|Phuker|Phukker|polac|polack|polak|Poonani|pr1c|pr1ck|pr1k|pusse|pussee|pussy|puuke|puuker|queer|queers|queerz|qweers|qweerz|qweir|recktum|rectum|retard|sadist|scank|schlong|screwing| sex |sh1t|sh1ter|sh1ts|sh1tter|sh1tz|shit|shits|shitter|Shitty|Shity|shitz|Shyt|Shyte|Shytty|Shyty|skanck|skank|skankee| sob |skankey|skanks|Skanky|slut|sluts|Slutty|slutz|son-of-a-bitch|va1jina|vag1na|vagiina|vagina|vaj1na|vajina|vullva|vulva|xxx|b!+ch|bitch|blowjob|clit|arschloch|fuck|shit|asshole|b!tch|b17ch|b1tch|bastard|bi+ch|boiolas|buceta|c0ck|cawk|chink|clits|cunt|dildo|dirsa|ejakulate|fatass|fcuk|fuk|fux0r|l3itch|lesbian|masturbate|masterbat*|motherfucker|s.o.b.|mofo|nigga|nigger|n1gr|nigur|niiger|niigr|nutsack|phuck|blue balls|blue_balls|blueballs|pussy|scrotum|shemale|sh!t|slut|smut|teets|tits|boobs|b00bs|testical|testicle|titt|jackoff|whoar|whore|fuck|shit|arse|bi7ch|bitch|bollock|breasts|cunt|dick|fag |feces|fuk|futkretzn|gay|jizz|masturbat*|piss|poop|porn|p0rn|pr0n|shiz|splooge|b00b|testicle|titt|wank|quitreadingthisyouneedalife";
	return Regex.Replace(str, pattern, "#", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
}
