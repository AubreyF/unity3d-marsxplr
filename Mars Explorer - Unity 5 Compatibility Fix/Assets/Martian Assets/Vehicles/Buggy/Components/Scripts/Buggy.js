//Object Linkages
var wing0 : MeshFilter;
var wing1 : MeshFilter;
var floatPoints : Transform;
var wheel : GameObject;
var axel : GameObject;
var leftTrail : Transform;
var rightTrail : Transform;
var WheelmarksPrefab : GameObject;
var buggyCollider : Collider;
var lod : WhirldLOD;
var wheels : Transform[];
var wheelGraphics : Transform[];
var axels : Transform[];
var wheelPos : Vector3;
var axelPos : Vector3;

//Internal Registers
private var baseVertices : Vector3[];
private var baseNormals : Vector3[];
private var wingMesh : Mesh;
private var wingState = 0.0;
private var wingFlaps = 0;
private var wingOpen : boolean;
private var isInverted = false;
private var vehicle : Vehicle;
private var bouyancyPoints : Transform[];
private var suspensionRange : float;
private var friction : float;
private var realComp : float[] = new float[4];
private var hitDistance : float[] = new float[4];
private var hitCompress : float[] = new float[4];
private var hitFriction  : float[] = new float[4];
private var hitVelocity : Vector3[] = new Vector3[4];
private var wheelPositn : Vector3[] = new Vector3[4];
private var hitForce : Vector3[] = new Vector3[4];
private var wheelMarks : Skidmarks;
private var wheelMarkIndex : int[] = new int[4];
private var isDynamic = false;
private var frictionTotal : float;
private var brakePower : float;

//Drivetrain Data
private var motorTorque : float;
private var motorSpeed = 0.00;
private var motorSpd = 0.00;
private var motorInputSmoothed = 0.00;
private var wheelRadius = 0.30;
private var wheelCircumference = wheelRadius * Mathf.PI * 2;
private var motorMass = 1;
private var motorDrag = 1;
private var maxAcceleration = 60;
private var motorAccel = 60;
private var motorSpeedNew = 0.00;

function InitVehicle(veh : Vehicle) {
	vehicle = veh;

	var materialAccents : Array = new Array();

	//Init Wing Tinting
	materialAccents.Add(wing0.GetComponent.<Renderer>().material);
	materialAccents.Add(wing1.GetComponent.<Renderer>().material);

	//Instantiate Wheels
	for(i=0; i<4; i++) {
		wheelPositn[i] = Vector3(wheelPos.x *(i%2?1:-1),wheelPos.y,wheelPos.z *(i<2?1:-1));
		var go : GameObject = Instantiate(wheel, transform.TransformPoint(wheelPositn[i]), transform.rotation);
		wheels[i] = go.transform;
		wheelGraphics[i] = wheels[i].Find("Graphic").transform;
		if(i== 1 || i==3) wheels[i].Find("Graphic/Simple").transform.localEulerAngles.y = 0;
		var mR : MeshRenderer = wheelGraphics[i].Find("Detailed/Beadlock").GetComponent(MeshRenderer);
		materialAccents.Add(mR.material);
		wheels[i].parent = transform;
		go = Instantiate(axel, transform.TransformPoint(Vector3(axelPos.x *(i%2?1:-1),axelPos.y,axelPos.z *(i<2?1:-1))), transform.rotation);
		axels[i] = go.transform;
		axels[i].parent = transform;
	}

	//Instantiate Skidmarks
	if(vehicle.isPlayer) {
		go = Instantiate(WheelmarksPrefab, Vector3.zero, Quaternion.identity);
		go.layer = 11;
		wheelMarks = go.GetComponentInChildren(Skidmarks);
	}
	else {
		leftTrail.gameObject.SetActive(false);
		rightTrail.gameObject.SetActive(false);
	}

	//Initialize Bouyancy Points
	i = 0;
	bouyancyPoints = new Transform[floatPoints.childCount];
	for (var pt : Transform in floatPoints) {
		bouyancyPoints[i] = pt;
		i++;
	}

	vehicle.materialAccent = materialAccents.ToBuiltin(Material);

	//OnPrefsUpdated();
}

