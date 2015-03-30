var vehicle : Vehicle;
var tracks : GameObject;
var tracksSimple : GameObject;
var tracksPerSide = 3;
var trackSpacing = 2.5;
var superTracks : GameObject;
var simpleTracks : GameObject;

function InitVehicle(veh : Vehicle) {
	vehicle = veh;

	var materialAccents : Array = new Array();

	//Build Tracks
	var track : GameObject;
	superTracks = new GameObject("Tracks");
	superTracks.transform.parent = transform;
	for(i=0; i<tracksPerSide; i++) {
		//Left Side
		track = Instantiate(tracks, transform.TransformPoint(Vector3(-2,0,-(((tracksPerSide - 1) * trackSpacing) / 2) + i * trackSpacing)), transform.rotation);
		materialAccents.Add(track.transform.Find("Detailed/Track").GetComponent(MeshRenderer).material);
		materialAccents.Add(track.transform.Find("Detailed/Tread").GetComponent(MeshRenderer).material);
		materialAccents.Add(track.transform.Find("Simple").GetComponent(MeshRenderer).material);
		track.transform.parent = superTracks.transform;
		//Right Side
		track = Instantiate(tracks, transform.TransformPoint(Vector3(2,0,-(((tracksPerSide - 1) * trackSpacing) / 2) + i * trackSpacing)), transform.rotation);
		materialAccents.Add(track.transform.Find("Detailed/Track").GetComponent(MeshRenderer).material);
		materialAccents.Add(track.transform.Find("Detailed/Tread").GetComponent(MeshRenderer).material);
		materialAccents.Add(track.transform.Find("Simple").GetComponent(MeshRenderer).material);
		track.transform.parent = superTracks.transform;
		track.GetComponent(TankTrack).rightSide = true;
	}

	if(vehicle.GetComponent.<NetworkView>().isMine != true) {
		simpleTracks = new GameObject();
		simpleTracks.transform.parent = transform;
		for(i=0; i<tracksPerSide; i++) {
			//Left Side
			track = Instantiate(tracksSimple, transform.TransformPoint(Vector3(-2,.2,-(((tracksPerSide - 1) * trackSpacing) / 2) + i * trackSpacing)), transform.rotation);
			materialAccents.Add(track.transform.Find("Detailed/Track").GetComponent(MeshRenderer).material);
			materialAccents.Add(track.transform.Find("Detailed/Tread").GetComponent(MeshRenderer).material);
			materialAccents.Add(track.transform.Find("Simple").GetComponent(MeshRenderer).material);
			track.transform.parent = simpleTracks.transform;
			//Right Side
			track = Instantiate(tracksSimple, transform.TransformPoint(Vector3(2,.2,-(((tracksPerSide - 1) * trackSpacing) / 2) + i * trackSpacing)), transform.rotation);
			materialAccents.Add(track.transform.Find("Detailed/Track").GetComponent(MeshRenderer).material);
			materialAccents.Add(track.transform.Find("Detailed/Tread").GetComponent(MeshRenderer).material);
			materialAccents.Add(track.transform.Find("Simple").GetComponent(MeshRenderer).material);
			track.transform.parent = simpleTracks.transform;
		}
	}
	else {
		var tankMe : TankMe = gameObject.AddComponent(TankMe);
		tankMe.vehicle = vehicle;
	}

	vehicle.materialAccent = materialAccents.ToBuiltin(Material);

	if(World.base) transform.position = World.base.position; //DRAGONHERE: why we need to do this I don't know, but if we don't, we will hover in mid air on local client instances
	transform.localPosition = Vector3.zero; //DRAGONHERE: VERY STRANGE UNITY BUG that sets localposition to -3 if a tank is already present in world...
}

function Update() {
	if(!vehicle) return;

	vehicle.myRigidbody.centerOfMass.y = Game.Settings.tankCG;

	if(vehicle.GetComponent.<NetworkView>().isMine != true && vehicle.vehicleNet) {
		//Enable advanced physics
		if(vehicle.vehicleNet.simulatePhysics && simpleTracks.activeSelf) {
			vehicle.myRigidbody.useGravity = true; //Gravity is simulated on the authoratative client instance that owns this tank - it just makes the networked instances jittery
			simpleTracks.SetActive(false);
			superTracks.SetActive(true);
		}
		//Disable advanced physics
		else if(!vehicle.vehicleNet.simulatePhysics && superTracks.activeSelf) {
			vehicle.myRigidbody.useGravity = true; //Gravity is simulated on the authoratative client instance that owns this tank - it just makes the networked instances jittery
			simpleTracks.SetActive(true);
			superTracks.SetActive(false);
		}
	}
}

function OnLOD(level : int) {
	if(superTracks) for(var track : Transform in superTracks.transform) {
		track.Find("Detailed/Tread").gameObject.GetComponent(MeshRenderer).enabled = (level == 0);
		track.Find("Detailed/Track").gameObject.GetComponent(MeshRenderer).enabled = (level == 0);
		track.Find("Simple").gameObject.GetComponent(MeshRenderer).enabled = !(level == 0);
	}
	if(simpleTracks) for(var track : Transform in simpleTracks.transform) {
		track.Find("Detailed/Tread").gameObject.GetComponent(MeshRenderer).enabled = (level == 0);
		track.Find("Detailed/Track").gameObject.GetComponent(MeshRenderer).enabled = (level == 0);
		track.Find("Simple").gameObject.GetComponent(MeshRenderer).enabled = !(level == 0);
	}
}
