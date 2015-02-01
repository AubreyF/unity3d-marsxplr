//**************************************************************************************************
//*********************************** Whirld - by Aubrey Falconer **********************************
//**** http://AubreyFalconer.com **** http://www.unifycommunity.com/wiki/index.php?title=Whirld ****
//**************************************************************************************************

enum WhirldInStatus { Idle, Working, Success, WWWError, SyntaxError }

class WhirldIn extends System.Object {
	
	var status : WhirldInStatus = WhirldInStatus.Idle;
	var statusTxt : String = "";
	var progress : float = 0.00;
	var info : String = "";
	var url : String = "";
	var data : String;
	var world : GameObject;
	var whirldBuffer : GameObject;
	var worldName : String = "World";
	var urlPath : String;
	//var defaultMaterial : Material;
	var worldParams : Hashtable = new Hashtable();
	var threads : Hashtable = new Hashtable();
	var threadAssetBundles : int = 0;
	var threadTextures : int = 0;
	var maxThreads = 5;
	var loadedAssetBundles : Array = new Array();
	var objects : Hashtable = new Hashtable();
	var textures : Hashtable = new Hashtable();
	var meshMaterials : Hashtable = new Hashtable();
	var meshMatLibs : Hashtable = new Hashtable();
	//var prefabs : Array = new Array();
	var monoBehaviour : MonoBehaviour; //Needed for attaching Coroutines too
	var readChr = 0;
	
	function Load() {
		
		whirldBuffer = new GameObject("WhirldBuffer");
		monoBehaviour = whirldBuffer.AddComponent(MonoBehaviourScript);
		
		monoBehaviour.StartCoroutine(Generate());
		
	}
		
	function Cleanup() {
		
		//We are still loading the world
		if(whirldBuffer && monoBehaviour) {
			monoBehaviour.StopAllCoroutines();
			GameObject.Destroy(whirldBuffer);
		}
		
		//Unload AssetBundles
		if(loadedAssetBundles.length > 0) {
			for(var ab : AssetBundle in loadedAssetBundles) ab.Unload(true);
			loadedAssetBundles.Clear();
		}
		
	}
	
	function Generate() {
		
		status = WhirldInStatus.Working;
		
		if(url != "") {
		
			//Download Whirld File
			statusTxt = "Downloading World Definition";
			info = "";
			urlPath = url.Substring(0, url.LastIndexOf("/") + 1);
			var www : WWW = new WWW (url);
			while(!www.isDone) {
				progress = www.progress;
				yield new WaitForSeconds(.1);
			}
			progress = 1;
			
			//Verify Successful Download
			if (www.error != null) {
				info = "Failed to download Whirld definition file: " + url + " (" + www.error + ")\n";
				status = WhirldInStatus.WWWError;
				return;
			}
			data = www.data;
		
		}
		
		//Init
		readChr = 0;
		world = GameObject.Find("World");
		if(world) GameObject.Destroy(world);
		world = new GameObject("World");
		//for(i=0; i < 10; i++) prefabs.Add(Resources.Load("Prefab" + i));	//Populate prefabs array - which is necessary to generate TerrainData elements
		statusTxt = "Parsing World Definition";
		
		//Sanity Check
		if(!data || data.length < 10 || (data[0] != "[" && data[0] != "{")) {
			status = WhirldInStatus.SyntaxError;
			return;
		}
		
		//Read Whirld Headers
		while(true) {
			//Read next char
			var s = data[readChr];
			readChr += 1;
			
			//Incorrectly nested header []s
			if(readChr >= data.length) {
				status = WhirldInStatus.SyntaxError;
				return;
			}
			
			//Ignore Newlines and Tabs
			else if(s == "\n" || s == "\t") continue;
			
			else if(s == "{") break;	//Finished reading headers
			else if(s == "[") {			//Beginning new header
				var n = "";
				var v = "";
			}
			
			//Header name read, read value
			else if(s == ":" && n == "") {
				n = v;
				v = "";
			}
			
			//Header ended
			else if(s == "]") {
				
				//[name] header
				if(n == "") {
					n = v;
					v = "";
				}
				
				//AssetBundle
				if(n == "ab") monoBehaviour.StartCoroutine(LoadAssetBundle(v));
				
				//StreamedScene
				if(n == "ss") monoBehaviour.StartCoroutine(LoadStreamedScene(v));
				
				//Skybox
				else if(n == "rndSkybox") monoBehaviour.StartCoroutine(LoadSkybox(v));
				
				//Texture
				else if(n == "txt") monoBehaviour.StartCoroutine(LoadTexture(v));
				
				//Mesh
				else if(n == "msh") monoBehaviour.StartCoroutine(LoadMesh(v));
				
				//Terrain
				else if(n == "trn") monoBehaviour.StartCoroutine(LoadTerrain(v));
				
				//Rendering Settings
				else if(n == "rndFogColor" || n == "rndFogDensity" || n == "rndAmbientLight" || n == "rndHaloStrength" || n == "rndFlareStrength") {
					var vS = v.Split(","[0]);
					if(n == "rndFogColor") RenderSettings.fogColor = Color(parseFloat(vS[0]), parseFloat(vS[1]), parseFloat(vS[2]), 1);
					else if(n == "rndFogDensity") RenderSettings.fogDensity = parseFloat(v);
					else if(n == "rndAmbientLight") RenderSettings.ambientLight = Color(parseFloat(vS[0]), parseFloat(vS[1]), parseFloat(vS[2]), parseFloat(vS[3]));
					else if(n == "rndHaloStrength") RenderSettings.haloStrength = parseFloat(v);
					else if(n == "rndFlareStrength") RenderSettings.flareStrength = parseFloat(v);
				}
				
				//Arbitrary Data
				else worldParams.Add(n, v);
				
			}
			
			//Header char read
			else v += s;
		}
		
		statusTxt = "Downloading World Assets";
		
		//Wait for all "threads" to finish working
		while(threads.Count > 0) {
			//Debug.Log(threads.Count);
			yield;
		}
		
		//Generate World
		statusTxt = "Initializing World";
		ReadObject(world.transform);
		
		//Add TerrainControllers to Terrain objects
		for (var trn : Terrain in GameObject.FindObjectsOfType(Terrain)) {
			trn.gameObject.AddComponent(TerrainController).trnDat = trn.terrainData;
		}
		
		//Cleanup
		GameObject.Destroy(whirldBuffer);
		
		//Send Scene Generation Notice to each object
		for (var go : GameObject in GameObject.FindObjectsOfType(GameObject)) go.SendMessage("OnSceneGenerated", SendMessageOptions.DontRequireReceiver);
		
		//Success!
		status = WhirldInStatus.Success;
		statusTxt = "World Loaded Successfully";
		if(info != "") Debug.Log("Whirld Loading Info: " + info);
		
	}
	
	function LoadAssetBundle(p : String) {
		threadAssetBundles++;

		while(threads.Count >= maxThreads) yield;	//Don't overwhelm the computer by doing too many things @ once
		
		//Presets
		var thread : String = System.IO.Path.GetFileNameWithoutExtension(p);
		threads.Add(thread, "");
		var url : String = p;
		
		//Download StreamedScene
		url = GetURL(url);
		var www : WWW = new WWW (url);
		while(!www.isDone) {
			threads[thread] = www.progress;
			yield;
		}
		if(www.error || !www.assetBundle) {
			if(!www.assetBundle) info += "Referenced file is not an AssetBundle: " + url + "\n";
			else info += "Failed to download asset file: " + url + " (" + www.error + ")\n";
			threads.Remove(thread);
			threadAssetBundles--;
			return;
		}
		
		//Load AssetBundle
		threads[thread] = "Initializing Bundle";
		loadedAssetBundles.Add(www.assetBundle);
		
		//Success
		threads.Remove(thread);
		threadAssetBundles--;
		
	}
	
