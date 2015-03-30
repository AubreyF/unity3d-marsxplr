function Start () {
	yield new WaitForSeconds(15);
	
	var pe : ParticleEmitter = GetComponent(ParticleEmitter);
	pe.emit = true; 
}