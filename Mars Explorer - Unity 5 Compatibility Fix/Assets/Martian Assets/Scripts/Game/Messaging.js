enum chatOrigins {Local, Remote, Server}
var chatting : boolean;
var showChat = -1;
@HideInInspector
var scrollPosition : Vector2;
@HideInInspector
var entries = ArrayList();
private var inputField = "";
private var display = true;
private var windowRect : Rect;

class ChatEntry {
	var text = "";	
	var origin : chatOrigins;
}

function OnGUI () {
	if(Game.Settings.simplified) return;
	GUI.skin = Game.Skin;
	GUI.color.a = Game.GUIAlpha;
	if(Game.Controller.loadingWorld) return;
	
	if ((showChat == 1 || showChat < 0)) {
		windowRect = Rect(10, 40, Mathf.Min(Mathf.Max(170,Screen.width / 4),250), (Game.Settings.minimapAllowed && Game.Settings.useMinimap ? Screen.height * .75 - 60 : Screen.height - 55));
		GUI.Window (11, windowRect, ChatWindow, "Messaging Console");
	}
	else if(GUI.Button(new Rect(10, 40, Mathf.Min(Mathf.Max(170,Screen.width / 4),250), 25), "Messaging Console")) {
		//Game.Settings.simplified = false;
		showChat = 1;
		GUI.FocusControl("Chat input field");
	}
}

function ChatWindow (id : int) {
	var closeButtonStyle = GUI.skin.GetStyle("close_button");
	if (GUI.Button(Rect(closeButtonStyle.padding.left, closeButtonStyle.padding.top, closeButtonStyle.normal.background.width, closeButtonStyle.normal.background.height), "", "close_button")) {
		showChat = 0;
	}
	
	scrollPosition = GUILayout.BeginScrollView (scrollPosition);
	for (var entry : ChatEntry in entries) {
		GUILayout.BeginHorizontal();
		if (entry.origin == chatOrigins.Remote) {
			GUILayout.FlexibleSpace ();
			GUILayout.Label (entry.text, "chatRemote");
		}
		else if(entry.origin == chatOrigins.Local) {
			GUILayout.Label (entry.text, "chatLocal");
			GUILayout.FlexibleSpace ();
		}
		else {
			GUILayout.FlexibleSpace ();
			GUILayout.Label (entry.text, "chatServer");
			GUILayout.FlexibleSpace ();
		}
		
		GUILayout.EndHorizontal();
		GUILayout.Space(3);
		
	}
	GUILayout.EndScrollView ();
	
	GUILayout.FlexibleSpace ();
	
	if (Event.current.type == EventType.keyDown && Event.current.character == "\n" && inputField.Length > 0) {
		if(inputField == "x" || inputField == "/x" || inputField == "/X") {
			if(Game.Settings.zorbSpeed != 0) {
				Game.Player.GetComponent.<NetworkView>().RPC("sZ", RPCMode.All, !Game.PlayerVeh.zorbBall);
				Game.Controller.msg("XORB " + (Game.PlayerVeh.zorbBall ? "Activated" : "Deactivated"), 0 + chatOrigins.Server);
			}
			else Game.Controller.msg("XORBs Unavailable", 0 + chatOrigins.Server);
		}
		else if(inputField == "r" || inputField == "/r" || inputField == "/R") {
			Game.Settings.resetTime = Time.time;
			Game.Player.GetComponent.<Rigidbody>().isKinematic = true;
			broadcast(Game.Player.name + " Resetting in 10 seconds...");
		}
		else {
			inputField = Game.LanguageFilter(inputField);
			Game.Controller.msg(inputField, 0 + chatOrigins.Local);
			Game.Controller.GetComponent.<NetworkView>().RPC("msg", RPCMode.Others, inputField + " - " + GameData.userName, parseInt(chatOrigins.Remote));
			
		}
		inputField = "";
		chatting = false;
		GUI.UnfocusWindow();
	}
	
	GUI.SetNextControlName("Chat input field");
	inputField = GUILayout.TextField(inputField, 300);
	
	if(chatting && inputField == "") {
		GUILayout.Label("(Press \"Tab\" to Cancel)");	
	}
	else if(chatting) {
		GUILayout.Label("(Press \"Enter\" to Send)");
	}
	else {
		GUILayout.Label("(Press \"Tab\" to Message)");
	}
	
	//if(Event.current.type == EventType.Repaint) {
	if(chatting) {
		GUI.FocusControl("Chat input field");
		GUI.FocusWindow(id);
	}
	
	if(showChat < 0 && showChat > -5) showChat = showChat -1;
	else if(showChat < 0 || ((Input.GetKeyDown(KeyCode.Tab) || Input.GetKeyDown(KeyCode.Mouse0)) && Time.time > Game.Controller.kpTime)) {
		Game.Controller.kpTime = Time.time + Game.Controller.kpDur;
		if((chatting == false && !Input.GetKeyDown(KeyCode.Mouse0)) || (windowRect.Contains(Input.mousePosition) && Input.GetKeyDown(KeyCode.Mouse0))) {
			if(showChat == 1) chatting = true;
			showChat = 1;
		}
		else {
			//if(Input.GetKeyDown(KeyCode.Tab)) inputField = "";
			chatting = false;
			if(Input.GetKeyDown(KeyCode.Tab)) GUI.UnfocusWindow();
		}
	}
	//}
}

function broadcast(str : String) {
	Game.Controller.GetComponent.<NetworkView>().RPC("msg", RPCMode.All, str, parseInt(chatOrigins.Server));
}