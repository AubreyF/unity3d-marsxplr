var Lobby : Lobby;
//var blur : MotionBlur;

function Start() {
	//particleEmitter.emit = true;
	//gameObject.GetComponent(ParticleAnimator).force.z = -Lobby.GUIHide * 15;
	//DontDestroyOnLoad(this);
}

function Update () {
	if(Application.loadedLevel == 1 && Lobby.GUIHide > 0) {
		//gameObject.GetComponent(ParticleAnimator).force.y = -Lobby.GUIHide * 10;
		//blur.blurAmount = Mathf.Min(1, Lobby.GUIHide * 3);
		//gameObject.GetComponent(ParticleRenderer).material.color.a = .5 - Lobby.GUIHide;
		var col : Color = gameObject.GetComponent(ParticleRenderer).material.GetColor("_TintColor");
		col.a = .5 - Lobby.GUIHide / 2;
		gameObject.GetComponent(ParticleRenderer).material.SetColor("_TintColor", col);
		//gameObject.GetComponent(ParticleRenderer).material.GetColor("_TintColor").a = .5 - Lobby.GUIHide;
	}
	else if(Application.loadedLevel > 1) {
		GetComponent.<ParticleEmitter>().worldVelocity.y = -Mathf.Min(Time.timeSinceLevelLoad, 5);
		if(Time.timeSinceLevelLoad > 7 || QualitySettings.GetQualityLevel() < QualityLevel.Good) GetComponent.<ParticleEmitter>().emit = false;
		//particleEmitter.emit = true;
		//gameObject.GetComponent(ParticleAnimator).force.y = -Mathf.Min(Time.timeSinceLevelLoad * .01, .1);
		/*col = gameObject.GetComponent(ParticleRenderer).material.GetColor("_TintColor");
		col.a = Mathf.Min(Time.timeSinceLevelLoad * 1, .5);
		gameObject.GetComponent(ParticleRenderer).material.SetColor("_TintColor", col);*/
		//gameObject.GetComponent(ParticleRenderer).material.GetColor("_TintColor").a = Mathf.Min(Time.timeSinceLevelLoad * 1, .5);
		//if(Time.timeSinceLevelLoad > 10) Destroy(gameObject);
	}
}
