var fogDensity = 0.00;
var fogColor : Color;
var baseColor : Color;
var baseMultBlurPixels = 0.00;
var blurOverDrive = 0.00;
var depthAmbient = 1.50;

var terrainSize : Vector3;
var terrainCollider : Collider;
var texture : Texture2D;

@ContextMenu ("Apply Fog")
function ApplyFog ()
{
	var bColorTex = new Texture2D(texture.width, texture.height);
	var x = 0.00;
	var y = 0.00;
	while(x < texture.width)
	{
		y = 0.00;
		while(y < texture.height)
		{
			vect = Vector3(parseFloat(x / texture.width) * terrainSize.x, 400.00, parseFloat(y / texture.height) * terrainSize.y);
			var hit : RaycastHit;
			if(terrainCollider.Raycast(Ray(vect, Vector3.up * -500), hit, 500))
			{
				depth = 35.35 - hit.point.y;
				if(x == 256) print(vect);
				if(depth > 0)
				{
					lightCol = texture.GetPixel(x,y);
					curCol = Color.Lerp(lightCol, Color.gray, depthAmbient * depth * fogDensity);
					fog = Vector3(Mathf.Pow(fogColor.r, depth * fogDensity), Mathf.Pow(fogColor.g, depth * fogDensity), Mathf.Pow(fogColor.b, depth * fogDensity));
					texture.SetPixel(x,y, Color(curCol.r * fog.x * lightCol.a, curCol.g * fog.y * lightCol.a, curCol.b * fog.z * lightCol.a, curCol.a));
					bColorTex.SetPixel(x,y, Color(baseColor.r, baseColor.g, baseColor.b, 1));
 				}
 				else
 				{
 					bColorTex.SetPixel(x,y, Color.white);	
 				}
			}
			y++;
		}
		x++;	
	}
	
	//bColorTex.Apply();
	
	x = 0.00;
	while(x < texture.width)
	{
		y = 0.00;
		while(y < texture.height)
		{
			curCol = texture.GetPixel(x,y);
			
			var lerp : float;
			if(baseMultBlurPixels > 0)
			{
				lerp = (1.00 / (4.00 * baseMultBlurPixels)) * (1 + blurOverDrive);
				pix = baseMultBlurPixels;
			}
			else
			{
				lerp = 1.00;
				pix = baseMultBlurPixels;
			}
			
			temp = bColorTex.GetPixel(Mathf.Clamp(x, 0, texture.width - 1), Mathf.Clamp(y, 0, texture.width - 1));
			curCol = Color.Lerp(curCol, Color(curCol.r * temp.r, curCol.g * temp.g, curCol.b * temp.b, curCol.a), lerp);
			while(pix > 0)
			{
				temp = bColorTex.GetPixel(Mathf.Clamp(x+pix, 0, texture.width - 1), Mathf.Clamp(y, 0, texture.width - 1));
				curCol = Color.Lerp(curCol, Color(curCol.r * temp.r, curCol.g * temp.g, curCol.b * temp.b, curCol.a), lerp);
				
				temp = bColorTex.GetPixel(Mathf.Clamp(x-pix, 0, texture.width - 1), Mathf.Clamp(y, 0, texture.width - 1));
				curCol = Color.Lerp(curCol, Color(curCol.r * temp.r, curCol.g * temp.g, curCol.b * temp.b, curCol.a), lerp);
				
				temp = bColorTex.GetPixel(Mathf.Clamp(x, 0, texture.width - 1), Mathf.Clamp(y+pix, 0, texture.width - 1));
				curCol = Color.Lerp(curCol, Color(curCol.r * temp.r, curCol.g * temp.g, curCol.b * temp.b, curCol.a), lerp);
				
				temp = bColorTex.GetPixel(Mathf.Clamp(x, 0, texture.width - 1), Mathf.Clamp(y-pix, 0, texture.width - 1));
				curCol = Color.Lerp(curCol, Color(curCol.r * temp.r, curCol.g * temp.g, curCol.b * temp.b, curCol.a), lerp);
				pix --;
			}
			texture.SetPixel(x,y, curCol);
			
			y++;
		}
		x++;	
	}
	texture.Apply();
	DestroyImmediate(bColorTex);
}