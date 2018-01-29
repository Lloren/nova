"use strict"

function Audio_player(){
	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	this.context = new AudioContext();
	this.queue = [];
	this.playing = false;
	this.output_handle = false;
	this.pause_time = 0;
	this.length = 0;
	this.replaying = false;

	this.new = function (url){
		return new Audio(url);
	};

	this.add = function (audio){

	};

	this.time_out = function (time){
		var sec = Math.floor(time%60);
		return Math.floor(time/60)+':'+(sec<10?'0'+sec:sec);
	};

	this.play = function(audio){
		this.stop();
		this.playing = audio;
		this.playing.volume = 0.05;
		this.playing.load();
		this.playing.play();
		this.replaying = false;
		$(".repeating").removeClass("repeating");
		this.length = false;
		console.log(this.playing);
		var scope = this;
		this.output_handle = setInterval(function (){
			if (scope.length === 0 && scope.playing.duration){
				scope.length = scope.playing.duration;
				$(".current_song .total_time").html(scope.time_out(scope.length));
			}
			$(".current_song .current_time").html(scope.time_out(scope.playing.currentTime));
			$(".current_song .song_played").css("width", (scope.playing.currentTime / scope.playing.duration * 100) + "%");
		}, 100);
	};

	this.play_url = function(url, force){
		force = force || false;
		if (!this.playing || this.playing.src != url || force){
			this.play(this.new(url));
		}
	};

	this.stop = function (){
		if (this.playing){
			clearInterval(this.output_handle);
			var prev = this.playing;
			$(prev).animate({volume: 0}, 1000, function (){});
		}
	};

	this.pause = function (){
		this.pause_time = this.playing.currentTime;
		this.playing.pause();
	};

	this.resume = function (){
		this.playing.currentTime = this.pause_time;
		this.playing.play();
	};

	this.set_pos = function (val){
		this.pause();
		this.pause_time = val * this.length;
		this.resume();
	};
}

function Audio_player2(){
	this.queue = [];
	this.playing = false;
	this.output_handle = false;
	this.pause_time = 0;
	this.is_playing = false;
	this.replaying = false;

	this.new = function (url){
		return new Media(url, function (dat){console.log("media_success", dat)}, function (dat){console.log("media_error", dat)}, this.media_status);
	};

	this.add = function (audio){

	};

	this.media_status = function (dat){
		if (this.replaying && dat == 4){
			this.playing.play();
		}
	};

	this.time_out = function (time){
		var sec = Math.floor(time%60);
		return Math.floor(time/60)+':'+(sec<10?'0'+sec:sec);
	};

	this.play = function(audio){
		if (this.stop() && false){
			setTimeout(function (){
				player._play(audio);
			}, 100);
		} else {
			this._play(audio);
		}
	};

	this._play = function (audio){
		this.playing = audio;
		this.playing.setVolume(0.05);
		this.playing.play();
		this.is_playing = true;
		this.replaying = false;
		$(".repeating").removeClass("repeating");
		this.length = false;
		console.log(this.playing);
		var scope = this;
		this.output_handle = setInterval(function (){
			scope.playing.getCurrentPosition(function (pos){
				if (scope.length <= 0 && scope.playing.getDuration()){
					scope.length = scope.playing.getDuration();
					$(".current_song .total_time").html(scope.time_out(scope.length));
				}
				$(".current_song .current_time").html(scope.time_out(pos));
				$(".current_song .song_played").css("width", (pos / scope.playing.getDuration() * 100) + "%");
			}, function (err){

			});
		}, 100);
	};

	this.play_url = function(url, force){
		force = force || false;
		if (!this.playing || this.playing.src != url || force){
			this.play(this.new(url));
		}
	};

	this.stop = function (){
		console.log("stop", this.playing, this.is_playing);
		if (this.is_playing){
			this.replaying = false;
			$(".repeating").removeClass("repeating");
			clearInterval(this.output_handle);
			if (thePlatform == "ios"){
				this.playing.pause();
			} else {
				var prev = this.playing;
				var vol = 1.0;
				var aud_down = setInterval(function (){
					if (vol <= 0){
						clearInterval(aud_down);
						prev.stop();
						prev.release();
					} else {
						prev.setVolume(vol);
						vol -= 0.1;
					}
				}, 100);
			}
			this.is_playing = false;
			return true;
		}
	};

	this.pause = function (){
		this.playing.pause();
		//this.pause_time = this.playing.currentTime;
		this.is_playing = false;
	};

	this.resume = function (){
		//this.playing.currentTime = this.pause_time;
		this.playing.play();
		this.is_playing = true;
	};

	this.set_pos = function (val){
		this.playing.seekTo(val * this.length * 1000);
		//this.pause();
		//this.pause_time = val * this.length;
		//this.resume();
	};
}
var player = false;