	function LoadStreamedScene(p : String) {
		while(threads.Count >= maxThreads) yield;	//Don't overwhelm the computer by doing too many things @ once
		
		//Presets
		var thread : String = "SceneData";
		threads.Add(thread, "");
		var nme : String = "World";
		var url : String = "Whirld.unity3d";
		
		//Object Parameters
		if(p != "") {	//[ss:sceneName,url]
			pS = p.Split(","[0]);
			if(pS[0]) nme = pS[0];
			if(pS[1]) url = pS[1];
		}
		
		//Download StreamedScene
		url = GetURL(url);
		var www : WWW = new WWW (url);
		while(!www.isDone) {
			threads[thread] = www.progress;
			yield;
		}
		if(www.error || !www.assetBundle) {
			if(!www.assetBundle) info += "StreamedScene file contains no scenes: " + url + "\n";
			else info += "Failed to download asset file: " + url + " (" + www.error + ")\n";
			threads.Remove(thread);
			return;
		}
		
		//Wait for all AssetBundles to load
		threads[thread] = "Loading Asset Dependencies";
		while(threadAssetBundles > 0) yield;
		
		threads.Remove(thread);
		thread = "SceneInit";
		threads.Add(thread, "...");
		
		//Load StreamedScene
		var blah = www.assetBundle;
		var async : AsyncOperation = Application.LoadLevelAdditiveAsync(nme);
		var tme : float = Time.time;
	    while(!async.isDone) {
	    	threads[thread] = (Time.time - tme) + "...";
	    	//threads[thread] = (Mathf.RoundToInt(Time.time - tme) * 3) + "..."; //async.progress;
	    	yield;
	    }
	    
		//Success
		loadedAssetBundles.Add(www.assetBundle);
		threads.Remove(thread);
		
	}
	
	function LoadTexture(p : String) {	//[txt:name,url,wrapMode,anisoLevel]
		threadTextures++;
		
		while(threads.Count >= maxThreads) yield;	//Don't overwhelm the computer by doing too many things @ once

		vS = p.Split(","[0]);
		
		var thread : String = "Txt" + threadTextures + " - " + vS[0];
		threads.Add(thread, "");
		
		var url : String = GetURL(vS[1]);
		var www : WWW = new WWW(url);
		while(!www.isDone) {
			threads[thread] = www.progress;
			yield;
		}
		if(www.error) {
			info += "Failed to download texture: " + url + " (" + www.error + ")\n";
			threads.Remove(thread);
			threadTextures--;
			return;
		}
		
		threads[thread] = "Initializing";
		//var txt = www.texture;
		var txt : Texture2D = new Texture2D(4, 4, TextureFormat.DXT1, true);
		www.LoadImageIntoTexture(txt);
		txt.wrapMode = (!vS[2] || vS[2] == 0 ? TextureWrapMode.Clamp : TextureWrapMode.Repeat);
		txt.anisoLevel = (vS[3] ? vS[3] : 1);
		txt.Apply(true);
		txt.Compress(true);
		textures.Add(vS[0], txt);
		
		threads.Remove(thread);
		threadTextures--;
	}
	
	function LoadMeshTexture(url : String, materialName : String) {
		threadTextures++;
		
		while(threads.Count >= maxThreads) yield;	//Don't overwhelm the computer by doing too many things @ once
		var thread : String = "MshTxt" + threadTextures + " - " + materialName;
		threads.Add(thread, "");
		
		url = GetURL(url);
		var www : WWW = new WWW(url);
		while(!www.isDone) {
			threads[thread] = www.progress;
			yield;
		}
		if(www.error) {
			info += "Failed to download mesh texture: " + url + " (" + www.error + ")\n";
			threads.Remove(thread);
			threadTextures--;
			return;
		}
		
		threads[thread] = "Initializing";
		
		var mshTxt : Texture2D = new Texture2D(4, 4, TextureFormat.DXT1, true);
		www.LoadImageIntoTexture(mshTxt);
		mshTxt.wrapMode = TextureWrapMode.Repeat;
		mshTxt.Apply(true);
		mshTxt.Compress(true);
		meshMaterials[materialName].mainTexture = mshTxt;
		
		threads.Remove(thread);
		threadTextures--;
	}
	
