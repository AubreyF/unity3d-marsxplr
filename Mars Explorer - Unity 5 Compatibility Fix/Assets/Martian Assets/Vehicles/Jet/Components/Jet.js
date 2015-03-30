#pragma strict

var vehicle : Vehicle;
var landingGear : GameObject[];
var landingGearScale : float;
var hoverThrusters : Transform[];
var mainThrusterParticles : ParticleRenderer;
var mainThrusterCone : ThrustCone;
var mainThruster : Transform[];
var thrustMask : LayerMask = -1;
var bodyCollider : MeshCollider;
var lod : WhirldLOD;

var hoverThrustFactor = 1;
var hoverSteerFactor = .1;
var hoverAngDrag = .1;
var hoverLevelForceFactor = .2;
var flightThrustFactor = 5;
var flightAngDrag = .01;

var atmosDensity : float;
var locvel : Vector3;
var speed : float;
var pitch : float;
var roll : float;
var angleOfAttack : float;
var stallFactor : float;

private var grav : float;
private var mass : float;
private var inertiaTensor : Vector3;
private var inertiaTensorRotation : Quaternion;

var lavaFloat : float = .1;
var hit : RaycastHit;

function InitVehicle(veh : Vehicle) {
	vehicle = veh;
	vehicle.specialInput = true; //Start out in landing mode

	mass = vehicle.myRigidbody.mass;
	grav = -Physics.gravity.y * mass;
	inertiaTensor = vehicle.myRigidbody.inertiaTensor;
	inertiaTensorRotation = vehicle.myRigidbody.inertiaTensorRotation;
}

function Update () {
	if(!vehicle) return;

	//Thruster Particles
	if(vehicle.specialInput) {
		for(var thruster : Transform in hoverThrusters) {
			thruster.gameObject.GetComponent.<ParticleEmitter>().emit = true;
			thruster.gameObject.GetComponent.<ParticleEmitter>().localVelocity.y = -1 * vehicle.input.z;
			thruster.gameObject.GetComponent.<ParticleEmitter>().minSize = thruster.gameObject.GetComponent.<ParticleEmitter>().maxSize = Mathf.Max(.1, vehicle.input.z * .3);
		}
		if(lod.level == 0) {
			mainThrusterParticles.gameObject.GetComponent.<ParticleEmitter>().localVelocity.x = 1 * vehicle.input.x;
			mainThrusterParticles.gameObject.GetComponent.<ParticleEmitter>().localVelocity.y = -1 * vehicle.input.y;
		}
		else mainThrusterCone.magThrottle = 0;
	}
	else {
		if(vehicle.brakes) vehicle.input.z = 0;

		if(lod.level == 0) mainThrusterParticles.gameObject.GetComponent.<ParticleEmitter>().localVelocity.x = mainThrusterParticles.gameObject.GetComponent.<ParticleEmitter>().localVelocity.y = 0;
		else mainThrusterCone.magThrottle = 4;

		for(var thruster : Transform in hoverThrusters) {
			thruster.gameObject.GetComponent.<ParticleEmitter>().emit = false;
		}
	}
	mainThrusterParticles.gameObject.GetComponent.<ParticleEmitter>().localVelocity.z = Mathf.Min(-10 * (vehicle.specialInput ? .1 : vehicle.input.z), -.5);
	if(mainThrusterParticles.gameObject.GetComponent.<ParticleEmitter>().localVelocity.z >= -1) mainThrusterParticles.particleRenderMode = ParticleRenderMode.Billboard;
	else mainThrusterParticles.particleRenderMode = ParticleRenderMode.Stretch;

	//Camera
	vehicle.camSmooth = !vehicle.specialInput;
}

