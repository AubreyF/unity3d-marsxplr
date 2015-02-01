// Upgrade NOTE: replaced 'PositionFog()' with multiply of UNITY_MATRIX_MVP by position
// Upgrade NOTE: replaced 'V2F_POS_FOG' with 'float4 pos : SV_POSITION'

// Upgrade NOTE: replaced 'defined HAS_REFLECTION' with 'defined (HAS_REFLECTION)'
// Upgrade NOTE: replaced 'defined WATER_REFLECTIVE' with 'defined (WATER_REFLECTIVE)'
// Upgrade NOTE: replaced 'defined WATER_SIMPLE' with 'defined (WATER_SIMPLE)'

Shader "FX/Island Water Simple" { 
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
		"WaterMode" = "Reflective"
		"Queue" = "Transparent-120" // foam uses -110
	}
	Pass {
		ZWrite Off
		ColorMask RGB
		Blend SrcAlpha OneMinusSrcAlpha
		
CGPROGRAM
// Upgrade NOTE: excluded shader from OpenGL ES 2.0 because it uses non-square matrices
#pragma exclude_renderers gles
// Upgrade NOTE: excluded shader from Xbox360; has structs without semantics (struct v2f members ref,bumpuv,viewDirZ)
#pragma exclude_renderers xbox360
#pragma vertex vert
#pragma fragment frag
#pragma fragmentoption ARB_precision_hint_fastest 
#pragma fragmentoption ARB_fog_exp2
#pragma multi_compile WATER_REFLECTIVE WATER_SIMPLE

#if defined (WATER_REFLECTIVE)
#define HAS_REFLECTION 1
#endif


#include "UnityCG.cginc"

uniform float4 WaveSpeed;
uniform float _WaveScale;

#ifdef HAS_REFLECTION
uniform float _ReflDistort;
#endif

struct appdata {
	float4 vertex : POSITION;
	float3 normal : NORMAL;
};

struct v2f {
	float4 pos : SV_POSITION;
	#if defined (HAS_REFLECTION)
	float3 ref;
	#endif
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
	
	#if defined (HAS_REFLECTION)
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
	#else
	o.viewDirZ.w = 0.0;
	#endif
	
	return o;
}

#if defined (WATER_REFLECTIVE)
sampler2D _Fresnel;
sampler2D _ReflectionTex;
#endif
#if defined (WATER_SIMPLE)
sampler2D _ReflectiveColor;
uniform float4 _HorizonColor;
#endif
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
	
	// perturb reflection UVs by bumpmap, and lookup colors
	
	#ifdef HAS_REFLECTION
	bump.xy *= i.viewDirZ.w;
	float3 uv1 = i.ref; uv1.xy += bump * _ReflDistort;
	half4 refl = tex2Dproj( _ReflectionTex, uv1 );
	half fresnel = tex2D( _Fresnel, float2(fresnelFac,fresnelFac) ).a;
	// Cg 1.5 has a bug when compiling for ps_2_0 where it does not respect
	// destination masks properly. So final color ends up being just fresnel,
	// resulting in black water on D3D. To workaround, we add just a tiny bit
	// of original alpha...
	refl.a = fresnel + refl.a * 0.01;
	return refl;
	#endif
	
	#ifdef WATER_SIMPLE
	half4 color;
	half4 water = tex2D( _ReflectiveColor, float2(fresnelFac,fresnelFac) );
	//color.rgb = lerp( water.rgb, _HorizonColor.rgb, water.a );
	//color.a = water.a * _HorizonColor.a * 2;
	color.rgb = lerp( water.rgb, _HorizonColor.rgb, water.a * 2 );
	color.a = _HorizonColor.a * 3;
	return color;
	#endif	
}
ENDCG

	}
}

// -----------------------------------------------------------
// Radeon 9000 cards