	function LoadMesh(v : String) {	//[msh:name,url]
		while(threads.Count >= maxThreads) yield;	//Don't overwhelm the computer by doing too many things @ once
		
		//Init Thread
		vS = v.Split(","[0]);
		var thread : String = vS[0];
		threads.Add(thread, "");
		
		//Downlod Mesh Object
		var hasCollider = (vS.length > 2 ? parseInt(vS[2]) : 0);
		www = new WWW(GetURL(vS[1]));
		while(!www.isDone) {
			threads[thread] = www.progress;
			yield;
		}
		if(www.error) {
			info += "Failed to download mesh: " + url + " (" + www.error + ")\n";
			threads.Remove(thread);
			return;
		}
		
		//Download All Textures Before Generating Mesh
		//threads[thread] = "Loading Textures";
		//while(threadTextures > 0) yield;
		
		//Uncompress as necessary...
		threads[thread] = "Decompressing";
		yield;	//Rebuild GUI as we may be working for a while
		var lastDot : int = vS[1].LastIndexOf(".");
		if(vS[1].Substring(lastDot + 1) == "gz") {
			var data : String = new Ionic.Zlib.GZipStream(new System.IO.MemoryStream(), Ionic.Zlib.CompressionMode.Decompress).UncompressString(www.bytes);
			vS[1] = vS[1].Substring(0, lastDot);
		}
		else data = www.data;
		
		threads[thread] = "Generating";
		
		lastDot = vS[1].LastIndexOf(".");
		var ext : String = vS[1].Substring(lastDot + 1);
		
		//Binary UniTyMesh Object
		if(ext == "utm") {
			//MeshSerializer has been depricated - it's totally nonstandard, and it didn't support submeshes anyway
			//var msh : Mesh = MeshSerializer.ReadMesh(www.bytes);
		}
		
		//.obj File
		else if(ext == "obj") {
			msh = new Mesh();
			var verts = new Array();
			var norms = new Array();
			var uvs = new Array();
			var tris = new Array();
			var triangles = new Array();
			var mats = new Array();
			
			var timer : float = Time.time + .1;
			var file : String[] = data.Split("\n"[0]);
			for (var str : String in file) {
				if(str == "") continue;
				var l : String[] = str.Split(" "[0]);
				if(l[0] == "v") verts.Add(Vector3(-parseFloat(l[1]), parseFloat(l[2]), parseFloat(l[3])));
				else if(l[0] == "vn") norms.Add(Vector3(parseFloat(l[1]), parseFloat(l[2]), parseFloat(l[3])));
				else if(l[0] == "vt") uvs.Add(Vector2(parseFloat(l[1]), parseFloat(l[2])));
				else if(l[0] == "f") {
					if(l.length == 4) {
						tris.Add(parseInt(l[2].Substring(0, l[2].IndexOf("/"))) - 1);
						tris.Add(parseInt(l[1].Substring(0, l[1].IndexOf("/"))) - 1);
						tris.Add(parseInt(l[3].Substring(0, l[3].IndexOf("/"))) - 1);
					}
					else {	//Attempt to triangulate face - hardly works, could use better routine here...
						for(i=2; i < l.length; i++) {
							tris.Add(parseInt(l[i].Substring(0, l[i].IndexOf("/"))) - 1);
							if(i % 2 == 0) tris.Add(parseInt(l[1].Substring(0, l[1].IndexOf("/"))) - 1);	//Add new "node" for our fan
						}
						while(tris.length % 3 != 0) tris.Add(parseInt(l[i-2].Substring(0, l[i-2].IndexOf("/"))) - 1);
					}
				}
				else if(l[0] == "usemtl") {
					if(meshMaterials.ContainsKey(l[1])) mats.Add(meshMaterials[l[1]]);
					else {
						info += "Mesh Material Missing: " + l[1] + "\n";
						mats.Add(null);
					}
					if(tris.length > 0) {
						triangles.Add(tris);
						tris = new Array();
					}
				}
				else if(l[0] == "mtllib") { //Time to load a material library!
					if(!meshMatLibs.ContainsKey(l[1])) {
						meshMatLibs.Add(l[1], true); //Only load a material library once, even if it is referenced by multiple meshes
						www = new WWW(GetURL(l[1]));
						while(!www.isDone) {
							threads[thread] = "Downloading Material Library (" + Mathf.RoundToInt(www.progress * 100) + "%)";
							//yield;
						}
						if (www.error != null) info += "Mesh Material Library Undownloadable: " + GetURL(l[1]) + " (" + www.error + ")\n";
						else {
							threads[thread] = "Initializing " + vS[0] + "";
							//yield;
							var meshlib : String[] = www.data.Split("\n"[0]);
							var curMat : Material;
						    var offset : int = -1;
						    while(true) {
						    	offset = www.data.IndexOf("map_Ka", offset + 1);
						    	if(offset == -1) break;
						    }
							for (var meshline : String in meshlib) {
								var ml : String[] = meshline.Split(" "[0]);
								if(ml[0] == "newmtl") { //Beginning of new material
									if(curMat) { //Save current material
										meshMaterials.Add(curMat.name, curMat);
									}
									curMat = new Material(Shader.Find("VertexLit"));
									curMat.name = ml[1];
								}
								else if(ml[0] == "#Shader") { //Set shader of current material
									var shdr = meshline.Substring(8).Replace("Diffuse", "VertexLit");
									if(shdr != "VertexLit" && shdr != "VertexLit Fast") curMat.shader = Shader.Find(shdr);
								}
								else if(ml[0] == "Ka") { //Set color of current material
									curMat.color = Color(parseFloat(ml[1]), parseFloat(ml[2]), parseFloat(ml[3]), 1);
								}
								else if(ml[0] == "Kd") {
									curMat.SetColor("_Emission", Color(parseFloat(ml[1]), parseFloat(ml[2]), parseFloat(ml[3]), 1));
								}
								else if(ml[0] == "Ks") {
									curMat.SetColor("_SpecColor", Color(parseFloat(ml[1]), parseFloat(ml[2]), parseFloat(ml[3]), 1));
								}
								else if(ml[0] == "Ns") {
									curMat.SetFloat("_Shininess", parseFloat(ml[1]));
								}
								else if(ml[0] == "map_Ka") { //Set texture of current material
									curMat.mainTextureOffset = Vector2(parseFloat(ml[2]), parseFloat(ml[3]));
									curMat.mainTextureScale = Vector2(parseFloat(ml[5]), parseFloat(ml[6]));
									monoBehaviour.StartCoroutine(LoadMeshTexture(ml[7], curMat.name));
								}
								else if(ml[0] == "d") { //Set alpha cutoff of current material
									//curMat.shader = Shader.Find("Transparent/Cutout/VertexLit");
									//curMat.SetFloat("_Cutoff", parseFloat(ml[1]));
								}
							}
							if(curMat) { //Save last material (others get saved as file is read)
								meshMaterials.Add(curMat.name, curMat);
							}
						}
					}
				}
				if(Time.time > timer) {	//Refresh GUI 10 times per second to keep the user entertained
					timer = Time.time + .1;
					yield;
				}
			}
			
			threads[thread] = "Initializing";
			
			msh.vertices = verts.ToBuiltin(Vector3);
			msh.normals = norms.ToBuiltin(Vector3);
			msh.uv = uvs.ToBuiltin(Vector2);
			if(triangles.length > 0) {
				triangles.Add(tris);
				msh.subMeshCount = triangles.length;
				for(i=0; i < triangles.length; i++) msh.SetTriangles(triangles[i].ToBuiltin(int), i);
			}
			else msh.triangles = tris.ToBuiltin(int);
		}
		
		//Unknown File Type
		else info += "Mesh Type Unrecognized: " + vS[0] + " " + vS[1] + " (." + ext + ")\n";
		
		if(hasCollider != 1) { //This mesh is being created, and it has a renderer
			var mshObj : GameObject = new GameObject(vS[0]);
			mshObj.AddComponent(MeshFilter);
			mshObj.GetComponent(MeshFilter).mesh = msh;
			mshObj.AddComponent(MeshRenderer);
			mshObj.GetComponent(MeshRenderer).materials = mats.ToBuiltin(Material);
			if(hasCollider != -1) { //This mesh has a collider, and it is the same as it's rendered mesh
				mshObj.AddComponent(MeshCollider);
				mshObj.GetComponent(MeshCollider).mesh = msh;
			}
			if(msh.uv.length < 1) TextureObject(mshObj);
			objects.Add(vS[0], mshObj);
			mshObj.transform.parent = whirldBuffer.transform;
		}
		else {	//This mesh has a custom collider
			if(objects.ContainsKey(vS[0])) {	//This mesh already exists, add a custom collider to it
				mshObj = objects[vS[0]];
				mshObj.AddComponent(MeshCollider);
				mshObj.GetComponent(MeshCollider).mesh = msh;
			}
			else {		//This mesh is just a collider. It hasn't been created already, so we need to do that.
				mshObj = new GameObject(vS[0]);
				mshObj.AddComponent(MeshCollider);
				mshObj.GetComponent(MeshCollider).mesh = msh;
				objects.Add(vS[0], mshObj);
				mshObj.transform.parent = whirldBuffer.transform;
			}
		}
		msh.Optimize();
		
		threads.Remove(thread);
		
	}
	
