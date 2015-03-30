var Lobby : Lobby;
var bg : GUITexture;

var logoOffset : int;

function Awake() {
	if(Time.time > 6) GetComponent.<GUITexture>().color.a = 0;
	else if(bg) bg.pixelInset = Rect(0, 0, Screen.width, Screen.height);
}

function Update() {	
	var width = Screen.height * .84;
	if(width > 600) width -= (width - 600) * .5;
	if(width > Screen.width - 30) width = Screen.width - 30;
	if(Time.time > 1.5 && !Camera.main.GetComponent.<AudioSource>().isPlaying && PlayerPrefs.GetInt("useMusic", 1) != 0) Camera.main.GetComponent.<AudioSource>().Play();
	
	if(Time.time < 5) {
		bg.color.a = 1 - (Time.time / 4);
		if(Time.time < 2.5) {
			GetComponent.<GUITexture>().color.a = Mathf.Lerp(0, .6, Time.time * (1 / 2.5));
			GetComponent.<GUITexture>().pixelInset = Rect (Screen.width / 2 - width / 2,  Screen.height / 2 - width / 4, width, width / 2);
		}
		if(Time.time > 4.25) {
			GetComponent.<GUITexture>().pixelInset = Rect (Screen.width / 2 - width / 2, easeOutExpo(Time.time - 4.25,
				Screen.height / 2 - width / 4,
				Screen.height - (width / 2)
			, .75), width, width / 2);
			//width = (width * 20) * Mathf.Pow(2, 10 * ((Time.time - 3) / 2 - 1)) + width;
		}
	}
	else if(Time.time > 6) {
		if(bg) Destroy(bg);
		//if(Time.timeSinceLevelLoad > 6) {
			GetComponent.<GUITexture>().color.a = Mathf.Lerp(GetComponent.<GUITexture>().color.a, Lobby.GUIAlpha - .4, Time.deltaTime * 4);
			GetComponent.<GUITexture>().pixelInset = Rect(Screen.width / 2 - width / 2, Screen.height - (width / 2), width, width / 2);
			//if(width < 480) width = 480;
		//}
	}
	
	logoOffset = width / 2;
}

//time, begin, change, duration
function easeOutExpo(t, b, c, d) {
	c = c - b;
	return c * (-Mathf.Pow(2, -10 * t/d) + 1) + b; 
} 

function easeInOutExpo(t, b, c, d) {
	c = c - b;
	if (t < d/2) return 2*c*t*t/(d*d) + b;
	var ts = t - d/2;
	return -2*c*ts*ts/(d*d) + 2*c*ts/d + c/2 + b;
}