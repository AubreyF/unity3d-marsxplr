private var mat : Material;
var upMode : boolean;

function Start() {
	mat = GetComponent(MeshRenderer).material;
	mat.mainTextureScale.x = 1;
	mat.mainTextureScale.y = .1;
}

function Update() {
	transform.localScale = Vector3.one * Mathf.Max(.5, Mathf.Min(10, Vector3.Distance(transform.position, Camera.main.transform.position) / 10));
	
	transform.localEulerAngles.y += Time.deltaTime * 10;
	if(transform.localEulerAngles.y > 360) transform.localEulerAngles.y = transform.localEulerAngles.y - 360;
	
	mat.mainTextureOffset.x += Time.deltaTime * .5;
	if(mat.mainTextureOffset.x > 1) mat.mainTextureOffset.x--;
	
	if(upMode) {
		mat.mainTextureOffset.y += Time.deltaTime * .1;
		if(mat.mainTextureOffset.y > .6) upMode = false;
	}
	else {
		mat.mainTextureOffset.y -= Time.deltaTime * .1;
		if(mat.mainTextureOffset.y < .4) upMode = true;
	}
}