function Update() {

	//Wings
	if(wingState != 0) {
		wingState += Time.deltaTime * 2;
		//Opening Wings
		if(wingState >= 1) {
			wingOpen = true;
			if(wingState > 2) wingState = 0;
		}
		//Closing Wings
		else {
			if(wingState > 0) {
				wingOpen = false;
				leftTrail.localPosition.x = 0;
				rightTrail.localPosition.x = 0;
				wingState = 0;
			}
		}
	}
	wingMesh = (lod.level == 0 ? wing0 : wing1).mesh;
	(lod.level == 0 ? wing0 : wing1).gameObject.SetActive(wingOpen);
	//vehicle.inputThrottle = wing.activeSelf;
	if(wingOpen) {
		if (baseVertices == null) baseVertices = wingMesh.vertices;
		var vertices = new Vector3[baseVertices.Length];
		for (var i=0;i<vertices.Length;i++) {
			pos = baseVertices[i];
			if(wingState >= -1 && wingState < 0 || wingState >= 1 && wingState < 2) {
				if(wingState > 0) {
					pos.y = pos.y * (wingState - 1);
					pos.x = pos.x * (wingState - 1);
					leftTrail.localPosition.x = (wingState - 1) * -3.5;
					rightTrail.localPosition.x = (wingState - 1) * 3.5;
				}
				else {
					pos.y = pos.y * wingState;
					pos.x = pos.x * wingState;
					leftTrail.localPosition.x = wingState * 3.5;
					rightTrail.localPosition.x = wingState * -3.5;
				}
			}
			else {
				t = pos.z * (vehicle.input.x * 0.14)/* * (pos.z > 0 ? -1 : 1)*/;
				if(pos.z > 0.2) t = 0;
				else t *= (Mathf.Abs(pos.x) / 10);
			//	if(pos.x < 0) t = -t;
				t += pos.x * (motorInputSmoothed * 0.04);
				var st : float = Mathf.Sin(t);
				var ct : float = Mathf.Cos(t);
				pos.x = pos.y*st + pos.x*ct;
				pos.y = pos.y*ct - pos.x*st;
			}
			vertices[i] = pos;
		}
		if(!(wingState >= -1 && wingState < 0 || wingState >= 1 && wingState < 2)) {
			leftTrail.localPosition.x = -3.5;
			rightTrail.localPosition.x = 3.5;
		}
		wingMesh.vertices = vertices;
	}
	else {
		leftTrail.localPosition.x = rightTrail.localPosition.x = 0;
	}

	//Wheels
	for(i=0; i<4; i++) {
		pos = Vector3(wheelPos.x *(i%2?1:-1),wheelPos.y - (hitDistance[i] == -1 ? suspensionRange : (hitDistance[i] - wheelRadius)),wheelPos.z *(i<2?1:-1));
		wheels[i].transform.position = transform.TransformPoint(pos);
		//wheels[i].Rotate((vehicle.myRigidbody.GetPointVelocity(pos).magnitude / wheelCircumference) * Time.deltaTime, 0, 0); //360 * (motorSpeed / wheelCircumference)
		wheelGraphics[i].transform.Rotate(360 * (motorSpeed / wheelCircumference) * Time.deltaTime * .5, 0, 0);
		if(axels[i].gameObject.activeSelf) axels[i].LookAt(wheels[i].position);
	}
}

