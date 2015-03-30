//**************************************************************************************************
//*********************************** Whirld - by Aubrey Falconer **********************************
//**** http://AubreyFalconer.com **** http://www.unifycommunity.com/wiki/index.php?title=Whirld ****
//**************************************************************************************************

enum WorldSources { URL, File }

class WhirldWindowIn extends EditorWindow {
    var worldName : String = "World";
    var world : GameObject;
    var worldUrl : String;
    var worldFile : String;
	var worldSource : WorldSources = WorldSources.File;
    var tickTime : float = 0.0;
    var labelClean : GUIStyle;
    
    @MenuItem ("Assets/Whirld/Whirld Import")
    static function Init () {
        var window : WhirldWindowIn = EditorWindow.GetWindow(WhirldWindowIn, false, "WhirldIn " + WhirldLibrary.version);
        window.autoRepaintOnSceneChange = true;
    }
    
    function OnGUI () {
		
		//Init GUIStyles
		if(!labelClean) {
			labelClean = new GUIStyle();
			labelClean.stretchHeight = labelClean.wordWrap = true;
			labelClean.alignment = TextAnchor.MiddleCenter;
			labelClean.padding.left = labelClean.padding.right = 10;
		}
		
		/*GUILayout.FlexibleSpace();
		
		GUILayout.Label("\"Open\" exports individual asset files.\n\"Bundle\" (Pro) exports an AssetBundle.\n\"Scene\" (Pro) exports a StreamedScene.", labelClean);
		*/
		
		GUILayout.FlexibleSpace();
		
		//Display Various Options
		worldSource = EditorGUILayout.EnumPopup("Source", worldSource);
		
		if(worldSource == WorldSources.File) {
			if(!worldFile || worldFile == "") worldFile = "{Select Whirld File}";
			if(GUILayout.Button(worldFile)) worldFile = EditorUtility.OpenFilePanel("Select a World File", worldFile, null);
		}
		else {
			if(!worldUrl) worldUrl = "http://";
			worldUrl = EditorGUILayout.TextField(GUIContent("World URL","Find and share worlds @ MarsXplr.com!"), worldUrl);
		}
		
		GUILayout.FlexibleSpace();
		
		//Import World!
		if(GUILayout.Button("Import World")) {
			Load(worldUrl);
			EditorUtility.ClearProgressBar();
		}
		
		GUILayout.FlexibleSpace();
		
	}
    
	function Load(url : String) {
	
		//Download Whirld File
		var www : WWW = new WWW (url);
		while(!www.isDone) {
			EditorUtility.DisplayProgressBar("WhirldIn " + WhirldLibrary.version, "Downloading World... " + EditorApplication.timeSinceStartup, www.progress);
		}
		EditorUtility.DisplayProgressBar("WhirldIn " + WhirldLibrary.version, "Importing World...", 1);
		
		//Verify Successful Download
		if (www.error != null) {
			Debug.Log("Error Downloading World: " + url);
			return false;
		}
		
		//Bundle Mode
		if(www.assetBundle && www.assetBundle.mainAsset) {
		
		}
		
		//Scene Mode
		else if(www.assetBundle) {
			assetBundle = www.assetBundle;
			Application.LoadLevelAdditive("World");	//Application.levelCount);
		}
		
		//Open Mode
		else {
			//data = www.data;
		}
		
		return true;
		
	}
	
}