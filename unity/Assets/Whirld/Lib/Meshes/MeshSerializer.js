import System.IO;

// A simple mesh saving/loading functionality.
// This is an utility script, you don't need to add it to any objects.
// See SaveMeshForWeb and LoadMeshFromWeb for example of use.
//
// Uses a custom binary format:
//
//    2 bytes vertex count
//    2 bytes triangle count
//    1 bytes vertex format (bits: 0=vertices, 1=normals, 2=tangents, 3=uvs)
//
//    After that come vertex component arrays, each optional except for positions.
//    Which ones are present depends on vertex format:
//        Positions
//            Bounding box is before the array (xmin,xmax,ymin,ymax,zmin,zmax)
//            Then each vertex component is 2 byte unsigned short, interpolated between the bound axis
//        Normals
//            One byte per component
//        Tangents
//            One byte per component
//        UVs (8 bytes/vertex - 2 floats)
//            Bounding box is before the array (xmin,xmax,ymin,ymax)
//            Then each UV component is 2 byte unsigned short, interpolated between the bound axis
//
//    Finally the triangle indices array: 6 bytes per triangle (3 unsigned short indices)


// Reads mesh from an array of bytes. Can return null
// if the bytes seem invalid.
static function ReadMesh( bytes : byte[] ) : Mesh
{
    if( !bytes || bytes.Length < 5 )
    {
        print( "Invalid mesh file!" );
        return null;
    }
   
    var buf = new BinaryReader( new MemoryStream( bytes ) );
   
    // read header
    var vertCount = buf.ReadUInt16();
    var triCount = buf.ReadUInt16();
    var format = buf.ReadByte();
   
    // sanity check
    if (vertCount < 0 || vertCount > 64000)
    {
        print ("Invalid vertex count in the mesh data!");
        return null;
    }
    if (triCount < 0 || triCount > 64000)
    {
        print ("Invalid triangle count in the mesh data!");
        return null;
    }
    if (format < 1 || (format&1) == 0 || format > 15)
    {
        print ("Invalid vertex format in the mesh data!");
        return null;
    }
   
    var mesh = new Mesh();
    var i : int;
   
    // positions
    var verts = new Vector3[vertCount];
    ReadVector3Array16bit (verts, buf);
    mesh.vertices = verts;
   
    if( format & 2 ) // have normals
    {
        var normals = new Vector3[vertCount];
        ReadVector3ArrayBytes (normals, buf);
        mesh.normals = normals;
    }
   
    if( format & 4 ) // have tangents
    {
        var tangents = new Vector4[vertCount];
        ReadVector4ArrayBytes (tangents, buf);
        mesh.tangents = tangents;
    }
   
    if( format & 8 ) // have UVs
    {
        var uvs = new Vector2[vertCount];
        ReadVector2Array16bit (uvs, buf);
        mesh.uv = uvs;
    }
   
    // triangle indices
    var tris = new int[triCount * 3];
    for( i = 0; i < triCount; ++i )
    {
        tris[i*3+0] = buf.ReadUInt16();
        tris[i*3+1] = buf.ReadUInt16();
        tris[i*3+2] = buf.ReadUInt16();
    }
    mesh.triangles = tris;
   
    buf.Close();
   
    return mesh;
}

static function ReadVector3Array16bit (arr : Vector3[], buf : BinaryReader) : void
{
    var n = arr.Length;
    if (n == 0)
        return;
       
    // Read bounding box
    var bmin : Vector3;
    var bmax : Vector3;
    bmin.x = buf.ReadSingle ();
    bmax.x = buf.ReadSingle ();
    bmin.y = buf.ReadSingle ();
    bmax.y = buf.ReadSingle ();
    bmin.z = buf.ReadSingle ();
    bmax.z = buf.ReadSingle ();
   
    // Decode vectors as 16 bit integer components between the bounds
    for (var i = 0; i < n; ++i) {
        var ix : System.UInt16 = buf.ReadUInt16 ();
        var iy : System.UInt16 = buf.ReadUInt16 ();
        var iz : System.UInt16 = buf.ReadUInt16 ();
        var xx : float = ix / 65535.0 * (bmax.x - bmin.x) + bmin.x;
        var yy : float = iy / 65535.0 * (bmax.y - bmin.y) + bmin.y;
        var zz : float = iz / 65535.0 * (bmax.z - bmin.z) + bmin.z;
        arr[i] = Vector3 (xx,yy,zz);
    }
}

