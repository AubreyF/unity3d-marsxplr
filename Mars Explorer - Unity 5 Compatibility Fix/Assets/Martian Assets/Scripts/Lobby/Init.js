var txt : GUIText;

function Update() {
	var i : float = Application.GetStreamProgressForLevel(Application.loadedLevel + 1);
	if(i == 1) Application.LoadLevel(Application.loadedLevel + 1);
	else txt.text = Mathf.RoundToInt(i * 100) + "%"; // \n(" + Application.streamedBytes + ")";
}