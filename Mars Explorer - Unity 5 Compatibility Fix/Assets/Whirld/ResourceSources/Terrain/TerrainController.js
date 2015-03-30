var whirldObject : WhirldObject;
var trn : Terrain;
var trnDat : TerrainData;
var updateTime : float = -1;
var seaLevel : float;

var dat : TerrainData;

function OnSceneGenerated() {

	if(!trnDat)	Destroy(this);
	trn = GetComponent(Terrain);

	//Move trees to MainCamera layer - http://answers.unity3d.com/questions/1629/minimap-camera-terrain-vegitation/1631#1631
	//for(var tP : TreePrototype in trnDat.treePrototypes) tP.prefab.layer = 11;
	//for(var dP : DetailPrototype in trnDat.detailPrototypes) dP.prototype.layer = 11;

	//Find WhirldObject
	whirldObject = gameObject.GetComponent(WhirldObject);
	if(!whirldObject || !whirldObject.params || !whirldObject.params["SeaFloorTexture"]) {
		Destroy(this);
		return;
	}
	whirldObject.Activate();	//Just in case it hasn't yet activated...

	//Init SplatMap Array
	var splatsOld = trnDat.splatPrototypes;
	var splatsNew = new SplatPrototype[trnDat.splatPrototypes.length + 1];

	//Copy Data to New SplatMap Array
	for(i=0; i < trnDat.splatPrototypes.length; i++) splatsNew[i] = splatsOld[i];

	//Add SeaFloorTexture Splat Channel to TerrainData Object
	splatsNew[splatsNew.length - 1] = new SplatPrototype();
	splatsNew[splatsNew.length - 1].texture = whirldObject.params["SeaFloorTexture"];
	splatsNew[splatsNew.length - 1].tileSize = Vector2(15, 15);
	trnDat.splatPrototypes = splatsNew;

	//Prepare to Regenerate SeaFloor AlphaMap Channel
	dat = new TerrainData();
	dat.alphaMap = trnDat.GetAlphamaps(0, 0, trnDat.alphamapResolution, trnDat.alphamapResolution);
	dat.heightMap = trnDat.GetHeights(0, 0, trnDat.heightmapWidth, trnDat.heightmapHeight);

	ReSplat();
}

function OnPrefsUpdated() {
	if(!World.sea || seaLevel == World.sea.position.y) return;

	if(updateTime == -1) {
		updateTime = Time.time + 3;
		while(Time.time < updateTime) yield;
		ReSplat();
	}

	else {
		updateTime = Time.time + 3;		//We are just bumping the execution of this coroutine farther into the future
	}

	/*
	Debug.DrawRay(transform.position, Vector3.up * 1000, Color.red);
	Debug.DrawRay(Vector3(transform.position.x + trnDat.size.x, 0, 0), Vector3.up * 1000, Color.green);
	Debug.DrawRay(Vector3(0, 0, transform.position.z + Mathf.ParseFloat(150 / trnDat.alphamapResolution) * trnDat.size.z), Vector3.up * 1000, Color.yellow);

	for (y = 0; y < trnDat.alphamapResolution; y++) for (x = 0; x < trnDat.alphamapResolution; x++) {
		Debug.DrawRay(
			Vector3(transform.position.x + ((x / trnDat.alphamapResolution) * trnDat.size.x), 0, transform.position.z + ((y / trnDat.alphamapResolution) * trnDat.size.z)),
			Vector3.up * 1000,
			Color.blue);
	}*/
}

function ReSplat() {

	updateTime = -1;
	if(World.sea) seaLevel = World.sea.position.y;
	else if(GameObject.Find("Sea")) seaLevel = GameObject.Find("Sea").transform.position.y;
	else return;

	//Create new 3D array to work with - JS nD array support is just about nonexistent...
	var alphaMap = trnDat.GetAlphamaps(0, 0, trnDat.alphamapResolution, trnDat.alphamapResolution);	//dat.alphaMap

	//Synthesize SeaFloor channel based upon raycasts to check for water
	for (y = 0; y < trnDat.alphamapResolution; y++) for (x = 0; x < trnDat.alphamapResolution; x++) {

		/*
		//Examine this terrain "Pixel"
		var hits = Physics.RaycastAll(
			Vector3(transform.position.x + parseFloat(x / trnDat.alphamapResolution) * trnDat.size.x, 999999, transform.position.z + parseFloat(y / trnDat.alphamapResolution) * trnDat.size.z),
			Vector3.up * -1,
			Mathf.Infinity);
		var submerged : boolean = false;

		var trnAlt : float = 999999;
		var seaAlt : float = -999999;
	    for (var i=0; i<hits.length; i++) {

			//Terrain Hit
			if(hits[i].transform == transform)	{
				trnAlt = hits[i].point.y;
				if(hits[i].point.y > 0) Debug.Log(hits[i].point.y);
			}

			//Sea Surface Hit
			else if(hits[i].transform.gameObject.layer == 4) {
				if(hits[i].point.y > seaAlt) seaAlt = hits[i].point.y;
			}

		}

		//Check if this pixel is Submerged
		if(seaAlt > trnAlt || trnAlt < 0) {
			submerged = true;
			var depth : float = seaAlt + trnAlt;
		}*/

		//Check if this pixel is submerged
		var submerged : boolean = false;
		var trnAlt : float = transform.position.y + parseFloat(dat.heightMap[parseFloat(x / parseFloat(trnDat.alphamapResolution)) * trnDat.heightmapWidth, parseFloat(y / parseFloat(trnDat.alphamapResolution)) * trnDat.heightmapHeight] * trnDat.size.y);	//(y >= (trnDat.alphamapResolution / 2) ? y - (trnDat.alphamapResolution / 2): y + (trnDat.alphamapResolution / 2))
		if(trnAlt < seaLevel) {
			submerged = true;
			var depth : float = seaLevel + trnAlt;
		}

		//Update AlphaMap Array
		for (z = 0; z < trnDat.alphamapLayers; z++) {
			if(submerged == true) alphaMap[x, y, z] = (z == trnDat.alphamapLayers - 1 ? 1 : 0);
			else alphaMap[x, y, z] = (z == trnDat.alphamapLayers - 1 ? 0 : dat.alphaMap[x, y, z]);
		}

	}

	//Assign regenerated AlphaMap to Terrain
	trnDat.SetAlphamaps(0, 0, alphaMap);

	//Recalculate Basemap
	trn.terrainData = trnDat;
	trnDat.SetBaseMapDirty();
	//trnDat.ResetDirtyDetails();	//DRAGONHERE: now protected, need to find a workaround
	trnDat.RefreshPrototypes();
	trn.Flush();

}
