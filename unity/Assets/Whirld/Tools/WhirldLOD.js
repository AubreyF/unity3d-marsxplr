var lodObjs : GameObject[];
var lodLevMax : int = 0;

@HideInInspector
var level : int = 0;
private var lastLevel : int = -1;
private var lodCheck : float = Random.Range(30, 60) / 10;

function Start () {
	InvokeRepeating("SetLOD", 0, lodCheck);
}

function SetLOD() {
	
	//Level determined by distance to cam
	if(lodLevMax == 0) {
		level = (World.lodDist > 0 ?
			parseInt(Mathf.Lerp(0, lodObjs.length - 1, Vector3.Distance(transform.position, Camera.main.transform.position) / World.lodDist)) :
			lodObjs.length - 1);
	}
	
	//Level determined directly by game quality level
	else {
		level = (QualitySettings.currentLevel >= lodLevMax ? 0 : 1);
		/*level = (World.lodDist > 0 ?
			parseInt(Mathf.Lerp(lodObjs.length - 1, 0, Game.Settings.renderLevel / lodLevMax)) :
			lodObjs.length - 1);*/
	}
	
	if(lastLevel != level) {
		BroadcastMessage ("OnLOD", level, SendMessageOptions.DontRequireReceiver);
		for(i=0; i < lodObjs.length; i++) {
			var desired : boolean = (i == level);
			if(lodObjs[i].active != desired) lodObjs[i].SetActiveRecursively(desired);
		}
		lastLevel = level;
	}
}