static function WriteVector3Array16bit (arr : Vector3[], buf : BinaryWriter) : void
{
    if (arr.Length == 0)
        return;
   
    // Calculate bounding box of the array
    var bounds = Bounds (arr[0], Vector3(0.001,0.001,0.001));
    for (var v in arr)
        bounds.Encapsulate (v);
       
    // Write bounds to stream
    var bmin = bounds.min;
    var bmax = bounds.max;
    buf.Write (bmin.x);
    buf.Write (bmax.x);
    buf.Write (bmin.y);
    buf.Write (bmax.y);
    buf.Write (bmin.z);
    buf.Write (bmax.z);
   
    // Encode vectors as 16 bit integer components between the bounds
    for (var v in arr) {
        var xx = Mathf.Clamp ((v.x - bmin.x) / (bmax.x - bmin.x) * 65535.0, 0.0, 65535.0);
        var yy = Mathf.Clamp ((v.y - bmin.y) / (bmax.y - bmin.y) * 65535.0, 0.0, 65535.0);
        var zz = Mathf.Clamp ((v.z - bmin.z) / (bmax.z - bmin.z) * 65535.0, 0.0, 65535.0);
        var ix : System.UInt16 = xx;
        var iy : System.UInt16 = yy;
        var iz : System.UInt16 = zz;
        buf.Write (ix);
        buf.Write (iy);
        buf.Write (iz);
    }
}


static function ReadVector2Array16bit (arr : Vector2[], buf : BinaryReader) : void
{
    var n = arr.Length;
    if (n == 0)
        return;
       
    // Read bounding box
    var bmin : Vector2;
    var bmax : Vector2;
    bmin.x = buf.ReadSingle ();
    bmax.x = buf.ReadSingle ();
    bmin.y = buf.ReadSingle ();
    bmax.y = buf.ReadSingle ();
   
    // Decode vectors as 16 bit integer components between the bounds
    for (var i = 0; i < n; ++i) {
        var ix : System.UInt16 = buf.ReadUInt16 ();
        var iy : System.UInt16 = buf.ReadUInt16 ();
        var xx : float = ix / 65535.0 * (bmax.x - bmin.x) + bmin.x;
        var yy : float = iy / 65535.0 * (bmax.y - bmin.y) + bmin.y;
        arr[i] = Vector2 (xx,yy);
    }
}

static function WriteVector2Array16bit (arr : Vector2[], buf : BinaryWriter) : void
{
    if (arr.Length == 0)
        return;
   
    // Calculate bounding box of the array
    var bmin : Vector2 = arr[0] - Vector2(0.001,0.001);
    var bmax : Vector2 = arr[0] + Vector2(0.001,0.001);
    for (var v in arr) {
        bmin.x = Mathf.Min (bmin.x, v.x);
        bmin.y = Mathf.Min (bmin.y, v.y);
        bmax.x = Mathf.Max (bmax.x, v.x);
        bmax.y = Mathf.Max (bmax.y, v.y);
    }
       
    // Write bounds to stream
    buf.Write (bmin.x);
    buf.Write (bmax.x);
    buf.Write (bmin.y);
    buf.Write (bmax.y);
   
    // Encode vectors as 16 bit integer components between the bounds
    for (var v in arr) {
        var xx = (v.x - bmin.x) / (bmax.x - bmin.x) * 65535.0;
        var yy = (v.y - bmin.y) / (bmax.y - bmin.y) * 65535.0;
        var ix : System.UInt16 = xx;
        var iy : System.UInt16 = yy;
        buf.Write (ix);
        buf.Write (iy);
    }
}

static function ReadVector3ArrayBytes (arr : Vector3[], buf : BinaryReader) : void
{
    // Decode vectors as 8 bit integers components in -1.0 .. 1.0 range
    var n = arr.Length;
    for (var i = 0; i < n; ++i) {
        var ix : byte = buf.ReadByte ();
        var iy : byte = buf.ReadByte ();
        var iz : byte = buf.ReadByte ();
        var xx : float = (ix - 128.0) / 127.0;
        var yy : float = (iy - 128.0) / 127.0;
        var zz : float = (iz - 128.0) / 127.0;
        arr[i] = Vector3(xx,yy,zz);
    }
}

