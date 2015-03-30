var vehicle : Vehicle;

private var enemy : GameObject;
private var botMovement : int;
private var botEnemySelection : int;
private var enemyUpdateTime : int;
private var rocketFireTime = 0.00;

function Update () {
	//Enemy updates
	if(enemyUpdateTime == 0.00 || Time.time - 2 > enemyUpdateTime) {
		enemyUpdateTime = Time.time;

		if(botEnemySelection == 1) {
			var distance = Mathf.Infinity;
			for(var plrE : DictionaryEntry in Game.Players) {
				if(!plrE.Value.gameObject) continue;
				var go : GameObject = plrE.Value.gameObject;
			    var diff = (go.transform.position - transform.position);
			    var curDistance = diff.sqrMagnitude;
			    if (curDistance < distance && go.name != name) {
			    	enemy = go;
			        distance = curDistance;
   				}
			}
		}
		else if(botEnemySelection == 2) {
			for(var plrE : DictionaryEntry in Game.Players) {
   	 			if(plrE.Value.isIt == 1) {
   	 				enemy = plrE.Value.gameObject;
   	 				break;
   	 			}
			}
		}
	}

	//Rabbit Hunt Mode
	//if(true) {
		if(vehicle.isIt) {
			botMovement = 1;
			botEnemySelection = 1;
		}
		else {
			botMovement = 2;
			botEnemySelection = 2;
		}
	//}

	//Tag Mode
	/*else {
		if(!vehicle.isIt) {
			botMovement = 1;
		}
		else {
			botMovement = 2;
			botEnemySelection = 1;
		}
	}*/


	if(Game.Settings.botsCanDrive) {
		//Hiding movement
		if(botMovement == 1) {
			//Tank
			if(vehicle.vehId == 2) {
				vehicle.input.x = (Time.time % 2 == 0 ? 0 : Random.value * 2 - 1);
				vehicle.input.y = 1;
			}
			//All others
			else {
				vehicle.input.x = Random.value * 2 - 1;
				vehicle.input.y = 1;
			}
		}

		//Persuing movement
		else if(botMovement == 2) {
			if(enemy) {
				distance = Vector3.Distance(enemy.transform.position, vehicle.myRigidbody.position);
				rotation = (Quaternion.LookRotation(enemy.transform.position - vehicle.myRigidbody.position).eulerAngles.y - transform.localRotation.eulerAngles.y);
				if(rotation > 180) rotation = rotation - 360; //180;
				if(rotation < -180) rotation = rotation + 360;

				//Buggy
				if(vehicle.vehId == 0) {
					rotation = rotation / 20;
					if(distance < 15) vehicle.input.x = (Mathf.Abs(rotation) < .1 ? 0 : Mathf.Clamp(rotation, -1, 1));
					else vehicle.input.x = (Mathf.Abs(rotation) < .1 ? 0 : Mathf.Clamp(rotation, -.6, .6));
					vehicle.input.y = 1;
					//if(vehicle.myRigidbody.velocity.magnitude < 100) specialInput = true;
					vehicle.specialInput = false;
				}
				//Hovercraft
				else if(vehicle.vehId == 1) {
					rotation = rotation / 15;
					vehicle.input.x = (Mathf.Abs(rotation) < .1 ? 0 : Mathf.Clamp(rotation, -1, 1));
					vehicle.input.y = 1;
					vehicle.specialInput = false;
				}
				//Tank
				else if(vehicle.vehId == 2) {
					rotation = rotation / 80;
					vehicle.input.x = (Mathf.Abs(rotation) < .3 ? 0 : Mathf.Clamp(rotation, -1, 1));
					vehicle.input.y = (Mathf.Abs(rotation) > 1 ? 0 : 1);
					vehicle.specialInput = false;
				}
				//Jet
				else if(vehicle.vehId == 3) {
					rotation = rotation / 10;
					vehicle.input.x = (Mathf.Abs(rotation) < .1 ? 0 : Mathf.Clamp(rotation, -1, 1));
					vehicle.input.y = 1;
					vehicle.input.z = (Physics.Raycast(transform.position, Vector3.up * -1, 4) ? 1 : .3);
					vehicle.specialInput = true;
				}
			}
		}
	}
	else {
		vehicle.input.x = 0;
		vehicle.input.y = 0;
	}

	//Fire!
	if (enemy && Game.Settings.botsCanFire && (Time.time - 1 > rocketFireTime && !Physics.Linecast(transform.position, enemy.transform.position,  1 << 8))) {
		rocketFireTime = Time.time;
		GetComponent.<NetworkView>().RPC("fRl", RPCMode.All, GetComponent.<NetworkView>().viewID, Network.time + "", vehicle.ridePos.position + vehicle.transform.up * -.1, enemy.GetComponent.<NetworkView>().viewID/*Quaternion.LookRotation((enemy.transform.position + vehicle.transform.up * -.1) - vehicle.ridePos.position).eulerAngles*/);
		//var btemp;
		//btemp = Instantiate(rocket, ridePos.position + transform.TransformDirection(Vector3.up) * .08, brang);
		//btemp.GetComponent("Rocket").launchedBy = gameObject;
		//if(networked) {
			//var viewID = Network.AllocateViewID();
		//	transform.root.networkView.RPC("FireRocket" + "" , RPCMode.Others, vehicle.myRigidbody.transform.root.networkView.viewID, brang);
		//}
	}

	//Bounds Checking
	if(vehicle.myRigidbody.position.y < -300) {
		vehicle.myRigidbody.velocity = vehicle.myRigidbody.velocity.normalized;
		vehicle.myRigidbody.isKinematic = true;
		vehicle.transform.position = World.base.position;
		vehicle.myRigidbody.isKinematic = false;
		if(Game.Messaging) Game.Messaging.broadcast(name + " fell off the planet");
	}
}
