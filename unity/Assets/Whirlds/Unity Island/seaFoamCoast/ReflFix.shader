Shader "FoamReflFix" {
	Properties {
		_Color ("Main Color", Color) = (1,1,1,1)
		_MainTex ("Base (RGB)", 2D) = "white" {TexGen ObjectLinear}
	}
	SubShader {
		Tags { "Queue" = "Transparent" }
		Pass {
			Offset -1, -1
			Blend SrcAlpha OneMinusSrcAlpha
			ColorMask RGB
			Color [_Color]
			SetTexture [_MainTex] { matrix[_WavesBaseMatrix] combine texture, texture }
		}
	} 
	FallBack "Diffuse", 1
}