function FixedUpdate() {
	if(!vehicle) return; //We are materializing, don't try to manipulate physics

	//Landing Gear
	if(vehicle.specialInput) {
		if(!landingGear[lod.level].activeSelf) landingGear[lod.level].SetActive(true);
		if(landingGearScale < 1) landingGearScale = landingGearScale + Time.deltaTime;
	}
	else {
		if(landingGear[lod.level].activeSelf && landingGearScale > 0) landingGearScale = landingGearScale - Time.deltaTime;
		else if(landingGear[lod.level].activeSelf) landingGear[lod.level].SetActive(false);
	}
	if(landingGear[lod.level].activeSelf) landingGear[lod.level].transform.localScale.y = landingGear[lod.level].transform.localScale.x = landingGearScale;

	if(vehicle.myRigidbody.isKinematic == true) return; //We are materializing, don't try to manipulate physics

	vehicle.myRigidbody.centerOfMass = Vector3.zero;
	vehicle.myRigidbody.inertiaTensor = inertiaTensor * .75;
	vehicle.myRigidbody.inertiaTensorRotation = inertiaTensorRotation;

	//Hovering
	if(vehicle.specialInput) {

		//We are applying thrusters
		//if(vehicle.input.z > 0) {

			//Force of hover thrusters in atmosphere
			vehicle.myRigidbody.AddForce(transform.up * vehicle.input.z * hoverThrustFactor * grav);

			//Ground effect for each individual thruster
			/*for(var thruster : Transform in hoverThrusters) {
				if (Physics.Raycast (transform.position, Vector3.up * -1, hit, 30, thrustMask)) {
					if(hit.distance < Game.Settings.hoverHeight) {
						vehicle.myRigidbody.AddForce(transform.up * (Game.Settings.hoverHeight - hit.distance) * Game.Settings.hoverHover);							//Hover force
						if(thrustLast > hit.distance) vehicle.myRigidbody.AddForce(hit.normal * Mathf.Min((thrustLast - hit.distance) * Game.Settings.hoverRepel, 10), ForceMode.VelocityChange);		//Anticollision force
					}
					vehicle.myRigidbody.AddTorque(Vector3.Cross(transform.up, hit.normal) * Vector3.Angle(transform.up, hit.normal) * .2 * (40 - Mathf.Min(40,hit.distance)));
					thrustLast = hit.distance;
				}
			}*/

			//Autoleveling
			vehicle.myRigidbody.AddTorque(Vector3.Cross(transform.up, Vector3.up) * Vector3.Angle(transform.up, Vector3.up) * hoverLevelForceFactor * mass);

			//Steering
			vehicle.myRigidbody.AddRelativeTorque(Vector3(
				vehicle.input.y * mass * hoverSteerFactor,
				Mathf.Clamp(vehicle.input.x + vehicle.input.w, -1, 1) * mass * hoverSteerFactor,
				-vehicle.input.x * mass * hoverSteerFactor
			));
		//}

		vehicle.myRigidbody.drag = Game.Settings.jetHDrag * vehicle.myRigidbody.velocity.magnitude  * (vehicle.brakes ? 7 : 1);
		vehicle.myRigidbody.angularDrag = hoverAngDrag * (vehicle.brakes ? 5 : 1);
		mainThruster[lod.level].localEulerAngles = Vector3.zero;
	}

	//Flying
	else {
		if(vehicle.brakes) vehicle.input.z = 0;

		//Pertinent Flight Info
		if(vehicle.myRigidbody.transform.position.y < 5000) atmosDensity = Mathf.Lerp(1.2250, 0.18756, vehicle.myRigidbody.transform.position.y / 5000); //kg/m³ 0-50,00' http://www.aerospaceweb.org/design/scripts/atmosphere/
		else atmosDensity = Mathf.Lerp(0.18756, 0.017102, vehicle.myRigidbody.transform.position.y / 10000); //50,000'-100,000'
		speed = vehicle.myRigidbody.velocity.magnitude;
		pitch = (transform.eulerAngles.x > 180 ? transform.eulerAngles.x - 360 : transform.eulerAngles.x);
		roll = (transform.eulerAngles.z > 180 ? transform.eulerAngles.z - 360 : transform.eulerAngles.z);
		locvel = vehicle.myRigidbody.transform.InverseTransformDirection(vehicle.myRigidbody.velocity);
		angleOfAttack = locvel.normalized.y;
		if(speed < Game.Settings.jetStall) stallFactor = Mathf.Lerp(1, 0, ((speed - Game.Settings.jetStall * .8) / Game.Settings.jetStall) * 10); //Blend into wing stall
		else stallFactor = Mathf.Max(0, Mathf.Min(Mathf.Abs(angleOfAttack) - .65, .1)) * 10; //Lerp between 1 and 0 as aoa is between .85 and .95

		//Thruster
		mainThruster[lod.level].localEulerAngles = Vector3(-vehicle.input.y * Mathf.Lerp(20, 5, speed / (Game.Settings.jetStall * 5)), -vehicle.input.x * 1 + (vehicle.input.w == 0 ? Mathf.Clamp(-locvel.x * 1, -10, 10) : Mathf.Clamp(-locvel.x * .5, -10, 10)) + -vehicle.input.w * 15, 0);
		vehicle.myRigidbody.AddForceAtPosition(mainThruster[lod.level].forward * vehicle.input.z * flightThrustFactor * grav * .99, mainThruster[0].position);

		//Control Surfaces
		vehicle.myRigidbody.AddRelativeTorque(Vector3(vehicle.input.y * mass * Game.Settings.jetSteer * .2, 0, -vehicle.input.x * mass * Game.Settings.jetSteer * .75) * Mathf.Lerp(0, 1, speed / Game.Settings.jetStall * .7) * atmosDensity * (locvel.z > 0 ? 1 : -1));
		vehicle.myRigidbody.angularDrag = flightAngDrag;

		//Lift
		if(stallFactor < 1) {
			//Nonsense Hack
			//var liftMax : float = grav * (Mathf.Min(Game.Settings.jetLevelSpeed * 2, speed) / Game.Settings.jetLevelSpeed);
			//var lift2 : float = (-angleOfAttack + .1) * liftMax * 3;
			//Debug.DrawRay (transform.position, transform.up * lift2 * .002, Color.red);

			//http://www.aerospaceweb.org/question/aerodynamics/q0015b.shtml
			var wingArea = 15; //m²
			var liftCoefficient = (angleOfAttack > 0 ? -Mathf.Min(.3, angleOfAttack) : Mathf.Max(-.3, -angleOfAttack));
			var lift : float = Game.Settings.jetLift * atmosDensity * locvel.z * locvel.z * wingArea * liftCoefficient;
			vehicle.myRigidbody.AddRelativeForce(Vector3.up * Mathf.Lerp(lift, 0, stallFactor));
			//Debug.DrawRay (transform.position, transform.up * lift * .002, Color.green);
		}

		//Sideslip
		//if(stallFactor < .5 && Mathf.Abs(pitch) < 45) {
			//if(Mathf.Abs(roll) < 90) vehicle.myRigidbody.AddRelativeTorque(Mathf.Abs(roll) * mass * -.015, roll * mass * -.04, roll * mass * -.01);
			//else vehicle.myRigidbody.AddRelativeTorque(Mathf.Abs(roll) * mass * .015, roll * mass * .04, roll * mass * .01);
		//}
		//vehicle.myRigidbody.AddRelativeTorque(0, roll * mass * .04 * Mathf.Lerp(1, 0, Mathf.Abs(pitch) / 90) * (Mathf.Abs(roll) < 90 ? -1 : -1), 0);

		//Drag
		if(stallFactor >= .5) vehicle.myRigidbody.drag = speed * Mathf.Lerp(Game.Settings.jetDrag, Game.Settings.jetDrag * 5, Vector3.Angle(vehicle.myRigidbody.velocity, vehicle.myRigidbody.transform.forward) / 90) * atmosDensity;
		else {
			vehicle.myRigidbody.drag = 0;
			vehicle.myRigidbody.AddRelativeForce(Vector3(locvel.x * -Game.Settings.jetDrag * 3, locvel.y * -Game.Settings.jetDrag * 3, locvel.z * -Game.Settings.jetDrag) * atmosDensity * (vehicle.brakes ? 5 : 1), ForceMode.VelocityChange);
		}
	}

	//Floating
	if(transform.position.y < Game.Settings.lavaAlt + 20 || Physics.Raycast(transform.position + (Vector3.up * 200), Vector3.down, hit, 220,  1 << 4)) {
	    var up : Vector3 = Vector3.up * 200;
	    var dn : Vector3 = Vector3.up * -1;
	    var lavaHit : RaycastHit;
		for (var pt : Vector3 in bodyCollider.sharedMesh.vertices) {
			var hitDistance : float;
			pt = transform.TransformPoint(pt);
			if(pt.y < Game.Settings.lavaAlt) hitDistance = (pt.y - Game.Settings.lavaAlt) * -1;
			else if(hit.distance && hit.collider.Raycast(Ray(pt + up, dn), lavaHit, 200)) hitDistance = (200 - lavaHit.distance);
			else continue;
			var ptVel : Vector3 = vehicle.myRigidbody.GetPointVelocity(pt);
			vehicle.myRigidbody.AddForceAtPosition((Vector3.up * lavaFloat * Mathf.Min(6, 3 + hitDistance) * Mathf.Lerp(1.3, 5, Vector2(ptVel.x, ptVel.z).magnitude / 20) + ptVel * -Game.Settings.jetDrag * 70) / bodyCollider.sharedMesh.vertexCount, pt, ForceMode.VelocityChange);
		}
	}
}

//Lava Collisions
/*function OnTriggerStay(collider : Collider) {
	if(collider.gameObject.tag != "BouyantLiquid") return;

	var drag = 100;
	var float = 100;
    var hit : RaycastHit;
    var up : Vector3 = transform.up * 10;

	for (var pt : Vector3 in bodyCollider.mesh.vertices) {
		if(collider.Raycast (transform.TransformPoint(pt) + up, hit, 100.0)) {
	}
}*/