	function LoadTerrain(v : String) {	//v = "name;r:width,height,length,heightmapResolution	//,detailResolution,controlResolution,textureResolution;h:heightMapUrl";
		
		var vS2 : String[] = v.Split(";"[0]);
		var tName = vS2[0];
		for(i2 = 1; i2<vS2.length; i2++) {
			var str : String[] = vS2[i2].Split(":"[0]);
			if(str[0] == "r") var tRes : String[] = str[1].Split(","[0]);
			else if(str[0] == "h") var tHtmp : String = GetURL(str[1]);
			else if(str[0] == "l") var tLtmp : String = GetURL(str[1]);
			else if(str[0] == "s") var tSpmp : String = GetURL(str[1]);
			else if(str[0] == "s2") var tSpmp2 : String = GetURL(str[1]);
			else if(str[0] == "t") var tTxts : String[] = str[1].Split(","[0]);
			else if(str[0] == "d") var tDtmp : String = GetURL(str[1]);
		}
		
		var thread : String = tName;
		threads.Add(thread, "");
		www = new WWW(tHtmp);
		while(!www.isDone) {
			threads[thread] = www.progress;
			yield;
		}
		if (www.error != null) info += "Terrain Undownloadable: " + tName + " " + tHtmp + " (" + www.error + ")\n";
		else {
			threads[thread] = "Initializing";
			//yield;
			
			var tWidth : int = parseInt(tRes[0]);
			var tHeight : int = parseInt(tRes[1]);
			var tLength : int = parseInt(tRes[2]);
			var tHRes : int = parseInt(tRes[3]);
			//var tDRes : int = parseInt(tRes[4]);
			//var tCRes : int = parseInt(tRes[5]);
			//var tBRes : int = parseInt(tRes[6]);
			var trnDat : TerrainData = new TerrainData();
			
			//Heights
			trnDat.heightmapResolution = tHRes;
			//trnDat.Init(tCRes, tDRes, tBRes);
			var hmap = trnDat.GetHeights(0, 0, tHRes, tHRes);
			var br : System.IO.BinaryReader;
			if(true) { //Terrain RAW file is compressed
				/*var stream = new DeflateStream(new MemoryStream(www.bytes), CompressionMode.Decompress);
				var buffer : byte[] = new byte[4096];
		        var ms : MemoryStream = new MemoryStream();
				var bytesRead : int = 0;
				while (bytesRead > 0) {
	            	bytesRead = stream.Read(buffer, 0, buffer.Length);
	            	if (bytesRead > 0) ms.Write(buffer, 0, bytesRead);
		        }
				br = new System.IO.BinaryReader(ms);*/
			    br = new System.IO.BinaryReader(new System.IO.MemoryStream(new Ionic.Zlib.GZipStream(new System.IO.MemoryStream(), Ionic.Zlib.CompressionMode.Decompress).UncompressBuffer(www.bytes)));
			}
			else br = new System.IO.BinaryReader(new System.IO.MemoryStream(www.bytes));
			for (var x : int = 0; x < tHRes; x++) for (var y : int = 0; y < tHRes; y++) hmap[x, y] = br.ReadUInt16() / 65535.00000000;
			trnDat.SetHeights(0, 0, hmap);
			trnDat.size = Vector3(tWidth, tHeight, tLength);				
			
			//Textures
			if(tTxts) {
				var splatPrototypes : SplatPrototype[] = new SplatPrototype[tTxts.length];
				for(i=0; i < tTxts.length; i++) {
					var splatTxt : String[] = tTxts[i].Split("="[0]);
					var splatTxtSize : String[] = splatTxt[1].Split("x"[0]);
					www = new WWW(GetURL(splatTxt[0]));
					while(!www.isDone) {
						//threads[thread] = "Initializing";
						//yield new WaitForSeconds(.1);
					}
					if (www.error != null) info += "Terrain Texture Undownloadable: #" + (i + 1) + " (" + splatTxt[0] + ")\n";
					else {
						//yield;
						splatPrototypes[i] = new SplatPrototype();
						splatPrototypes[i].texture = new Texture2D(4, 4, TextureFormat.DXT1, true);
						www.LoadImageIntoTexture(splatPrototypes[i].texture);
						splatPrototypes[i].texture.Apply(true);
						splatPrototypes[i].texture.Compress(true);
						splatPrototypes[i].tileSize = Vector2(parseInt(splatTxtSize[0]), parseInt(splatTxtSize[1]));
					}
				}
			}
			/*else {
				splatPrototypes = new SplatPrototype[whirld.worldTerrainTextures.length];
				for(i=0; i < whirld.worldTerrainTextures.length; i++) {
					splatPrototypes[i] = new SplatPrototype();
					splatPrototypes[i].texture = whirld.worldTerrainTextures[i];
					splatPrototypes[i].tileSize = Vector2(15, 15);
				}
			}*/
			trnDat.splatPrototypes = splatPrototypes;
			
			//Lightmap
			if(tLtmp) {
				//whirld.statusTxt = "Downloading Terrain Lightmap (" + tName + ")";
				www = new WWW(tLtmp);
				while(!www.isDone) {
					//whirld.progress = www.progress;
					//yield new WaitForSeconds(.1);
				}
				if (www.error != null) info += "Terrain Lightmap Undownloadable: " + tName + " " + tLtmp + " (" + www.error + "\n";
				else {
					trnDat.lightmap = www.texture;
				}
			}
			
			//Splatmap
			if(tSpmp) {
				if(tSpmp2) {
					//whirld.statusTxt = "Downloading Augmentative Terrain Texturemap (" + tName + ")";
					www = new WWW(tSpmp2);
					while(!www.isDone) {
						//whirld.progress = www.progress;
						//yield new WaitForSeconds(.1);
					}
					var mapColors2 = www.texture.GetPixels();
				}
				//whirld.statusTxt = "Downloading Terrain Texturemap (" + tName + ")";
				www = new WWW(tSpmp);
				while(!www.isDone) {
					//whirld.progress = www.progress;
					//yield new WaitForSeconds(.1);
				}
				//whirld.statusTxt = "Mapping Terrain Textures...";
				//yield;
				if (www.error != null) info += "Terrain Texturemap Undownloadable: " + tName + " " + tLtmp + " (" + www.error + ")\n";
				else {
					if (www.texture.format != TextureFormat.ARGB32 || www.texture.width != www.texture.height || Mathf.ClosestPowerOfTwo(www.texture.width) != www.texture.width) {
						info += "Terrain Splatmap Unusable: Splatmap must be in RGBA 32 bit format, square, and it's size a power of 2\n";
					}
					else {
						trnDat.alphamapResolution = www.texture.width;
						var splatmapData = trnDat.GetAlphamaps(0, 0, www.texture.width, www.texture.width);
						var mapColors = www.texture.GetPixels();
						var ht : int = www.texture.height;
						var wd : int = www.texture.width;
						for (y = 0; y < ht; y++) for (x = 0; x < wd; x++) for (z = 0; z < trnDat.alphamapLayers; z++) {
							if(z < 4) splatmapData[x,y,z] = mapColors[x * wd + y][z];
							else splatmapData[x,y,z] = mapColors2[x * wd + y][z-4];
						}
						trnDat.SetAlphamaps(0, 0, splatmapData);
					}
				}
			}
			
			//Details (rocks, trees, grass, etc)
			/*if(tDtmp) {
				//whirld.statusTxt = "Downloading Terrain Details (" + tDtmp + ")";
				www = new WWW(tDtmp);
				while(!www.isDone) {
					//whirld.progress = www.progress;
					//yield new WaitForSeconds(.1);
				}
				if (www.error != null) info += "Terrain Details Undownloadable: " + tName + " " + tDtmp + " (" + www.error + ")\n";
				else {
					var treePrototypes : Array = new Array();
					var treeInstances : Array = new Array();
					var treeProto : TreePrototype;
					var detailProto : DetailPrototype;
					var detailPrototypes : Array = new Array();
					file = new Ionic.Zlib.GZipStream(new System.IO.MemoryStream(), Ionic.Zlib.CompressionMode.Decompress).UncompressString(www.bytes).Split("\n"[0]);
					for (i=0; i < file.length; i++) {
						if(file[i] == "" || i == file.length - 1) { //Apply Existing Trees
							if(treeProto) {
								treePrototypes.Add(treeProto);
								treeProto = null;
								//continue;
							}
							if(detailProto) {
								detailPrototypes.Add(detailProto);
								detailProto = null;
								//continue;
							}
						}
						if(file[i].length > 10 && file[i].Substring(0, 10) == "detailmap2") {
							//whirld.statusTxt = "Downloading Augmentative Terrain Detail Map (" + GetURL(file[i].Substring(11)) + ")";
							www = new WWW(GetURL(file[i].Substring(11)));
							while(!www.isDone) {
								//whirld.progress = www.progress;
								//yield new WaitForSeconds(.1);
							}
							if (www.error != null) info += "Augmentative Terrain Detail Map Undownloadable: " + tName + " " + file[i].Substring(11) + " (" + www.error + ")\n";
							else {
								tex = www.texture;
								pixels = www.texture.GetPixels();
								if(detailPrototypes.length > 4) var detLayer4 = trnDat.GetDetailLayer(0, 0, trnDat.detailResolution, trnDat.detailResolution, 4);
								if(detailPrototypes.length > 5) var detLayer5 = trnDat.GetDetailLayer(0, 0, trnDat.detailResolution, trnDat.detailResolution, 5);
								if(detailPrototypes.length > 6) var detLayer6 = trnDat.GetDetailLayer(0, 0, trnDat.detailResolution, trnDat.detailResolution, 6);
								if(detailPrototypes.length > 7) var detLayer7 = trnDat.GetDetailLayer(0, 0, trnDat.detailResolution, trnDat.detailResolution, 7);
								i2 = 0;
								for(iY = 0; iY < trnDat.detailResolution; iY++) {
									for(iX = 0; iX < trnDat.detailResolution; iX++) {
										if(detailPrototypes.length > 4) detLayer4[iX, iY] = Mathf.RoundToInt(pixels[i2].r * 16);
										if(detailPrototypes.length > 5) detLayer5[iX, iY] = Mathf.RoundToInt(pixels[i2].g * 16);
										if(detailPrototypes.length > 6) detLayer6[iX, iY] = Mathf.RoundToInt(pixels[i2].b * 16);
										if(detailPrototypes.length > 7) detLayer7[iX, iY] = Mathf.RoundToInt(pixels[i2].a * 16);
										i2 += 1;
									}
								}
							}
						}
						else if(file[i].length > 10 && file[i].Substring(0, 9) == "detailmap") {
							//whirld.statusTxt = "Downloading Terrain Detail Map (" + GetURL(file[i].Substring(10)) + ")";
							www = new WWW(GetURL(file[i].Substring(10)));
							while(!www.isDone) {
								//whirld.progress = www.progress;
								//yield new WaitForSeconds(.1);
							}
							if (www.error != null) info += "Terrain Detail Map Undownloadable: " + tName + " " + file[i].Substring(10) + " (" + www.error + ")\n";
							else {
								tex = www.texture;
								pixels = www.texture.GetPixels();
								trnDat.detailResolution = www.texture.width;
								if(detailPrototypes.length > 0) var detLayer0 = trnDat.GetDetailLayer(0, 0, trnDat.detailResolution, trnDat.detailResolution, 0);
								if(detailPrototypes.length > 1) var detLayer1 = trnDat.GetDetailLayer(0, 0, trnDat.detailResolution, trnDat.detailResolution, 1);
								if(detailPrototypes.length > 2) var detLayer2 = trnDat.GetDetailLayer(0, 0, trnDat.detailResolution, trnDat.detailResolution, 2);
								if(detailPrototypes.length > 3) var detLayer3 = trnDat.GetDetailLayer(0, 0, trnDat.detailResolution, trnDat.detailResolution, 3);
								i2 = 0;
								for(iY = 0; iY < trnDat.detailResolution; iY++) {
									for(iX = 0; iX < trnDat.detailResolution; iX++) {
										if(detailPrototypes.length > 0) detLayer0[iX, iY] = Mathf.RoundToInt(pixels[i2].r * 16);
										if(detailPrototypes.length > 1) detLayer1[iX, iY] = Mathf.RoundToInt(pixels[i2].g * 16);
										if(detailPrototypes.length > 2) detLayer2[iX, iY] = Mathf.RoundToInt(pixels[i2].b * 16);
										if(detailPrototypes.length > 3) detLayer3[iX, iY] = Mathf.RoundToInt(pixels[i2].a * 16);
										i2 += 1;
									}
								}
							}
						}
						else if(file[i] == "tree") { //Create new tree prototype
							treeProto = new TreePrototype();
						}
						else if(treeProto) {
							if(file[i].Substring(0, 1) == "m") {
								//treeProto.prefab = Resources.Load(file[i].Substring(2));
								//treeProto.prefab = Game.Controller.prefab;
								//prefab.AddComponent(MeshFilter);
								//prefab.AddComponent(MeshRenderer);
								if(objects.ContainsKey(file[i].Substring(2))) {
									treeProto.prefab = prefabs.Pop();
									treeProto.prefab.name = file[i].Substring(2);
									if(!treeProto.prefab.GetComponent(MeshFilter)) treeProto.prefab.AddComponent(MeshFilter);
									treeProto.prefab.GetComponent(MeshFilter).mesh = objects[file[i].Substring(2)].GetComponent(MeshFilter).mesh;
									if(!treeProto.prefab.GetComponent(MeshRenderer)) treeProto.prefab.AddComponent(MeshRenderer);
									treeProto.prefab.GetComponent(MeshRenderer).materials = objects[file[i].Substring(2)].GetComponent(MeshRenderer).materials;
									//treeProto.prefab = objects[file[i].Substring(2)];
								}
								else info += "Terrain Detail Mesh not found: " + file[i].Substring(2) + "\n";
							}
							else if(file[i].Substring(0, 1) == "b") treeProto.bendFactor = parseFloat(file[i].Substring(2));
							else if(file[i+1] == "") { //Read detail objects
								var treedat : String[] = file[i].Split(";"[0]);
								for(var tr : String in treedat) {
									if(!tr) continue;
									var tree = tr.Split(","[0]);
									if(!tree[0] || tree[0] == "") continue;
									var treeInstance = new TreeInstance();
									treeInstance.prototypeIndex = treePrototypes.length;
									treeInstance.position = Vector3(parseFloat(tree[0]), parseFloat(tree[1]), parseFloat(tree[2]));
									treeInstance.widthScale = parseFloat(tree[3]);
									treeInstance.heightScale = parseFloat(tree[4]);
									var c : float = Random.Range(.6, .7);
									treeInstance.color = Color(c - .15, c - .15, c - .15, 1);
									treeInstance.lightmapColor = Color(c + .15, c + .15, c + .15, 0);
									treeInstances.Add(treeInstance);
								}
							}
						}
						else if(file[i] == "detail") {
							detailProto = new DetailPrototype();
						}
						else if(detailProto) {
							l = file[i].Split(" "[0]);
							if(l[0] == "pO") {
								if(objects.ContainsKey(l[1])) {
									//detailProto.prototype = objects[l[1]];
									detailProto.prototype = prefabs.Pop();
									detailProto.prototype.name = l[1];
									if(!detailProto.prototype.GetComponent(MeshFilter)) detailProto.prototype.AddComponent(MeshFilter);
									detailProto.prototype.GetComponent(MeshFilter).mesh = objects[l[1]].GetComponent(MeshFilter).mesh;
									if(!detailProto.prototype.GetComponent(MeshRenderer)) detailProto.prototype.AddComponent(MeshRenderer);
									detailProto.prototype.GetComponent(MeshRenderer).material = objects[l[1]].GetComponent(MeshRenderer).material;
								}
								else info += "Terrain Detail Mesh not found: " + l[1] + "\n";
							}
							else if(l[0] == "pT") {
								l[1] = GetURL(l[1]);
								//whirld.statusTxt = "Downloading Terrain Detail Texture (" + l[1] + ")";
								www = new WWW(l[1]);
								while(!www.isDone) {
									//whirld.progress = www.progress;
									//yield new WaitForSeconds(.1);
								}
								if (www.error != null) info += "Terrain Detail Texture Undownloadable: " + l[1] + "\n";
								else {
									//whirld.statusTxt = "Initializing " + vS[0] + "...";
									//whirld.progress = 0;
									//yield;
									mshTxt = new Texture2D(4, 4, TextureFormat.DXT5, true);
									www.LoadImageIntoTexture(mshTxt);
									mshTxt.Apply(true);
									mshTxt.Compress(true);
									mshTxt.wrapMode = TextureWrapMode.Clamp;
									detailProto.prototypeTexture = mshTxt;
								}
							}
							else if(l[0] == "minW") detailProto.minWidth = parseFloat(l[1]);
							else if(l[0] == "maxW") detailProto.maxWidth = parseFloat(l[1]);
							else if(l[0] == "minH") detailProto.minHeight = parseFloat(l[1]);
							else if(l[0] == "maxH") detailProto.maxHeight = parseFloat(l[1]);
							else if(l[0] == "nS") detailProto.noiseSpread = parseFloat(l[1]);
							else if(l[0] == "bF") detailProto.bendFactor = parseFloat(l[1]);
							else if(l[0] == "hC") detailProto.healthyColor = Color(parseFloat(l[1]), parseFloat(l[2]), parseFloat(l[3]));
							else if(l[0] == "dC") detailProto.dryColor = Color(parseFloat(l[1]), parseFloat(l[2]), parseFloat(l[3]));
							else if(l[0] == "lF") detailProto.lightmapFactor = parseFloat(l[1]);
							else if(l[0] == "gL") detailProto.grayscaleLighting = (l[1] == "1" ? true : false);
							else if(l[0] == "rM") {
								if(l[1] == "GrassBillboard") detailProto.renderMode = DetailRenderMode.GrassBillboard;
								else if(l[1] == "VertexLit") detailProto.renderMode = DetailRenderMode.VertexLit;
								else detailProto.renderMode = DetailRenderMode.Grass;
							}
							else if(l[0] == "uM") detailProto.usePrototypeMesh = (l[1] == "1" ? true : false);
						}
					}
					trnDat.treePrototypes = treePrototypes.ToBuiltin(TreePrototype);
					trnDat.treeInstances = treeInstances.ToBuiltin(TreeInstance);
					trnDat.detailPrototypes = detailPrototypes.ToBuiltin(DetailPrototype);
					if(detailPrototypes.length > 0) trnDat.SetDetailLayer(0, 0, 0, detLayer0);
					if(detailPrototypes.length > 1) trnDat.SetDetailLayer(0, 0, 1, detLayer1);
					if(detailPrototypes.length > 2) trnDat.SetDetailLayer(0, 0, 2, detLayer2);
					if(detailPrototypes.length > 3) trnDat.SetDetailLayer(0, 0, 3, detLayer3);
					if(detailPrototypes.length > 4) trnDat.SetDetailLayer(0, 0, 4, detLayer4);
					if(detailPrototypes.length > 5) trnDat.SetDetailLayer(0, 0, 5, detLayer5);
					if(detailPrototypes.length > 6) trnDat.SetDetailLayer(0, 0, 6, detLayer6);
					if(detailPrototypes.length > 7) trnDat.SetDetailLayer(0, 0, 7, detLayer7);
					//trnDat.RefreshPrototypes();
					//trnDat.RecalculateTreePositions();
				}
				
				/*for(i=0; i<trnDat.treePrototypes.length; i++) {
					trnDat.treePrototypes[i].prefab.name = trnDat.treePrototypes[i].prefab.name.Replace(" ", "_");
					MeshWriteObj(trnDat.treePrototypes[i].prefab.GetComponent(MeshFilter), trnDat.treePrototypes[i].prefab.name);
					whirld.data = "[msh:" + trnDat.treePrototypes[i].prefab.name + "," + trnDat.treePrototypes[i].prefab.name + ".obj.gz]" + whirld.data;
					trnV += (trnV != "" ? "\n\n" : "") + "tree\nm:" + trnDat.treePrototypes[i].prefab.name + "\nb:" + trnDat.treePrototypes[i].bendFactor + "\n";
					for(var tree : TreeInstance in trnDat.treeInstances) {
						if(tree.prototypeIndex != i) continue;
						trnV += tree.position.x.ToString("F1", System.Globalization.CultureInfo.InvariantCulture) + "," + tree.position.y.ToString("F1", System.Globalization.CultureInfo.InvariantCulture) + "," + tree.position.z.ToString("F1", System.Globalization.CultureInfo.InvariantCulture) + "," + tree.widthScale.ToString("F1", System.Globalization.CultureInfo.InvariantCulture) + "," + tree.heightScale.ToString("F1", System.Globalization.CultureInfo.InvariantCulture) + ";";
					}
				}* /
			}*/
			
			//Go!
			var trnObj : GameObject = new GameObject(tName);
			trnObj.AddComponent(Terrain);
			trnObj.GetComponent(Terrain).terrainData = trnDat;
			trnObj.AddComponent(TerrainCollider);
			trnObj.GetComponent(TerrainCollider).terrainData = trnDat;
			
			objects.Add(tName, trnObj);
			trnObj.transform.parent = whirldBuffer.transform;	//Delete this temporary terrain object AFTER world is fully loaded
		}
		
		threads.Remove(thread);
	}
	
