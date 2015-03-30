var vehicle : Vehicle;
var mat : Material;

var magSteer : float = 15;
var magThrottle : float = 1;
var minThrottle : float = .2;

function Start() {
	vehicle = gameObject.transform.root.gameObject.GetComponentInChildren(Vehicle);
}

function Update () {
	mat.mainTextureOffset.y -= Time.deltaTime * .8;
	if(mat.mainTextureOffset.y < -.5) mat.mainTextureOffset.y = mat.mainTextureOffset.y + .1;
	
	if(magSteer > 0) transform.localEulerAngles.y = -vehicle.input.x * magSteer;
	if(magThrottle > 0) transform.localScale.y = Mathf.Max(minThrottle, (vehicle.inputThrottle ? vehicle.input.z : vehicle.input.y) * magThrottle);
	else transform.localScale.y = minThrottle;
}