#warning Upgrade NOTE: SubShader commented out because of manual shader assembly
/*Subshader {
	Tags {
		"WaterMode" = "Reflective"
		"Queue" = "Transparent-120" // foam uses -110
	}
	Pass {
		ZWrite Off
		ColorMask RGB
		Blend SrcAlpha OneMinusSrcAlpha
	
CGPROGRAM
#pragma vertex vert

#include "UnityCG.cginc"

uniform float4 WaveSpeed;
uniform float _WaveScale;
uniform float _ReflDistort;

struct appdata {
	float4 vertex : POSITION;
	float3 normal : NORMAL;
};

struct v2f {
	V2F_POS_FOG;
	float2 bumpuv[2] : TEXCOORD0;
	float3 viewDir : TEXCOORD2;
	float4 ref : TEXCOORD3;
}; 

v2f vert(appdata v)
{
	v2f o;
	PositionFog( v.vertex, o.pos, o.fog );
	
	// scroll bump waves
	float4 temp;
	temp.xyzw = (v.vertex.xzxz + _Time.x * WaveSpeed.xyzw) * _WaveScale;
	o.bumpuv[0] = temp.xy * float2(.4, .45);
	o.bumpuv[1] = temp.wz;
	
	// object space view direction
	o.viewDir.xzy = normalize( ObjSpaceViewDir(v.vertex) );
	
	// calculate the reflection vector
	float4x4 mat = float4x4 (
		.5, 0, 0,.5,
		 0,.5 * _ProjectionParams.x, 0,.5,
		 0, 0,.5,.5,
		 0, 0, 0, 1
	);	
	o.ref = mul (mat, o.pos);
	
	return o;
}
ENDCG

Program "" {
SubProgram {
	Keywords { "WATER_REFLECTIVE" "WATER_REFRACTIVE" }
	SetTexture [_BumpMap] { 2D }
	SetTexture [_BumpMap] { 2D }
	SetTexture [_Fresnel] { 2D }
	SetTexture [_ReflectionTex] { 2D }
	Local 0, ([_ReflDistort],0,0,0)

"!!ATIfs1.0
StartConstants;
	CONSTANT c0 = program.local[0];
EndConstants;

StartPrelimPass;
	PassTexCoord r3, t3.stq_dq; # reflection vector
	SampleMap r0, t0.str;	# bump1
	SampleMap r1, t1.str;	# bump2
	PassTexCoord r2, t2.str;
	
	ADD r1.half, r0.bias, r1.bias;	# bump = bump1 + bump2 - 1
	DOT3 r2, r1.2x, r2;				# fresnel: dot (bump, viewer-pos)
	# add less offset because it's purely screenspace; big ones look bad
	MAD r3.rg, r1, c0.r, r3;		# uv += bump * strength; add less because it's not perspective
EndPass;

StartOutputPass;
	SampleMap r3, r3.str;		# reflection color
 	SampleMap r2, r2.str;		# water color/fresnel
 	MOV r0, r3;
 	MUL r0.a, r2.a, r2.a; # square fresnel because water mesh is very low-poly
EndPass;
" 
}
SubProgram {
	Keywords { "WATER_SIMPLE" }
	SetTexture [_BumpMap] { 2D }
	SetTexture [_BumpMap] { 2D }
	SetTexture [_ReflectiveColor] { 2D }
	Local 0, [_HorizonColor]

"!!ATIfs1.0
StartConstants;
	CONSTANT c0 = program.local[0];
EndConstants;

StartPrelimPass;
	SampleMap r0, t0.str;
	SampleMap r1, t1.str;
	PassTexCoord r2, t2.str;
	
	ADD r1, r0.bias, r1.bias;	# bump = bump1 + bump2 - 1
	DOT3 r2, r1, r2;			# fresnel: dot (bump, viewer-pos)
EndPass;

StartOutputPass;
 	SampleMap r2, r2.str;

	#MOV r0.rgb, r2;
	LERP r0.rgb, r2.a, c0, r2;	# fade in reflection
	MOV r0.a, c0.a;
EndPass;
" 
}
}
	}
}*/

// -----------------------------------------------------------
//  Old cards

// three texture, cubemaps
Subshader {
	Tags {
		"WaterMode" = "Simple"
		"Queue" = "Transparent-120" // foam uses -110
	}
	Pass {
		ZWrite Off
		ColorMask RGB
		Blend SrcAlpha OneMinusSrcAlpha
		Color (0.5,0.5,0.5,0.3)
		SetTexture [_MainTex] {
			Matrix [_WaveMatrix]
			combine texture * primary
		}
		SetTexture [_MainTex] {
			Matrix [_WaveMatrix2]
			combine texture * primary + previous
		}
		SetTexture [_ReflectiveColorCube] {
			combine texture * previous, primary
			Matrix [_Reflection]
		}
	}
}

// single texture, cubemaps
Subshader {
	Tags {
		"WaterMode" = "Simple"
		"Queue" = "Transparent-120" // foam uses -110
	}
	Pass {
		ZWrite Off
		ColorMask RGB
		Blend SrcAlpha OneMinusSrcAlpha
		Color [_HorizonColor]
		SetTexture [_ReflectiveColorCube] {
			combine texture, primary
			Matrix [_Reflection]
		}
	}
}

// single texture
Subshader {
	Tags {
		"WaterMode" = "Simple"
		"Queue" = "Transparent-120" // foam uses -110
	}
	Pass {
		ZWrite Off
		ColorMask RGB
		Blend SrcAlpha OneMinusSrcAlpha
		Color [_HorizonColor]
		SetTexture [_MainTex] {
			Matrix [_WaveMatrix]
			combine texture, primary
		}
	}
}


}
