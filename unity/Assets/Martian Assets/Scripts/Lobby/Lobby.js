@System.NonSerialized
var port = 2500;

private var GuiAnimate : int = -1;
@System.NonSerialized
var GUIAlpha : float = 0;
@System.NonSerialized
var GUIHide : float = 0;
private var gameName = "marsxplr";
private var timeoutHostList = 0.00;
private var lastHostListRequest = -1000.0;
private var lastHostListRefresh = -1000.0;
private var hostListRefreshTimeout = 5.0;

//private var serverPings: Ping[];
private var natCapable : ConnectionTesterStatus = ConnectionTesterStatus.Undetermined;
private var NATHosts = false;
private var probingPublicIP = false;
private var doneTesting = false;
private var timer : float = 0.0;
private var filterNATHosts = false;
private var forceNAT = false;
private var hideTest = false;
private var masterServerMessage = "";
private var masterServerConFailures = 0;
private var testMessage = "";
private var netConIP : String[];
private var netConPort : int;
private var netConAttempts = 0;
private var useMasterServer : boolean = true;
private var disableMasterServer : boolean = false;
private var doNetworking = true;
@System.NonSerialized
var userName = "";
@System.NonSerialized
var userCode = "";
private var userIsRegistered = false;
private var remoteIP : String;
private var userNameTemp = "";
private var userPassword = "";
private var userRemembered = false;
private var userAuthenticating = "";
@System.NonSerialized
var windowRect : Rect;
@System.NonSerialized
var temp = "";
private var scrollPosition : Vector2;
private var outdated = "";
private var hostRegistered = false;
private var serverLevel = "";
private var showSettings = false;
private var autoHostListRefresh = true;
//@System.NonSerialized
var useAlternateServer = false;
@System.NonSerialized
var messages : String[];
private var listServerIP : String = "";
private var listServerPort : int;
private var backupServerIP : String;
private var backupServerPort : int = 23456;
private var buttonHeight : float;
private var buttonHeightTarget : float;
private var mouseInServerList : boolean;
private var serverDetails : String = "";
private var serverDetailsBoxAlpha : float;
var Skin : GUISkin;
var serverDetailsBox : GUIStyle;
var lobbyDecor : LobbyDecor;
var contentWidth : int = 0;

private var hostDedicated : boolean = false;
private var dedicatedIP : String[];
private var dedicatedPort : int;
private var dedicatedNAT : boolean;
private var dedicatedHostAttempts : int;

private var showAds : boolean = false;
var gameAds : adDesc[];
class adDesc extends System.Object {
    var url : String = "";
    var title : String = "";
    var desc : String = "";

	function adDesc(u : String, t : String, d : String) {
        this.url = u;
        this.title = t;
        this.desc = d;
    }
}

function Awake () {
	QualitySettings.currentLevel = QualityLevel.Fantastic; //Autoalias Starfield
	Screen.lockCursor = false;
	Application.runInBackground = false;
	//ServerPings = new Ping[0];
}

