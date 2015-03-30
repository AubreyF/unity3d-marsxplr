var terrainMask : LayerMask = ~1 << 4;
private var hit : RaycastHit;
private var myTransform : Transform;
private var linkPos : Vector3;

function Start() {
	//myTransform = transform;
}

function FixedUpdate() {
	//if(linkPos == Vector3.zero) linkPos = myTransform.InverseTransformPoint(myTransform.position);
	
	/*if (Physics.Raycast(linkPos + transform.TransformPoint(Vector3.up * 5), transform.parent.TransformDirection(Vector3.down), hit, 5.5, terrainMask)) {
		myTransform.position = hit.point;
		myTransform.LookAt(hit.point + hit.normal);
	}
	else {*/
		//myTransform.position = myTransform.TransformPoint(linkPos);
		//myTransform.rotation = transform.parent.rotation;
	//}
}