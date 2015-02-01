var thrustMask : LayerMask = -1;
var vehicle : Vehicle;
private var hitDown : RaycastHit;
private var thrustLast : float;
private var hoverHeight : float;

function InitVehicle(veh : Vehicle) {
	vehicle = veh;
}

function FixedUpdate () {
	if(vehicle.myRigidbody.isKinematic == true) return; //We are materializing, don't try to manipulate physics
	
	vehicle.myRigidbody.centerOfMass.x = 0;
	vehicle.myRigidbody.centerOfMass.z = 0;
	vehicle.myRigidbody.centerOfMass.y = -.3;
	vehicle.myRigidbody.inertiaTensor = Vector3(15, 15, 15);
	vehicle.myRigidbody.mass = 50;
	
	var locvel = vehicle.myRigidbody.transform.InverseTransformDirection(vehicle.myRigidbody.velocity);
	
	if(!vehicle.brakes) {
		vehicle.myRigidbody.drag = 0;
		vehicle.myRigidbody.angularDrag = 4;
		vehicle.myRigidbody.AddRelativeForce(Vector3(locvel.x * -10, /*locvel.y * -1*/0,(vehicle.input.y > 0 ? vehicle.input.y * Game.Settings.hoverThrust : 0)));	
	}
	else {
		if(vehicle.myRigidbody.velocity.magnitude > 5) vehicle.myRigidbody.drag = 1.5;
		else vehicle.myRigidbody.drag = 100;
		vehicle.myRigidbody.angularDrag = 20;
	}
	
	var hit : RaycastHit;
	if (Physics.Raycast(transform.position, Vector3.up * -1, hit, 30, thrustMask) || transform.position.y < Game.Settings.lavaAlt + 30) {
		if(!hit.distance || hit.distance > Mathf.Max(0, transform.position.y - Game.Settings.lavaAlt) || transform.position.y < Game.Settings.lavaAlt) {
			hit.distance = Mathf.Max(0, transform.position.y - Game.Settings.lavaAlt);
			hit.normal = Vector3.up;
		}
		
		hoverHeight = (Physics.Raycast(transform.position, Vector3.up, 5, thrustMask) ?
			(hoverHeight > 5 ? hoverHeight - Time.deltaTime * 3 : 5) :													//Duck!
			(hoverHeight < Game.Settings.hoverHeight ? hoverHeight + Time.deltaTime * 3 : Game.Settings.hoverHeight)	//Cruise
		);
		
		if(hit.distance < hoverHeight) {
			vehicle.myRigidbody.AddForce(transform.up * (hoverHeight - hit.distance) * Game.Settings.hoverHover);							//Hover force
			if(thrustLast > hit.distance) vehicle.myRigidbody.AddForce(hit.normal * Mathf.Min((thrustLast - hit.distance) * Game.Settings.hoverRepel, 10), ForceMode.VelocityChange);		//Anticollision force
		}
		vehicle.myRigidbody.AddTorque(Vector3.Cross(transform.up, hit.normal) * Vector3.Angle(transform.up, hit.normal) * .2 * (40 - Mathf.Min(40,hit.distance)));
		thrustLast = hit.distance;
	}
	else {
		vehicle.myRigidbody.angularDrag = .5;
	}
	
	//Steering
	vehicle.myRigidbody.AddRelativeTorque(Vector3(
		vehicle.input.y * 30, //(((transform.eulerAngles.x > 180 ? transform.eulerAngles.x - 360 : transform.eulerAngles.x) < 20 && vehicle.input.y > 0) ? 
		vehicle.input.x * 100, //vehicle.input.y
		(vehicle.input.x > 0 ? ((transform.eulerAngles.z > 180 ? transform.eulerAngles.z - 360 : transform.eulerAngles.z) < 40 ? vehicle.input.x : 0) : ((transform.eulerAngles.z > 180 ? transform.eulerAngles.z - 360 : transform.eulerAngles.z) > -40 ? vehicle.input.x : 0)) * -200
	));
}