	function LoadSkyboxTexture(url : String, dest : int) {
		threadTextures++;
		
		while(threads.Count >= maxThreads) yield;	//Don't overwhelm the computer by doing too many things @ once
		
		//Presets
		var thread : String = "Skybox" + dest;
		threads.Add(thread, "");
		
		
		//Download Skybox Image
		url = GetURL(url);
		var www : WWW = new WWW (url);
		while(!www.isDone) {
			threads[thread] = www.progress;
			yield;
		}
		
		threads.Remove(thread);
		threadTextures--;
		
		if(www.error) {
			info += "Failed to download skybox # " + dest + ": " + url + " (" + www.error + ")\n";
			return;
		}
		
		var txt : Texture2D = new Texture2D(4, 4, TextureFormat.DXT1, true);
		www.LoadImageIntoTexture(txt);
		txt.wrapMode = TextureWrapMode.Clamp;
		txt.Apply(true);
		txt.Compress(true);
		
		//Wait for everything else to load
		while(threads.Count > 0) yield;
		
		//Assign Texture to Skybox!
		if(dest == 0 || dest == 1) RenderSettings.skybox.SetTexture("_FrontTex", txt);
		if(dest == 0 || dest == 2) RenderSettings.skybox.SetTexture("_BackTex", txt);
		if(dest == 0 || dest == 3) RenderSettings.skybox.SetTexture("_LeftTex", txt);
		if(dest == 0 || dest == 4) RenderSettings.skybox.SetTexture("_RightTex", txt);
		if(dest == 0 || dest == 5) RenderSettings.skybox.SetTexture("_UpTex", txt);
		if(dest == 0 || dest == 6) RenderSettings.skybox.SetTexture("_DownTex", txt);
		
	}
	
