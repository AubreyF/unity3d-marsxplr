@MenuItem("Terrain/Update Tree Lightmap Color")
static function RebuildWithLightmap () {
	var tex : Texture2D = Selection.activeObject as Texture2D;
	if (tex)
	{
		if (Terrain.activeTerrain == null || Terrain.activeTerrain.terrainData == null)
		{
			EditorUtility.DisplayDialog("No active terrain in the scene", "No active terrain in the scene", "Ok");
			return;
		}

		Undo.RecordObject(Terrain.activeTerrain.terrainData, "Set Tree colors");
		//DRAGONHERE: depricated
		//UnityEditor.TerrainLightmapper.UpdateTreeLightmapColor(tex, Terrain.activeTerrain.terrainData);
	}
	else
		EditorUtility.DisplayDialog("Select a lightmap", "Select a lightmap", "Ok");
}

@MenuItem("Terrain/Update Tree Color")
static function RebuildWithColor () {
	var tex : Texture2D = Selection.activeObject as Texture2D;
	if (tex)
	{
		if (Terrain.activeTerrain == null || Terrain.activeTerrain.terrainData == null)
		{
			EditorUtility.DisplayDialog("No active terrain in the scene", "No active terrain in the scene", "Ok");
			return;
		}

		Undo.RecordObject(Terrain.activeTerrain.terrainData, "Set Tree colors");
		//UnityEditor.TerrainLightmapper.UpdateTreeColor(tex, Terrain.activeTerrain.terrainData);
	}
	else
		EditorUtility.DisplayDialog("Select a lightmap", "Select a lightmap", "Ok");
}
