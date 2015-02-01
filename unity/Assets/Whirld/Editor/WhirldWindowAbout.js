//**************************************************************************************************
//*********************************** Whirld - by Aubrey Falconer **********************************
//**** http://AubreyFalconer.com **** http://www.unifycommunity.com/wiki/index.php?title=Whirld ****
//**************************************************************************************************

class WhirldWindowAbout extends EditorWindow {
	
    @MenuItem ("Assets/Whirld/About Whirld", false, 0)
    static function Init () {
        var window : WhirldWindowAbout = EditorWindow.GetWindow(WhirldWindowAbout, false, "About Whirld");
    }
    
	function OnGUI () {
		
		var style : GUIStyle = new GUIStyle();
		style.stretchHeight = style.wordWrap = true;
		style.alignment = TextAnchor.MiddleCenter;
		style.padding.left = style.padding.right = 25;
		
		GUILayout.FlexibleSpace();
		
		GUILayout.Label("Whirld is the Compatible, Extensible, Open world toolkit for Unity 3D\n\nInstalled Version: " + WhirldLibrary.version + "\nCreated By: Aubrey Falconer", style);
		
		GUILayout.FlexibleSpace();
		
		if(GUILayout.Button("» AubreyFalconer.com")) Application.OpenURL("http://AubreyFalconer.com");
		if(GUILayout.Button("» Whirld Home")) Application.OpenURL("http://www.unifycommunity.com/wiki/index.php?title=Whirld");
		if(GUILayout.Button("» Whirld License: CC BY SA 3.0 2009")) Application.OpenURL("http://creativecommons.org/licenses/by-sa/3.0/us/");
		
		GUILayout.FlexibleSpace();
	}
}