static function WriteVector3ArrayBytes (arr : Vector3[], buf : BinaryWriter) : void
{
    // Encode vectors as 8 bit integers components in -1.0 .. 1.0 range
    for (var v in arr) {
        var ix : byte = Mathf.Clamp (v.x * 127.0 + 128.0, 0.0, 255.0);
        var iy : byte = Mathf.Clamp (v.y * 127.0 + 128.0, 0.0, 255.0);
        var iz : byte = Mathf.Clamp (v.z * 127.0 + 128.0, 0.0, 255.0);
        buf.Write (ix);
        buf.Write (iy);
        buf.Write (iz);
    }
}

static function ReadVector4ArrayBytes (arr : Vector4[], buf : BinaryReader) : void
{
    // Decode vectors as 8 bit integers components in -1.0 .. 1.0 range
    var n = arr.Length;
    for (var i = 0; i < n; ++i) {
        var ix : byte = buf.ReadByte ();
        var iy : byte = buf.ReadByte ();
        var iz : byte = buf.ReadByte ();
        var iw : byte = buf.ReadByte ();
        var xx : float = (ix - 128.0) / 127.0;
        var yy : float = (iy - 128.0) / 127.0;
        var zz : float = (iz - 128.0) / 127.0;
        var ww : float = (iw - 128.0) / 127.0;
        arr[i] = Vector4(xx,yy,zz,ww);
    }
}

static function WriteVector4ArrayBytes (arr : Vector4[], buf : BinaryWriter) : void
{
    // Encode vectors as 8 bit integers components in -1.0 .. 1.0 range
    for (var v in arr) {
        var ix : byte = Mathf.Clamp (v.x * 127.0 + 128.0, 0.0, 255.0);
        var iy : byte = Mathf.Clamp (v.y * 127.0 + 128.0, 0.0, 255.0);
        var iz : byte = Mathf.Clamp (v.z * 127.0 + 128.0, 0.0, 255.0);
        var iw : byte = Mathf.Clamp (v.w * 127.0 + 128.0, 0.0, 255.0);
        buf.Write (ix);
        buf.Write (iy);
        buf.Write (iz);
        buf.Write (iw);
    }
}

// Writes mesh to an array of bytes.
static function WriteMesh( mesh : Mesh, saveTangents : boolean ) : byte[]
{
    if( !mesh )
    {
        print( "No mesh given!" );
        return null;
    }
   
    var verts = mesh.vertices;
    var normals = mesh.normals;
    var tangents = mesh.tangents;
    var uvs = mesh.uv;   
    var tris = mesh.triangles;
   
    // figure out vertex format
    var format : byte = 1;
    if( normals.Length > 0 )
        format |= 2;
    if( saveTangents && tangents.Length > 0 )
        format |= 4;
    if( uvs.Length > 0 )
        format |= 8;
   
    var stream = new MemoryStream();
    var buf = new BinaryWriter( stream );
   
    // write header
    var vertCount : System.UInt16 = verts.Length;
    var triCount : System.UInt16 = tris.Length / 3;
    buf.Write( vertCount );
    buf.Write( triCount );
    buf.Write( format );
    // vertex components
    WriteVector3Array16bit (verts, buf);
    WriteVector3ArrayBytes (normals, buf);
    if (saveTangents)
        WriteVector4ArrayBytes (tangents, buf);
    WriteVector2Array16bit (uvs, buf);
    // triangle indices
    for( var idx in tris ) {
        var idx16 : System.UInt16 = idx;
        buf.Write( idx16 );
    }
    buf.Close();
    
    return stream.ToArray();
}


// Writes mesh to a local file, for loading with WWW interface later.
static function WriteMeshToFileForWeb( mesh : Mesh, name : String, saveTangents : boolean )
{
    // Write mesh to regular bytes
    var bytes = WriteMesh( mesh, saveTangents );
   
    // Write to file
    var fs = new FileStream( name, FileMode.Create );
    fs.Write( bytes, 0, bytes.Length );
    fs.Close();
}


// Reads mesh from the given WWW (that is finished downloading already)
static function ReadMeshFromWWW( download : WWW ) : Mesh
{
    if (download.error) {
        print ("Error downloading mesh: " + download.error);
        return null;
    }
   
    if (!download.isDone) {
        print ("Download must be finished already");
        return null;
    }
   
    var bytes = download.bytes;
   
    // Read and return the mesh from regular bytes.
    return ReadMesh( bytes );
}