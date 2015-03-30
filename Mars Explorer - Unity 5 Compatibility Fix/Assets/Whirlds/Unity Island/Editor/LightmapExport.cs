using UnityEngine;
using UnityEditor;
using System.Collections;
using System.IO;
 
public class LightmapExport : ScriptableObject
{    
    [MenuItem ("CUSTOM/Duplicate Texture")]
    static void DoRecord()
    {
    	byte[] myBytes;
		Texture2D lightmapTexture;	
       lightmapTexture = (Texture2D) Selection.activeObject;
   	   myBytes = lightmapTexture.EncodeToPNG();
   	   string filename = Selection.activeObject.name + "Duplicate.png";
      File.WriteAllBytes(Application.dataPath + "/"+filename, myBytes); 
       EditorUtility.DisplayDialog("Texture Duplicated", "Selected Texture2D saved in Assets/ as: " + filename, "");
    }
 }