	function LoadSkybox(v : String) {
		
		var vS = v.Split(","[0]);
		
		//Multiple Image Skybox
		if(vS.length > 5) {
			//var skyMat : Material = RenderSettings.skybox;
			//RenderSettings.skybox = new Material();
			//RenderSettings.skybox.CopyPropertiesFromMaterial(skyMat);
			LoadSkyboxTexture(vS[0], 1);
			LoadSkyboxTexture(vS[1], 2);
			LoadSkyboxTexture(vS[2], 3);
			LoadSkyboxTexture(vS[3], 4);
			LoadSkyboxTexture(vS[4], 5);
			LoadSkyboxTexture(vS[5], 6);
			while(threads.Count > 0) yield;	//Wait for everything else to load
			if(vS.length > 6) {
				RenderSettings.skybox.SetColor("_Tint", new Color(parseFloat(vS[6]), parseFloat(vS[7]), parseFloat(vS[8]), .5));
			}
		}
		
		//Single JPG image for all sides
		else if(vS[0].Substring(vS[0].LastIndexOf(".") + 1) == "jpg") {
			//skyMat = RenderSettings.skybox;
			//RenderSettings.skybox = new Material();
			//RenderSettings.skybox.CopyPropertiesFromMaterial(skyMat);
			LoadSkyboxTexture(vS[0], 0);
			while(threads.Count > 0) yield;	//Wait for everything else to load
			if(vS.length > 1) {
				RenderSettings.skybox.SetColor("_Tint", new Color(parseFloat(vS[1]), parseFloat(vS[2]), parseFloat(vS[3]), .5));
			}
		}
		
		//AssetBundle Material Skybox
		else {
			while(threads.Count > 0) yield;	//Wait for everything else to load
			RenderSettings.skybox = GetAsset(v); //, Material
			if(!RenderSettings.skybox) info += "Skybox not found: " + v + "\n";
		}
		
	}
	