function Start () {
	//serverName		= PlayerPrefs.GetString("serverName","");
	userPassword	= PlayerPrefs.GetString("userPassword","");
	userCode		= PlayerPrefs.GetString("userCode","");
	userRemembered	= (PlayerPrefs.GetInt("userRemembered", 0) == 1 ? true : false);
	userIsRegistered	= (PlayerPrefs.GetInt("userRegistered", 0) == 1 ? true : false);
	GameData.masterBlacklist = "";
	
	if(GameData.userName != "") {	//They just left a server
		userName 		= GameData.userName;
		if(userRemembered) userNameTemp	= userName;
	}
	else if(userPassword != "") { 	//They are trying to play authenticated - don't let them in without validating their password
		userNameTemp = PlayerPrefs.GetString("userName","");
		authenticateUser(); //Attempt Auto Login
	}
	else { 							//They are a guest, just let them use whatever username they have.
		userNameTemp	= PlayerPrefs.GetString("userName","");
		userName		= userNameTemp + (userNameTemp != "" ? "–" : "");
	}
	
	var msgs = new Array();
	var wlds = new Array();
	var www : WWW = new WWW ("http://dat.marsxplr.com/upd3");
	yield www;
	if(!www.error) {
		var data = www.data.Split("\n"[0]);
		//var val : String[];
		for (var dat : String in data) {
			if(dat == "") continue;
			
			//val = dat.Split("="[0], 2);
			
			var pos : int = dat.IndexOf("="[0]);
			if(!pos || pos == -1) continue;
			var tmp = new Array(dat.Substring(0, pos), dat.Substring(pos + 1));
			var val : String[] = tmp.ToBuiltin(String);
			
			if(val[0] == "v" && float.Parse(val[1], System.Globalization.CultureInfo.InvariantCulture.NumberFormat) > parseFloat(GameData.gameVersion)) outdated = val[1];
			else if(val[0] == "d") hostDedicated = (val[1] == "1" || val[1] == "true");
			else if(val[0] == "a") showAds = (val[1] == "1" || val[1] == "true");
			else if(val[0] == "m") msgs.Add(val[1]);
			else if(val[0] == "w") {
				var nme = "";
				var url = "";
				var featured = false;
				var wrld = val[1].Split(";"[0]);
				for (var str : String in wrld) {
					if(str == "") continue;
					if(str == "featured") {
						featured = true;
						continue;
					}
					vals = str.Split(":"[0]);
					if(vals[0] == "nme") nme = vals[1];
					else if(vals[0] == "url") url = str.Substring(4);
				}
				wlds.Add(new GameWorldDesc(nme, url, featured));
			}
			else if((val[0] == "s" && !useAlternateServer) || (val[0] == "s2" && useAlternateServer)) {
				var ipStr : String[] = val[1].Split(":"[0]);
				listServerIP = ipStr[0];
				listServerPort = parseInt(ipStr[1]);
				MasterServer.ipAddress = listServerIP;
				MasterServer.port = listServerPort;
			}
			else if((val[0] == "f" && !useAlternateServer) || (val[0] == "f2" && useAlternateServer)) {
				ipStr = val[1].Split(":"[0]);
				Network.natFacilitatorIP = ipStr[0];
				Network.natFacilitatorPort = parseInt(ipStr[1]);
			}
			else if((val[0] == "t" && !useAlternateServer) || (val[0] == "t2" && useAlternateServer)) {
				ipStr = val[1].Split(":"[0]);
				Network.connectionTesterIP = ipStr[0];
				Network.connectionTesterPort = parseInt(ipStr[1]);
			}
			else if(val[0] == "b") {
				GameData.masterBlacklist += (GameData.masterBlacklist != "" ? "\n" : "") + val[1];
			}
			else if(val[0] == "n") {
				GameData.networkMode = parseInt(val[1]);
			}
			else if(val[0] == "adbr") {
				var adBrightUrl : String = val[1];
			}
			else if(val[0] == "adsn") {
				var adSenseUrl : String = val[1];
			}
		}
	}
	else {
		GameData.errorMessage = "Alert: Update server is unreachable.\nIf this computer is online, the update server may be down.\n\nYou need to be connected to the internet to play Mars Explorer.\n\nPlease check MarsXPLR.com for news & updates!";
	}
	
	GameData.gameWorlds = wlds.ToBuiltin(GameWorldDesc);
	messages = msgs.ToBuiltin(String);
	
	MasterServer.RequestHostList(gameName);
	
	if(showAds) {
		var ads : Array = new Array();

		//Adbrite
		www = new WWW(adBrightUrl);
		yield www;
		if(!www.error) {
			var matches : System.Text.RegularExpressions.MatchCollection = System.Text.RegularExpressions.Regex.Matches(www.data.Replace("\\\"", "\""), "<a[^>]*?class=\\\"adHeadline\\\"[^>]*?href=\\\"(.*?)\\\"[^>]*?>(.*?)</a>[^.]*?<a[^>]*?class=\\\"adText\\\"[^>]*?>(.*?)</a>");
			for(var match : System.Text.RegularExpressions.Match in matches) {
				var ad : adDesc = new adDesc(match.Groups[1].ToString(), htmlDecode(match.Groups[2].ToString()), htmlDecode(match.Groups[3].ToString()));
				if(Random.value > .5) ads.Add(ad);
				else ads.Unshift(ad);
			}
		}
		
		//Adsense
		www = new WWW(adSenseUrl);
		yield www;
		if(!www.error) {
			matches = System.Text.RegularExpressions.Regex.Matches(www.data.Replace("\\\"", "\""), "<a[^>]*?class=adt[^>]*?href=\\\"(.*?)\\\"[^>]*?>(.*?)</a>[^.]*?<div[^>]*?class=adb[^>]*?>(.*?)</div>");
			for(var match : System.Text.RegularExpressions.Match in matches) {
				ad = new adDesc("http://googleads.g.doubleclick.net" + match.Groups[1].ToString(), htmlDecode(match.Groups[2].ToString()), htmlDecode(match.Groups[3].ToString()));
				if(ad.url.IndexOf("&nh=1") == -1) ad.url += "&nh=1";
				ads.Unshift(ad);
			}
		}
		
		//Tally
		if(ads.length > 0) {
			gameAds = ads.ToBuiltin(adDesc);
		}
	}
}

function OnFailedToConnectToMasterServer(info: NetworkConnectionError) {
	if(info == NetworkConnectionError.CreateSocketOrThreadFailure && masterServerMessage != "") return;
	//GameData.errorMessage = "\nCould not connect to master list server.\n\n\n" + info;
	//testMessage += " Master server connection failure.";
	MasterServer.ClearHostList();
	masterServerMessage = " Master server connection failure: " + info;
	masterServerConFailures += 1;
}

function OnFailedToConnect(info: NetworkConnectionError) {
	if(Network.isClient) return; //We already connected to a different server
	
	GameData.errorMessage = "Game could not be connected to.\nPlease try joining a different game!\n\n\n" + (info == NetworkConnectionError.ConnectionFailed ? "You may be blocked by a network firewall.\n(See \"How Do I configure My Router\" on the FAQ @ MarsXPLR.com)\n" : (info == NetworkConnectionError.NATTargetNotConnected ? "\nThe person hosting the game you were connecting to\nmay have stopped playing Mars Explorer." : info ));
	
	if(netConAttempts < 2) {
		Network.Connect(netConIP, netConPort);
		netConAttempts += 1;
		GameData.errorMessage += "\n\n...Reattempting Connection - Attempt # " + netConAttempts + "...";
	}
	else {
		GameData.errorMessage += "\n\nReconnection Attempt Failed.";
	}
}

function OnConnectedToServer() {
	GameData.errorMessage = "";
	Network.isMessageQueueRunning = false;	//We don't want to recieve LoadLevel commands before we are ready... This will be enabled as soon as we get to the "Game" level
	GameData.userName = userName;
	GameData.userCode = userCode;
	LoadGame();
}

