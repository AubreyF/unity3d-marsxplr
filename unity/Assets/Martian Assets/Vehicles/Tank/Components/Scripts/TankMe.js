var vehicle : Vehicle;
var bellyup = false;

function FixedUpdate () {	
	if(vehicle.myRigidbody.isKinematic == true) return; //We are materializing, don't try to manipulate physics
	
	if(vehicle.brakes && vehicle.myRigidbody.velocity.magnitude < 3) {
		vehicle.myRigidbody.velocity = Vector3.zero;
		vehicle.myRigidbody.angularVelocity = Vector3.zero;
		if(vehicle.input.y) vehicle.myRigidbody.drag = 5;
		else vehicle.myRigidbody.drag = 10000; //rigidbody.Sleep();
		//vehicle.myRigidbody.angularDrag = 2;
	}
	else {
		vehicle.myRigidbody.angularDrag = 2;
		vehicle.myRigidbody.drag = .01;
	}
	
	//Steering
	//joint.targetRotation = Quaternion.Euler(vehicle.input.x * -120, 0, 0);
	//print(joint.targetRotation);
	
	if(bellyup && Vector3.Angle(transform.up, Vector3.up) < 35) bellyup = false;
}

function OnCollisionStay(collision : Collision) {
	if(vehicle.zorbBall) return;
	for (var contact : ContactPoint in collision.contacts) {
		if(contact.otherCollider.gameObject.layer != 0) continue;
		if(bellyup == false && vehicle.myRigidbody.velocity.sqrMagnitude < 20 && vehicle.myRigidbody.angularVelocity.sqrMagnitude < 5 && Vector3.Angle(transform.up, contact.normal) > 130) {
			bellyup = true;
		}
		/*else if(Vector3.Angle(transform.up, contact.normal) < 30) {
			bellyup = false;
		}*/
		if(bellyup) {
			vehicle.myRigidbody.AddForce(Vector3.up * 5000);
			vehicle.myRigidbody.AddTorque(Vector3.Cross(transform.up, Vector3.up) * 100000, ForceMode.Acceleration);
		}
	}
}

function OnSetSpecialInput() {
}