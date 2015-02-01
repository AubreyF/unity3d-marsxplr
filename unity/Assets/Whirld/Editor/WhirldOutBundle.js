//**************************************************************************************************
//*********************************** Whirld - by Aubrey Falconer **********************************
//**** http://AubreyFalconer.com **** http://www.unifycommunity.com/wiki/index.php?title=Whirld ****
//**************************************************************************************************

class WhirldOutBundle extends System.Object {
	
	var objects : Hashtable;
	var objectBundle : Hashtable;
	var whirldOut : WhirldOut;
	
	function WhirldOutBundle(out : WhirldOut) {
		
		//Init
		BuildPipeline.PushAssetDependencies();	//Share All Built Resources
		var objArr : Array = new Array();
		var whirldData : String = "";
		whirldOut = out;
		
		//Find Resource Objects & Exclude them from StreamedScene
		trs = GameObject.FindObjectsOfType (Transform);
		for (var tr : Transform in trs) {
			if(!tr || tr.parent) continue;
			
			//Check for asset references to include in AssetBundle
			var whirldObject : WhirldObject = tr.gameObject.GetComponent(WhirldObject);
			if(whirldObject) {
				for (var dat : WhirldData in whirldObject.data) {
					if(dat.o) objArr.Add(dat.o);
				}
			}
			
			//This thing is a defined resource
			if(tr.gameObject.name != "Light" && Resources.Load(tr.gameObject.name)) {
				whirldOut.data += whirldOut.ObjectData(tr.gameObject) + "}";
				GameObject.DestroyImmediate(tr.gameObject, false);		//Remove it from scene so the scene doesn't get serialized
			}
			
			//Check is object has been deleted because it was a resource, or if we need to prepare it for direct inclusion in AssetBundle
			//if(tr && whirldObject) {
			//	whirldObject.OnSaveScene();
			//}
			
		}
		
		//Handle Skyboxes - which can't be stored in the main StreamedScene :(
		if(RenderSettings.skybox) {
			//BuildPipeline.BuildAssetBundle(RenderSettings.skybox, null, whirldOut.outPath + "Skybox.unity3d", BuildAssetBundleOptions.CollectDependencies | BuildAssetBundleOptions.CompleteAssets);
			whirldOut.data = "[rndSkybox:" + RenderSettings.skybox.name + "]\n" + whirldOut.data;
			objArr.Add(RenderSettings.skybox);
			/*objArr.Add(RenderSettings.skybox.GetTexture("_FrontTex"));
			objArr.Add(RenderSettings.skybox.GetTexture("_BackTex"));
			objArr.Add(RenderSettings.skybox.GetTexture("_LeftTex"));
			objArr.Add(RenderSettings.skybox.GetTexture("_RightTex"));
			objArr.Add(RenderSettings.skybox.GetTexture("_UpTex"));
			objArr.Add(RenderSettings.skybox.GetTexture("_DownTex"));
			objArr.Add(RenderSettings.skybox.GetTexture("_Tex"));*/
		}
		
		//Handle Shared Bundles
		if(whirldOut.assetBundles || objArr.length > 0) {
			
			try {
			
				//Iterate through each bundle to be built
				if(whirldOut.assetBundles && whirldOut.assetBundles.length > 0) for(var ab : String in whirldOut.assetBundles) {
					
					//Determine title for this bundle
					var url : String = "";
					var fColon : int = ab.IndexOf(":");
					if(fColon > 0) {
						url = ab.Substring(fColon + 1, ab.length - 1 - fColon);
						ab = ab.Substring(0, fColon);
					}
					var offset : int = ab.Substring(0, ab.length-2).LastIndexOf("/") + 1;
					var title : String = ab.Substring(offset, ab.length - offset - 1) + ".unity3d";
					
					//Iterate through each file to be built in this bundle - assets are shared, meaning that whatever we build here will not be packeged into the StreamedScene
					
					var files : String[] = System.IO.Directory.GetFiles(ab, "*", System.IO.SearchOption.AllDirectories);
					for(var file : String in files) objArr.Add(AssetDatabase.LoadMainAssetAtPath(file));
					whirldData += "[ab:" + (url == "" ? title : url) + "]\n";
					var objs : UnityEngine.Object[] = objArr.ToBuiltin(UnityEngine.Object);
					BuildPipeline.BuildAssetBundle(null, objs, whirldOut.outPath + title, BuildAssetBundleOptions.CollectDependencies | BuildAssetBundleOptions.CompleteAssets | BuildAssetBundleOptions.DeterministicAssetBundle);
					objArr.Clear();
					
				}
				
				//We have assets that must be stored in a bundle, but we didn't have any bundles defined
				if(objArr.length > 0) {
					whirldData += "[ab:Assets.unity3d]\n";
					objs = objArr.ToBuiltin(UnityEngine.Object);
					BuildPipeline.BuildAssetBundle(null, objs, whirldOut.outPath + "Assets.unity3d", BuildAssetBundleOptions.CollectDependencies | BuildAssetBundleOptions.CompleteAssets);
				}
			}
			
			catch (e : System.Exception) {
				Debug.Log("Error saving AssetBundle \"" + whirldOut.outPath + title + "\": " + e.ToString());
			}
			
		}
		
		//Build Whirld!
		whirldData += "[ss]\n";
		EditorApplication.SaveScene("Assets/Whirld/World.unity");
		BuildPipeline.BuildPlayer(["Assets/Whirld/World.unity"], whirldOut.outPath + "Whirld.unity3d", BuildTarget.WebPlayer, BuildOptions.BuildAdditionalStreamedScenes);
		
		//End Resource Sharing
		BuildPipeline.PopAssetDependencies();
		whirldOut.data = whirldData + whirldOut.data;
	}
	