function OnGUI () {
	GUI.skin = Skin;
	GUI.color.a = GUIAlpha;
	
	if(QualitySettings.currentLevel < 3) QualitySettings.currentLevel = 3; //Server List GUI looks terrible at 1/4 res :)
	
	if(Time.time > 4.25) {
		//Fade GUI Out
		if(GuiAnimate == 1) {
			if(GUIAlpha <= 0) {
				GUIAlpha = 0;
				GuiAnimate = 0;
			}
			else GUIAlpha = GUIAlpha - Time.deltaTime * .35;
			if(GUIHide > 1) {
				GUIHide = 1;
			}
			else GUIHide += Time.deltaTime * .5;
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
			else GUIAlpha += Time.deltaTime * .2;
		}
		
		var width = Screen.height * 1.2;	// * .84
		if(width > 800) width -= (width - 800) * .5;
		if(width > 1200) width = 1200;
		if(width > Screen.width - 30) width = Screen.width - 30;
		if(width < 600) width = 600;
		contentWidth = width;
		
		if(GameData.errorMessage != "") {
			GUILayout.Window(1, Rect(Screen.width * 0.5 - width / 2 + 50, lobbyDecor.logoOffset - 20, width - 100, 300), errorWindow, "", "windowAlert"); //Notice
			GUI.BringWindowToFront(1);
		}
		//else
		if(outdated == "") {
			GUILayout.Window(0, 
				Rect(
					Screen.width * 0.5 - width / 2 - 50,
					lobbyDecor.logoOffset - 70,
					width + 100,
					(doNetworking && userName != "" ? Screen.height - lobbyDecor.logoOffset + 10 : 320) + 100),
				MakeWindow,
				/*(userName == "" ? "Pick a Name" : (Network.isServer ? "Start a Server" : "Join a Game")) +*/ "",
				"windowChromeless");
		}
		else GUILayout.Window(0, Rect(Screen.width * 0.5 - width / 2,lobbyDecor.logoOffset - 20, width, 150), makeWindowUpdate, /* "New Version Available! */ "", "windowChromeless");
		GUI.FocusWindow(0);
		
		if(serverDetails != "" && GuiAnimate != 1 && GUIAlpha != 0 && GameData.errorMessage == "") {
			if(serverDetailsBoxAlpha < .99) serverDetailsBoxAlpha += Time.deltaTime * .5;
			else serverDetailsBoxAlpha = 1;
		}
		else {
			if(serverDetailsBoxAlpha > .01) serverDetailsBoxAlpha -= Time.deltaTime * .5;
			else serverDetailsBoxAlpha = 0;
		}
		if(serverDetailsBoxAlpha > .01) {
			GUI.color.a = serverDetailsBoxAlpha;
			var serverDetailsBoxStyle = GUI.skin.GetStyle("serverDetailsBox");
			GUILayout.Window(2, Rect(Input.mousePosition.x - serverDetailsBoxStyle.fixedWidth - 1, Screen.height - Input.mousePosition.y - serverDetailsBoxStyle.fixedHeight - 4, serverDetailsBoxStyle.fixedWidth, serverDetailsBoxStyle.fixedHeight), serverDetailsWindow, "", "serverDetailsBox");
			GUI.BringWindowToFront(2);
		}
	}
}

function serverDetailsWindow() {
	GUI.contentColor = GUI.skin.GetStyle("serverDetailsBox").normal.textColor;
	GUILayout.Label(serverDetails);
}

function TestConnection(force : boolean) {
	disableMasterServer = false;
	probingPublicIP = false;
	if(!timer) timer = Time.time + 15;
	testMessage = "testing";
	doneTesting = false;
	doNetworking = false;
	
	natCapable = Network.TestConnection(force);
	while (natCapable == ConnectionTesterStatus.Undetermined) {
		natCapable = Network.TestConnection();
		yield new WaitForSeconds (.5);
	}
	
	switch (natCapable) {
		case ConnectionTesterStatus.Error: 
			GameData.errorMessage = "Your computer does not appear to be online...\nNetworking was defaulted to Local Area Network mode.\n\n(You can play with friends over a LAN, but not with people all around the world over the internet)";
			testMessage = "Computer is Offline.";
			doneTesting = true;
			doNetworking = true;
			useMasterServer = false;
			break;
			
		case ConnectionTesterStatus.PrivateIPNoNATPunchthrough: 
			GameData.errorMessage = "You appear to have a private IP and no NAT punchthrough capability...\n\nHit \"Dismiss\" click \"Show Settings\", then click \"Retest Internet Connection\".\nIf you get this message again, read \"How Do I configure My Router\" on the FAQ @ MarsXPLR.com";
			testMessage = "Private IP with no NAT punchthrough - Local network, non internet games only.";
			//filterNATHosts = true;
			Network.useNat = true;
			doneTesting = true;
			doNetworking = true;
			useMasterServer = false;
			break;
			
		case ConnectionTesterStatus.PrivateIPHasNATPunchThrough:
			if (probingPublicIP)
				testMessage = "Non-connectable public IP address (port "+ port +" blocked), NAT punchthrough can circumvent the firewall.";
			else
				testMessage = "NAT punchthrough enabled.";
			// NAT functionality is enabled in case a server is started,
			// clients should enable this based on if the host requires it
			Network.useNat = true;
			doneTesting = true;
			doNetworking = true;
			useMasterServer = true;
			break;
			
		case ConnectionTesterStatus.PublicIPIsConnectable:
			testMessage = "Directly connectable public IP address.";
			Network.useNat = false;
			doneTesting = true;
			doNetworking = true;
			useMasterServer = true;
			break;
			
		// This case is a bit special as we now need to check if we can 
		// cicrumvent the blocking by using NAT punchthrough
		case ConnectionTesterStatus.PublicIPPortBlocked:
			testMessage = "Non-connectible public IP address with NAT punchthrough disabled, running a server is impossible.\n\n(Please setup port forwarding for port # " + port + " in your router)";
			Network.useNat = false;
			// If no NAT punchthrough test has been performed on this public IP, force a test
			if (!probingPublicIP) {
				Debug.Log("Testing if firewall can be circumvented");
				natCapable = Network.TestConnectionNAT();
				probingPublicIP = true;
				timer = Time.time + 10;
			}
			// NAT punchthrough test was performed but we still get blocked
			else if (Time.time > timer) {
				probingPublicIP = false; 		// reset
				Network.useNat = true;
				doneTesting = true;
				doNetworking = true;
				useMasterServer = false;
			}
			break;
		case ConnectionTesterStatus.PublicIPNoServerStarted:
			testMessage = "Public IP address but server not initialized, it must be started to check server accessibility. Restart connection test when ready.";
			doNetworking = true;
			doneTesting = true;
			useMasterServer = true;
			break;
		default: 
			testMessage = "Error in test routine, got " + natCapable;
			doNetworking = false;
	}
}

