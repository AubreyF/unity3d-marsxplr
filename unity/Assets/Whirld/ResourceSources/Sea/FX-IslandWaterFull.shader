// Upgrade NOTE: replaced 'PositionFog()' with multiply of UNITY_MATRIX_MVP by position
// Upgrade NOTE: replaced 'V2F_POS_FOG' with 'float4 pos : SV_POSITION'

Shader "FX/Island Water Full" { 
Properties {
	_WaveScale ("Wave scale", Range (0.001,0.15)) = 0.063
	_ReflDistort ("Reflection distort", Range (0,1.5)) = 0.44
	_RefrDistort ("Refraction distort", Range (0,1.5)) = 0.40
	_RefrColor ("Refraction color", COLOR)  = ( .34, .85, .92, 1)
	_Fresnel ("Fresnel (A) ", 2D) = "" {}
	_BumpMap ("Bumpmap (RGB) ", 2D) = "" {}
	WaveSpeed ("Wave speed (map1 x,y; map2 x,y)", Vector) = (19,9,-16,-7)
	_ReflectiveColor ("Reflective color (RGB) fresnel (A) ", 2D) = "" {}
	_ReflectiveColorCube ("Reflective color cube (RGB) fresnel (A)", Cube) = "" { TexGen CubeReflect }
	_HorizonColor ("Simple water horizon color", COLOR)  = ( .172, .463, .435, 1)
	_MainTex ("Fallback texture", 2D) = "" {}
	_ReflectionTex ("Internal Reflection", 2D) = "" {}
	_RefractionTex ("Internal Refraction", 2D) = "" {}
}


// -----------------------------------------------------------
// Fragment program cards


Subshader {
	Tags {
		"WaterMode" = "Refractive"
		"Queue" = "Transparent-120" // foam uses -110
	}
	Pass {
		
CGPROGRAM
// Upgrade NOTE: excluded shader from OpenGL ES 2.0 because it uses non-square matrices
#pragma exclude_renderers gles
// Upgrade NOTE: excluded shader from Xbox360; has structs without semantics (struct v2f members ref,bumpuv,viewDirZ)
#pragma exclude_renderers xbox360
#pragma vertex vert
#pragma fragment frag
#pragma fragmentoption ARB_precision_hint_fastest 
#pragma fragmentoption ARB_fog_exp2
#pragma multi_compile WATER_REFRACTIVE

#define HAS_REFLECTION 1
#define HAS_REFRACTION 1

#include "UnityCG.cginc"

uniform float4 WaveSpeed;
uniform float _WaveScale;

uniform float _ReflDistort;
uniform float _RefrDistort;

struct appdata {
	float4 vertex : POSITION;
	float3 normal : NORMAL;
};

struct v2f {
	float4 pos : SV_POSITION;
	float3 ref;
	float2 bumpuv[2];
	float4 viewDirZ;
}; 

v2f vert(appdata v)
{
	v2f o;
	o.pos = mul (UNITY_MATRIX_MVP, v.vertex);
	
	// scroll bump waves
	float4 temp;
	temp.xyzw = (v.vertex.xzxz + _Time.x * WaveSpeed.xyzw) * _WaveScale;
	o.bumpuv[0] = temp.xy * float2(.4, .45);
	o.bumpuv[1] = temp.wz;
	
	// object space view direction (will normalize per pixel)
	o.viewDirZ.xzy = ObjSpaceViewDir(v.vertex);
	
	// calculate the reflection vector
	float3x4 mat = float3x4 (
		0.5, 0, 0, 0.5,
		0, 0.5 * _ProjectionParams.x, 0, 0.5,
		0, 0, 0, 1
	);	
	o.ref = mul (mat, o.pos);
	
	// increase distortion in distance a bit to make
	// the perspective decrease of distortion less pronounced
	o.viewDirZ.w = 1.0 + o.ref.z * 0.15;
	
	return o;
}

sampler2D _ReflectionTex;
sampler2D _Fresnel;
sampler2D _RefractionTex;
uniform float4 _RefrColor;
sampler2D _BumpMap;

half4 frag( v2f i ) : COLOR
{
	i.viewDirZ.xyz = normalize(i.viewDirZ.xyz);
	
	// combine two scrolling bumpmaps into one
	half3 bump1 = tex2D( _BumpMap, i.bumpuv[0] ).rgb;
	half3 bump2 = tex2D( _BumpMap, i.bumpuv[1] ).rgb;
	half3 bump = bump1 + bump2 - 1;
	
	// fresnel factor
	half fresnelFac = dot( i.viewDirZ.xyz, bump );
	
	// perturb reflection/refraction UVs by bumpmap, and lookup colors
	bump.xy *= i.viewDirZ.w;
	
	float3 uv1 = i.ref; uv1.xy += bump * _ReflDistort;
	half4 refl = tex2Dproj( _ReflectionTex, uv1 );
	float3 uv2 = i.ref; uv2.xy -= bump * _RefrDistort;
	half4 refr = tex2Dproj( _RefractionTex, uv2 ) * _RefrColor;
	
	// final color is between refracted and reflected based on fresnel	
	half4 color;

	// refraction + reflection	
	half fresnel = tex2D( _Fresnel, float2(fresnelFac,fresnelFac) ).a;
	color = lerp( refr, refl, fresnel );
	
	return color;
}
ENDCG

	}
}

Fallback Off

}