function open_band_dashboard(band_id){
	$.getJSON(base_url+"/ajax/band.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), band_id: band_id, action:'dashboard'}, function (data){
		$("#band_dashboard").data("band_id", data.id);
		$("#band_dashboard .profile_background").css("background-image", "url("+data.image+")");
		$("#band_dashboard .profile_image").attr("src", data.image);
		$("#band_dashboard .profile_name").html(data.name);
		$("#band_dashboard .change_photo").data("id", data.id);
		var song_html = "";
		for (var i=0;i<data.songs.length;i++){
			data.songs[i].play_now = true;
			song_html += template("song_list", data.songs[i]);
		}
		$("#band_dashboard .song_genres_selector").remove();
		$("#band_dashboard #dash_song_list").html(song_html);
		$("#band_name").val(data.name);
		$("#song_genre").show();
		if ($("#song_genre").children().length <= 1){
			var genre_html = "";
			for (var i=0;i<data.genres.length;i++){
				genre_html += '<option value="'+data.genres[i].id+'">'+data.genres[i].name+'</option>';
			}
			$("#song_genre").append(genre_html);
		}
		show_page("band_dashboard");
		if (typeof data.status != "undefined")
			$("#band_status").val(data.status);
	});
}

function open_band(band_id){
	$.getJSON(base_url+"/ajax/band.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), band_id: band_id}, function (data){
		$("#band .profile_image").attr("src", data.image);
		$("#band .profile_name").html(data.name);
		if (data.show_dash_button){
			$("#band .open_band_dashboard").show().data("band_id", data.id);
		} else {
			$("#band .open_band_dashboard").hide();
		}
		show_page("band");
	});
}

var playlist_state = false;
var playlist_touch = false;
var playlist_swipe_start_x = false;
var playlist_swipe_delta_x = false;
var playlist_swipe_start_y = false;
var playlist_swipe_delta_y = false;
var playlist = {type: "", key: "", empty: "", data: []};
function load_playlist(type, key, empty){
	$("#head_bar").hide();
	var force = false;
	if (type !== playlist.type || key !== playlist.key){
		force = true;
		playlist_state = false;
	}
	playlist.empty = empty || false;
	playlist.type = type || "discover";
	if (playlist.type == "discover")
		playlist.empty = "No new Discover songs, try Genre or top lists.";
	playlist.key = key || 0;
	playlist.data = [];
	console.log("playlist", playlist);
	show_page("playlist");
	if (playlist_state){
		$("#playlist_songs").html(playlist_state);
		return;
	} else {
		setTimeout(function (){
			$("#head_bar").hide();
		}, 10);
	}
	$("#playlist_songs").html("Loading...");
	$.getJSON(base_url+"/ajax/get_list.php?callback=?", {type:playlist.type, key: playlist.key, user_id: settings.get("user_id"), uuid: settings.get("uuid")}, function (data){
		if (!data.songs || data.songs.length == 0){
			playlist_state = playlist.empty;
		} else {
			var htmls = [];
			for (var i=0;i<data.songs.length;i++){
				var song = data.songs[i];
				song.add_class = "";
				if (i == 0)
					song.add_class = "current_song";
				if (i == 1)
					song.add_class = "next_song";
				song.genre_data = JSON.stringify(song.genres);
				htmls.push(template("song_disp", song));
			}
			player.play_url(base_url+"/data/band_songs/"+data.songs[0].key+".mp3", force);
			player.length = 0;
			playlist_state = htmls.join("");
		}
		$("#playlist_songs").html(playlist_state);
		$("#head_bar").hide();
	});
}

function next_playlist(){
	if ($(".song.next_song").length){
		$("#playlist").removeClass("paused");
		$(".song.next_song").animate({left: 0}, 200, function (){
			$(".song.prev_song").removeClass("prev_song");
			$(".song.current_song").removeClass("current_song").addClass("prev_song").css({left: '-100%'});
			$(".song.next_song").removeClass("next_song").addClass("current_song").next().addClass("next_song");
			setTimeout(function (){
				playlist_state = $("#playlist_songs").html();
				player.length = 0;
			}, 1);
		});
		player.play_url(base_url+"/data/band_songs/"+$(".song.next_song").data("key")+".mp3");
	} else if (playlist.empty !== false){
		$("#playlist_songs").html("<br /><br /><br /><br />"+playlist.empty);
	}
	setTimeout(function (){
		playlist_state = $("#playlist_songs").html();
	}, 1);
}

function prev_playlist(){
	if ($(".song.prev_song").length){
		$("#playlist").removeClass("paused");
		$(".song.prev_song").animate({left: 0}, 200, function (){
			$(".song.next_song").removeClass("next_song");
			$(".song.current_song").removeClass("current_song").addClass("next_song").css({left: '100%'});
			$(".song.prev_song").removeClass("prev_song").addClass("current_song").prev().addClass("prev_song");
			setTimeout(function (){
				playlist_state = $("#playlist_songs").html();
				player.length = 0;
			}, 1);
		});
		player.play_url(base_url+"/data/band_songs/"+$(".song.prev_song").data("key")+".mp3");
	}
	setTimeout(function (){
		playlist_state = $("#playlist_songs").html();
	}, 1);
}

function play_song(song_id){
	back_log("load_playlist", ["song", song_id]);
}

function load_admin(){
	$.getJSON(base_url+"/ajax/admin.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), action:"dashboard"}, function (data){
		var band_html = "";
		for (var i=0;i<data.bands.length;i++){
			band_html += template("band_list", data.bands[i]);
		}
		if (band_html == "")
			band_html = "No bands to approve";
		$("#admin_bands").html(band_html);
	});
}

function load_featured(){
	$.getJSON(base_url+"/ajax/featured.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid")}, function (data){
		$("#featured_featured .feature").attr("src", data.image_url).data("band_id", data.band_id);//TODO: dynamicafy
	});
}

