// Upgrade NOTE: replaced 'PositionFog()' with multiply of UNITY_MATRIX_MVP by position
// Upgrade NOTE: replaced 'V2F_POS_FOG' with 'float4 pos : SV_POSITION'

Shader "Transparent/GlassGlowing" {
Properties {
	_Color ("Main Color", Color) = (1,1,1,1)
	_FColor ("Fallback Color", Color) = (1,1,1,1)
	_SpecColor ("Specular Color", Color) = (0.5,0.5,0.5,1)
	_Cube ("Reflection Cubemap", Cube) = "_Skybox" {TexGen CubeNormal}
}

Category {
	Tags {Queue=Transparent}
	ZWrite Off
	Blend SrcAlpha OneMinusSrcAlpha
	Lighting Off
	Colormask RGB

	SubShader {
		Pass {
			
CGPROGRAM
// profiles arbfp1
// fragment frag
// fragmentoption ARB_fog_exp2
// fragmentoption ARB_precision_hint_fastest 
// vertex vert
#include "UnityCG.cginc"

struct v2f {
	float4 pos : SV_POSITION;
	float3  normal	: TEXCOORD0;
	float3	viewDir	: TEXCOORD1;
};

v2f vert (appdata_tan v)
{	
	v2f o;
	o.pos = mul (UNITY_MATRIX_MVP, v.vertex);
	o.normal = mul( (float3x3)_Object2World, v.normal );
	o.viewDir = mul( (float3x3)_Object2World, ObjSpaceViewDir(v.vertex) );
	
	return o;
}

uniform samplerCUBE _Cube : register(s0);
uniform float4 _Color;
uniform float4 _SpecColor;

float4 frag (v2f i)  : COLOR
{
	float3 normal = i.normal;
	i.viewDir = normalize(i.viewDir);
	half nsv = saturate(dot( normal, i.viewDir ));
	
	// calculate reflection vector in world space
	half3 r = reflect(-i.viewDir, normal);
	
	half4 reflcolor = texCUBE(_Cube, r);
	
	half fresnel = .9 - nsv*0.5;
	half3 c = lerp( _Color.rgb, reflcolor.rgb+_SpecColor.rgb, fresnel );
	
	return half4( c, fresnel );
}
ENDCG  
			SetTexture [_Cube] {combine texture}
		}
	}
	
	SubShader {
		Pass {
			Color [_FColor]
		}
	}
	
	
}

}
