private var motorMinSpeed = 100.00;
private var motorMaxAccel = 0.00;
private var motorAccelTime = 2.50;
private var motorPower = 0.00;
private var motorSpeed = 0.00;
private var motorSpeedNew = 0.00;
private var sideSlipDragForce = 150;
private var linearDragForce = 50;

private var hit : ContactPoint;
private var myTransform : Transform;
private var myTexture : Texture;
var TreadTex : Renderer;
var vehicle : Tank;
var rightSide = false;
var joint : ConfigurableJoint;
var offset : float;
var strtPos : Vector3;

function Start() {
	myTransform = transform;
	vehicle = transform.parent.transform.parent.gameObject.GetComponent(Tank);
	joint.connectedBody = vehicle.vehicle.GetComponent.<Rigidbody>();
	strtPos = transform.localPosition;
}

function OnEnable () {
	if(!joint.connectedBody) return;
	GetComponent.<Rigidbody>().isKinematic = true;
	transform.localRotation = Quaternion.identity;
	transform.localPosition = strtPos;
	if(joint.anchor != Vector3.zero) joint.anchor = Vector3.zero;
	GetComponent.<Rigidbody>().isKinematic = false;
	GetComponent.<Rigidbody>().velocity = Vector3.zero;
}

function OnCollisionStay(collision : Collision) {
	if(vehicle.vehicle.zorbBall || collision.collider.transform.root == transform.root) return;
	if(collision.transform.root && collision.transform.root.gameObject.GetComponent.<Rigidbody>()) {
		vehicle.vehicle.OnRam(collision.transform.root.gameObject); //we hit a tank track or something
	}
	else if (collision.rigidbody) {
		vehicle.vehicle.OnRam(collision.gameObject);
	}
	else for (hit in collision.contacts) {
		if(hit.otherCollider.gameObject.layer == 0 || hit.otherCollider.gameObject.layer == 11) {
			gotDirt(hit, collision);
			return;
		}
	}
}

function gotDirt(hit : ContactPoint, collision : Collision) {
	if(transform.InverseTransformPoint(hit.point).y > 0) return;	//Don't let the upper tip collide with terrain - we get launched for some reason
	
	var locVel : Vector3 = vehicle.vehicle.myRigidbody.GetPointVelocity(hit.point);
	if(locVel.magnitude > 1000) {
		Debug.Log("Crazy Track LocVel: " + locVel);
		locVel = locVel.normalized * 1000;
	}
	locVel = myTransform.InverseTransformDirection(locVel);
	
	offset += (Time.deltaTime * locVel.z * -1.2);
	if(offset > 1) offset -= 1;
	if(offset < 0) offset += 1;
    TreadTex.material.SetTextureOffset("_MainTex", Vector2(0, offset));
    TreadTex.material.SetTextureOffset("_BumpMap", Vector2(0, offset));
	
	if(vehicle.vehicle.input.y > 0) {			//Forward
		if(motorSpeed < 0) motorSpeed = -motorSpeed;
		if(motorSpeed < motorMinSpeed) motorSpeed = motorMinSpeed;
		motorSpeedNew = Game.Settings.tankPower * (Mathf.Max(0.1,Game.Settings.tankSpeed - locVel.z) / Game.Settings.tankSpeed);
		if(motorSpeedNew > motorSpeed) motorSpeed = Mathf.SmoothDamp(motorSpeed, motorSpeedNew, motorMaxAccel, motorAccelTime);
		else motorSpeed = motorSpeedNew;
		motorPower = motorSpeed;
		
		if(vehicle.vehicle.input.x != 0) {
			if(rightSide && vehicle.vehicle.input.x > 0) motorPower = 0;
			else if(!rightSide && vehicle.vehicle.input.x < 0) motorPower = 0;
		}
	}
	else if(vehicle.vehicle.input.y < 0) {		//Reverse
		if(motorSpeed > 0) motorSpeed = -motorSpeed;
		if(motorSpeed > -motorMinSpeed) motorSpeed = -motorMinSpeed;
		motorSpeedNew = -Game.Settings.tankPower * (Mathf.Max(0.1,Game.Settings.tankSpeed + locVel.z) / Game.Settings.tankSpeed);
		if(motorSpeedNew < motorSpeed) motorSpeed = Mathf.SmoothDamp(motorSpeed, motorSpeedNew, motorMaxAccel, motorAccelTime);
		else motorSpeed = motorSpeedNew;
		motorPower = motorSpeed;
		
		if(vehicle.vehicle.input.x != 0) {
			if(rightSide && vehicle.vehicle.input.x > 0) motorPower = 0;
			else if(!rightSide && vehicle.vehicle.input.x < 0) motorPower = 0;
		}
	}
	else {										//Spin
		if(vehicle.vehicle.input.x != 0) {
			motorPower = Game.Settings.tankPower * vehicle.vehicle.input.x * -.5 * (rightSide ? 1 : -1);
		}
		else motorPower = 0;
	}
	
	var force : Vector3 = Vector3(
		locVel.x * -sideSlipDragForce,			//Side
		10,										//Vertical
		(motorPower < -0.1 || motorPower > 0.1 ? motorPower : locVel.z * -linearDragForce)		//Forward
	);	
	GetComponent.<Rigidbody>().AddForceAtPosition(Quaternion.LookRotation(Vector3.Cross(transform.right, hit.normal)) * force, Vector3(/*hit.point.x*/transform.position.x,hit.point.y,hit.point.z) + transform.TransformDirection(Vector3.up * Game.Settings.tankGrip));
	//Debug.DrawRay(hit.point, Quaternion.LookRotation(Vector3.Cross(transform.right, hit.normal)) * force);
}