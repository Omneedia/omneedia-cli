<script>

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

			function reqListener () {
				if (!this.response) this.response="";
				if (list[i].indexOf('.modules.js')>-1) {
					var modules=eval(this.response);
					var zpath=list[i].substr(0,list[i].lastIndexOf('/')+1);
					list.splice(i,1);
					for (var j=modules.length-1;j>=0;j--) list.splice(i,0,zpath+modules[j]);
					return loader(list,i,cbz);
				};
				window.eval(this.response);
				return loader(list,i+1,cbz);
			};

			function transferFailed() {
				throw "Script: "+list[i]+" Not found";
			};
			
			function updateProgress() {
				
			};
			
			function transferCanceled() {
				
			};
			
			var url=list[i];

			if (url.indexOf('.js')==-1) url=url+".js";
			
			if (url.substr(0,1)=="!") {
				loadScript(url.substr(1,url.length),function() {
					loader(list,i+1,cbz)	
				});
				return;
			};
			
			var newXHR = new XMLHttpRequest();
			newXHR.addEventListener( 'load' , reqListener,false );
			newXHR.addEventListener( "progress" , updateProgress, false);
			newXHR.open( 'GET', url );
			newXHR.send();			
		};

		loader(url,0,cb);

	};
	var bootstraploader = function (tab, i, cb) {
		if (i <= tab.length) require([tab[i]], function () {
			bootstraploader(tab, i + 1, cb);
		});
		else cb();
	};
	setTimeout(function () {
		require(["Contents/Settings"], function () {
			bootstraploader(Settings.FRAMEWORKS, 0, function () {
				require(["Contents/Application/app"], function () {

				});
			});
		});
	}, 1000);
</script>