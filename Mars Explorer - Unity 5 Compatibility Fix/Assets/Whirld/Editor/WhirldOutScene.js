//**************************************************************************************************
//*********************************** Whirld - by Aubrey Falconer **********************************
//**** http://AubreyFalconer.com **** http://www.unifycommunity.com/wiki/index.php?title=Whirld ****
//**************************************************************************************************

class WhirldOutScene extends System.Object {
	
	var worldName : String = "World";
	var outPath : String = "";
	
	function WhirldOutScene(nme : String, pth : String) {
		worldName = nme;
		outPath = pth;
	}
	
	function Save() {
		
		//Build Whirld!
		BuildPipeline.BuildPlayer(["Assets/Whirld/World.unity"], outPath + "Whirld.unity3d", BuildTarget.WebPlayer, BuildOptions.BuildAdditionalStreamedScenes);	
		
		return true;
		
	}
}