function MakeWindow (id : int) {
	//Test User's Network
	if(!doNetworking) {
		GUILayout.FlexibleSpace();
		if(testMessage == "testing") {
			if(Time.time > timer) {
				GUILayout.Label("Network status could not be determined.");
			}
			else {
				GUILayout.Label("Determining your network's configuration... " + (timer - Time.time));
			}
			GUILayout.Space(10);
		}
		else GUILayout.Label("Unfortunatley, your computer's network settings will not allow Mars Explorer to network. Specific error was: " + testMessage);
		GUILayout.BeginHorizontal();
		GUILayout.FlexibleSpace();
		GUILayout.BeginVertical(GUILayout.Width(300));
		if(GUILayout.Button("Restart Connection Test")) {
			timer = 0;
			TestConnection(true);
		}	
		if(GUILayout.Button("Force Enable Networking (May Not Work)")) {
			Network.useNat = true;
			doneTesting = true;
			doNetworking = true;
			useMasterServer = true;
			testMessage = "Network testing failed, networking force enabled";
		}
		GUILayout.EndVertical();
		GUILayout.FlexibleSpace();
		GUILayout.EndHorizontal();
		GUILayout.FlexibleSpace();
	}
	
	//Get user's name
	else if(userName == "") {
		GUILayout.Space(50);
		GUILayout.Label("Welcome, Space Cadet!\nPlease enter a pseudonym for others to know you by:");
		
		GUILayout.Space(10);
		
		GUILayout.BeginHorizontal();
		GUILayout.Space(contentWidth / 3.5);
		GUILayout.BeginScrollView(Vector2.zero);
		
		GUILayout.BeginHorizontal();
		GUILayout.Label("Your Name:", GUILayout.Width(100));
		GUI.SetNextControlName("Name");
		userNameTemp = Regex.Replace(GUILayout.TextField(userNameTemp, 25), "[^A-Za-z0-9-_.&<>]", "");
		GUILayout.EndHorizontal();
		
		if(userIsRegistered) {
			GUILayout.BeginHorizontal();
			GUILayout.Label("Your Password:", GUILayout.Width(100));
			userPassword = GUILayout.PasswordField(userPassword, "*"[0]);
			GUILayout.EndHorizontal();
		}
		
		GUILayout.BeginHorizontal();
		GUILayout.Label("", GUILayout.Width(100));
		userIsRegistered = GUILayout.Toggle(userIsRegistered, "I am registered");
		GUILayout.EndHorizontal();
				
		GUILayout.BeginHorizontal();
		GUILayout.Label("", GUILayout.Width(100));
		userRemembered = GUILayout.Toggle(userRemembered, "Remember Me");
		GUILayout.EndHorizontal();
				
		GUILayout.EndScrollView();
		GUILayout.Space(contentWidth / 3.5);
		GUILayout.EndHorizontal();
		
		GUILayout.Space(10);
		
		GUILayout.BeginHorizontal();
		GUILayout.Space(contentWidth / 4);
		if(userNameTemp != "") {
			//Registered User
			if(userIsRegistered) {
				if(userPassword != "") {
					buttonHeightTarget = 40;
					if(GUILayout.Button((userAuthenticating != "" ? (userAuthenticating == "true" ? "...Authenticating..." : "Authentication Failed: " + userAuthenticating + "\n>> Retry <<") : ">> Authenticate and Explore Mars! <<"),GUILayout.Height(buttonHeight)) || Input.GetKeyDown("return") || Input.GetKeyDown("enter")) authenticateUser();
				}
				else {
					buttonHeightTarget = 0;
					if(buttonHeight > 4) GUILayout.Button((userAuthenticating != "" ? (userAuthenticating == "true" ? "...Authenticating..." : "Authentication Failed: " + userAuthenticating + "\n>> Retry <<") : ">> Authenticate and Explore Mars! <<"),GUILayout.Height(buttonHeight));
				}
			}
			
			//Guest User
			else {
				buttonHeightTarget = 40;
				if(GUILayout.Button(">> I Am Ready to Explore Mars! <<",GUILayout.Height(buttonHeight)) || Input.GetKeyDown("return") || Input.GetKeyDown("enter")) {
					userName = Game.LanguageFilter(userNameTemp);
					if(userName.IndexOf("ADMIN") != -1 || userName.IndexOf("admin") != -1 || userName.IndexOf("Admin") != -1 || userName.IndexOf("aubrey") != -1 || userName.IndexOf("Aubrey") != -1 || userName.IndexOf("AUBREY") != -1 || userName.IndexOf("abrey") != -1 || userName.IndexOf("Abrey") != -1 || userName.IndexOf("aubry") != -1 || userName.IndexOf("Aubry") != -1 || userName.IndexOf("aubery") != -1 || userName.IndexOf("Aubery") != -1) userName += " 2";
					if(userCode == "{Code}") userCode = "";
					if(userRemembered) {
						PlayerPrefs.SetString("userName",userName);
						PlayerPrefs.SetString("userPassword","");
						PlayerPrefs.SetInt("userRemembered",1);
					}
					else {
						PlayerPrefs.SetString("userName","");
						PlayerPrefs.SetString("userPassword","");
						PlayerPrefs.SetInt("userRemembered",0);
						userNameTemp = "";
						userPassword = "";
					}
					PlayerPrefs.SetInt("userRegistered", 0);
					
					userName += "–";
					
					lastHostListRefresh = -1;
					lastHostListRequest = Time.time;
				}
			}
		}
		else {
			buttonHeightTarget = 0;
			if(buttonHeight > 4) GUILayout.Button((userIsRegistered ? (userAuthenticating != "" ? (userAuthenticating == "true" ? "...Authenticating..." : "Authentication Failed: " + userAuthenticating + "\n>> Retry <<") : ">> Authenticate and Explore Mars! <<") : ">> I Am Ready to Explore Mars! <<"), GUILayout.Height(buttonHeight));
		}
		GUILayout.Space(contentWidth / 4);
		GUILayout.EndHorizontal();
		
		GUILayout.Space(10);
		
		if(userIsRegistered == true) {
			if(userPassword == "") GUILayout.Label("(Make sure the credentials you enter match your MarsXPLR.com login)");
		}
		else {
			//GUILayout.Label("Don't have a MarsXPLR.com account?");
			GUILayout.BeginHorizontal();
			GUILayout.Space(contentWidth / 3);
			if(GUILayout.Button("Want to own your name?\n>> Register an account! <<")) Application.OpenURL("http://MarsXPLR.com/user/register");
			GUILayout.Space(contentWidth / 3);
			GUILayout.EndHorizontal();
		}
		
		GUILayout.FlexibleSpace();
		
		if(GUIUtility.keyboardControl == 0) GUI.FocusControl("Name");
		
		//Hide Button
		if(buttonHeightTarget == 0) {
			buttonHeight -= buttonHeight * Time.deltaTime * 6;
		}
		//Show Button
		else {
			buttonHeight += (buttonHeightTarget - buttonHeight) * Time.deltaTime * 6;
		}
	}
	
	//Show Server List
	else {
		GUILayout.Space(5);
		GUILayout.BeginHorizontal();
		
		if (GUILayout.Button ("<< Change Name: " + userName,GUILayout.Width(238), GUILayout.Height(30))) {
			userName = "";
		}
		
		GUILayout.FlexibleSpace();
		
		// Start a new server
		
		if (Network.peerType == NetworkPeerType.Disconnected) {
			if (GUILayout.Button ("Host Game >>",GUILayout.Width(238), GUILayout.Height(30))) {
				Network.Disconnect();
				//Network.InitializeSecurity();
				if(hostDedicated && dedicatedIP.length > 0) {
					Network.useNat = (dedicatedNAT || forceNAT);
					temp = Network.Connect(dedicatedIP, dedicatedPort) + "";
					netConIP = dedicatedIP;
					netConPort = dedicatedPort;
					netConAttempts = 1;
					dedicatedHostAttempts = 1;
					if(temp != "NoError") GameData.errorMessage = "Dedicated server initialization failed: " + temp + "\n\nTo resolve this issue, please uncheck the\n\"Utilize dedicated servers for hosting games\"\n option in the Settings below.";
					else GameData.errorMessage = "...Initializing connection to dedicated server...\n(" + netConIP[0] + ":" + netConPort + (Network.useNat ? " NAT" : "") + ")\n\n\n\nIf this fails, please uncheck the\n\"Utilize dedicated servers for hosting games\"\n option in the Settings below.";
				}
				else {
					Network.useNat = !Network.HavePublicAddress();
					port = 2500;
					while(true) {
						info = Network.InitializeServer(9, port);
						if(port < 2600 && info != NetworkConnectionError.NoError) {
							port++;
						}
						else {
							break;
						}
					}
					if(info != NetworkConnectionError.NoError) GameData.errorMessage = "\nCould not start server: " + info;
					else {
						GameData.userName = userName;
						LoadGame();
					}
				}
			}
		}
		else {
			GUILayout.Button("Hosting Game...",GUILayout.Width(238), GUILayout.Height(30));
		}
		
		GUILayout.EndHorizontal();
		GUILayout.Space(5);
		
		scrollPosition = GUILayout.BeginScrollView(scrollPosition);
		
		var hostInfo = "";
		if(Event.current.type != EventType.Layout) serverDetails = "";
		if(useMasterServer && !disableMasterServer) {
		
		var activePlayers : int;
		var activePlayersVisible : int;
		var availableServers : int;
		dedicatedIP = new Array(); //.Clear();
		
		var data : HostData[] = MasterServer.PollHostList();
		
		//Precull Data
		if(data.length > 0) {
			var dataCulled : Array = new Array();
			for (var element : HostData in data) {
				activePlayers += element.connectedPlayers;
				
				if(filterNATHosts && element.useNat) continue;
				
				var serverData = element.comment.Split(";"[0]);
				var vals : String[];
				var gameVersion = 0.0;
				var serverVersion = 0.0;
				for (var dat : String in serverData) {
					if(dat == "") continue;
					vals = dat.Split("="[0]);
					if(vals[0] == "v") gameVersion = parseFloat(vals[1]);
					if(vals[0] == "d") serverVersion = parseFloat(vals[1]);
				}
				
				if(serverVersion == GameData.serverVersion && element.connectedPlayers == 0) {
					availableServers += 1;
					dedicatedIP = element.ip;
					dedicatedPort = element.port;
					dedicatedNAT = element.useNat;
					continue;
				}
				else if(GameData.gameVersion != gameVersion) continue;
				
				//Display this Game
				dataCulled.Add(element);
			}
			data = dataCulled.ToBuiltin(HostData);
		}
		
		//Display Data
		if(data.length > 0) {
		System.Array.Sort(data, sortHostArray);
		
		/*
		if(serverPings == null) {
			ServerPings = new Ping[data.length];
			i=0;
			for (var element in data) {
				for (var host in element.ip) hostInfo = host;
				ServerPings[i] = Ping(hostInfo); //element.ip
				i++;
			}
		}
		*/
		i=0;
		var adCounter : float = 0.000;
		var adTicker : int = 0;
		for (var element in data) {
			
			//Ads
			if(showAds) {
				adCounter += (parseFloat(gameAds.length) / data.length);
				if(adTicker < adCounter && adTicker < gameAds.length) {
					if(GUILayout.Button(gameAds[adTicker].title + "   ~   " + gameAds[adTicker].desc, "lobbyAd")) {
						OpenURL(gameAds[adTicker].url);
					}
					if(Event.current.type != EventType.Layout && mouseInServerList && GUILayoutUtility.GetLastRect().Contains(Event.current.mousePosition)) {
						serverDetails = "This advertisement helps bring Mars Explorer to you for free!\n\nIf you are interested in one of our sponsor's offers,\nplease be sure to check it out.";
					}
					adTicker++;
				}
			}
			
			masterServerConFailures = 0;
			masterServerMessage = "";
			hostInfo = "";
			serverData = element.comment.Split(";"[0]);
			gameVersion = 0.0;
			serverVersion = 0.0;
			var serverWorld : String;
			var serverPlayers : String;
			var serverWorldURL : String;
			var bannedIPs : String = "";
			var	serverLag : String = "";
			var	isLocked : boolean;
			for (var dat : String in serverData) {
				if(dat == "") continue;
				vals = dat.Split("="[0]);
				if(vals[0] == "v") gameVersion = parseFloat(vals[1]);
				if(vals[0] == "d") serverVersion = parseFloat(vals[1]);
				else if(vals[0] == "w") serverWorld = vals[1];
				else if(vals[0] == "p") serverPlayers = vals[1];
				else if(vals[0] == "u") serverWorldURL = vals[1];
				else if(vals[0] == "b") bannedIPs = vals[1];
				else if(vals[0] == "s") serverLag = vals[1];
				else if(vals[0] == "l") isLocked = true;
			}
			
			activePlayersVisible += element.connectedPlayers;
			
			GUILayout.BeginHorizontal();
			GUILayout.Label(element.connectedPlayers.ToString(), GUILayout.Width(40));
			GUILayout.Label(element.gameName);
			//for (var host in element.ip) hostInfo += " " + host;
			//GUILayout.Label(hostInfo,GUILayout.Width(110));
			GUILayout.Label(serverWorld/*, GUILayout.Width(180)*/);
			if(serverVersion != 0.0) GUILayout.Label("»", GUILayout.Width(15));
			else GUILayout.Label(" ", GUILayout.Width(15));
			//GUILayout.Label(/*(ServerPings[i].isDone || true ? (ServerPings[i].time).ToString() + "" + ServerPings[i].ip : "...") + */(element.useNat ? "" : " *"),GUILayout.Width(10)); 
			/*if(Application.CanStreamedLevelBeLoaded(element.comment) == false || Application.GetStreamProgressForLevel(element.comment) < 1) {
				GUILayout.Label("Preloading (" + (Application.GetStreamProgressForLevel(element.comment) * 100) + "%)",GUILayout.Width(150));
			}
			else */if(element.connectedPlayers == element.playerLimit) {
				GUILayout.Label("Game Full", GUILayout.Width(150));
			}
			else {
				//Are We Banned?
				var weAreBanned = false;
				if(bannedIPs != "") {
					var banned = bannedIPs.Split(","[0]);
					for (var dat : String in banned) {
						if(dat == Network.player.ipAddress) {
							weAreBanned = true;
							break;
						}
					}
				}
				if (GUILayout.Button((weAreBanned ? "(You Are Banned)" : (isLocked ? "(Password Protected)" : "Join Game")), GUILayout.Width(170))) {
					Network.useNat = (element.useNat || forceNAT);
					temp = Network.Connect(element.ip, element.port) + "";
					netConIP = element.ip;
					netConPort = element.port;
					netConAttempts = 1;
					if(temp != "NoError") GameData.errorMessage = "Cound not join game: " + temp + "";
					else GameData.errorMessage = "...Connecting to Game...\n(" + element.ip[0] + ":" + element.port + ((element.useNat || forceNAT) ? " NAT" : "") + ")\n\n\n\nPlay safe! Don't share personal information online,\nand don't trust anyone who asks you for it.";
				}
			}
			GUILayout.EndHorizontal();
			if(Event.current.type != EventType.Layout && mouseInServerList && GUILayoutUtility.GetLastRect().Contains(Event.current.mousePosition)) {
				serverDetails = (element.connectedPlayers > 0 ? element.connectedPlayers.ToString() : "") + (serverPlayers ? " Players: " + serverPlayers.Replace(",", ", ") : "") + (serverLag != "" ? "\nAvg Ping: " + serverLag + " ms" : "") + "\n" + element.ip[0] + ":" + element.port + (element.useNat ? " NAT" : "") + (serverVersion != 0.0 ? " (» Dedicated Host Server)" : ""); //+ element.comment;// /*+ "\n" + hostInfo/* + " " + serverWorldURL*/;
			}
			i++;
			
			//"Advertise Here" Ad
			if(showAds && i == data.length) {
				if(GUILayout.Button("» Advertise on Mars Explorer! «", "lobbyAd")) {
					OpenURL("http://www.adbrite.com/mb/commerce/purchase_form.php?opid=1509409&&nr=1");
				}
				if(Event.current.type != EventType.Layout && mouseInServerList && GUILayoutUtility.GetLastRect().Contains(Event.current.mousePosition)) {
					serverDetails = "That's right - you can bid directly to advertise inside Mars Explorer!\n\nPresent YOUR message to an audience\nof friendly Martians everywhere.";
				}
			}
		}
		}
		if(activePlayersVisible == 0) {
			if(Time.time < lastHostListRefresh + hostListRefreshTimeout) GUILayout.Label("\n\n\nLoading Server List...\n" + (hostListRefreshTimeout + lastHostListRefresh - Time.time));
			else {
				GUILayout.Label("\n\n\nNo active games could be found.\nPress \"Host Game >>\" above to start your own!\n");
				GUILayout.Label((userCode != "" ? "You are viewing only games with the secret code \"" + userCode + "\".\n(Press \"<< Change Name\" above to edit this code)" : "You are running Mars Explorer version " + GameData.gameVersion + ",\nand will only see games hosted by others using this version."));
				GUILayout.Label((autoHostListRefresh ? "\n(This list refreshes automatically)" : "\n(Press the \"Refresh List\" button in the Networking Settings panel to check for new games)"));
			}
		}
		
		if(useAlternateServer == true) GUILayout.Label("\n(You are using the backup list server, and will only see games of others doing the same)");
		if(filterNATHosts) GUILayout.Label("\n(All games requiring Network Address Translation have been hidden)");
		
		}
		else {
			GUILayout.Label("\n\n" + (disableMasterServer ? "Your computer" : "Even if your computer") + " isn't connected to the internet - don't worry!\nYou can still play Mars Explorer on your own, or with friends on your local network.\n\nIf a friend is already hosting a game, enter their IP address here:\n");
			if(!remoteIP) getRemoteIP();
			GUILayout.BeginHorizontal();
			GUILayout.FlexibleSpace();
			GUILayout.BeginVertical(GUILayout.Width(300));
			GUILayout.BeginHorizontal();
			remoteIP = GUILayout.TextField(remoteIP);
			GUILayout.Space(5);
			port = parseInt(GUILayout.TextField(port + "", GUILayout.Width(60)));
			GUILayout.EndHorizontal();
			GUILayout.Space(5);
			if (GUILayout.Button("Connect to Game Server")) {
				GameData.errorMessage = "...Connecting to Game...\n(" + remoteIP + ":" + port + (Network.useNat ? " NAT" : "") + ")\n\n\n\nPlay safe! Don't share personal information online,\nand don't trust anyone who asks you for it.";
				Network.Connect(remoteIP, port);
				var remIP : Array = new Array();
				remIP.Add(remoteIP);
				netConIP = remIP.ToBuiltin(String);
				netConPort = port;
				netConAttempts = 1;
				PlayerPrefs.SetString("remoteIP",remoteIP);
			}
			GUILayout.Space(5);
			Network.useNat = GUILayout.Toggle(Network.useNat," Enable NAT (generally unneeded)");
			GUILayout.EndVertical();
			GUILayout.FlexibleSpace();
			GUILayout.EndHorizontal();
		}
		
		if(activePlayers > 0) {
			GUILayout.Space(30);
			GUILayout.Label(activePlayers + " players online - " + activePlayersVisible + " players in this version - " + availableServers + " available dedicated servers");
		}
		
		GUILayout.EndScrollView();
		if(Event.current.type != EventType.Layout) {
			mouseInServerList = GUILayoutUtility.GetLastRect().Contains(Event.current.mousePosition);
		}
		
		GUILayout.FlexibleSpace();
		GUILayout.Space(5);
		
		if (showSettings) {
			GUILayout.BeginHorizontal();
			if(!disableMasterServer) {
				if (useMasterServer) {
					if (GUILayout.Button ("Switch to Direct Connect"/*, GUILayout.Width(200)*/)) {
						useMasterServer = false;
						Network.useNat = false;
					}
				}
				else {
					if (GUILayout.Button ("Switch to Server List"/*, GUILayout.Width(200)*/)) {
						useMasterServer = true;
					}
				}
			}
			if (useMasterServer) {
				GUILayout.Space(5);
				if (GUILayout.Button ("Refresh Games")) {
					MasterServer.ClearHostList();
					MasterServer.RequestHostList(gameName);
					//ServerPings = null;
					lastHostListRefresh = -1;
					lastHostListRequest = Time.time;
				}
				GUILayout.EndHorizontal();
				GUILayout.BeginHorizontal();
				GUILayout.FlexibleSpace();
				hostDedicated = GUILayout.Toggle(hostDedicated, "Utilize dedicated servers for hosting games");
				GUILayout.FlexibleSpace();
				GUILayout.EndHorizontal();
				GUILayout.BeginHorizontal();
				GUILayout.Label(testMessage + masterServerMessage + (masterServerConFailures > 0 ? " (" + masterServerConFailures + " failures)" : "") + (useMasterServer ? " (Master Server @ " + MasterServer.ipAddress + ":" + MasterServer.port + ")" : "") +  (autoHostListRefresh && useMasterServer ? " (Autorefresh in " + Mathf.Ceil(lastHostListRequest + hostListRefreshTimeout - Time.time) + ")" : ""));
				if (useMasterServer) forceNAT = GUILayout.Toggle(forceNAT, "Force NAT");
			}
			else {
				GUILayout.EndHorizontal();
				GUILayout.Space(3);
				GUILayout.BeginHorizontal();
			}
			/*if (GUILayout.Button ("Retest Internet Connection")) {
				timer = 0;
				TestConnection(true);
			}*/
			
			GUILayout.EndHorizontal();
			
			/*if (useMasterServer) {
				GUILayout.BeginHorizontal();
				autoHostListRefresh = GUILayout.Toggle(autoHostListRefresh,"Auto Refresh");
				filterNATHosts = GUILayout.Toggle(filterNATHosts,"Hide NAT Games");
				if(GUILayout.Toggle(useAlternateServer,"Use Backup List Server") != useAlternateServer) {
					useAlternateServer = (useAlternateServer ? false : true);
					MasterServer.ClearHostList();
					if(useAlternateServer == true) {
	    				MasterServer.ipAddress = backupServerIP;
						MasterServer.port = backupServerPort;
					}
	    			else {
	    				MasterServer.ipAddress = listServerIP;
						MasterServer.port = listServerPort;
	    			}
				}
				GUILayout.EndHorizontal();
				GUILayout.Space(5);
			}*/
		}
		
		GUILayout.BeginHorizontal();
		//if (GUILayout.Button("First Time?\n>> Tutorial Map <<")) Application.LoadLevel("Learn to Play");
				
		if(Application.platform == RuntimePlatform.WindowsPlayer || Application.platform == RuntimePlatform.OSXPlayer) {
			if (GUILayout.Button("<< Exit Game", GUILayout.Height(30))) Application.Quit();
			GUILayout.Space(5);
		}
				
		if (showSettings) {
			if (GUILayout.Button ("Hide Settings", GUILayout.Height(30))) {
				showSettings = false;
			}
		}
		else {
			if (GUILayout.Button ("Show Settings", GUILayout.Height(30))) {
				showSettings = true;
			}
		}
		
		if(messages && messages.length > 0) for (var msg : String in messages) {
			var val : String[] = msg.Split(","[0]);
			GUILayout.Space(5);
			if (GUILayout.Button(val[0], GUILayout.Height(30))) OpenURL(val[1]);
		}
		GUILayout.EndHorizontal();
	}
	
	if (autoHostListRefresh == true && (Time.time > lastHostListRequest + hostListRefreshTimeout || lastHostListRefresh < 0) && useMasterServer) {
		//MasterServer.ClearHostList();
		MasterServer.RequestHostList(gameName);
		//ServerPings = null;
		if(lastHostListRefresh <= 0) lastHostListRefresh = Time.time;
		lastHostListRequest = Time.time;
	}
}