	function GetAsset(str : String) {
		if(loadedAssetBundles.length > 0) {
			for(var ab : AssetBundle in loadedAssetBundles) {
				if(ab.Contains(str)) return ab.Load(str);
			}
		}
	}
	
	function ReadObject(parent : Transform) {
		var c : String;					//Character
		var i : int = 0;				//Index of param
		var n : String = "";			//Param name we are reading data for
		var v : String = "";			//Value we are building
		var d : Array = new Array();	//Array of all values in current param data
		var obj : GameObject;			//Object we have created
		
		while(true) {
			if(readChr >= data.length) return;
			
			//Get Char
			s = data[readChr];
			
			//We just attempted to read past the end of the world data - the world file must have been malformed
			/*if(s == "") {
				whirld.info = "Malformed World File";
				whirld.status = WhirldInStatus.SyntaxError;
			}*/
			
			//Ignore spaces
			if(s == " " || s == "\n" || s == "\t") { };
			
			//Name fully read, begin collecting param value(s)
			else if(s == ":") {
				n = v;
				v = "";
			}
			
			//Move to next section of value
			else if(s == ",") {
				d.Add(v);
				v = "";
			}
			
			//Begin recursively reading child object
			else if(s == "{") {
				readChr += 1;
				ReadObject(obj.transform);
				continue;	//Continue to next obj once the child "thread" we just launched has finished parsing objects at it's level
			}
			
			//Assign current value to object, Begin reading new value
			else if(s == ";" || s == "}") {
			
				//Object name just read, create object
				if(!obj) {
					if(objects.ContainsKey(v)) {
						if(objects[v] != null) var goP : GameObject = objects[v];
						else Debug.Log("Whirld: Objects[" + v + "] is null");
						//else goP = gameObject.Find();
					}
					else {
						goP = Resources.Load(v);
						if(goP) objects.Add(v, goP);
					}
					if(goP) {
						obj = GameObject.Instantiate(goP);
						obj.name = v;
					}
					else {
						obj = new GameObject(v);
						objects.Add(v, obj);
					}
					if(obj.name != "Base" && obj.name != "Sea" && obj.name != "JumpPoint" && obj.name != "Light") obj.transform.parent = parent;
					var whirldObject : WhirldObject = obj.GetComponent(WhirldObject);
					if(whirldObject) whirldObject.params = new Hashtable();
					var lightSource : Light = obj.GetComponent(Light);
				}
				
				//Object already created, assign property to object
				else {
					if((n == "p" || (n == "" && i == 1)) && d.length == 2) obj.transform.localPosition = Vector3(parseFloat(d[0]), parseFloat(d[1]), parseFloat(v));
					else if(n == "p" || (n == "" && i == 1)) obj.transform.localPosition = Vector3.one * parseFloat(v);
					else if((n == "r" || (n == "" && i == 2)) && d.length == 3) obj.transform.rotation = Quaternion(parseFloat(d[0]), parseFloat(d[1]), parseFloat(d[2]), parseFloat(v));
					else if((n == "r" || (n == "" && i == 2)) && d.length == 2) obj.transform.rotation = Quaternion.Euler(parseFloat(d[0]), parseFloat(d[1]), parseFloat(v));
					else if((n == "r" || (n == "" && i == 2)) && d.length == 0) obj.transform.rotation = Quaternion.identity;
					else if((n == "s" || (n == "" && i == 3)) && d.length == 0) obj.transform.localScale = Vector3.one * parseFloat(v);
					else if(n == "s" || (n == "" && i == 3)) obj.transform.localScale = Vector3(parseFloat(d[0]), parseFloat(d[1]), parseFloat(v));
					else if(n == "cc") {
						obj.AddComponent(CombineChildren);
						worldParams["ccc"] = 1;
						//if(!whirld.worldParams.ContainsKey("cc")) whirld.worldParams.Add("cc", 0);
					}
					else if(n == "m") {
						//d.Add(v);
						//ReadMesh(obj, d);
						info += "Inline Whirld mesh generation not supported\n";
					}
					else if(lightSource && n == "color") {
						lightSource.color.r = parseFloat(d[0]);
						lightSource.color.g = parseFloat(d[1]);
						lightSource.color.b = parseFloat(v);
					}
					else if(lightSource && n == "intensity") lightSource.intensity = parseFloat(v);
					else {
						if(whirldObject) {
							
							//Object Reference
							if(v.Substring(0, 1) == "#") whirldObject.params.Add(n, GetAsset(v.Substring(1)));
							
							//Text
							else whirldObject.params.Add(n, v);
							
						}
						else if(n != "") Debug.Log(obj.name + " Unknown Param: " + n + " > " + v);
					}
				}
								
				//Reset properties
				v = "";
				n = "";
				if(d.length > 0) d = new Array();
				i += 1;
				
				//Done reading this object
				if(s == "}") {
					//Finish up this object
					if(obj.name == "cube" || obj.name == "pyramid" || obj.name == "cone" || obj.name == "mesh") {
						TextureObject(obj);
					}
					//var renderer : MeshRenderer = obj.GetComponent(MeshRenderer);
					//if(renderer && (renderer.material == null || renderer.material.name == "Default-Diffuse (Instance)")) renderer.material = defaultMaterial;
					//Debug.Log(renderer.material);
					
					//Increment ReadChar
					readChr += 1;
					
					//Handle spaces
					while(readChr < data.length && (data[readChr] == " " || data[readChr] == "\n" || data[readChr] == "\t"))readChr += 1;
					
					//Read the next object
					if(readChr < data.length && data[readChr] == "{") {
						readChr += 1;
						ReadObject(parent);
						return;
					}
					
					//Done reading objects at this level of recursion
					else {
						return;
					}
				}
			}
			
			//Assign char to property we are reading
			else {
				if(n) v += s;	//Building value
				else n += s;	//Building name
			}
			readChr += 1;
		}
	}
	
