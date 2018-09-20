<script>
var shortid = function(){
  var __initime = 1460332800000,
    __symbols = ['0','1','2','3','4','5','6','7','8','9',
	  'a','b','c','d','e','f','g','h','i','j',
	  'k','l','m','n','o','p','q','r','s','t',
	  'u','v','w','x','y','z','A','B','C','D',
	  'E','F','G','H','I','J','K','L','M','N',
	  'O','P','Q','R','S','T','U','V','W','X','Y','Z'],
	__base = 62,
	__paddingLeft = function(padding, val) {
	  return (padding+val).slice(-padding.length);	
	},
    ShortId = function(opt) {
	  this._opt = opt||{};
    };
	ShortId.prototype = {
	  _toBase: function (decimal, base) {
		var opt=this._opt,
		  symbols=opt.symbols||__symbols,
		  conversion = "";
		if (base > symbols.length || base <= 1) {
			return false;
		}
		while (decimal >= 1) {
		  conversion = symbols[(decimal - (base * Math.floor(decimal / base)))] + 
		    conversion;
		  decimal = Math.floor(decimal / base);
		}
		return (base < 11) ? parseInt(conversion) : conversion;
	  },
	  _salts: function() {
	    var self=this,opt=self._opt,salts=opt.salts||2,
		  ret='';
		for(var i=0;i<salts;i++) {
		  var salt = Math.floor(Math.random()*3844);
		  ret += __paddingLeft('00',self._toBase(salt, __base));
		}
		return ret;
	  },
	  gen: function() {
	    var self=this,opt=self._opt,interval=opt.interval||1,
		  initime = opt.initTime||__initime,
		  elapsed = interval>0?Math.floor((new Date().getTime()-initime)/interval):0,
		  salts = self._salts();
		return elapsed===0?salts:(self._toBase(elapsed, __base)+salts);
	  }
	};
	return {
	  inst:function(opt){
		return new ShortId(opt);
	  },
	  gen: function(opt) {
		return new ShortId(opt).gen();
	  },
	  uuid: function() {
		return new ShortId({salts:4}).gen();
	  }
	};
};

require = function(url,cb) {
	var loadScript = function(url,callback) {

		var script = document.createElement("script");
		script.type = "text/javascript";
		if (script.readyState){  
			script.onreadystatechange = function(){
				if (script.readyState == "loaded" ||
						script.readyState == "complete"){
					script.onreadystatechange = null;
					callback();
				}
			};
		} else {  
			script.onload = callback;
		};
		script.src = url;
		document.getElementsByTagName("head")[0].appendChild(script);
	};

	function loadResources(list,i,cbz) {
		if (!list[i]) return cbz();
		var link=document.createElement('link');
		link.rel="stylesheet";
		link.type="text/css";
		document.getElementsByTagName('')
	};

	function loader(list,i,cbz) {

		if (!list[i]) return cbz();

		var url=list[i];

		function reqListener () {
			if (!this.response) this.response="";
			if (list[i].indexOf('.modules.js')>-1) {
				var modules=eval(this.response);
				var zpath=list[i].substr(0,list[i].lastIndexOf('/')+1);
				list.splice(i,1);
				for (var j=modules.length-1;j>=0;j--) list.splice(i,0,zpath+modules[j]);
				return loader(list,i,cbz);
			} else {
				window.eval(this.response);
				return loader(list,i+1,cbz);
			}
		};

		function transferFailed() {
			throw "Script: "+list[i]+" Not found";
		};
		
		function updateProgress() {
			
		};
		
		function transferCanceled() {
			
		};
		
		
		if (url.substr(0,1)=="!") {
			loadScript(url.substr(1,url.length),function() {
				loader(list,i+1,cbz)	
			});
			return;
		};
		
		if (url.indexOf('.js')==-1) url=url+".js";

		var newXHR = new XMLHttpRequest();
		newXHR.addEventListener( 'load' , reqListener,false );
		newXHR.addEventListener( "progress" , updateProgress, false);
		newXHR.open( 'GET', url );
		newXHR.send();			
	};

	loader(url,0,cb);

};

function loadResources(list,cb) {
	for (var i=0;i<list.length;i++) {
		var link = document.createElement('link');
		link.rel="stylesheet";
		link.type="text/css";
		link.href=list[i];
		document.getElementsByTagName('head')[0].appendChild(link);
	};
	cb();
};

function BOOTSTRAP_ME() {
	require(['Contents/Settings'],function() {
		loadResources(Settings.RESOURCES, function() {
			require(Settings.FRAMEWORKS,function() {

				require(['Contents/Application/app.js'],function() {
					
				});

			});
		});
	});
}

window.z="0mneediaRulez!";
setTimeout(BOOTSTRAP_ME,1000);


</script>