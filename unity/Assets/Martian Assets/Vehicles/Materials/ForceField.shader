// Upgrade NOTE: replaced 'PositionFog()' with multiply of UNITY_MATRIX_MVP by position
// Upgrade NOTE: replaced 'V2F_POS_FOG' with 'float4 pos : SV_POSITION'

Shader "ForceField" {
    Properties {
        _Offset ("Time", Range (0, 1)) = 0.0
        _Color ("Tint (RGB)", Color) = (1,1,1,1)
        _SurfaceTex ("Texture (RGB)", 2D) = "white" {}
        _RampTex ("Facing Ratio Ramp (RGB)", 2D) = "white" {}
    }
    SubShader {
        ZWrite Off
        Tags { "Queue" = "Transparent" }
        Blend One One
        Cull Off

        Pass {  
            CGPROGRAM 
            #pragma vertex vert
            #pragma fragment frag
            #pragma fragmentoption ARB_fog_exp2
            #include "UnityCG.cginc" 
 
            struct v2f {
                float4 pos : SV_POSITION;
                float2 uv : TEXCOORD0;
                float2 uv2 : TEXCOORD1;
                float3 normal : TEXCOORD2;
            };
            
            uniform float _Offset;
            
            v2f vert (appdata_base v) {
                v2f o;
                o.pos = mul (UNITY_MATRIX_MVP, v.vertex);
                
                float3 viewDir = normalize(ObjSpaceViewDir(v.vertex));
                v.texcoord.x = v.texcoord.x;
                v.texcoord.y = v.texcoord.y + _Offset;
                o.uv = TRANSFORM_UV (1);
                o.uv2 = float2( abs (dot (viewDir, v.normal)), 0.5);
                o.normal = v.normal;
                return o;
            }
            
            uniform float4 _Color;
            uniform sampler2D _RampTex : register(s0);
            uniform sampler2D _SurfaceTex : register(s1);
                
            half4 frag (v2f f) : COLOR 
            {
                f.normal = normalize (f.normal);
                
                half4 ramp = tex2D (_RampTex, f.uv2) * _Color.a;
                half4 texture = tex2D (_SurfaceTex, f.uv) * ramp * _Color;
                
                return half4 (texture.r, texture.g, texture.b, ramp.r);
            }
            
            ENDCG 
 
            SetTexture [_RampTex] {combine texture}
            SetTexture [_SurfaceTex] {combine texture}
        }
    }
    Fallback "Transparent/VertexLit"
}