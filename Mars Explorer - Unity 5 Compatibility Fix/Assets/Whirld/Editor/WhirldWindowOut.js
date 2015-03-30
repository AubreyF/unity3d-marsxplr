//**************************************************************************************************
//*********************************** Whirld - by Aubrey Falconer **********************************
//**** http://AubreyFalconer.com **** http://www.unifycommunity.com/wiki/index.php?title=Whirld ****
//**************************************************************************************************

class WhirldWindowOut extends EditorWindow {
    var worldName : String = "World";
    var worldDest : String = "";
    var outMode : WhirldOutMode = WhirldOutMode.Open;
    var worldObject : GameObject;
    var tickTime : float = 0.0;
    var labelClean : GUIStyle;
	
    @MenuItem ("Assets/Whirld/Whirld Export")
    static function Init () {
        var window : WhirldWindowOut = EditorWindow.GetWindow(WhirldWindowOut, false, "WhirldOut " + WhirldLibrary.version);
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
	
		//Check for Whirld Container once every 3 seconds
		if(EditorApplication.timeSinceStartup > tickTime) {
			worldObject = GameObject.Find(worldName);
			tickTime = EditorApplication.timeSinceStartup + 3;
		}
		
		/* //Verify World is Present
		if(!worldObject && outMode != WhirldOutMode.Scene) {
			GUILayout.FlexibleSpace();
			GUILayout.Label("No World to Export:\n\n(Please place your world inside a GameObject titled \"World\" - or switch to \"Scene\" mode)", labelClean);
			GUILayout.FlexibleSpace();
			outMode = EditorGUILayout.EnumPopup("Export Mode", outMode);
			GUILayout.FlexibleSpace();
			return;
		}*/
		
		GUILayout.FlexibleSpace();
		
		if(outMode == WhirldOutMode.Package)
			GUILayout.Label("\"Package\" prepares the current scene for bundling by an instance of Unity Pro.", labelClean);
		else if(outMode == WhirldOutMode.Bundle)
			GUILayout.Label("\"Bundle\" (requires Unity Pro) exports the current scene as a compressed, ready-to-play Whirld.", labelClean);
		else
			GUILayout.Label("\"Open\" exports the current scene as a collection of asset files.", labelClean);

		GUILayout.FlexibleSpace();
		
		//Display Various Options
		outMode = EditorGUILayout.EnumPopup("Export Mode", outMode);
		
		GUILayout.FlexibleSpace();
		
		//Save World!
		if(GUILayout.Button("Export World")) {
			
			EditorUtility.DisplayProgressBar("WhirldOut " + WhirldLibrary.version, "Exporting World...", 0);
			
			if(outMode == WhirldOutMode.Package) {
				//DRAGONHERE: AssetDatabase.AssetPathToGUID
				var success : boolean = true;
			}
			else {
				var whirldOut : WhirldOut = new WhirldOut(outMode);
				success = whirldOut.Save();
			}
			if(success) Debug.Log("World Exported to: " + Application.dataPath + "/../" + whirldOut.outPath);
			else Debug.Log("World Export Failed");
			
			EditorUtility.ClearProgressBar();
			
		}
		
		GUILayout.FlexibleSpace();
		
	}
}