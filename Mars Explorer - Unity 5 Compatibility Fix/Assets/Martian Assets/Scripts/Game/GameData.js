static var gameVersion : float = 2.22; //.1
static var serverVersion : float = 0.2;
static var gameName : String = "marsxplr";
static var userName : String = "";
static var userCode : String = "";
static var errorMessage : String = "";
static var masterBlacklist : String = "";
static var gameWorlds : GameWorldDesc[];
static var networkMode : int = 0;

class GameWorldDesc extends System.Object {
    var name : String = "";
    var url : String = "";
    //var format : WorldFormats;
    var featured : boolean;
    
    function GameWorldDesc() {
    }
    
	function GameWorldDesc(n : String, u : String, /*f : WorldFormats, */feat : boolean) {
        this.name = n;
        this.url = u;
        //this.format = f;
        this.featured = feat;
    }
}