function load_genres(){
	$.getJSON(base_url+"/ajax/genre.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid")}, function (data){
		$("#genre_featured .feature").attr("src", data.image_url).data("band_id", data.band_id);//TODO: dynamicafy
		var genre_html = [];
		for (var i=0;i<data.genres.length;i++){
			genre_html.push(template("text_list_item", data.genres[i]));
		}
		$("#genre_list").html(genre_html.join(""));
	});
}

function load_social(){
}

function open_full_list(type, name){
	$.getJSON(base_url+"/ajax/get_list.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), type: type}, function (data){
		var htmls = [];
		for (var i=0;i<data.songs.length;i++){
			var item = data.songs[i];
			item.num = i+1;
			htmls.push(template("full_list", item));
		}
		$("#full_list_content").html(htmls.join(""));
	});
	$("#full_list_title").html(name);
	show_page("full_list");
}

function open_profile_yours(){
	$.getJSON(base_url+"/ajax/profile.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), users_id: settings.get("user_id")}, function (data){
		$("#your_profile .profile_background").css("background-image", "url("+data.image+")");
		$("#your_profile .profile_image_src").attr("src", data.image);
		$("#your_profile .profile_name").html(data.name);

		var song_htmls = [];
		for (var i=0;i<data.songs.length;i++){
			song_htmls.push(template("half_list", data.songs[i]));
		}
		$("#profile_your_songs").html(song_htmls.join(""));

		var playlists_htmls = [];
		for (var i=0;i<data.playlists.length;i++){
			playlists_htmls.push(template("playlist_list", data.playlists[i]));
		}
		$("#profile_your_playlists").html(playlists_htmls.join(""));

		var notifications_htmls = [];
		for (var i=0;i<data.notifications.length;i++){
			notifications_htmls.push(template("notification_list", data.notifications[i]));
		}
		$("#profile_notifications").html(notifications_htmls.join(""));

		var band_htmls = [];
		for (var i=0;i<data.your_bands.length;i++){
			band_htmls.push(template("band_list", data.your_bands[i]));
		}
		$("#settings_bands").html(band_htmls.join(""));

		$("#settings_name").val(data.name);
		show_page("your_profile");
	});
}

function open_profile(user_id){
	$.getJSON(base_url+"/ajax/profile.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), users_id: user_id}, function (data){
		$("#profile .profile_background").css("background-image", "url("+data.image+")");
		$("#profile .profile_image").attr("src", data.image);
		$("#profile .profile_name").html(data.name);
		if (data.is_fallowing){
			$(".add_friend").hide();
		} else {
			$(".add_friend").show().data("user_id", data.id);
		}

		var song_htmls = [];
		for (var i=0;i<data.songs.length;i++){
			song_htmls.push(template("half_list", data.songs[i]));
		}
		$("#profile_songs").html(song_htmls.join(""));

		var playlists_htmls = [];
		for (var i=0;i<data.playlists.length;i++){
			playlists_htmls.push(template("playlist_list", data.playlists[i]));
		}
		$("#profile_playlists").html(playlists_htmls.join(""));

		show_page("profile");
	});
}

function view_playlist(playlist_id){
	$.getJSON(base_url+"/ajax/settings.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), action:"playlist_info", playlist_id: playlist_id}, function (data){
		$("#view_playlist_name").html(data.playlist.name);
		var song_htmls = [];
		for (var i=0;i<data.songs.length;i++){
			song_htmls.push(template("half_list", data.songs[i]));
		}
		$("#view_playlist_songs").html(song_htmls.join("")+'<div class="clear"></div>');
		show_page("view_playlist");
	});
}

function run_search(term){
	$.getJSON(base_url+"/ajax/search.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), term: term}, function (data){
		var htmls = [];
		if (data.results.users.length > 0)
			htmls.push(template("search_result_group", {name: "Users"}));
		for (var i=0;i<data.results.users.length;i++){
			var t = data.results.users[i];
			t.added = ' open_profile" data-user_id="'+t.id;
			htmls.push(template("search_results", t));
		}
		if (data.results.songs.length > 0)
			htmls.push(template("search_result_group", {name: "Songs"}));
		for (var i=0;i<data.results.songs.length;i++){
			var t = data.results.songs[i];
			t.added = ' open_song" data-song_id="'+t.id;
			htmls.push(template("search_results", t));
		}
		if (data.results.bands.length > 0)
			htmls.push(template("search_result_group", {name: "Bands"}));
		for (var i=0;i<data.results.bands.length;i++){
			var t = data.results.bands[i];
			t.added = ' open_band" data-band_id="'+t.id;
			htmls.push(template("search_results", t));
		}
		if (htmls.length == 0)
			htmls.push("No results");
		$("#search_results").html(htmls.join(""));
	});
}

function save_settings(){
	var settings_data = Object.create(settings.data);
	if (settings.get("user_id") > 0){
		$.post(base_url+"/ajax/settings.php?action=save&uuid="+settings.get("uuid")+"&user_id="+settings.get("user_id"), {data: settings_data}, function (data){
		});
	}
}

//var pages = [];
function show_page(key, onload){
	if (typeof onload == "undefined")
		onload = true;
	var page = $("#"+key);
	/*if (page.data("back")){
		pages = [];
		if ($("#"+key).data("back") == "hide")
			$("#head_back").hide();
		else
			$("#head_back").show();
	} else {
		pages.push($(".page:visible").attr("id"));
		$("#head_back").show();
	}*/
	$("#head_back").show();
	if (page.data("no_back"))
		$("#head_back").hide();
	if (onload && page.data("on_open")){
		window[page.data("on_open")]();
	}
	$(".page").hide();
	$("#head_bar").show();
	page.show();
}
function open_page(key){
	back_log("show_page", [key]);
}

