using UnityEngine;

// Sets up transformation matrices to scale&scroll water waves
// for the case where graphics card does not support vertex programs.

[ExecuteInEditMode]
public class LavaSimple : MonoBehaviour
{
	void Update()
	{
		if( !GetComponent<Renderer>() )
			return;
		Material mat = GetComponent<Renderer>().sharedMaterial;
		if( !mat )
			return;
			
		Vector4 waveSpeed = mat.GetVector( "WaveSpeed" );
		float waveScale = mat.GetFloat( "_WaveScale" );
		float t = Time.time / 40.0f;
		
		Vector3 offset = new Vector3( t * waveSpeed.x, t * waveSpeed.y, 0 );
		Vector3 scale = new Vector3( 1.0f/waveScale, 1.0f/waveScale, 1 );
		Matrix4x4 scrollMatrix = Matrix4x4.TRS( offset, Quaternion.identity, scale );
		mat.SetMatrix( "_WaveMatrix", scrollMatrix );
		
		offset = new Vector3( t * waveSpeed.z, t * waveSpeed.w, 0 );
		scrollMatrix = Matrix4x4.TRS( offset, Quaternion.identity, scale * 0.45f );
		mat.SetMatrix( "_WaveMatrix2", scrollMatrix );
	}
}
