/***
	videoplayer common superclass impelmentation for all inherited versions. Common interface that can be extended and specified
***/


function VideoPlayerBasic(element_id, profile, width, height){
	console.log("VideoPlayerBasic - Constructor");
	this.FILETYPES = {
		MP4:0,
		MPEG:1,
		DASH:2
	};
	this.element_id = element_id;
	this.element = document.getElementById(element_id);
	if(!this.element){
		this.element = document.createElement("div");
		this.element.setAttribute("id", this.element_id);
	}
	$(this.element).addClass("hidden");
	this.fullscreenElement = this.element;
	this.width = width;
	this.height = height;
	this.visible = false;
	this.url = null;
	this.video = null;
	this.profile = profile;

	// Timers and intervals
	this.progressUpdateInterval = null;
	this.hidePlayerTimer = null;
	
	this.populate = function(){
		console.log("VideoPlayerBasic - populate");
		this.element.innerHTML = "";
		this.video = null;
		this.loadingImage = document.createElement("div");
		this.loadingImage.setAttribute("id", "loadingImage");
		this.loadingImage.addClass("hidden");
		this.element.appendChild(this.loadingImage);
		this.setFullscreen(true);
	};
	
	this.displayPlayer = function( sec ){
		console.log("VideoPlayerBasic - displayPlayer");
		clearTimeout( this.hidePlayerTimer );
		$("#player").removeClass("hide");
		$("#player").addClass("show");
		if(sec){
			this.hidePlayerTimer = setTimeout( function(){
				$("#player").removeClass("show");
			}, sec * 1000);
		}
	};
	
	
	/* Use inherited basic method or player specified */
	this.navigate = this.__proto__.navigate || function(key){
		var self = this;
		
		if( self.onAdBreak ){
			console.log("Navigation on ad break");
		}
		
		switch(key){
			case VK_UP:
				self.displayPlayer(5);
			break;

			case VK_DOWN:
				self.displayPlayer(5);
			break;

			case VK_BACK:
			case VK_STOP:
			case 8: // for edge backspace button
				self.stop();
			break;

			case VK_LEFT:
			case VK_REWIND:
				if( !self.onAdBreak ){
					self.rewind( 30 );
					self.displayPlayer(5);
				}
				break;
			case VK_RIGHT:
			case VK_FAST_FWD:
				if( !self.onAdBreak ){
					self.forward( 30 );
					self.displayPlayer(5);
				}
				break;
			case VK_ENTER:
			case VK_PLAY_PAUSE:
			case VK_PAUSE:
			case VK_PLAY:
				if( !self.onAdBreak ){
					if( this.isPlaying() ){
						this.pause();
					}
					else{
						this.play();
					}
				}
			break;
			case VK_YELLOW:
				try{
					if( this.video.textTracks ){
						console.log("switch text Track");
						//var tracks = this.video.textTracks.length;
						
						// count all tracks except metadata
						var tracks = 0;
						for( var i = 0; i < this.video.textTracks.length; ++i ){
							if( this.video.textTracks[i].kind != "metadata" )
								tracks++;
						}
						//var tracks = this.video.textTracks.map( function(track){ return track.kind != "metadata" } ).length;
						console.log("text tracks " + tracks );
						if( !tracks ){
							showInfo("No Subtitles Available");
							break;
						}
						
						
						console.log("Current track index " + this.subtitleTrack);
						if( this.subtitleTrack >= tracks ){
							this.subtitleTrack = 0; // was off, select first
						}
						else{
							this.video.textTracks[ this.subtitleTrack ].mode = 'hidden'; // hide current
							this.subtitleTrack++;
						}
						
						var lang = (this.subtitleTrack >= tracks? "off" : this.video.textTracks[ this.subtitleTrack ].label );
						
						$("#subtitleButtonText").html( "Subtitles: " + lang );
						showInfo("Subtitles: " + lang);
						
						if( lang != "off" ){
							this.video.textTracks[ this.subtitleTrack ].mode = 'showing';
						}
					}
				} catch( e ){
					console.log( e.description );
				}
			break;
			default:
			break;
		}
	};
	
	this.setDisplay = function( container ){
		if( container ){
			// detach from DOM
			var element = $(this.element).detach();
			element.addClass("hidden");
			// append into
			$(container).prepend( element );
			element.removeClass("hidden");
		}
		else{
			// if target not set, assume to set fullscreen
			this.setFullscreen(true);
		}
	};
	
	this.setSubtitles = this.__proto__.setSubtitles || function( subtitles ){
		// out-of-band subtitles must be an array containing containing language code and source.xml file url.
		try{
			var player = this.video;
			
			console.log("set subs from active assets metadata 'subtitles'");
			this.subtitles = subtitles;
			
			console.log( JSON.stringify( this.subtitles ) );
			
			if( this.subtitles && this.subtitles.length ){
				
				$.each( this.subtitles, function(i, lang){
					//console.log( lang );
					console.log("Subtitles " + i + ": " + lang.code + " - " + lang.src);
									
					var track = document.createElement("track");
					track.kind = "subtitles";
					track.label = lang.code;
					track.language = lang.code;
					track.src = lang.src;
					track.onerror = function(e){
						console.log(e);
						showInfo("Error with subtitles: " + e.type);
					};
					
					player.appendChild(track);
					
				} );
				$("#subtitleButton").show();
				$("#subtitleButtonText").html( "Subtitles: " + player.textTracks[0].label );
				console.log( "Text tracks: " + player.textTracks.length );
				$.each( player.textTracks, function(i, track){
					console.log( track );
				} );
				this.subtitleTrack = 0;
				player.textTracks[0].mode = "showing";
			}
			else{
				console.log( "no subs" );
			}
		} catch(e){
			console.log("Error: setSubtitles: " + e.description );
		}
	};
	
	this.pause = this.__proto__.pause || function(){
		console.log("VideoPlayerBasic pause");
		var self = this;
		try{
			self.video.pause();
			self.displayPlayer();
		}
		catch(e){
			console.log(e);
		}
	};
	
	this.setLoading = function(loading, reason){
		this.loading = loading;
		if(this.loading){
			this.loadingImage.removeClass("hidden");
		}
		else{
			this.loadingImage.addClass("hidden");
		}
		if(reason){
			console.log(reason);
		}
	};

	this.setFullscreen = function(fs){
		this.fullscreen = fs;
		if(fs){
			this.element.addClass("fullscreen");
			this.setDisplay( $("body")[0] ); // sets video player object to child of body
		}
		else{
			this.element.removeClass("fullscreen");
			this.setDisplay( menu.focus.element ); // sets video player object to child of focused tile element
			$("#player").removeClass("show");
		}

	};

	this.isVisible = function(fs){
		return this.visible;
	};
	
	this.updateProgressBar = function(){
		var position = 0;
		var duration = 0;
		var pbMaxWidth = 895; // progress bar maximum width in pixels
		
		// first try get time out of player and decide which player is used
		try{
			// <video> object used
			if( this.video.duration ){
				position = this.video.currentTime;
				duration = this.video.duration;
			}
			// oipf player object used. Convert milliseconds to seconds
			else if( this.video.playTime ){
				position = this.video.playPosition / 1000;
				duration = this.video.playTime / 1000;
			}
			else{
				console.log("Videoplayer not ready. Can not get position or duration");
				return;
			}
		} catch(e){
			console.log( e.message );
		}
		
		try{
			var self = this;

			pbar = document.getElementById("progressbar");

			var barWidth = Math.floor((position / duration) * pbMaxWidth );
			if(barWidth > pbMaxWidth){
				barWidth = pbMaxWidth;
			}
			else if( barWidth < 0 ){
				barWidth = 0;
			}
			
			pbar.style.width = barWidth + "px";
			
			var play_position = barWidth;
			
			$("#playposition").css("left", play_position);
			$("#progress_currentTime").css("left", play_position);


			
			$("#playposition").html("");
			if(position){
				var pp_hours = Math.floor(position / 60 / 60);
				var pp_minutes = Math.floor((position-(pp_hours*60*60)) / 60);
				var pp_seconds = Math.round((position-(pp_hours*60*60)-(pp_minutes*60)));
				$("#playposition").html( addZeroPrefix(pp_hours) + ":" + addZeroPrefix(pp_minutes) + ":" + addZeroPrefix(pp_seconds) );
			}

			document.getElementById("playtime").innerHTML = "";
			if(duration){
				var pt_hours = Math.floor(duration / 60 / 60);
				var pt_minutes = Math.floor((duration-(pt_hours*60*60))  / 60);
				var pt_seconds = Math.round((duration-(pt_hours*60*60)-(pt_minutes*60)) );
				document.getElementById("playtime").innerHTML = addZeroPrefix(pt_hours) + ":" + addZeroPrefix(pt_minutes) + ":" + addZeroPrefix(pt_seconds);
			}
		} catch(e){
			console.log( e.message );
		}

	};
	
	this.setDRM = function( system, la_url){
		if( !system ){
			this.drm = null;
		}
		else{
			console.log("setDRM("+ system +", "+la_url+")");
			this.drm = { la_url : la_url, system : system, ready : false, error : null};
		}
	};
}




