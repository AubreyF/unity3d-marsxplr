@script ExecuteInEditMode()

var whirldObject : WhirldObject;
var seaObject : GameObject;
var seaObjectSimple : GameObject;
var seaObjectSimBot : GameObject;

enum SeaModes { unset = 99, Tropic = 0, Lava = 1 }
var SeaMode : SeaModes = SeaModes.Tropic;
private var setMode : SeaModes = SeaModes.unset;
var seaModeData : SeaModeData[];

class SeaModeData extends System.Object {
	var name : String;
    var color : Color;
    var glowColor : Color;
    var waves : float;
    var reflection : float;
    var refraction : float;
}

function Start () {
	if(whirldObject == null || whirldObject.params == null || seaObject == null || !whirldObject.params["Mode"]) return;
	SeaMode = System.Enum.Parse(SeaModes, whirldObject.params["Mode"].ToString(), true);
}

function Update () {
	if(SeaMode != setMode) SetSeaMode();
}

function SetSeaMode() {
	setMode = SeaMode;
	seaObject.renderer.sharedMaterial.SetColor( "_RefrColor", seaModeData[parseInt(SeaMode)].color );
	seaObject.renderer.sharedMaterial.SetFloat( "_WaveScale", seaModeData[parseInt(SeaMode)].waves );
	seaObject.renderer.sharedMaterial.SetFloat( "_ReflDistort", seaModeData[parseInt(SeaMode)].reflection );
	seaObject.renderer.sharedMaterial.SetFloat( "_RefrDistort", seaModeData[parseInt(SeaMode)].refraction );
	seaObjectSimple.renderer.sharedMaterial.SetColor( "_Color", seaModeData[parseInt(SeaMode)].color );
	seaObjectSimBot.renderer.sharedMaterial.SetColor( "_Color", seaModeData[parseInt(SeaMode)].glowColor );
	seaObjectSimple.renderer.sharedMaterial.color.a = .85;
	seaObjectSimBot.renderer.sharedMaterial.color.a = .85;
	
	World.seaFogColor = seaModeData[parseInt(SeaMode)].color;
	World.seaGlowColor = seaModeData[parseInt(SeaMode)].glowColor;
}