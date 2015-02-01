Shader "FX/MiniMapMarker" {
	Properties {
   		_Color ("Main Color", Color) = (1,1,1,0)
	}
	SubShader {
		ZTest Always
		Tags {"Queue" = "Overlay" }
		Pass { Color [_Color]}
	} 
}