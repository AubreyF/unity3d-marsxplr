//var sphere : Transform;
var shield : Transform;
private var offset : float;
var tagColor : Color;
var ramColor : Color;
var ram : boolean = false;
var vehicle : Vehicle;

function Start() {
	shield.renderer.material.color = tagColor;
	vehicle = transform.root.gameObject.GetComponent(Vehicle);
}

function Update() {
	offset += (Time.deltaTime * .1);
	if(offset > 1) offset -= Mathf.Floor(offset);
	
    //sphere.renderer.material.SetTextureOffset("_MainTex", Vector2(0, offset));
    //sphere.rotation = Quaternion.identity;
    
    shield.renderer.material.SetFloat("_Offset", offset);
    shield.renderer.material.color.a = Mathf.Lerp(shield.renderer.material.color.a, ((ram) ? ramColor.a : tagColor.a), Time.deltaTime * 3);
    shield.rotation = Quaternion.identity;
}

function colorSet(r : boolean) {
	yield new WaitForFixedUpdate (); //bizare, but necessary...
	if(r) shield.renderer.material.color = ramColor;
	else shield.renderer.material.color = tagColor;
	shield.renderer.material.color.a = 0;
	ram = r;
}

function OnCollisionEnter(collision : Collision) {
	var i : float = collision.relativeVelocity.magnitude * Mathf.Abs(Vector3.Dot(collision.contacts[0].normal,collision.relativeVelocity.normalized));
	if(i > 3) shield.renderer.material.color.a = ((ram) ? ramColor.a : tagColor.a) + i * .1;
}

function OnTriggerStay (other : Collider) {
	if(other.gameObject.layer == 14) return;
	if(other.name == "ORB(Clone)" && shield.renderer.material.color.a < 3) shield.renderer.material.color.a = 3;
	if(!vehicle.networkView.isMine) return;
	if(other.attachedRigidbody) {
		vehicle.OnRam(other.attachedRigidbody.gameObject);
	}
}

function OnTriggerEnter (other : Collider) {
	if(other.gameObject.layer == 14) return;
	if(other.name == "ORB(Clone)") {
		shield.renderer.material.color.a = 10;
	}
}

function OnLaserHit() {
	shield.renderer.material.color.a = 5;
}