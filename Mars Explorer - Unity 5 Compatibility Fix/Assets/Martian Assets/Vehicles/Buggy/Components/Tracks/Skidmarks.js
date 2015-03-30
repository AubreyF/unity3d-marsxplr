
//This script borrowed by Aubrey fron the Unity sample networking project

//Script used by the car Script to create skidmark meshes when cornering.
//Just create an empty GameObject and attach this.
RequireComponent(MeshFilter);
RequireComponent(MeshRenderer);

//maximal number of skidmarks 
private var maxMarks = 256;

//width of skid marks
var markWidth = 0.225;

//time interval new mesh segments are generated in
//the lower this value, the smoother the generated tracks
private var updateRate = 0.2;
	
private var indexShift = 0;
private var numMarks = 0;
private var updateTime = 0.0;	
private var newTrackFlag = true;
private var updateMeshFlag = true;
private var meshFilter : MeshFilter;
private var mesh : Mesh;

//data structure describing a section of skidmarks
class markSection{
	var pos : Vector3;
	var normal : Vector3;
	var posl : Vector3;
	var posr : Vector3;
	var intensity = 0.0;
	var lastIndex = -1;
};

var skidmarks : markSection[];	
	
// Use this for initialization
function Start () {
	//create structures
	skidmarks=new markSection[maxMarks];
	for(i=0;i<maxMarks;i++) skidmarks[i] = new markSection();
	meshFilter = gameObject.GetComponent(MeshFilter);
	mesh = meshFilter.mesh;
	if(mesh==null) mesh=new Mesh();
}
	
//called by the car script to add a skid mark at position pos with the supplied normal.
//transparency can be specified in the intensity parameter. Connects to the track segment 
//indexed by lastIndex (or it won't display if lastIndex is -1). returns an index value 
//which can be passed as lastIndex to the next AddSkidMark call
function AddSkidMark(pos : Vector3, normal : Vector3,intensity : float,lastIndex : int) : int
{
	intensity=Mathf.Clamp01(intensity);
	
	//get index for new segment
	currIndex=numMarks;
	
	//reuse lastIndex if we don't need to create a new one this frame
	if(lastIndex!=-1 && !newTrackFlag)
		currIndex=lastIndex;
		
	//setup skidmark structure
	curr=skidmarks[currIndex%maxMarks];
	curr.pos=pos+normal*0.05-transform.position;
	curr.normal=normal;
	curr.intensity=intensity;
	
	if(lastIndex==-1 || newTrackFlag)
		curr.lastIndex=lastIndex;
		
	//if we have a valid lastIndex, get positions for marks
	if(curr.lastIndex!=-1)
	{
		last=skidmarks[curr.lastIndex%maxMarks];
		dir=(curr.pos-last.pos);
		xDir=Vector3.Cross(dir,normal).normalized;
		
		curr.posl=curr.pos+xDir*markWidth*0.5;
		curr.posr=curr.pos-xDir*markWidth*0.5;
		
		if(last.lastIndex==-1)
		{
			last.posl=curr.pos+xDir*markWidth*0.5;
			last.posr=curr.pos-xDir*markWidth*0.5;
		}
	}
	if(lastIndex==-1 || newTrackFlag)
		numMarks++;
	updateMeshFlag=true;
	return currIndex;
}

//regenerate the skidmarks mesh	
function UpdateMesh () {
	//count visible segments
	var segmentCount=0;
	for(i=0;i<numMarks&&i<maxMarks;i++)
		if(skidmarks[i].lastIndex!=-1&&skidmarks[i].lastIndex>numMarks-maxMarks)
			segmentCount++;
	
	//create skidmark mesh coordinates
	vertices=new Vector3[segmentCount*4];
	normals=new Vector3[segmentCount*4];
	colors=new Color[segmentCount*4];
	uvs = new Vector2[segmentCount*4];
	triangles=new int[segmentCount*6];
	segmentCount=0;
	for(i=0;i<numMarks&&i<maxMarks;i++)
		if(skidmarks[i].lastIndex!=-1&&skidmarks[i].lastIndex>numMarks-maxMarks)
		{
			curr=skidmarks[i];
			last=skidmarks[curr.lastIndex%maxMarks];
						
			vertices[segmentCount*4+0]=last.posl;
			vertices[segmentCount*4+1]=last.posr;
			vertices[segmentCount*4+2]=curr.posl;
			vertices[segmentCount*4+3]=curr.posr;
			
			normals[segmentCount*4+0]=last.normal;
			normals[segmentCount*4+1]=last.normal;
			normals[segmentCount*4+2]=curr.normal;
			normals[segmentCount*4+3]=curr.normal;

			colors[segmentCount*4+0]=new Color(1,1,1,last.intensity);
			colors[segmentCount*4+1]=new Color(1,1,1,last.intensity);
			colors[segmentCount*4+2]=new Color(1,1,1,curr.intensity);
			colors[segmentCount*4+3]=new Color(1,1,1,curr.intensity);

			uvs[segmentCount*4+0]=new Vector2(0,0);
			uvs[segmentCount*4+1]=new Vector2(1,0);
			uvs[segmentCount*4+2]=new Vector2(0,0);
			uvs[segmentCount*4+3]=new Vector2(1,0);
			
			triangles[segmentCount*6+0]=segmentCount*4+0;
			triangles[segmentCount*6+1]=segmentCount*4+1;
			triangles[segmentCount*6+2]=segmentCount*4+2;
			
			triangles[segmentCount*6+3]=segmentCount*4+2;
			triangles[segmentCount*6+4]=segmentCount*4+1;
			triangles[segmentCount*6+5]=segmentCount*4+3;
			segmentCount++;			
		}
	
	//update mesh
	mesh.Clear();
	mesh.vertices=vertices;
	mesh.normals=normals;
	mesh.triangles=triangles;
	mesh.colors=colors;
	mesh.uv=uvs;
	updateMeshFlag=false;
}

function Update()
{
	//update mesh if skidmarks have changed since last frame
	if(updateMeshFlag)
		UpdateMesh();
}

function FixedUpdate()
{
	//set flag for creating new segments this frame if an update is pending
	newTrackFlag = false;
	updateTime += Time.deltaTime;
	if(updateTime > updateRate)
	{
		newTrackFlag = true;
		updateTime -= updateRate;
	}
}