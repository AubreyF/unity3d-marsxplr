var cursor : Texture2D;
var cursorOffset : Vector2;

/*
function Start() {
	Screen.showCursor = false;
}
*/

function OnGUI () {
	if(CursorLockMode.Locked) {
		GUI.depth = -999;
		//GUI.Label(Rect (Event.current.mousePosition.x - cursorOffset.x, Event.current.mousePosition.y - cursorOffset.y, cursor.width, cursor.height), cursor);
		GUI.Label(Rect (Screen.width / 2 - cursorOffset.x, Screen.height / 2 - cursorOffset.y, cursor.width, cursor.height), cursor);
	}
}