function FixedUpdate () {
	var wheelsAreTouchingGround = false;
	if(Game.Settings.buggySmartSuspension) {
		if((Game.Settings.buggyNewPhysics || wingOpen) && !Physics.Raycast(transform.position, Vector3.up * -1, 5, vehicle.terrainMask)) { //Auto Gear Retract
			if(suspensionRange > .01) suspensionRange -= Time.deltaTime * .5;
			else suspensionRange = 0;
			//vehicle.myRigidbody.centerOfMass.z = -.2;
		}
		else {
			suspensionRange = Mathf.Lerp(suspensionRange,(wingOpen ? .5 : Mathf.Lerp(0.4, 0.2, Mathf.Min(1,((Game.Settings.buggyNewPhysics ? vehicle.myRigidbody.velocity.magnitude : Mathf.Abs(motorSpeed)) / Game.Settings.buggySpeed)))),Time.deltaTime * 3);
		}
	}
	else {
		suspensionRange = .4;
	}
	vehicle.myRigidbody.centerOfMass.z = .2;
	vehicle.myRigidbody.centerOfMass.y = Game.Settings.buggyCG * suspensionRange * .5;
	vehicle.myRigidbody.mass = 30;
	//vehicle.myRigidbody.inertiaTensor = Vector3(7, 7, 3);

	var hit : RaycastHit;
	if(vehicle.myRigidbody.isKinematic == true) {
		for(i=0; i<4; i++) {
			if(Physics.Raycast(transform.TransformPoint(wheelPositn[i]), transform.up * -1, hit, suspensionRange + wheelRadius, vehicle.terrainMask)) {
				motorSpeed = hitVelocity[i].z;
				hitDistance[i] = hit.distance;
			}
			else hitDistance[i] = -1;
		}
		return;
	}

	if(wingOpen) {
		motorInputSmoothed = Mathf.Lerp(vehicle.input.y, motorInputSmoothed + (vehicle.brakes ? -1: 0), .8);
		var stallSpeed = 16;
		//var dragFactor = 300;
		var locVel = transform.InverseTransformDirection(vehicle.myRigidbody.velocity);
		var roll = (transform.eulerAngles.z > 180 ? transform.eulerAngles.z - 360 : transform.eulerAngles.z);
		var pitch = (transform.eulerAngles.x > 180 ? transform.eulerAngles.x - 360 : transform.eulerAngles.x);
		if(locVel.sqrMagnitude > stallSpeed) {
			vehicle.myRigidbody.drag = vehicle.myRigidbody.velocity.magnitude / Game.Settings.buggyFlightDrag * 0.3;

			//Airbrakes
			if(vehicle.brakes) {
				if(brakePower < 1) brakePower += Time.deltaTime * .15;
				var multiplier : float = -brakePower * 2;
				vehicle.myRigidbody.AddRelativeForce(locVel.x * multiplier * 5, locVel.y * multiplier * 100, locVel.z * 150 * multiplier);
				vehicle.myRigidbody.AddRelativeTorque(Vector3((pitch + (vehicle.input.y * -100)) * -2, vehicle.input.x * 280, (roll) * -1));
			}

			//Standard Flight
			else {
				brakePower = 0;
				var angDelta : float = Vector3.Angle(vehicle.myRigidbody.velocity,transform.TransformDirection(Vector3.forward));
				if(angDelta > 10 && Game.Settings.buggyFlightSlip) {
					vehicle.myRigidbody.velocity = vehicle.myRigidbody.transform.TransformDirection(locVel.x * .95, locVel.y * .95, locVel.z + ((Mathf.Abs(locVel.x) + Mathf.Abs(locVel.y)) * .1 * (angDelta / 360)));
				}
				else {
					vehicle.myRigidbody.velocity = vehicle.myRigidbody.transform.TransformDirection(0, 0,
						locVel.magnitude + (Time.deltaTime * 50 * (Game.Settings.buggyFlightLooPower ? Mathf.Abs(motorInputSmoothed) / 10 : (motorInputSmoothed < .999 && motorInputSmoothed > -.999 ? Mathf.Abs(motorInputSmoothed) / 10 : 0)))
					);
				}
				vehicle.myRigidbody.AddRelativeTorque(Vector3(motorInputSmoothed * 100 * Game.Settings.buggyFlightAgility, 0, vehicle.input.x * -100 * Game.Settings.buggyFlightAgility));
			}

			//Slideslip - "Dihedral"
			if(!vehicle.input.x && (transform.eulerAngles.z < 90 || transform.eulerAngles.z > 270)) {
				 vehicle.myRigidbody.AddRelativeTorque(
				 	((transform.eulerAngles.x < 10 || transform.eulerAngles.x > 350) ? pitch - .95 : 0)  * -0, //4
				 	roll * -.6,
				 	((transform.eulerAngles.z < 20 || transform.eulerAngles.z > 340) ? roll * -0.5 : 0)
				 );
			}
			else if(!vehicle.input.x) {
				 vehicle.myRigidbody.AddRelativeTorque(
				 	0,
				 	(transform.eulerAngles.z - 180) * .4, 0
				 );
			}

			//Turbulence
			//if(Time.time % .125 == 0 && (!vehicle.networked || networkView.isMine)) {
			//	var trb = 15;
			//	vehicle.myRigidbody.AddRelativeTorque(Vector3(Random.Range(-trb, trb), Random.Range(-trb, trb), Random.Range(-trb, trb)));
			//}

			//Lava "Thermals"
			if (transform.position.y < Game.Settings.lavaAlt + 10 || Physics.Raycast (transform.position, Vector3.down, hit, 10,  1 << 4)) {
				vehicle.myRigidbody.AddForce (Vector3.up * (10 - hit.distance) * 40);
			}

			//vehicle.myRigidbody.MoveRotation(vehicle.myRigidbody.rotation * Quaternion.Euler(Vector3 (vehicle.input.y * 60, 0, vehicle.input.x * -200 + vehicle.myRigidbody.rotation.y * 0.5) * Time.deltaTime));
			// vehicle.myRigidbody.AddRelativeForce(Vector3.up * 200);
			vehicle.myRigidbody.angularDrag = 5;

		} else {

			//Stalling
			vehicle.myRigidbody.angularDrag = 1;
			vehicle.myRigidbody.drag = vehicle.myRigidbody.velocity.magnitude / Game.Settings.buggyFlightDrag * 9;
			vehicle.myRigidbody.AddRelativeTorque(Vector3(vehicle.input.y + 0.5 * 100,0,vehicle.input.x * -30));

		}
	}
	else {
		/*if(Game.Settings.buggyNewPhysics) {
			vehicle.myRigidbody.angularDrag = .2;
			vehicle.myRigidbody.drag = .01;
		} else {*/
			if(vehicle.brakes && vehicle.myRigidbody.velocity.magnitude < 1.5) {
				if(vehicle.input.y) vehicle.myRigidbody.drag = 2;
				else vehicle.myRigidbody.drag = 50;
				vehicle.myRigidbody.angularDrag = 1;
			}
			else if(vehicle.brakes && vehicle.myRigidbody.velocity.magnitude < 10) {
				if(vehicle.input.y) vehicle.myRigidbody.drag = 2;
				else vehicle.myRigidbody.drag = 10;
			}
			else {
				vehicle.myRigidbody.angularDrag = .2;
				vehicle.myRigidbody.drag = .01;
			}
		//}
	}

	//Steering
	var steeringAngle : float = Mathf.Lerp(40, 30, vehicle.myRigidbody.velocity.magnitude / Game.Settings.buggySpeed);
	wheels[0].localRotation = wheels[1].localRotation = Quaternion.LookRotation(Vector3(vehicle.input.x * (steeringAngle / 90), 0, 1 + (-1 * Mathf.Abs(vehicle.input.x * (steeringAngle / 90)))));
	steeringAngle = Mathf.Lerp(20, 0, vehicle.myRigidbody.velocity.magnitude / Game.Settings.buggySpeed);
	wheels[2].localRotation = wheels[3].localRotation = Quaternion.LookRotation(Vector3(-vehicle.input.x * (steeringAngle / 90), 0, 1 + (-1 * Mathf.Abs(vehicle.input.x * (steeringAngle / 90)))));

	//Experimental Motor Physics
	if(Game.Settings.buggyNewPhysics) {
		motorTorque = -vehicle.input.y * Mathf.Lerp(Game.Settings.buggyPower * 3, 0, hitVelocity[0].z / Game.Settings.buggySpeed);

		//Apply wheel force
		frictionTotal = 0;
		for(i=0; i<4; i++) {
			if(Physics.Raycast(transform.TransformPoint(wheelPositn[i]), transform.up * -1, hit, suspensionRange + wheelRadius, vehicle.terrainMask)) {
				if(motorTorque == 0 || motorTorque < (hitFriction[i] * hitForce[i].z)) motorSpeed = hitVelocity[i].z;		//Static Friction
				else motorSpeed = Mathf.Lerp(Game.Settings.buggySpeed, 0, (motorTorque - (hitFriction[i] * hitForce[i].z)) / motorTorque);		//Dynamic Friction
				//motorSpeed += -motorSpeed * motorDrag / motorTorque * Time.fixedDeltaTime;
				motorSpd = (frictionTotal - Game.Settings.buggyPower * 3) / (Game.Settings.buggyPower * 3 / Game.Settings.buggySpeed);

				wheelsAreTouchingGround = true;
				isDynamic = ((motorTorque > hitFriction[i]) || (Mathf.Abs(hitVelocity[i].x) > Mathf.Abs(hitVelocity[i].z) * .3));
				hitDistance[i] = hit.distance;
				hitCompress[i] = -((hit.distance) / (suspensionRange + wheelRadius)) + 1;
				hitVelocity[i] = wheels[i].InverseTransformDirection(vehicle.myRigidbody.GetPointVelocity(transform.TransformPoint(wheelPositn[i])));
				if(isDynamic) {
					hitFriction[i] = Game.Settings.buggyTr * 60;
					//Debug.DrawRay(transform.TransformPoint(wheelPositn[i]),transform.up * 5, Color.red);
					//getSpringForce(comp, vel.y) *				//Spring Compression position, normalized (0-1)
					//Mathf.Lerp(1, 1, Mathf.Min(comp * 4, 1))	//Static tire friction coeffecient, as function of downforce*/
				}
				else {
					hitFriction[i] = Game.Settings.buggyTr * 150 * Mathf.Lerp(1.5, .5, Mathf.Min(hitCompress[i] * 3, 1));
				}

				var dir : Vector3 = Vector3(hitVelocity[i].x, 0, (Game.Settings.buggyAWD == true || i > 1 ? (hitVelocity[i].z - motorSpeed) : 0));
				if(dir.magnitude > 1) dir = dir.normalized;
				hitForce[i] = dir;
				//Debug.DrawRay(transform.TransformPoint(wheelPositn[i]),transform.right * dir.x, Color.blue);
				//Debug.DrawRay(transform.TransformPoint(wheelPositn[i]),transform.forward * dir.z, Color.blue);
				var force : Vector3 = wheels[i].TransformDirection(dir * -hitFriction[i]);
				//Debug.DrawRay(hit.point,force / 50);
				vehicle.myRigidbody.AddForceAtPosition(force, hit.point);
				if(wheelMarks) wheelMarkIndex[i]=wheelMarks.AddSkidMark(hit.point, hit.normal, (isDynamic ? 1 : Mathf.Min(.5, force.magnitude * .0025)), wheelMarkIndex[i]);		//Do Tire Tracks
				frictionTotal += hitFriction[i];
			}
			else {
				hitDistance[i] = -1;
				wheelMarkIndex[i] = -1;
			}
		}
	}

	//Modified Yoggy physics
	else {
	/*
		//Motor
		motorTorque = Mathf.Max(1,Mathf.Lerp(Game.Settings.buggyPower, 0, Mathf.Abs(motorSpeed) / Game.Settings.buggySpeed) * Mathf.Abs((wing.activeSelf ? 0 : vehicle.input.y)));
		motorAccel = Mathf.Lerp(maxAcceleration, 0, Mathf.Abs(motorSpeed) / (motorSpeed > 0 ? Game.Settings.buggySpeed : 50));
		motorSpeed += vehicle.input.y * motorAccel / motorMass * Time.fixedDeltaTime;
		motorSpeed += -motorSpeed * (vehicle.brakes ? 10 : motorDrag) / motorTorque * Time.fixedDeltaTime;

		//Wheels
		for(i=0; i<4; i++) {
			pos = transform.TransformPoint(wheelPos.x *(i%2?1:-1),wheelPos.y,wheelPos.z *(i<2?1:-1));
			if(Physics.Raycast(pos, transform.up * -1, hit, suspensionRange + wheelRadius, ~1<<4)) {
				//hit.distance -= Vector3.Angle(hit.normal, transform.up) * .01; //Experimental wheel/terrain bounds intersection matching
				velocityAtTouch = wheels[i].InverseTransformDirection(vehicle.myRigidbody.GetPointVelocity(pos));
				compression = -((hit.distance) / (suspensionRange + wheelRadius)) + 1;
				friction =
					Game.Settings.buggyTr * compression
					* (Mathf.Abs(velocityAtTouch.x) < 4 ?
						110 :
						(30 - Mathf.Min(
							(i<2 ? 20 : 22),
							Mathf.Abs(velocityAtTouch.x) * .4)
						)
					) * .025;
				vehicle.myRigidbody.AddForceAtPosition(wheels[i].TransformDirection(Vector3.Min(Vector3(
					-velocityAtTouch.x * friction,						//Sideslip
					-velocityAtTouch.y * 30 * (wing.activeSelf ? 5 : 1) + compression * 400 * (wing.activeSelf && i < 2 ? 8 : 1),		//Shocks, Springs
					-(velocityAtTouch.z - motorSpeed) * friction		//Motor
				),Vector3(1000,1000,1000))), hit.point);
				motorSpeed += ((velocityAtTouch.z - motorSpeed) * friction * Time.fixedDeltaTime) / motorTorque;
			}
			else hit.distance = -1;
			hitDistance[i] = hit.distance;
		}
		*/

		//Motor
		motorTorque = Mathf.Max(1,Mathf.Lerp(Game.Settings.buggyPower * 5, 0, motorSpeed / (Game.Settings.buggySpeed * 10)) * Mathf.Abs((wingOpen ? 0 : vehicle.input.y)));
		motorAccel = Mathf.Lerp(maxAcceleration, 0, motorSpeed / (Game.Settings.buggySpeed * 10));
		motorSpeed += vehicle.input.y * motorAccel / motorMass * Time.fixedDeltaTime;
		motorSpeed += -motorSpeed * (vehicle.brakes ? 50 : motorDrag) / motorTorque * Time.fixedDeltaTime;

		//Wheel / Terrain Collisions
		for(i=0; i<4; i++) {
			if(Physics.Raycast(transform.TransformPoint(wheelPositn[i]), transform.up * -1, hit, suspensionRange + wheelRadius, vehicle.terrainMask)) {
				wheelsAreTouchingGround = true;
				hitCompress[i] = -((hit.distance) / (suspensionRange + wheelRadius)) + 1;
				hitVelocity[i] = wheels[i].InverseTransformDirection(vehicle.myRigidbody.GetPointVelocity(transform.TransformPoint(wheelPositn[i])));
				if(hit.rigidbody) {
					vehicle.myRigidbody.AddForceAtPosition((hitVelocity[i] - wheels[i].InverseTransformDirection(hit.rigidbody.GetPointVelocity(hit.point))) / 4, hit.point, ForceMode.VelocityChange);
					//vehicle.transform.position += (hit.rigidbody.GetPointVelocity(hit.point) * Time.fixedDeltaTime) / 4;
					//hitVelocity[i] = hit.rigidbody.GetPointVelocity(hit.point);
					//hitVelocity[i] = hit.rigidbody.GetPointVelocity(hit.point);
				}
				friction = Game.Settings.buggyTr * 9 * Mathf.Lerp(.5, 1, hitCompress[i]) * Mathf.Max(1, (20 - hitVelocity[i].magnitude) / 4);
				vehicle.myRigidbody.AddForceAtPosition(wheels[i].TransformDirection(Vector3.Min(Vector3(
					-hitVelocity[i].x * friction,					//Sideslip
					0,
					-(hitVelocity[i].z - motorSpeed) * friction		//Motor
				),Vector3(1000,1000,1000))), hit.point);
				motorSpeed += ((hitVelocity[i].z - motorSpeed) * friction * Time.fixedDeltaTime) / motorTorque;
				if(wheelMarks) wheelMarkIndex[i]=wheelMarks.AddSkidMark(hit.point, hit.normal, (Mathf.Abs(hitVelocity[i].x) > Mathf.Abs(hitVelocity[i].z) * .3 ? Mathf.Abs(vehicle.input.y) * .5 + .25 : Mathf.Min(.5, friction * .05)), wheelMarkIndex[i]);		//Do Tire Tracks
			}
			else {
				hit.distance = -1;
				wheelMarkIndex[i] = -1;
			}
			hitDistance[i] = hit.distance;
		}
	}

	//Suspension
	for(i=0; i<4; i++) {
		if(hitDistance[i] == -1) continue;
		//print(getSpringForce(hitCompress[i], hitVelocity[i].y) + "===" + i);
		vehicle.myRigidbody.AddForceAtPosition(transform.up * (-hitVelocity[i].y * Game.Settings.buggySh * 1 * (wingOpen ? 3 : 1) + hitCompress[i] * (20 * vehicle.myRigidbody.mass) * (wingOpen && i < 2 ? 8 : 1)), transform.TransformPoint(wheelPositn[i]));
		//Debug.DrawRay(transform.TransformPoint(wheelPositn[i]),transform.up * getSpringForce(hitCompress[i], hitVelocity[i].y) / 50, Color.green);
	}

	//Floating
	if((transform.position.y < Game.Settings.lavaAlt + .1 && transform.position.y - Game.Settings.lavaAlt > -3) || Physics.Raycast(transform.position + (Vector3.up * 3), Vector3.down, hit, 3.1,  1 << 4)) {

		//Vars
		if(wingOpen && hit.distance < 2) vehicle.myRigidbody.AddForce(Vector3.up * 400);
		roll = (transform.eulerAngles.z > 180 ? transform.eulerAngles.z - 360 : transform.eulerAngles.z);
		pitch = (transform.eulerAngles.x > 180 ? transform.eulerAngles.x - 360 : transform.eulerAngles.x);
		vehicle.myRigidbody.angularDrag = 2;
		//vehicle.myRigidbody.angularVelocity = Vector3(vehicle.myRigidbody.angularVelocity.x,0,0);

		//Flowing Lava
		var waterAngle : float;
		var waterAxis : Vector3;
		if(hit.distance && hit.transform) {
			hit.transform.rotation.ToAngleAxis(waterAngle, waterAxis);
			if(waterAngle != 0) {
				vehicle.myRigidbody.AddForce(hit.transform.rotation.eulerAngles * .8);
			}
		}

		//BouyancyPoints
		for(m in bouyancyPoints) {
			if (m.position.y < Game.Settings.lavaAlt || Physics.Raycast (m.position + (Vector3.up * 3), Vector3.down, hit, 3,  1 << 4)) {
				var bouyancyY : float = (hit.distance ? hit.distance - 5 : m.position.y - 2 - Game.Settings.lavaAlt);
				if(bouyancyY < -1.8) bouyancyY = -1.8;
				vehicle.myRigidbody.AddForceAtPosition((
					Vector3(0, -bouyancyY * (100 + vehicle.myRigidbody.GetPointVelocity(m.position).magnitude * (vehicle.myRigidbody.GetPointVelocity(m.position).magnitude > 15 ? 100 : 15)), 0) //skip force : bouyancy force
					+ vehicle.myRigidbody.GetPointVelocity(m.position) * -200 //Drag
				) / bouyancyPoints.length
				, m.position);
			}
		}
		if(vehicle.input.y >= 0) vehicle.myRigidbody.AddRelativeTorque(Vector3(-vehicle.input.y * 500 * ((70 - Mathf.Min(70, Mathf.Max(1,pitch * -1))) / 70)/* + (Mathf.PingPong(Time.time, 200) * 2)*/, vehicle.input.y * vehicle.input.x * 300, (roll * -3) + vehicle.input.y * vehicle.input.x * -50));
		if(!wingOpen && hit.distance < 3) vehicle.myRigidbody.AddRelativeForce(Vector3.forward * vehicle.input.y * 1200);
	}

	//Diving
	else if(transform.position.y < Game.Settings.lavaAlt || Physics.Raycast(transform.position + (Vector3.up * 200), Vector3.down, 200,  1 << 4)) {
		vehicle.myRigidbody.AddForce(vehicle.myRigidbody.velocity * -8 + Vector3.up * (wingOpen ? 400 : 200));
		vehicle.myRigidbody.angularDrag = 2;
	}

	//Collision Friction
	if(wingOpen || wheelsAreTouchingGround || Physics.Raycast(transform.position, transform.up * -1, 3, vehicle.terrainMask)) {	//We are driving - apply zero friction on collisions
		buggyCollider.material.frictionCombine = PhysicMaterialCombine.Minimum;
	}
	else {										//We are crashing - apply much more friction on collisions
		buggyCollider.material.frictionCombine = PhysicMaterialCombine.Maximum;
	}
}

