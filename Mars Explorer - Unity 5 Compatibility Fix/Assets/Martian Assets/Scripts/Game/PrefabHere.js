var prefab : GameObject;

function Awake () {
	var newObject : GameObject = Instantiate(prefab, transform.position, transform.rotation);
	newObject.transform.parent = transform.parent.transform;
	Destroy(gameObject);
}