	function TextureObject(go : GameObject) {
		
		var mf : MeshFilter = go.GetComponent(MeshFilter);
		if(!mf) return;
		mesh = mf.mesh;
		var uvs = new Vector2[mesh.vertices.Length];
		var tris = mesh.triangles;
		for (var i=0;i<tris.Length;i+=3) {
			var a : Vector3 = go.transform.TransformPoint(mesh.vertices[tris[i]]);
			var b : Vector3 = go.transform.TransformPoint(mesh.vertices[tris[i+1]]);
			var c : Vector3 = go.transform.TransformPoint(mesh.vertices[tris[i+2]]);
			var n : Vector3 = Vector3.Cross(a-c, b-c).normalized;
			if(Vector3.Dot(Vector3.up, n) >= .5 || Vector3.Dot(-Vector3.up, n) >= .5) {
				uvs[tris[i]]	= Vector2(a.x, a.z);
				uvs[tris[i+1]]	= Vector2(b.x, b.z);
				uvs[tris[i+2]]	= Vector2(c.x, c.z);
			}
			else if(Vector3.Dot(Vector3.right, n) >= .5 || Vector3.Dot(Vector3.left, n) >= .5) {
				uvs[tris[i]]	= Vector2(a.y, a.z);
				uvs[tris[i+1]]	= Vector2(b.y, b.z);
				uvs[tris[i+2]]	= Vector2(c.y, c.z);
			}
			else {
				uvs[tris[i]]	= Vector2(a.y, a.x);
				uvs[tris[i+1]]	= Vector2(b.y, b.x);
				uvs[tris[i+2]]	= Vector2(c.y, c.x);
			}
		}
	 	mesh.uv = uvs;
		
		/*
		mesh = mf.mesh;
		var uvs = new Vector2[mesh.vertices.Length];
		var tris = mesh.triangles;
		for (var i=0;i<tris.Length;i+=3) {
			var a : Vector3 = go.transform.TransformPoint(mesh.vertices[tris[i]]);
			var b : Vector3 = go.transform.TransformPoint(mesh.vertices[tris[i+1]]);
			var c : Vector3 = go.transform.TransformPoint(mesh.vertices[tris[i+2]]);
			var n : Quaternion = Quaternion.LookRotation(Vector3.Cross(a-c, b-c).normalized);
			a = n * a;
			b = n * b;
			c = n * c;
			uvs[tris[i]]	= Vector2(a.x, a.y);
			uvs[tris[i+1]]	= Vector2(b.x, b.y);
			uvs[tris[i+2]]	= Vector2(c.x, c.y);
		}
	 	*/
	 	
		/*
		var uvs = new Vector2[mf.mesh.vertices.Length];
		var tris = mf.mesh.triangles;
		var matrix : Matrix4x4 = new Matrix4x4();
		if(true /*worldSpace* /) {
			var o : Vector3 = mf.transform.position;
			o.x = o.x / mf.transform.lossyScale.x; //Mathf.Repeat(o.x / mf.transform.lossyScale.x, 1);
			o.y = o.y / mf.transform.lossyScale.y; //Mathf.Repeat(o.y / mf.transform.lossyScale.y, 1);
			o.z = o.z / mf.transform.lossyScale.z; //Mathf.Repeat(o.z / mf.transform.lossyScale.z, 1);
		}
		else o = Vector3.zero;
		for (var i=0; i<tris.Length; i+=3) {
			var up : Vector3 = Vector3.Cross(mf.mesh.vertices[tris[i]]-mf.mesh.vertices[tris[i+2]], mf.mesh.vertices[tris[i+1]]-mf.mesh.vertices[tris[i+2]]).normalized;
			var center : Vector3 = mf.transform.TransformPoint(mf.mesh.vertices[tris[i]] + mf.mesh.vertices[tris[i+1]] + mf.mesh.vertices[tris[i+2]] / 3);
			matrix.SetTRS(Vector3.zero, Quaternion.LookRotation(Vector3.Project(mf.transform.forward, up), up), mf.transform.lossyScale);
			var a : Vector3 = matrix.MultiplyPoint3x4(mf.mesh.vertices[tris[i]] + o);
			var b : Vector3 = matrix.MultiplyPoint3x4(mf.mesh.vertices[tris[i+1]] + o);
			var c : Vector3 = matrix.MultiplyPoint3x4(mf.mesh.vertices[tris[i+2]] + o);
			uvs[tris[i]]	= Vector2(a.x, a.z);
			uvs[tris[i+1]]	= Vector2(b.x, b.z);
			uvs[tris[i+2]]	= Vector2(c.x, c.z);
			Debug.DrawRay(center, Vector3.Project(mf.transform.forward, up).normalized, Color.red);
			//Debug.DrawRay(center, up * 100, Color.green);
			//Debug.DrawLine(mf.mesh.vertices[tris[i]],mf.mesh.vertices[tris[i+1]]);
			//Debug.DrawLine(c,b);
			//Debug.DrawLine(a,c);
		}
	 	*/
		
		/*
		mesh = mf.mesh;
		var uvs = new Vector2[mesh.vertices.Length];
		var tris = mesh.triangles;
		for (var i=0;i<tris.Length;i+=3) {
			var a : Vector3 = go.transform.TransformPoint(mesh.vertices[tris[i]]);
			var b : Vector3 = go.transform.TransformPoint(mesh.vertices[tris[i+1]]);
			var c : Vector3 = go.transform.TransformPoint(mesh.vertices[tris[i+2]]);
			var n : Vector3 = Vector3.Cross(a-c, b-c).normalized;
			var nA : Vector3 = Vector3(Mathf.Cos(90) * n.x + Mathf.Sin(90) * n.z, n.y, -Mathf.Sin(90) * n.x + Mathf.Cos(90) * n.z)
			var m : Vector3 = (a + b + c) / 3;
			var x : Matrix4x4 = Matrix4x4.TRS(Vector3.zero, Quaternion.LookRotation(nA, n), Vector3.one);
			a = x.MultiplyPoint(a);
			b = x.MultiplyPoint(b);
			c = x.MultiplyPoint(c);
			uvs[tris[i]]	= Vector2(a.x, a.z);
			uvs[tris[i+1]]	= Vector2(b.x, b.z);
			uvs[tris[i+2]]	= Vector2(c.x, c.z);
			Debug.DrawRay(m, n, Color.red);
			Debug.DrawRay(m, nA, Color.green);
		}*/
		
	}
	
	function GetURL(url) {
		if(url.Substring(0, 4) != "http") url = urlPath + url;
		return url;
	}
	
}