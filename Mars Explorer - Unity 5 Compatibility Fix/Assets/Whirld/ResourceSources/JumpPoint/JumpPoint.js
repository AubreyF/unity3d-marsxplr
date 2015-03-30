var whirldObject : WhirldObject;
private var time : int =  1;
private var randMin : int = 0;
private var randMax : int = 0;
private var velocity : int = 50;
private var lastBlast : float;

function Start() {
	if(!whirldObject || !whirldObject.params) return;
	if(whirldObject.params["JumpTime"]) time = parseFloat(whirldObject.params["JumpTime"]);
	if(whirldObject.params["JumpRandMin"]) randMin = parseFloat(whirldObject.params["JumpRandMin"]);
	if(whirldObject.params["JumpRandMax"]) randMax = parseFloat(whirldObject.params["JumpRandMax"]);
	if(whirldObject.params["JumpVelocity"]) velocity = parseFloat(whirldObject.params["JumpVelocity"]);
}

function OnTriggerEnter (other : Collider) {
	if(other.gameObject.layer == 14) return;
	lastBlast = Time.time + time;
}

function OnTriggerStay (other : Collider) {
	if(other.gameObject.layer == 14) return;
	if(Time.time - .1 < lastBlast) return;
	lastBlast = Time.time;
	if(randMin != 0 && randMax != 0) other.attachedRigidbody.AddForce(transform.up * Random.Range(randMin, randMax), ForceMode.VelocityChange);
	else other.attachedRigidbody.AddForce(transform.up * velocity, ForceMode.VelocityChange);
    //other.attachedRigidbody.AddExplosionForce(Random.Range(randMin, randMax), transform.position, 0, 2, ForceMode.VelocityChange);
}