function LoadGame() {
	GuiAnimate = 1;
	yield new WaitForSeconds (.75);
	Application.LoadLevel(2);
}

function authenticateUser() {
	userAuthenticating = "true";
	var www : WWW = new WWW ("http://marsxplr.com/user/authenticate.atis-u-" + Regex.Replace(WWW.EscapeURL(userNameTemp),"-","%2d").Replace(".","%2e") + "-p-" + Regex.Replace(WWW.EscapeURL(userPassword),"-","%2d").Replace(".","%2e"));
	yield www;
	if(!www || www.data == "") userAuthenticating = "Authentication server is unreachable";
	else if(www.data == "-1") userAuthenticating = "";
	else if(www.data == "-2") userAuthenticating = "Username not found";
	else if(www.data == "-3") userAuthenticating = "Incorrect password";
	else if(www.data == "-4") userAuthenticating = "Too many login attempts";
	else {
		var data = www.data.Split(":"[ 0 ]);
		if(data[1] != sha1sum(userNameTemp + "h092hjd82hdkl28djfu83hd82hdu82jfgruy5bg" + userNameTemp)) userAuthenticating = "Authcode failed";
		else {
			userAuthenticating = "";
			if(String.Equals(data[0],userNameTemp,System.StringComparison.CurrentCultureIgnoreCase)) userName = "(" + userNameTemp + ")+";
			else userName = "" + data[0] + " (" + userNameTemp + ")+";
			if(userCode == "{Code}") userCode = "";
			
			if(userRemembered) {
				PlayerPrefs.SetString("userName",userNameTemp);
				PlayerPrefs.SetString("userPassword",userPassword);
				PlayerPrefs.SetInt("userRemembered",1);
				PlayerPrefs.SetInt("userRegistered",1);
			}
			else {
				PlayerPrefs.SetString("userName","");
				PlayerPrefs.SetString("userPassword","");
				PlayerPrefs.SetInt("userRemembered",0);
				PlayerPrefs.SetInt("userRegistered",0);
				userNameTemp = "";
				userPassword = "";
			}
		}
	}
}