//Self righting
function OnCollisionStay(collision : Collision) {
	if(vehicle.zorbBall) return;
	for (var contact : ContactPoint in collision.contacts) {
		//if(contact.otherCollider.gameObject.layer != 8) continue;
		if(isInverted && Vector3.Angle(transform.up, contact.normal) < 50) isInverted = false;
		else if(!isInverted && vehicle.myRigidbody.angularVelocity.sqrMagnitude < 5 && !wingOpen && Vector3.Angle(transform.up, contact.normal) > 120) isInverted = true;
		if(isInverted) vehicle.myRigidbody.AddTorque(Vector3.Cross(transform.up, Vector3.up) * Vector3.Angle(transform.up, Vector3.up) * 3);
	}
}

/*function OnPrefsUpdated() {
	while(!vehicle) yield;
}*/

function OnSetSpecialInput() {
	while(!vehicle) yield;
	//Debug.Log(name + " --- " + vehicle.specialInput);
	vehicle.camSmooth = vehicle.specialInput;
	if(vehicle.specialInput) {
		wingState = 1;
		wingFlaps = 0;
	}
	else {
		wingState = -1;
		wingFlaps = 0;
	}
}

function OnDisable () {
	if(wheelMarks) Destroy(wheelMarks.gameObject);
}

function OnLOD(level : int) {
	for(i=0; i<4; i++) {
		wheelGraphics[i].Find("Detailed").gameObject.SetActive(level == 0);
		wheelGraphics[i].Find("Simple").gameObject.SetActive(!(level == 0));
		axels[i].gameObject.SetActive(level == 0);
	}
}
