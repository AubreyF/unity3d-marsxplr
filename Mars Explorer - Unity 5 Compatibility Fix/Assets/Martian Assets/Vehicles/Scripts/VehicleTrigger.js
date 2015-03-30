private var vehicle : Vehicle;

function Start() {
	vehicle = transform.root.GetComponent(Vehicle);
}

function OnTriggerStay (other : Collider) {
	if(other.gameObject.layer == 14 || !vehicle.GetComponent.<NetworkView>().isMine) return;
	if(other.attachedRigidbody) vehicle.OnRam(other.attachedRigidbody.gameObject);
}