function sortHostArray(a : HostData, b : HostData) : int {
	//if(a.connectedPlayers == a.playerLimit) return 1;
	return ((a.connectedPlayers > b.connectedPlayers) ? -1 : ((a.connectedPlayers < b.connectedPlayers) ? 1 : 0));
}

function errorWindow(id : int) {
	//GUI.BringWindowToFront(id);
	scrollPosition = GUILayout.BeginScrollView(scrollPosition);
	GUILayout.Label(GameData.errorMessage);
	GUILayout.EndScrollView ();
	if(GUILayout.Button("(Dismiss)") || Input.GetKeyDown("return") || Input.GetKeyDown("enter") || Input.GetKeyDown(KeyCode.Mouse0)) {
		GameData.errorMessage = "";
		if(!Network.isServer && Network.peerType != NetworkPeerType.Disconnected) {
			Network.Disconnect();
		}
	}
}

function makeWindowUpdate(id : int) {
	GUILayout.Space(40);
	GUILayout.Label("A new Mars Explorer version is now available:");
	GUILayout.Space(10);
	if (GUILayout.Button (">> Download Mars Explorer version " + outdated + "! <<", GUILayout.Height(40))) {
		Application.OpenURL("http://marsxplr.com/view-267");
	}
	GUILayout.Space(30);
	GUILayout.BeginHorizontal();
	GUILayout.Space(100);
	if (GUILayout.Button ("Ignore warning, Play Anyway")) {
		outdated = "";
	}
	GUILayout.Space(100);
	GUILayout.EndHorizontal();
	//GUILayout.Label("(Updating ensures that you have the same features as everyone else)");
	GUILayout.Space(40);
}

