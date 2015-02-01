//**************************************************************************************************
//*********************************** Whirld - by Aubrey Falconer **********************************
//**** http://AubreyFalconer.com **** http://www.unifycommunity.com/wiki/index.php?title=Whirld ****
//**************************************************************************************************


enum WhirldOutMode { Package, Open, Bundle }
enum WorldOutStatus { Idle, Working, Success, WWWError, SyntaxError, formatUnsupported }

class WhirldOut extends System.Object {
	
	var worldName : String = "World";
	var outPath : String = "";
	var outMode : WhirldOutMode = WhirldOutMode.Open;
	var assetBundles : Array;
	var data : String;
	
	function WhirldOut(mode : WhirldOutMode) {
		outMode = mode;
		outPath = "";
	}
	
	function Save() {
	
		//Init
		data = "";
		
		//Make sure we have somewhere to save our Whirld
		if(outPath == "") {
			outPath = "WhirldExport";
			var pI : int = 1;
			while(System.IO.Directory.Exists(outPath + (pI > 1 ? pI : ""))) pI += 1;
			if(pI > 1) outPath += pI;
			System.IO.Directory.CreateDirectory(outPath);
			outPath += System.IO.Path.DirectorySeparatorChar;
		}
		
		//Get World's WorldData
		var world : GameObject = GameObject.Find(worldName);
		if(world) var whirldObject : WhirldObject = world.GetComponent(WhirldObject);
		if(whirldObject) for (var dat : WhirldData in whirldObject.data) {
			
			//Custom Asset Bundle
			if(dat.n == "AssetBundle") {
				if(!assetBundles) assetBundles = new Array();
				assetBundles.Add(dat.v);
			}
			
			//Save this custom data field directly into world
			else data += "[" + dat.n + ":" + dat.v + "]\n";
		}
		
		//Save Rendering Settings
		if(RenderSettings.fog) {
			//data += "[rndSkybox:" + RenderSettings.skybox.name + "]\n";
			data += "[rndFogColor:" + RenderSettings.fogColor.r + "," + RenderSettings.fogColor.g + "," + RenderSettings.fogColor.b + "]\n";
			data += "[rndFogDensity:" + RenderSettings.fogDensity + "]\n";
			data += "[rndAmbientLight:" + RenderSettings.ambientLight.r + "," + RenderSettings.ambientLight.g + "," + RenderSettings.ambientLight.b + "," + RenderSettings.ambientLight.a + "]\n";
			data += "[rndHaloStrength:" + RenderSettings.haloStrength + "]\n";
			data += "[rndFlareStrength:" + RenderSettings.flareStrength + "]\n";
		}
		
		//Optimize Scene for use as Whirld
		var origScene : String = EditorApplication.currentScene;
		EditorApplication.SaveScene("Assets/Whirld/World.unity");
		var worldObject = GameObject.Find(worldName);
		trs = GameObject.FindObjectsOfType (Transform);
		if(worldObject && worldObject.transform.childCount > 0) {
			for (var tr : Transform in trs) {
				if(tr.root == tr && tr != worldObject.transform) GameObject.DestroyImmediate(tr.gameObject, false);  //Don't include non World Objects
				else if(tr.root == worldObject.transform) tr.parent = null;		//Move World objects into root
			}
			GameObject.DestroyImmediate(worldObject, false);	//Don't include world object
		}
		EditorApplication.SaveScene("Assets/Whirld/World.unity");
		
		//Save Whirld in "Bundle" mode
		if(outMode == WhirldOutMode.Bundle) {
			new WhirldOutBundle(this);
		}
		
		//Save Whirld in "Open" mode
		else {
			new WhirldOutOpen(this);
		}
		
		//Write Whirld.utw Datafile
		System.IO.File.WriteAllText(outPath + "/Whirld.utw", data);
		
		//Return to original scene
		EditorApplication.OpenScene(origScene);
		
		//Cleanup temp scene
		System.IO.File.Delete("Assets/Whirld/World.unity");
		
		//Clean up
		//outPath = "";	//Never overwrite a previously saved world
		
		//Success!
		return true;
		
	}
	
	function ObjectData(go : GameObject) {
		
		//Caluculate Indent
		var indent : String;
		var tr : Transform = go.transform;
		var pr : Transform = tr;
		while(true) {
			if(pr.parent == null) break;
			pr = pr.parent;
			indent += "\t";
		}
		
		//This thing has WorldData - grab it!
		var objectData : String = "";
		var whirldObject : WhirldObject = go.GetComponent(WhirldObject);
		if(whirldObject) for (var dat : WhirldData in whirldObject.data) {
			if(dat.o) objectData += ";" + dat.n + ":#" + dat.o.name; // + "." + dat.o.format;
			else objectData += ";" + dat.n + ":" + dat.v;
		}
		
		//
		return
			(data != "" ? "\n" : "") + indent +
			"{" + go.name + ";" +
			(tr.localPosition == Vector3.zero ? "0" : RoundFloat(tr.localPosition.x) + "," + RoundFloat(tr.localPosition.y) + "," + RoundFloat(tr.localPosition.z)) +
			";" + (tr.rotation == Quaternion.identity ? "0" : RoundFloat(tr.rotation.eulerAngles.x) + "," + RoundFloat(tr.rotation.eulerAngles.y) + "," + RoundFloat(tr.rotation.eulerAngles.z) /*+ "," + tr.rotation.w*/) +
			";" + (tr.localScale == Vector3.one ? 1 : RoundFloat(tr.localScale.x) + "," + RoundFloat(tr.localScale.y) + "," + RoundFloat(tr.localScale.z)) +
			objectData;
	}
	
	function RoundFloat(f : float) {
		if(f % 1 < .05 && f % 1 >= 0)	return f.ToString("F0", System.Globalization.CultureInfo.InvariantCulture);
		else {
			var ret : String = f.ToString("F3", System.Globalization.CultureInfo.InvariantCulture);
			if(ret[ret.Length - 1] == "0") ret = ret.Substring(0, ret.Length - 1);	//Strip trailing zero
			if(ret[ret.Length - 1] == "0") ret = ret.Substring(0, ret.Length - 1);	//Strip trailing zero
			return ret;
		}
	}

}