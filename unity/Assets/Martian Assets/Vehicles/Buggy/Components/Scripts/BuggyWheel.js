/*#pragma strict

var wheelIndex : int;
var linkage : Transform;
var car : Buggy;
private var wheelRadius = 0.30;
private var wheelCircumference = wheelRadius * Mathf.PI * 2;
private var hit : RaycastHit;
private var parent : Rigidbody;
parent = transform.root.rigidbody;
private var graphic : Transform;
graphic = transform.FindChild("Graphic");
private var myTransform : Transform;
var velocityAtTouch : Vector3;
var compression : float;
var test : float;

function Awake () {
   myTransform = transform;
}

function FixedUpdate () {
	if(Physics.Raycast(myTransform.position, car.down, hit, car.suspensionRange + wheelRadius, ~1<<4) && hit.collider.transform.root != myTransform.root) {
		if(car.wing.active && Mathf.Abs(car.motorSpeed) > 10) car.rigidbody.AddRelativeForce(0,800,0);		//This allows the car to take off without getting stuck to the ground
		velocityAtTouch = myTransform.InverseTransformDirection(parent.GetPointVelocity(myTransform.position));
		compression = -((hit.distance) / (car.suspensionRange + wheelRadius)) + 1;
		friction = Game.Settings.buggyTr * compression * (40 - Mathf.Min(20, Mathf.Abs(velocityAtTouch.x) * .7)) * .025;
		parent.AddForceAtPosition(myTransform.TransformDirection(Vector3.Min(Vector3(
			-velocityAtTouch.x * friction,						//Sideslip
			-velocityAtTouch.y * 30 + compression * 350,		//Shocks, Springs
			-(velocityAtTouch.z - car.motorSpeed) * friction	//Motor
		),Vector3(1000,1000,1000))), hit.point);
		//car.updateMotorForce((velocityAtTouch.z - car.motorSpeed) * friction * Time.fixedDeltaTime);
	}
	else hit.distance = -1;
}

function Update() {
	if(hit.distance != -1) graphic.position = myTransform.position + (car.down * (hit.distance - wheelRadius));
	else graphic.position = myTransform.position + (car.down * car.suspensionRange);
	
	linkage.LookAt(graphic.position);
	graphic.transform.Rotate(360 * (car.motorSpeed / wheelCircumference) * Time.deltaTime, 0, 0); 
}
*/


/*

if(car.vehicle.brakes) {
if(wheelIndex == 2 || wheelIndex == 3)  {
}
}
*/
/*
private var suspensionDamp = 15;
private var sidewaysFriction = 50; //50
private var sidewaysDamp = 2.00;
private var sidewaysSlipVelocity = 4;
private var sidewaysSlipForce = 15;
private var sidewaysSlipFriction = 1; //23
private var forwardFriction = 50;
private var forwardSlipVelocity = 10.00;
private var forwardSlipForce = 50;
private var forwardSlipFriction = 20.00;
private var usedSideFriction = 0.00;
private var usedForwardFriction = 0.00;
private var sideSlip = 0.00;
private var forwardSlip = 0.00;
*/
/*
var compComp : float;
if(wheelIndex == 0)			compComp = car.wheelComp[1];
else if(wheelIndex == 1)	compComp = car.wheelComp[0];
else if(wheelIndex == 2)	compComp = car.wheelComp[3];
else if(wheelIndex == 3)	compComp = car.wheelComp[2];
car.wheelComp[wheelIndex]	= hit.distance;
*/
//compression += Mathf.Min(suspensionRange - compComp, .5);

//if(!System.Single.IsNaN(forces.x)) {

/*
velocityAtTouch = myTransform.InverseTransformDirection(parent.GetPointVelocity(myTransform.position));
forwardDifference = velocityAtTouch.z - car.motorSpeed;
usedForwardFriction = Mathf.Lerp(forwardFriction, forwardSlipFriction, forwardSlip * forwardSlip) * compression;
forwardForce = -forwardDifference * usedForwardFriction;
forwardSlip = Mathf.Lerp(forwardForce / forwardSlipForce, forwardDifference / forwardSlipVelocity, .5);
//sideForce = -sidewaysDifference * Mathf.Lerp(sidewaysFriction, sidewaysSlipFriction, sideSlip * sideSlip) * compression;
//sideSlip = Mathf.Lerp(sideForce / sidewaysSlipForce, sidewaysDifference / sidewaysSlipVelocity, .3);
*/