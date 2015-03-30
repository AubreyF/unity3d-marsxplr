Shader "Foam w/ Glow" {
	Properties {
		_Offset ("Offset", Range (0.00,1.00)) = 1.000
		_Color ("Main Color", Color) = (1,1,1,1)
		_Glow ("Glow Amt (A)", Color) = (1,1,1,1)
		_MainTex ("Base (RGB)", 2D) = "white" {}
		_Cutout ("Mask (A)", 2D) = "white" {}
	}
	SubShader {
		Tags { "Queue" = "Transparent" }
		Pass {
			ZWrite off
			Offset -1, -1
			Blend SrcAlpha OneMinusSrcAlpha
			ColorMask RGB
			Color [_Color]
			SetTexture [_MainTex] {constantColor[_Color] combine texture * primary double, texture * constant double}
			SetTexture [_Cutout] { combine previous, previous * texture }
			
		}
		
		Pass {
			ZWrite off
			Offset -1, -1
			Blend SrcAlpha OneMinusSrcAlpha
			ColorMask A
			SetTexture [_MainTex] {constantColor[_Glow] combine texture, texture * constant }
			SetTexture [_Cutout] { combine previous, previous * texture }
			
		}
	} 
	FallBack "Diffuse", 1
}
