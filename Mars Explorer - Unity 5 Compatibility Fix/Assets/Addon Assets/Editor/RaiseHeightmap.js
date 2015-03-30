class RaiseHeightmap extends ScriptableWizard {
    var addHeight = .1;
    var sinkBorders : boolean = true;
    static var terrain : TerrainData;

    @MenuItem ("Terrain/Raise or Lower Heightmap...")
    static function CreateWizard () {
        terrain = null;
        var terrainObject : Terrain = Selection.activeObject as Terrain;
        if (!terrainObject) {
            terrainObject = Terrain.activeTerrain;
        }
        if (terrainObject) {
            terrain = terrainObject.terrainData;
            var buttonText = "Apply Height";
        }
        else {
            buttonText = "Cancel";
        }
        ScriptableWizard.DisplayWizard("Raise/Lower Heightmap", RaiseHeightmap, buttonText);
    }

    function OnWizardUpdate () {
        if (!terrain) {
            helpString = "No terrain found";
            return;
        }

        addHeight = Mathf.Clamp(addHeight, -1.0, 1.0);
        helpString = (terrain.size.y*addHeight) + " meters (" + parseInt(addHeight*100.0) + "%)";
    }

    function OnWizardCreate () {
        if (!terrain) {
            return;
        }
        Undo.RecordObject(terrain, "Raise or Lower Heightmap");

        var heights = terrain.GetHeights(0, 0, terrain.heightmapWidth, terrain.heightmapHeight);
        for (y = 0; y < terrain.heightmapHeight; y++) {
            for (x = 0; x < terrain.heightmapWidth; x++) {
            	if(sinkBorders && (x == 0 || y == 0 || x == terrain.heightmapWidth - 1 || y == terrain.heightmapHeight - 1)) {
            		heights[y,x] = 0; //Set borders to 0
            	}
              	else {
              		heights[y,x] = heights[y,x] + addHeight;
            	}
            }
        }
        terrain.SetHeights(0, 0, heights);
        terrain = null;
    }
}