function getRemoteIP() {
	remoteIP = PlayerPrefs.GetString("remoteIP","127.0.0.1");
}

function OpenURL(url : String) {
	//Exit Fullscreen
	if(Screen.fullScreen) {
		if(Application.platform == RuntimePlatform.WindowsWebPlayer || Application.platform == RuntimePlatform.OSXWebPlayer || Application.platform == RuntimePlatform.OSXDashboardPlayer) {
			Screen.fullScreen = false;
		}
		else {
			resolution = Screen.resolutions[Screen.resolutions.length - 2];
			Screen.SetResolution (resolution.width, resolution.height, false);
		}
	}
	
	//Open URL
	if(Application.platform == RuntimePlatform.OSXWebPlayer || Application.platform == RuntimePlatform.WindowsWebPlayer) {
		Application.ExternalEval("var confirmPopup = window.open('" + url + "', '_blank', 'width=' + screen.availWidth + ', height=' + screen.availHeight + ',toolbar=yes,location=yes,directories=yes,status=yes,menubar=yes,scrollbars=yes,copyhistory=no,resizable=yes'); if(!confirmPopup) { if(!confirm('I\\'m Sorry: Your browser blocked the window I attempted to open for you. Please instruct your browser to allow popups and click the link again, or hit \"Cancel\" - and I\\'ll redirect you from Mars Explorer to your intended destination automatically.')) { window.location = '" + url + "'; } }");
	}
	else Application.OpenURL(url);
}

function htmlDecode(str : String) {
	return System.Text.RegularExpressions.Regex.Replace(str, "<[^>]*?>", "").Replace("&#34;", "\"").Replace("&#39;", "'").Replace("&amp;", "&");
}

static function sha1sum(strToEncrypt){
    var encoding = System.Text.UTF8Encoding();
    var bytes = encoding.GetBytes(strToEncrypt);
 
    // encrypt bytes
    var md5 = System.Security.Cryptography.SHA1CryptoServiceProvider();
    var hashBytes:byte[] = md5.ComputeHash(bytes);
 
    // Convert the encrypted bytes back to a string (base 16)
    var hashString = "";
 
    for (var i = 0; i < hashBytes.Length; i++)
    {
        hashString += System.Convert.ToString(hashBytes[i], 16).PadLeft(2, "0"[0]);
    }
 
    return hashString.PadLeft(32, "0"[0]);
}