	/*function Save() {
		
		//Init
		data = "";
		objects = new Hashtable();
		objectBundle = new Hashtable();
		worldObject = GameObject.Find(worldName);
		if(!worldObject) return false;
		
		//Get World's WorldData
		var whirldObjData : WhirldObject = worldObject.GetComponent(WhirldObject);
		if(whirldObjData) for (var dat : WhirldData in whirldObjData.data) {
		
			//This world includes full custom rendering settings
			if(dat.n == "rndstg" && dat.v == "custom") {
				data += "[rndFogColor:" + RenderSettings.fogColor.r + "," + RenderSettings.fogColor.g + "," + RenderSettings.fogColor.b + "]\n";
				data += "[rndFogDensity:" + RenderSettings.fogDensity + "]\n";
				data += "[rndAmbientLight:" + RenderSettings.ambientLight.r + "," + RenderSettings.ambientLight.g + "," + RenderSettings.ambientLight.b + "," + RenderSettings.ambientLight.a + "]\n";
			}
			
			//Save this custom data field directly into world
			else data += "[" + dat.n + ":" + dat.v + "]\n";
		}
		
		//Recursively scan world objects
		Save(null,0);
				
		//Convert object listing into an Object[] array
		if(objectBundle.Count > 0) {
			i=0;
			var objs : Object[] = new Object[objectBundle.Count];
			for(var obj : DictionaryEntry in objectBundle) {
				objs[i] = obj.Value;
				i++;
			}
		}
		
		//Convert Whirld string to a TextAsset		
		//var path : String = FileUtil.GetUniqueTempPathInProject() + ".txt";	//Doesn't seem to work...
		var path : String = "Assets/data.txt";
		System.IO.File.WriteAllText(path, data);
		AssetDatabase.ImportAsset(path);
		var whirldObj : Object = AssetDatabase.LoadMainAssetAtPath(path);
		if(!whirldObj) {
			Debug.Log("Temp Whirld Data could not be loaded: " + path);
			return false;
		}
		
		//Build Asset Bundle
		//BuildPipeline.BuildAssetBundle(whirldObj, objs, outPath + "Whirld.unity3d"/*EditorApplication.currentScene* /, BuildAssetBundleOptions.CollectDependencies | BuildAssetBundleOptions.CompleteAssets);
		
		//Cleanup
		AssetDatabase.DeleteAsset(path);
		
		//Success!
		return data;
		
	}
	
	function Save(trobj : Transform, depth : int) {
		var indent : String = "";
		for(i=0; i < depth; i++) indent += "\t";
		
		for (var tr : Transform in (trobj == null ? worldObject.transform : trobj)) {
			//Sanitize Names
			tr.gameObject.name = tr.gameObject.name.Replace(" ","_");
			var light : Light = tr.gameObject.GetComponent(Light);
			if(light) tr.gameObject.name = "Light";
			
			//Save boilerplate object data
		    data += (data != "" ? "\n" : "") + indent + "{" + tr.gameObject.name + ";" + (tr.localPosition == Vector3.zero ? "0" : RoundFloat(tr.localPosition.x) + "," + RoundFloat(tr.localPosition.y) + "," + RoundFloat(tr.localPosition.z)) + ";" + (tr.rotation == Quaternion.identity ? "0" : RoundFloat(tr.rotation.eulerAngles.x) + "," + RoundFloat(tr.rotation.eulerAngles.y) + "," + RoundFloat(tr.rotation.eulerAngles.z) /*+ "," + tr.rotation.w* /) + ";" + (tr.localScale == Vector3.one ? 1 : RoundFloat(tr.localScale.x) + "," + RoundFloat(tr.localScale.y) + "," + RoundFloat(tr.localScale.z));
		    
		    //This thing hasn't been previously encountered
		    if(!objects.ContainsKey(tr.gameObject.name)) {
		    	
		    	//This thing has WorldData - grab it!
				var whirldObject : WhirldObject = tr.gameObject.GetComponent(WhirldObject);
				if(whirldObject) for (var dat : WhirldData in whirldObject.data) {
					data += ";" + dat.n + ":" + dat.v;
				}
				
				//Check for CombineChildren
		    	var combineChildren : CombineChildren = tr.gameObject.GetComponent(CombineChildren);
				if(combineChildren) data += ";cc:1";
				
				//This thing is a light source - save it's properties!
				if(tr.gameObject.light) {
					data += ";color:" + light.color.r + "," + light.color.g + "," + light.color.b + ";intensity:" + light.intensity;
				}

				//This thing is not a defined resource
				goP = Resources.Load(tr.gameObject.name);
				if(!goP) {
					
					//This thing has a mesh - include it!
					var mF : MeshFilter = tr.gameObject.GetComponent(MeshFilter);
					var mR : MeshRenderer = tr.gameObject.GetComponent(MeshRenderer);
				    var mC : MeshCollider = tr.gameObject.GetComponent(MeshCollider);
				    
					if(mC && mC.sharedMesh && (!mF || !mR.enabled || mC.sharedMesh != mF.sharedMesh)) {
						if(!objectBundle.ContainsKey(mC.name)) objectBundle.Add(mC.name, mC);
						data += ";cld:" + mC.name;
					}
					
					if(mF && mR.enabled) {
						if(!objectBundle.ContainsKey(mF.name)) objectBundle.Add(mF.name, mF);
						data += ";msh:" + mF.name + ((!mC || !mC.sharedMesh) ? ",-1" : "");
				    }
				    
				    //This is a terrain object! Save it's heightmap, lightmap, and splatmap
				    var trn : Terrain = tr.gameObject.GetComponent(Terrain);
					if(trn) {
						if(!objectBundle.ContainsKey(trn.terrainData.name)) objectBundle.Add(trn.terrainData.name, trn.terrainData);
						data += ";trn:" + trn.terrainData.name;
					}
				    
				    //Look for children objects to save
				    var lengthTemp : int = data.length;
					Save(tr, depth + 1);
					if(lengthTemp != data.length) data += "\n"; //Add new line for closing }
				}
				objects.Add(tr.gameObject.name, goP);
			}
		    data += indent + "}";
		}
	}*/
	
}