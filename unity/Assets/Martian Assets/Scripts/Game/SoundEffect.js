function Awake() {
	if(!Game.Settings.useSfx) gameObject.Destroy(gameObject.GetComponent(AudioSource));
}