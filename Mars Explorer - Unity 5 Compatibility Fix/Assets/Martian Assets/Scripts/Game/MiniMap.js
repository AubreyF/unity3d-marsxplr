var camHeight : float = 650;
var terrains : Array = new Array();

private var revertFogState = false;
private var terrainLightingEnabled = false;	//DRAGONHERE: TerrainLighting depricated, rewrite this code to use new QualitySettings system
private var terrainLOD = 0;
private var terrainTreeDistance = 0;
private var terrainDetailDistance = 0;
private var terrainBasemapDistance = 0;

function Update () {
	if(!Game.Settings.minimapAllowed || !Game.Settings.useMinimap || Game.Controller.loadingWorld || !Game.Player) {
		GetComponent.<Camera>().enabled = false;
		return;
	}
	else GetComponent.<Camera>().enabled = true;
	
	transform.position = Camera.main.transform.position;
	transform.position.y = Game.Player.transform.position.y + camHeight;
	transform.rotation = Quaternion.Slerp (transform.rotation, Quaternion.Euler(90, Game.Player.transform.eulerAngles.y, 0), Time.deltaTime);
}

function OnPreRender () {
	revertFogState = RenderSettings.fog;
	RenderSettings.fog = false;
	
	if(World.terrains && World.terrains.length > 0) {
		//if(World.terrains[0].lighting == TerrainLighting.Pixel) terrainLightingEnabled = true;
		//else terrainLightingEnabled = false;
		//terrainBasemapDistance = World.terrains[0].basemapDistance;
		terrainLOD = World.terrains[0].heightmapMaximumLOD;
		terrainTreeDistance = World.terrains[0].treeDistance;
		terrainDetailDistance = World.terrains[0].detailObjectDistance;
		for (var trn : Terrain in World.terrains) {
			//trn.basemapDistance = 1000;
			if(Game.Settings.renderLevel > 4) trn.heightmapMaximumLOD = 3;
			else if(Game.Settings.renderLevel > 3) trn.heightmapMaximumLOD = 4;
			else trn.heightmapMaximumLOD = 5;
			//trn.lighting = TerrainLighting.Lightmap;
			trn.treeDistance = 0;
			trn.detailObjectDistance = 0;
		}
	}
}

function OnPostRender () {
	RenderSettings.fog = revertFogState;
	
	if(World.terrains) for (var trn : Terrain in World.terrains) {	
		//trn.basemapDistance = terrainBasemapDistance;
		//trn.lighting = (terrainLightingEnabled ? TerrainLighting.Pixel : TerrainLighting.Lightmap);
		trn.treeDistance = terrainTreeDistance;
		trn.detailObjectDistance = terrainDetailDistance;
		trn.heightmapMaximumLOD = terrainLOD;
	}
}

function OnGUI() {
	if(!Game.Settings.minimapAllowed || !Game.Settings.useMinimap || !Game.Player) return;
	camHeight = GUI.HorizontalSlider(Rect(Screen.width * .01 + 25,Screen.height - 20 - Screen.height * .001, Screen.width * .25 - 50, 20), camHeight, 200, 1300);
}

@script RequireComponent (Camera)	