var saved_song_data = false;
var search_query_handle = false;

var name_long_press = false;
var questionnaire = false;
var next_questionnaire = 0;
var next_questionnaire_count = 3;
var last_touch = false;
var playlist_position = false;
var profile_playlist_long_press = false;
var profile_playlist_edit = false;
var profile_song_long_press = false;
var profile_song_press = false;
var profile_song_start_x = false;
var profile_song_start_y = false;
var profile_playlist_loc = false;
var feature_feature_start_x = false;
var feature_feature_delta_x = false;

function startup(){
	console.log("startup");
	start_splash_remove();
	if (!has_internet){
		$("body").html("This app requires internet to function.");
		return;
	}

	if (thePlatform == "non-gap"){
		player = new Audio_player();
	} else {
		player = new Audio_player2();
	}

	var height_mod = (thePlatform == "ios"?40:(thePlatform == "android"?20:0));
	$("head").append('<style type="text/css" id="dynamic_style_sheet"></style>');
	var hl_width = (($(window).height() - 322 - height_mod) / 2);
	$("#dynamic_style_sheet").html("#profile_your_music .half_list_song{width:"+hl_width+"px !important}.song_info{height:"+($(window).height() - $(window).width() - 80 - height_mod)+"px !important}#genre_list{height:"+($(window).height() - 291 - height_mod)+"px !important}#create_playlist_button{width: "+(hl_width - 10)+"px; height: "+(hl_width - 5)+"px}");
	
	click_event(".fb_login", function (){
		facebookConnectPlugin.login(["public_profile","email"], function (obj){
			console.log("fb login", obj);
			$.getJSON(base_url+"/ajax/login.php?callback=?", {uuid: settings.get("uuid"), fb_info: obj.authResponse}, function(data){
				if (data.mess.Error){
					var mess = "";
					for (var i=0;i<data.mess.Error.length;i++)
						mess += "<div>"+data.mess.Error[i].message+"</div>";

					open_modal({title: "Error"+(data.mess.Error.length > 1?"s":""), content:mess});
				}
				if (data.user_id){
					settings.set("user_id", data.user_id);
					if (data.is_admin){
						settings.set("is_admin", data.is_admin);
						$(".is_admin").show();
					}
					$(".logged_in").show();
					$(".logged_out").hide();
					back_log("load_playlist");
				}
				//login_responce(data);
				console.log("fb Result: ", data);
			});
		}, function (e){
			open_modal({title: "Login Error", content:e});
		});
	});
	click_event("#login_button", function (){
		var obj = {uuid: settings.get("uuid"), 'email': $("#login_email").val(), 'password': $("#login_password").val()};
		console.log("login", obj);
		$.getJSON(base_url+"/ajax/login.php?callback=?", obj, function(data){
			console.log("Result: ", data);
			if (data.mess.Error){
				var mess = "";
				for (var i=0;i<data.mess.Error.length;i++)
					mess += "<div>"+data.mess.Error[i].message+"</div>";
				
				open_modal({title: "Error"+(data.mess.Error.length > 1?"s":""), content:mess});
			}
			if (data.user_id){
				settings.set("user_id", data.user_id);
				if (data.is_admin){
					settings.set("is_admin", data.is_admin);
					$(".is_admin").show();
				}
				back_log("load_playlist");
			}
		});
	});
	click_event("#reset_button", function (){
		$.getJSON(base_url+"/ajax/login.php?callback=?", {action: "reset", email: $("#reset_email").val()}, function(data){
			console.log("Result: ", data);
			back_log("sreset");
		});
	});
	click_event("#signup_button", function (){
		var obj = {uuid: settings.get("uuid"), 'name': $("#signup_name").val(), 'email': $("#signup_email").val(), 'password': $("#signup_password").val(), 'cpassword': $("#signup_cpassword").val()};
		console.log("signup", obj);
		$.getJSON(base_url+"/ajax/signup.php?callback=?", obj, function(data){
			console.log("Result: ", data);
			if (data.mess.Error){
				var mess = "";
				for (var i=0;i<data.mess.Error.length;i++)
					mess += "<div>"+data.mess.Error[i].message+"</div>";

				open_modal({title: "Error"+(data.mess.Error.length > 1?"s":""), content:mess});
			}
			if (data.user_id){
				settings.set("user_id", data.user_id);
				back_log("load_playlist");
			}
		});
	});
	click_event(".logout", function (){
		player.stop();
		settings.set("user_id", 0);
		$(".is_admin").hide();
		$(".logged_in").hide();
		$(".logged_out").show();
		show_page("login");
	});

	$("#playlist_songs").on("touchstart", function(e){
		console.log("start");
		playlist_touch = e.originalEvent.touches[0];
		playlist_swipe_start_x = playlist_touch.clientX;
		playlist_swipe_delta_x = 0;
		playlist_swipe_start_y = playlist_touch.clientY;
		playlist_swipe_delta_y = 0;
	});
	$("#featured_featured").on("touchstart", function(e){
		feature_feature_start_x = e.originalEvent.touches[0].clientX;
	});
	$(document).on("touchstart", "#playlist_songs .song_name", function (){
		console.log("heights", $("#playlist .song_name span").height(), $("#playlist .song_name").height());
		if ($("#playlist .song_name span").height() > $("#playlist .song_name").height()){
			name_long_press = setTimeout(function (){
				$("#playlist .song_name").addClass("show_full");
			}, 500);
		}
	});

	$(document).on("touchstart", "#your_profile .play_playlist", function (e){
		profile_playlist_edit = false;
		if ($(e.currentTarget).data("playlist_id")){
			profile_playlist_loc = $("#profile_your_playlists").offset();
			profile_playlist_long_press = setTimeout(function (){
				if (Math.abs(profile_playlist_loc.left - $("#profile_your_playlists").offset().left) < 20){
					profile_playlist_edit = true;
					back_log("view_playlist", [$(e.currentTarget).data("playlist_id")]);
				}
			}, 500);
		}
	});
	$(document).on("touchstart", "#your_profile .play_song", function (e){
		var e = e;
		var profile_song_touch = e.originalEvent.touches[0];
		last_touch = profile_song_touch;
		profile_song_start_x = profile_song_touch.clientX;
		profile_song_start_y = profile_song_touch.clientY;
		profile_song_press = false;
		profile_song_long_press = setTimeout(function (){
			console.log(Math.abs(last_touch.clientX - profile_song_start_x));
			if (Math.abs(last_touch.clientX - profile_song_start_x) < 30){
				$("#profile_your_music").addClass("song_selected");
				profile_song_press = $(e.currentTarget);
				profile_song_press.addClass("selected_song");
			}
		}, 500);
	});
	$(document).on("touchstart", ".song_play_info", function (e){
		var e = e;
		profile_song_long_press = setTimeout(function (){
			playlist_position = true;
			$(".current_song .song_play_info").addClass("position_control");
		}, 500);
	});
	$(window).on("touchmove", function(e){
		e = e.originalEvent.touches[0];
		last_touch = e;
		var x_over = false;
		if (questionnaire){
			return;
		}
		if (playlist_position){
			var per = (e.clientX - $(window).width() * .15) / ($(window).width() * 0.7);
			if (per > 1)
				per = 1;
			if (per < 0)
				per = 0;
			player.set_pos(per);
			return;
		}
		if (feature_feature_start_x !== false){
			feature_feature_delta_x = feature_feature_start_x - e.clientX;
			if (feature_feature_delta_x > 50){
				if (feature_feature_delta_x < 0)
					feature_feature_delta_x = 0;
				$(".feature.next_feature").css({left: "calc(100% - "+feature_feature_delta_x+"px)"});
			}
			if (feature_feature_delta_x < -50){
				if (feature_feature_delta_x < -$(document).width())
					feature_feature_delta_x = -$(document).width();
				$(".feature.prev_feature").css({left: "calc(-100% + "+(-feature_feature_delta_x)+"px)"});
			}
		}
		if (playlist_swipe_start_x !== false){
			playlist_swipe_delta_x = playlist_swipe_start_x - e.clientX;
			if (playlist_swipe_delta_x > 50){
				x_over = true;
				if (playlist_swipe_delta_x < 0)
					playlist_swipe_delta_x = 0;
				$(".song.next_song").css({left: "calc(100% - "+playlist_swipe_delta_x+"px)"});
			}
			if (playlist_swipe_delta_x < -50){
				x_over = true;
				if (playlist_swipe_delta_x < -$(document).width())
					playlist_swipe_delta_x = -$(document).width();
				$(".song.prev_song").css({left: "calc(-100% + "+(-playlist_swipe_delta_x)+"px)"});
			}
		}
		if (!x_over && playlist_swipe_start_y !== false){
			playlist_swipe_delta_y = playlist_swipe_start_y - e.clientY;
			if (playlist_swipe_delta_y > 50){
				if (playlist_swipe_delta_y < 0)
					playlist_swipe_delta_y = 0;
				$(".song .band_info").css({top: "calc(100% - "+playlist_swipe_delta_y+"px)"});
			}
		}
		if (false && profile_song_press){//bad drag code
			var offsets = profile_song_press.offset();
			console.log(offsets);
			profile_song_press.find("img").css({left: playlist_swipe_start_x + e.clientX - offsets.left, top: playlist_swipe_start_y + e.clientY - offsets.top});
		}
	});
	$(document).on("touchend", function(e){
		if (profile_playlist_long_press){
			clearTimeout(profile_playlist_long_press);
			profile_playlist_long_press = false;
		}
		if (feature_feature_start_x !== false){
			feature_feature_start_x = false;
			if (feature_feature_delta_x > 50){
				if ($(".feature.next_feature").length){
					$(".feature.next_feature").animate({left: 0}, 200, function (){
						$(".feature.prev_feature").removeClass("prev_feature");
						$(".feature.current_feature").removeClass("current_feature").addClass("prev_feature").css({left: '-100%'});
						$(".feature.next_feature").removeClass("next_feature").addClass("current_feature").next().addClass("next_feature");
					});
				}
				$(".feature.prev_feature").animate({left: "-100%"}, 100);
			} else if (feature_feature_delta_x < -50){
				if ($(".feature.prev_feature").length){
					$(".feature.prev_feature").animate({left: 0}, 200, function (){
						$(".feature.next_feature").removeClass("next_feature");
						$(".feature.current_feature").removeClass("current_feature").addClass("next_feature").css({left: '100%'});
						$(".feature.prev_feature").removeClass("prev_feature").addClass("current_feature").prev().addClass("prev_feature");
					});
				}
				$(".feature.next_feature").animate({left: "100%"}, 100);
			}
		}
		if (profile_song_long_press){
			clearTimeout(profile_song_long_press);
			profile_song_long_press = false;
			if (profile_song_press){
				var offsets = profile_song_press.offset();
				$(".moving_song").removeClass("moving_song").find("img").css({top:0, left:0});
				profile_song_press = false;
			}
		}
		if (playlist_position){
			playlist_position = false;
			$(".song_play_info").removeClass("position_control");
		}
	});
	click_event(".selected_overlay .fa-close", function (e){
		$(e.currentTarget).parents(".half_list_song").removeClass("selected_song");
		if ($(".selected_song").length <= 0){
			$("#profile_your_music").removeClass("song_selected");
		}
	}, true, true);
	$("#playlist_songs").on("touchend", function(e){
		console.log(playlist_swipe_delta_x);
		if (name_long_press){
			$("#playlist .song_name").removeClass("show_full");
			clearTimeout(name_long_press);
			name_long_press = false;
		}
		if (playlist_swipe_delta_x > 50){
			if (next_questionnaire <= 0){
				next_questionnaire = next_questionnaire_count;
				questionnaire = true;
				var genres = JSON.parse($(".current_song .genre_data").html());
				var htmls = [];
				for (var i=0;i<genres.length;i++){
					htmls.push(template("free_question", genres[i]));
				}
				open_modal({title: "Free User Questionnaire", content: htmls.join(""), button1: "Cancel", add_class: "questionnaire", callback: function (button){
					questionnaire = false;
					next_playlist();
				}});
				$(".genre_selector .slider").on("input", function (){
					$("#genre_value_"+$(this).data("genre_id")).html($(this).val());
				}).on("change", function (){
					var genres = [];
					$(".genre_selector .slider").each(function (){
						if ($(this).val() > 0){
							genres.push([$(this).data("genre_id"), $(this).val()]);
						}
					});
					if (genres.length >= 3){
						$.getJSON(base_url+"/ajax/song.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), action: "genre_input", song_id: $(".current_song").data("song_id"), genres: genres}, function(data){
						});
						questionnaire = false;
						close_modal();
						next_playlist();
					}
				});
			}
			$(".song.prev_song").animate({left: "-100%"}, 100);
		} else if (playlist_swipe_delta_x < -50){
			prev_playlist();
			$(".song.next_song").animate({left: "100%"}, 100);
		} else if (playlist_swipe_delta_y > 150){
			open_band($(".song .band_info").data("band_id"));
			$(".song.next_song").animate({left: "100%"}, 100);
			$(".song.prev_song").animate({left: "-100%"}, 100);
		} else {
			$(".song.next_song").animate({left: "100%"}, 100);
			$(".song.prev_song").animate({left: "-100%"}, 100);
		}
		$(".song .band_info").css({top: "100%"}, 100);
		playlist_touch = false;
		playlist_swipe_delta_x = false;
		playlist_swipe_start_y = false;
	});

	click_event(".report_audio", function (e){
		open_modal({title:"Flag Song", content: '<a id="stolen" class="button">Stolen/infringement</a><a id="inapp" class="button">inappropriate</a><a id="neve" class="button">Never Play</a>', button1:"Cancel", add_class:"report", callback: function (action){
			if (action != "Cancel"){//TODO: make function
				/*$.getJSON(base_url+"/ajax/song.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), action: "pass", song_id: $(e.currentTarget).parents(".song").data("song_id")}, function(data){
					next_playlist();
				});*/
			}
		}});
	}, true);

	click_event(".repeat_audio", function (e){
		var t = $(e.currentTarget);
		var repeating = t.hasClass("repeating");
		if (repeating){
			t.removeClass("repeating");
			player.replaying = false;
		} else {
			t.addClass("repeating");
			player.replaying = true;
		}
	}, true);

	click_event(".song_pass", function (e){
		$.getJSON(base_url+"/ajax/song.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), action: "pass", song_id: $(e.currentTarget).parents(".song").data("song_id")}, function(data){
			next_playlist();
		});
	}, true);

	click_event(".song_like", function (e){
		$.getJSON(base_url+"/ajax/song.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), action: "like", song_id: $(e.currentTarget).parents(".song").data("song_id")}, function(data){
			next_playlist();
		});
	}, true);

	click_event(".stop_audio", function (e){
		$(e.currentTarget).siblings(".song_pause_menu").show();
		$("#playlist").addClass("paused");
		player.pause();
	}, true);

	click_event(".start_audio", function (e){
		$(e.currentTarget).parents(".song_pause_menu").hide();
		$("#playlist").removeClass("paused");
		player.resume();
	}, true);
	
	click_event(".open_profile_yours", function (e){
		back_log("open_profile_yours");
	}, true);

	click_event(".add_to_playlist", function (e){
		var song_ids = [];
		$(".selected_song").each(function (){
			song_ids.push($(this).data("song_id"));
		});
		$.getJSON(base_url+"/ajax/settings.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), action: "add_to_playlist", playlist_id: $(e.currentTarget).data("playlist_id"), song_ids: song_ids}, function(data){
			if (data.good){
				open_modal({title: "Plalist", content: "Songs added"});
			} else {
				open_modal({title: "Error", content: "error adding to playlist"});
			}
		});
	}, true, true);
	
	click_event(".play_playlist", function (e){
		if (!profile_playlist_edit)
			back_log("load_playlist", ["playlist", $(e.currentTarget).data("playlist_id")]);
	}, true);

	click_event(".create_playlist", function (){
		open_modal({title:"Create Playlist", content: 'Create playlist with the name <input id="playlist_name" type="text" placeholder="Name">', button1:"Create", button2: true, callback: function (action){
			if (action == "Create"){
				open_modala("Creating");
				$("#playlist_name").val();
				$.getJSON(base_url+"/ajax/settings.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), action: "create_playlist", name:$("#playlist_name").val()}, function (data){
					close_modala();
					if (data.playlist){
						$("#profile_your_playlists").append(template("playlist_list", data.playlist));
					}
				});
			}
		}});
	});

	click_event(".open_music", function (e){
		$("#profile_your_music").show();
		$("#profile_notifications").hide();
		$(".nav_item.active").removeClass("active");
		$(e.currentTarget).addClass("active");
	}, true);
	
	click_event(".open_notifications", function (e){
		$("#profile_notifications").show();
		$("#profile_your_music").hide();
		$(".nav_item.active").removeClass("active");
		$(e.currentTarget).addClass("active");
	}, true);
	
	click_event(".open_profile", function (e){
		back_log("open_profile", [$(e.currentTarget).data("user_id")]);
	}, true);

	click_event(".change_photo", function (e){
		open_modala("Selecting");
		var obj = $(e.currentTarget);
		navigator.camera.getPicture(function (imageURI){
			open_modala("Uploading");
			console.log(imageURI);
			var options = new FileUploadOptions();
			options.fileKey = "file";
			options.fileName = imageURI.substr(imageURI.lastIndexOf('/') + 1);
			options.params = {user_id: settings.get("user_id"), uuid: settings.get("uuid"), action: obj.data("action"), id: obj.data("id")};
			options.chunkedMode = false;
			console.log(options);

			var ft = new FileTransfer();
			ft.upload(imageURI, base_url+"/ajax/settings.php", function(result){
				close_modala();
				console.log(JSON.stringify(result));
				reload_page();
			}, function(error){
				close_modala();
				console.log(JSON.stringify(error));
			}, options);
		}, function(message) {
			close_modala();
			console.log(message);
			open_modal({title: "Error", content: "get picture failed"});
		}, {
			quality: 100,
			destinationType: navigator.camera.DestinationType.FILE_URI,
			sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY
		});
	}, true);

	function upload_song(data){
		console.log("song data", data);
		open_modala("Uploading");

		var genres = [];
		$(".song_genres_selector").each(function (){
			genres.push({id: $(this).find(".song_genres").val(), val: $(this).find("select").val()});
		});

		var options = new FileUploadOptions();
		options.fileKey = "file";
		options.fileName = data.exportedurl.substr(data.exportedurl.lastIndexOf('/') + 1);
		options.params = {user_id: settings.get("user_id"), uuid: settings.get("uuid"), action: "new_song", name: $("#song_name").val(), band_id: $("#band_dashboard").data("band_id"), genres: genres};
		options.chunkedMode = false;
		console.log(options);

		var ft = new FileTransfer();
		ft.upload(data.exportedurl, base_url+"/ajax/settings.php", function(result){
			var resp = JSON.parse(result.response);
			close_modala();
			if (resp.song_id){
				saved_song_data = false;
				$("#song_name").val("");
				$(".song_genres_selector").remove();
			} else {
				if (resp.mess.Error){
					var mess = "";
					for (var i=0;i<data.mess.Error.length;i++)
						mess += "<div>"+data.mess.Error[i].message+"</div>";
					open_modal({title: "Error"+(data.mess.Error.length > 1?"s":""), content:mess});
				} else {
					open_modal({title: "Error", content: "Unknown upload fail"});
				}
			}
			console.log(result);
		}, function(error){
			close_modala();
			console.log(error);
		}, options);
	}

	click_event("#song_button", function (e){
		window.plugins.mediapicker.getAudio(function (data){
			saved_song_data = data;
			setTimeout(function (){
				if ($("#song_name").val() == ""){
					$("#song_name").val(saved_song_data.title);
				}
			}, 10);
		},function (error){
			console.log("error", error);
		}, false, true, "song to upload");
	});

	$("#song_genre").on("change", function (){
		if ($(this).val() != 0){
			$("#song_genre").before(template("genre_adder", {id: $(this).val(), name: $(this).find("option:selected").html()}));
			$("#song_genre").val(0);
			if ($(".song_genres_selector").length >= 3){
				$("#song_genre").hide();
			}
		}
	});

	$(document).on("change", ".song_genres_selector select", function (){
		if ($(this).val() == 0){
			$(this).parents(".song_genres_selector").remove();
			if ($(".song_genres_selector").length < 3){
				$("#song_genre").show();
			}
		}
	});

	click_event("#song_submit", function (e){
		var mess = [];
		if ($("#song_name").val() == ""){
			mess.push("You need to enter a song name");
		}
		if (!saved_song_data){
			mess.push("You need to select a song");
		}
		if ($(".song_genres").length < 1){
			mess.push("You need to add a song genre");
		}
		if (mess.length == 0){
			setTimeout(function (){
				upload_song(saved_song_data);
			}, 10);
		} else {
			open_modal({title: "Error"+(mess.length > 1?"s":""), content:"<div>"+mess.join("</div><div>")+"</div>"});
		}
	});
	
	click_event("#band_create", function (e){
		$.getJSON(base_url+"/ajax/settings.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), action: "create_band", name: $("#create_band_name").val()}, function (data){
			console.log("Result: ", data);
			if (data.mess.Error){
				var mess = "";
				for (var i=0;i<data.mess.Error.length;i++)
					mess += "<div>"+data.mess.Error[i].message+"</div>";
				
				open_modal({title: "Error"+(data.mess.Error.length > 1?"s":""), content:mess});
			}
			if (data.band_id){
				back_log("open_band_dashboard", data.band_id);
			}
		});
	});

	click_event(".open_band", function (e){
		back_log("open_band", $(e.currentTarget).data("band_id"));
	}, true);

	click_event(".open_band_dashboard", function (e){
		back_log("open_band_dashboard", $(e.currentTarget).data("band_id"));
	}, true);

	click_event(".band_stats", function (e){
		$(".band_dashboard_pages").hide();
		$("#dash_stats").show();
		$(".nav_item.active").removeClass("active");
		$(e.currentTarget).addClass("active");
	}, true);

	click_event(".band_songs", function (e){
		$(".band_dashboard_pages").hide();
		$("#dash_songs").show();
		$(".nav_item.active").removeClass("active");
		$(e.currentTarget).addClass("active");
	}, true);

	click_event(".band_social", function (e){
		$(".band_dashboard_pages").hide();
		$("#dash_social").show();
		$(".nav_item.active").removeClass("active");
		$(e.currentTarget).addClass("active");
	}, true);

	click_event(".band_settings", function (e){
		$(".band_dashboard_pages").hide();
		$("#dash_settings").show();
		$(".nav_item.active").removeClass("active");
		$(e.currentTarget).addClass("active");
	}, true);

	$("#save_band").on("click", function (){
		$.getJSON(base_url+"/ajax/settings.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), action:"save_band", band_id: $("#band_dashboard").data("band_id"), name: $("#band_name").val()}, function (data){
			if (data.mess.Error){
				var mess = "";
				for (var i=0;i<data.mess.Error.length;i++)
					mess += "<div>"+data.mess.Error[i].message+"</div>";
				
				open_modal({title: "Error"+(data.mess.Error.length > 1?"s":""), content:mess});
			} else if (data.success){
				open_modal({title: "Changes Saved", content:""});
			}
		});
	});
	$(".admin_band_update").on("change", function (){
		$.getJSON(base_url+"/ajax/admin.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), action:"band_update", band_id: $("#band_dashboard").data("band_id"), status: $("#band_status").val()}, function (data){
		});
	});

	click_event(".play_now", function (e){
		player.play_url(base_url+"/data/band_songs/"+$(e.currentTarget).data("song_key")+".mp3");
	}, true);
	
	click_event(".open_full_list_100", function (e){
		back_log("open_full_list", ["100", "Top 100"]);
	}, true);
	
	click_event(".open_full_list_rise", function (e){
		back_log("open_full_list", ["rise", "Rise"]);
	}, true);
	
	click_event(".open_full_list_local", function (e){
		back_log("open_full_list", ["local", "Local"]);
	}, true);
	
	click_event(".open_full_list_curated", function (e){
		back_log("open_full_list", ["curated", "Curated"]);
	}, true);

	click_event(".play_song", function (e){
		if (!profile_song_press)
			play_song($(e.currentTarget).data("song_id"));
	}, true);
	
	$("#search_field").on("keyup", function (e){
		if (search_query_handle){
			clearTimeout(search_query_handle);
		}
		if (e.keyCode == 13 || e.keyCode == 9){
			console.log("enter key search");
		} else {
		}
		search_query_handle = setTimeout(function (){
			run_search($("#search_field").val());
		}, 100);
	});

	click_event(".open_genre", function (e){
		back_log("load_playlist", ["genre", $(e.currentTarget).data("genre_id")]);
	}, true);

	document.addEventListener("backbutton", function (){
		back_recent();
		return;
		/*var backs = $(".back:visible");
		if (backs.length > 0){
			backs.first().trigger("click_event");
		} else if ($(".settings_toggle").hasClass("close_main_info")){
			$(".settings_toggle").trigger("click_event");
		} else if ($(".settings_toggle").hasClass("open")){
			$(".settings_toggle").trigger("click_event");
		} else if ($("#menu-overlay:visible")){
			$("#menu-overlay").trigger("click_event");
		}*/
	}, false);
	
	click_event("#head_back", function (e){
		back_recent();
		return;
		/*if ($(".page:visible").data("back")){
			open_page($(".page:visible").data("back"));
		} else if (pages.length > 0){
			open_page(pages.pop());
		}*/
	});

	click_event(".open_page", function (e){
		$("#menu-overlay").trigger("click_event");
		open_page($(e.currentTarget).data("page"));
	}, true, true);
	
	
	if (settings.get("user_id") > 0){
		if (settings.get("is_admin") > 0){
			$(".is_admin").show();
		}
		//open_page("playlist");
		back_log("load_playlist");
		$(".logged_in").show();
		$(".logged_out").hide();
	} else {
		$(".logged_in").hide();
		$(".logged_out").show();
	}

}