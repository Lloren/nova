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
			var per = scope.playing.currentTime / scope.playing.duration;
			$(".current_song .current_time").html(scope.time_out(scope.playing.currentTime));
			$(".current_song .song_played").css("width", (per * 100) + "%");
			if (per >= 1){
				if (scope.replaying){
					scope.set_pos(0);
				} else {
					next_playlist();
				}
			}
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
		return new Media(url, function (dat){console.log("media_success", dat)}, function (dat){console.log("media_error", dat)}, player.media_status);
	};

	this.add = function (audio){

	};

	this.media_status = function (dat){
		console.log("media_status", dat, player.replaying);
		if (dat == 4){
			if (player.replaying){
				player.set_pos(0);
				setTimeout(function (){
					player.resume();
				}, 100);
			} else {
				next_playlist();
			}
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
		//console.log(this.playing);
		var scope = this;
		this.output_handle = setInterval(function (){
			scope.playing.getCurrentPosition(function (pos){
				if (scope.length <= 0 && scope.playing.getDuration()){
					scope.length = scope.playing.getDuration();
					$(".current_song .total_time").html(scope.time_out(scope.length));
				}
				scope.set_bar(pos);
			}, function (err){

			});
		}, 250);
	};

	this.set_bar = function (pos){
		var per = pos / this.length;
		$(".current_song .current_time").html(this.time_out(pos));
		$(".current_song .song_played").css("width", (per * 100) + "%");
	};

	this.play_url = function(url, force){
		force = force || false;
		if (!this.playing || this.playing.src != url || force){
			this.play(this.new(url));
		}
	};

	this.stop = function (){
		//console.log("stop", this.playing, this.is_playing);
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
		var pos = val * this.length;
		this.playing.seekTo(pos * 1000);
		this.set_bar(pos);
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
		$("#band_dashboard .band_image").data("band_id", data.id).attr("src", data.image_small_url);
		var song_html = "";
		var i=0;
		var locked_message = false;
		for (;i<data.songs.length;i++){
			if (i >= +data.unlocked && !locked_message){
				locked_message = true;
				if (i == 1)
					song_html += template("extra_song_list", {image: "locked_song", message: "Achieve 1k followers to unlock second public song"});
				if (i == 1 || i == 2)
					song_html += template("extra_song_list", {image: "locked_song", message: "Improve traction to unlock 3rd song"});
			}
			data.songs[i].play_now = true;
			if (i < data.unlocked){
				data.songs[i].classes = "main_item";
			} else {
				data.songs[i].classes = "";
			}
			song_html += template("song_list", data.songs[i]);
		}
		console.log(i, +data.unlocked);
		if (i < +data.unlocked){
			if (i == 1){
				song_html += template("extra_song_list", {image: "unlocked_song", message: "Upload a second song"});
			}
			if (data.unlocked == 2){
				song_html += template("extra_song_list", {image: "locked_song", message: "Improve traction to unlock 3rd song"});
			} else {
				song_html += template("extra_song_list", {image: "unlocked_song", message: "Upload a third song"});
			}
		}
		$("#band_dashboard .song_genres_selector").remove();
		$("#band_dashboard #dash_song_list").html(song_html);
		$("#band_name").val(data.name);
		$("#band_bio").val(data.bio);
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
		$("#band .donate").data("band_id", data.id).data("band_name", data.name);
		$("#band .band_bio").html(data.bio);
		$("#band .band_fav").data("band_id", data.id);
		$("#band_social_action").data("band_id", data.id);
		if (data.faved_band){
			$("#band .band_fav").addClass("faved");
		} else {
			$("#band .band_fav").removeClass("faved");
		}
		if (data.show_dash_button){
			$("#band .open_band_dashboard").show().data("band_id", data.id);
			$("#band_post_form").show();
		} else {
			$("#band .open_band_dashboard").hide();
			$("#band_post_form").hide();
		}
		
		if (data.top_supported){
			$("#band_top_supported").show();
			var top_fans = [];
			for (var i=0;i<data.top_supported.length;i++){
				var t = data.top_supported[i];
				if (t.rank == 1){
					t.rank = "Top Fan";
				} else {
					t.rank = "#"+t.rank;
				}
				t.add_class = " open_profile";
				top_fans.push(template("half_list_top", t));
			}
			$("#band_top_fans").html(top_fans.join(""));
		} else {
			$("#band_top_supported").hide();
		}

		var songs = [];
		for (var i=0;i<data.songs.length;i++){
			var s = data.songs[i];
			s.band_name = data.name;
			s.num = i+1;
			songs.push(template("full_list", s));
		}
		$("#band_song_list").html(songs.join(""));
		$("#band_songs").attr("class", "");


		data.socials.sort(function(a, b) {
			return b.time - a.time;
		});

		var socials = [];
		for (var i=0;i<data.socials.length;i++){
			if (data.socials[i].img_orig_type){
				data.socials[i].type = "image";
			} else if (data.socials[i].vid){
				data.socials[i].type = "vid";
			} else {
				data.socials[i].type = "text";
			}
			data.socials[i].poster_type = "open_"+data.socials[i].poster_type;
			socials.push(template("social", data.socials[i]));
		}
		$("#band_social").html(socials.join(""));
		show_page("band");
		$(".song .band_info").css({top: "0px"});
	});
}

var playlist_state = false;
var playlist_touch = false;
var playlist_swipe_start_x = false;
var playlist_swipe_delta_x = false;
var playlist_swipe_start_y = false;
var playlist_swipe_delta_y = false;
var x_over = false;
var y_over = false;
var empty_playlist = {type: "", key: "", empty: "Playlist Empty", data: []};
var playlist = Object.assign({}, empty_playlist);
function load_playlist(type, key, empty){
	$("#head_bar").hide();
	var force = false;
	var sec = false;
	type = type || "discover";
	key = key || 0;
	if ((key+"").indexOf(",") > 0){
		var t = key.split(",");
		key = t[0];
		sec = t[1];
	}
	empty = empty || false;
	if (type == "discover")
		empty = "No new Discover songs, try Genre or top lists.";
	console.log(playlist, type, key, empty);
	if (type !== playlist.type || key !== playlist.key){
		force = true;
		playlist_state = false;
	}
	playlist.empty = empty;
	playlist.type = type;
	playlist.key = key;
	playlist.sec = sec;
	playlist.data = [];
	console.log("playlist", playlist);
	show_page("playlist");
	setTimeout(function (){
		$("#head_bar").hide();
	}, 10);
	if (playlist_state){
		$("#playlist_songs").html(playlist_state);
		return;
	}
	$("#playlist_songs").html("Loading...");
	$.getJSON(base_url+"/ajax/get_list.php?callback=?", {type:playlist.type, key: playlist.key, user_id: settings.get("user_id"), uuid: settings.get("uuid")}, function (data){
		if (!data.songs || data.songs.length == 0){
			playlist_state = playlist.empty;
		} else {
			var htmls = [];
			var list_name = data.list_name || "";
			var ci = 0;
			var ni = 1;
			var pi = data.songs.length-1;

			console.log(data.songs);

			data.songs.sort(function(a, b) {
				return a.ord - b.ord;
			});

			console.log(data.songs);

			if (playlist.sec){
				console.log("sec", playlist.sec);
				for (var i=0;i<data.songs.length;i++){
					console.log("i", data.songs[i].id);
					if (data.songs[i].id == playlist.sec){
						ci = i;
						ni = i+1;
						pi = i-1;
						if (pi < 0){
							pi += data.songs.length;
						}
						if (ni >= data.songs.length){
							ni -= data.songs.length;
						}
						break;
					}
				}
			}

			for (var i=0;i<data.songs.length;i++){
				var song = data.songs[i];
				song.list_name = list_name;
				song.add_class = "";
				if (i == pi)
					song.add_class = "prev_song";
				if (i == ci)
					song.add_class = "current_song";
				if (i == ni)
					song.add_class = "next_song";
				if (song.show_edit){
					song.add_class += " editable";
				}
				song.genre_data = JSON.stringify(song.genres);
				htmls.push(template("song_disp", song));
			}
			player.play_url(base_url+"/data/band_songs/"+data.songs[ci].key+".mp3", force);
			player.length = 0;
			playlist_state = htmls.join("");
		}
		$("#playlist_songs").html(playlist_state);
		$("#head_bar").hide();
	});
}

function next_playlist(check){
	check = check || false;
	if ($(".song").length > 1){
		if (check)
			return true;
		$("#playlist").removeClass("paused");
		$(".song.next_song").animate({left: 0}, 200, function (){
			$(".song.prev_song").removeClass("prev_song");
			$(".song.current_song").removeClass("current_song").addClass("prev_song").css({left: '-100%'});
			var next = $(".song.next_song").removeClass("next_song").addClass("current_song").next();
			if (next.length || $(".song").length < 3){
				next.addClass("next_song");
			} else {
				$(".song").first().addClass("next_song");
			}
			setTimeout(function (){
				playlist_state = $("#playlist_songs").html();
				player.length = 0;
			}, 1);
		});
		player.play_url(base_url+"/data/band_songs/"+$(".song.next_song").data("key")+".mp3");
	} else if (playlist.empty !== false){
		$("#playlist_songs").html("<br /><br /><br /><br />"+playlist.empty);
	}
	return false;
	setTimeout(function (){
		playlist_state = $("#playlist_songs").html();
	}, 1);
}

function prev_playlist(){
	if ($(".song").length > 1){
		$("#playlist").removeClass("paused");
		$(".song.prev_song").animate({left: 0}, 200, function (){
			$(".song.next_song").removeClass("next_song");
			$(".song.current_song").removeClass("current_song").addClass("next_song").css({left: '100%'});
			var prev = $(".song.prev_song").removeClass("prev_song").addClass("current_song").prev();
			if (prev.length || $(".song").length < 3){
				prev.addClass("prev_song");
			} else {
				$(".song").last().addClass("prev_song");
			}
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

function play_song(song_id, playlist_id){
	if (typeof playlist_id != "undefined"){
		back_log("load_playlist", ["playlist", playlist_id+","+song_id]);
	} else{
		back_log("load_playlist", ["song", song_id]);
	}
}

function reset_playlist_scrolls(){
	$(".song.next_song").css({left: "100%"});
	$(".song.prev_song").css({left: "-100%"});
	$(".song .band_info").css({top: "100%"});
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
		var featured_html = [];
		for (var i=0;i<data.featured.length;i++){
			var f = data.featured[i];
			featured_html.push('<img class="open_band feature'+(i==0?" current_feature":(i==1?" next_feature":""))+'" src="'+f.image_url+'" data-band_id="'+f.band_id+'" />');
		}
		$("#featured_featured").html(featured_html.join(""));
	});
}

function load_genres(){
	$.getJSON(base_url+"/ajax/genre.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid")}, function (data){
		$("#genre_featured .feature").attr("src", data.image_url).data("band_id", data.band_id);//TODO: dynamicafy

		var moods_html = [];
		for (var i=0;i<data.moods.length;i++){
			var f = data.moods[i];
			moods_html.push('<img class="play_playlist feature'+(i==0?" current_feature":(i==1?" next_feature":""))+'" src="'+f.image_url+'" data-playlist_id="'+f.id+'" />');
		}
		$("#genre_featured").html(moods_html.join(""));



		var genre_html = [];
		for (var i=0;i<data.genres.length;i++){
			genre_html.push(template("text_list_item", data.genres[i]));
		}
		$("#genre_list").html(genre_html.join(""));
	});
}

function load_social(){
	$.getJSON(base_url+"/ajax/settings.php?callback=?", {action: "social", user_id: settings.get("user_id"), uuid: settings.get("uuid")}, function (data){
		if (data.social){
			preview_format(data.social);
			$("#social_last").show();

			$("#social_last_preview").css("background-image", "url('"+data.social.preview.img_url+"')");
			$("#social_last_preview img").attr("src", data.social.preview.img_url);
			$("#social_last_time").html(data.social.posted_time_out);
			$("#social_last_name").html(data.social.thing_name);
			$("#social_last_sec").html(data.social.owner);
			$("#social_last_details").removeClass("active");
		} else {
			$("#social_last").hide();
		}

		data.socials.sort(function(a, b) {
			return b.posted_time - a.posted_time;
		});

		var socials = [];
		for (var i=0;i<data.socials.length;i++){
			preview_format(data.socials[i]);

			socials.push(template("social", data.socials[i]));
		}
		$("#social_cont").html(socials.join(""));
	});
}

function open_social_interaction(post_id){
	console.log("social_interaction", post_id);
	$("#social_input").data("post_id", post_id);

	$.getJSON(base_url+"/ajax/social.php?callback=?", {post_id: post_id, user_id: settings.get("user_id"), uuid: settings.get("uuid")}, function (data){
		$(".open_interact").removeClass("active");
		$("#social_activity").removeClass("interacting");

		$("#social_input").css("height", 50).val("");
		$("#social_interact").css("top", 0);

		$("#social_band_image").attr("src", data.band_image_small_url).data("band_id", data.band_id);


		$("#social_preview").attr("class", "").addClass("social_preview_"+data.preview.type);
		if (!data.preview.img_url)
			data.preview.img_url = "";
		$("#social_preview_image").attr("src", data.preview.img_url);
		if (!data.preview.title)
			data.preview.title = "";
		$("#social_title").html(data.preview.title);
		if (!data.preview.text)
			data.preview.text = "";
		$("#social_text").html(data.preview.text);

		var item_name = "";
		if (data.preview.type == "song"){
			item_name = data.preview.title;
			$("#social_interaction .collect").show().data("song_id", data.song_id);
		}
		$("#social_nav .donation").data("band_id", data.id).data("post_id", post_id).data("band_name", data.band_name).data("extra_name", item_name);
		
		var friends = [];
		for (var i=0;i<data.friends.length;i++){
			var f = data.friends[i];
			friends.push('<div class="social_target _social_target" data-user_id="'+f.id+'"><img src="'+f.image_url+'" /><div>'+f.name+'</div></div>');
		}
		$("#social_friends").html(friends.join(""));

		$("#comment_count").html(data.num_comments);
		
		var comments = [];
		for (var i=0;i<data.comments.length;i++){
			comments.push(template("comment", data.comments[i]));
		}
		$("#social_comments").html(comments.join(""));
	});
	show_page("social_interaction");
}

function preview_format(data){
	if (data.img_orig_type){
		data.type = "image";
	} else if (data.vid){
		data.type = "vid";
	} else if (data.preview.type == "song"){
		data.type = "song";
		data.image_url = data.preview.img_url;
		//data.text = "<span>"+data.preview.title+"</span> "+data.preview.text;
		data.owner = data.preview.text;
		data.owner_id = data.band_id;
		data.owner_type = "open_band";
		data.thing = "song";
		data.thing_name = data.preview.title;
	} else {
		data.type = "text";
	}
	data.time_out = data.posted_time_out;
	data.poster_type = "open_"+data.poster_type;
}

function social_submit_interaction(){
	$.getJSON(base_url+"/ajax/social.php?callback=?", {comment: $("#social_input").val(), post_id: $("#social_input").data("post_id"), social_target: $("._social_target.active").data("user_id"), user_id: settings.get("user_id"), uuid: settings.get("uuid")}, function (data){
		$("._social_target").removeClass("active");
		open_social_interaction($("#social_input").val("").data("post_id"));
	});
}

function save_add_playlist(song_id, next_song){
	var song_id = song_id;
	var next_song = next_song || false;

	$.getJSON(base_url+"/ajax/song.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), action: "like", song_id: song_id, return: "playlists"}, function(data){

		var playlists_htmls = [];
		for (var i=0;i<data.playlists.length;i++){
			var t = data.playlists[i];
			t.song_id = song_id;
			playlists_htmls.push(template("playlist_list_clean_add", t));
		}

		open_modal({title: "Add This Song", content: '<div><div style="text-align: left;">Current Playlists</div><div style="width: 100%; overflow: auto;"><div class="supper_wide">'+playlists_htmls.join("")+'</div></div><input type="button" id="collect_create_new" class="create_playlist" data-song_id="'+song_id+'" value="New Playlist" /></div>', button1: false, dismissible: true, add_class: "collect_add_modal"});

		if (next_song){
			next_playlist();
		}


	});
}

function open_full_list(type, name){
	$.getJSON(base_url+"/ajax/get_list.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), type: type}, function (data){
		var htmls = [];
		if (data.songs){
			for (var i=0;i<data.songs.length;i++){
				var item = data.songs[i];
				item.num = i+1;
				htmls.push(template("full_list", item));
			}
		} else if (data.lists){
			for (var i=0;i<data.lists.length;i++){
				var item = data.lists[i];
				htmls.push('<img class="play_playlist" src="'+item.image_url+'" data-playlist_id="'+item.id+'" />');
			}
		}
		$("#full_list_content").html(htmls.join(""));
	});
	$("#full_list_title").html(name);
	show_page("full_list");
}

function open_profile(user_id){
	$.getJSON(base_url+"/ajax/profile.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), users_id: user_id}, function (data){
		$("#profile .profile_background").css("background-image", "url("+data.image+")");
		$("#profile .profile_image_src").attr("src", data.image);
		$("#profile .profile_name").html(data.name);
		$("#profile").removeClass("scrolled");
		if (data.is_fallowing){
			$(".add_friend").hide();
		} else {
			$(".add_friend").show().data("user_id", data.id);
		}

		$(".shown").removeClass("active");
		$("#show_songs").addClass("active");

		var song_htmls = [];
		for (var i=0;i<data.songs.length;i++){
			data.songs[i].playlist_id = -data.id;
			song_htmls.push(template("full_list", data.songs[i]));
		}
		$("#profile_songs").html(song_htmls.join(""));

		var playlists_htmls = [];
		for (var i=0;i<data.playlists.length;i++){
			playlists_htmls.push(template("playlist_list", data.playlists[i]));
		}
		$("#profile_playlists").html(playlists_htmls.join(""));

		var artists_supported = [];
		if (data.recent_supported.length){
			$(".no_artists").hide();
			if (data.top_supported){
				for (var i=0;i<data.top_supported.length;i++){
					var t = data.top_supported[i];
					t.add_class = " top_fan";
					if (t.rank == 1){
						t.rank = "Top Fan";
					} else {
						t.rank = "#"+t.rank;
					}
					artists_supported.push(template("half_list_recent", t));
				}
			}
			for (var i=0;i<data.recent_supported.length;i++){
				artists_supported.push(template("half_list_recent", data.recent_supported[i]));
			}
		} else {
			$(".no_artists").show();
		}
		$("#artists_supported").html(artists_supported.join(""));

		if (data.is_you){
			$("#profile_nav").show();
			$(".your_profile").show();
			var notifications_htmls = [];
			for (var i=0;i<data.notifications.length;i++){
				var note = data.notifications[i];
				var classes = [];

				if (note.seen == 0)
					classes.push("new");

				if (note.type == 0){//system

				} else if (note.type == 1){//fallow

				} else if (note.type == 2){//message
					note.text = "Sent you a message: "+note.data;
				} else if (note.type == 3){//share
					if (note.song_id){
						note.text = 'shared the song <span class="play_song" data-song_id="'+note.song_id+'"><img src="'+note.song_image_url+'" />'+note.song_name+"</span> with you. "+note.data;
					}
				}

				note.classes = classes.join(" ");
				notifications_htmls.unshift(template("notification_list", note));
			}
			$("#profile_notifications").html(notifications_htmls.join(""));

			var band_htmls = [];
			for (var i=0;i<data.your_bands.length;i++){
				band_htmls.push(template("band_list", data.your_bands[i]));
			}
			$("#settings_bands").html(band_htmls.join(""));

			$("#settings_name").val(data.name);
		} else {
			$("#profile_nav").hide();
			$(".your_profile").hide();
		}

		show_page("profile");
	});
}

function view_playlist(playlist_id){
	$.getJSON(base_url+"/ajax/settings.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), action:"playlist_info", playlist_id: playlist_id}, function (data){
		$("#view_playlist_name").html(data.playlist.name);
		$("#playlist_name").val(data.playlist.name);
		$("#playlist_submit").data("id", data.playlist.id);
		$("#view_playlist .change_photo, #playlist_submit").data("id", data.playlist.id);
		if (data.playlist.can_edit){
			$("#edit_playlist").show();
		} else {
			$("#edit_playlist").hide();
		}
		var song_htmls = [];
		for (var i=0;i<data.songs.length;i++){
			data.songs[i].playlist_id = data.playlist.id;
			song_htmls.push(template("half_list", data.songs[i]));
		}
		$("#view_playlist_songs").html(song_htmls.join("")+'<div class="clear"></div>');
		$("#view_playlist_songs .selected_title").html("Sort");
		if (typeof data.playlist.type != "undefined"){
			$("#playlist_type").val(data.playlist.type);
		}
		show_page("view_playlist");
	});
}

function reset_playlist_view(){
	if ($("#view_playlist").hasClass("editing")){
		$("#stop_edit_playlist").trigger("click_event");
	}
}

function run_search(term){
	if (term.length > 2){
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
	} else {
		$("#search_results").html("Search 3 characters or more");
	}
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
	$("#head_bar").show();
	var prev = $(".page:visible");
	$(".page").hide();
	page.show();
	if (prev.data("unload")){
		window[prev.data("unload")]();
	}
}
function open_page(key){
	back_log("show_page", [key]);
	if (key == "playlist")
		$("#head_bar").hide();
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
var feature_scope = "";
var feature_feature_start_x = false;
var feature_feature_delta_x = false;
var swiper_scope = false;
var swiper_start_x = false;
var swiper_delta_x = false;
var band_song_start_y = false;
var band_song_delta_y = false;
var window_base_height = 0;

var upload_selector = {};

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
	var hl_width = (($(window).height() - 322 - 30 - height_mod) / 2);
	var one_line = $(window).width() / ($(window).height() - 260 - height_mod) > 1;
	$("#dynamic_style_sheet").html(":root{--height_mod: "+height_mod+"px}#profile_your_music .half_list_song{width:"+hl_width+"px !important}.song_info{height:"+($(window).height() - $(window).width() - 80 - height_mod)+"px !important}#genre_list{height:"+($(window).height() - 291 - height_mod)+"px !important}#full_list_content{height:"+($(window).height() - 100 - height_mod)+"px !important}"+(one_line?"#playlist .song_name {max-height: 51px;}":""));
	
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
					settings.set("is_admin", data.is_admin*1);
					if (data.is_admin > 0){
						$(".is_admin").show();
					} else {
						$(".is_admin").hide();
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
				$("#login_email").val("");
				$("#login_password").val("");
				settings.set("user_id", data.user_id);
				settings.set("is_admin", data.is_admin*1);
				if (data.is_admin > 0){
					$(".is_admin").show();
				} else {
					$(".is_admin").hide();
				}
				$(".logged_in").show();
				$(".logged_out").hide();
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
				$("#signup_name").val("");
				$("#signup_email").val("");
				$("#signup_password").val("");
				$("#signup_cpassword").val("");
				settings.set("user_id", data.user_id);
				back_log("load_playlist");
			}
		});
	});
	click_event(".logout", function (){
		player.stop();
		settings.set("user_id", 0);
		settings.set("is_admin", 0);
		playlist = Object.assign({}, empty_playlist);
		$(".is_admin").hide();
		$(".logged_in").hide();
		$(".logged_out").show();
		show_page("login");
	});

	click_event("#settings_save", function (e){
		$.getJSON(base_url+"/ajax/settings.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), action: "save_profile", name: $("#settings_name").val(), pass: $("#settings_password").val(), cpass: $("#settings_cpassword").val()}, function (data){
			$("#settings_password").val("");
			$("#settings_cpassword").val("");
			if (data.mess.Error){
				var mess = "";
				for (var i=0;i<data.mess.Error.length;i++)
					mess += "<div>"+data.mess.Error[i].message+"</div>";

				open_modal({title: "Error"+(data.mess.Error.length > 1?"s":""), content:mess});
			} else if (data.good) {
				open_modal({title: "Success", content:"Changes Saved"});
			}
		});
	});

	$("#playlist_songs").on("touchstart", function(e){
		//console.log("start");
		x_over = false;
		y_over = false;
		playlist_touch = e.originalEvent.touches[0];
		playlist_swipe_start_x = playlist_touch.clientX;
		playlist_swipe_delta_x = 0;
		playlist_swipe_start_y = playlist_touch.clientY;
		playlist_swipe_delta_y = 0;
	});
	$(".swiper").on("touchstart", function(e){
		swiper_scope = $(e.currentTarget);
		swiper_start_x = e.originalEvent.touches[0].clientX;
	});
	$("#featured_featured").on("touchstart", function(e){
		feature_scope = "#featured_featured";
		feature_feature_start_x = e.originalEvent.touches[0].clientX;
	});
	$("#genre_featured").on("touchstart", function(e){
		feature_scope = "#genre_featured";
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
	$(document).on("touchstart", "#profile_playlists .play_playlist", function (e){
		profile_playlist_edit = false;
		if ($(e.currentTarget).data("playlist_id")){
			profile_playlist_loc = $("#profile_playlists").offset();
			profile_playlist_long_press = setTimeout(function (){
				if (Math.abs(profile_playlist_loc.left - $("#profile_playlists").offset().left) < 20){
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
		playlist_swipe_start_x = false;
		profile_song_long_press = setTimeout(function (){
			playlist_position = true;
			$(".current_song .song_play_info").addClass("position_control");
		}, 500);
	});
	$(document).on("touchstart", "#band_songs", function (e){
		if ($("#band_songs.hidden").length == 0 && $("#band_songs.full").length == 0){
			var e = e;
			var touch = e.originalEvent.touches[0];
			band_song_start_y = touch.clientY;
		}
	});
	$(window).on("touchmove", function(e){
		e = e.originalEvent.touches[0];
		last_touch = e;
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
				$(feature_scope+" .feature.next_feature").css({left: "calc(100% - "+feature_feature_delta_x+"px)"});
			}
			if (feature_feature_delta_x < -50){
				if (feature_feature_delta_x < -$(document).width())
					feature_feature_delta_x = -$(document).width();
				$(feature_scope+" .feature.prev_feature").css({left: "calc(-100% + "+(-feature_feature_delta_x)+"px)"});
			}
		}
		if (!y_over && playlist_swipe_start_x !== false){
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
				y_over = true;
				if (playlist_swipe_delta_y < 0)
					playlist_swipe_delta_y = 0;
				$(".song .social_overlay").css({top: "calc(100% - "+playlist_swipe_delta_y+"px)"});
			}
		}
		if (swiper_scope){
			swiper_delta_x = swiper_start_x - e.clientX;
			if (swiper_delta_x > 50){
				if (swiper_delta_x < 0)
					swiper_delta_x = 0;
				$(swiper_scope).find(".next_swipe").css({left: "calc(100% - "+swiper_delta_x+"px)"});
			}
			if (swiper_delta_x < -50){
				if (swiper_delta_x < -$(document).width())
					swiper_delta_x = -$(document).width();
				$(swiper_scope).find(".prev_swipe").css({left: "calc(-100% + "+(-swiper_delta_x)+"px)"});
			}
		}
		if (band_song_start_y){
			band_song_delta_y = band_song_start_y - e.clientY;
			if (band_song_delta_y > 200)
				band_song_delta_y = 200;
			$("#band_songs").css({top: "calc(100% - "+(band_song_delta_y + 110)+"px)"});
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
				if ($(feature_scope+" .feature.next_feature").length){
					$(feature_scope+" .feature.next_feature").animate({left: 0}, 200, function (){
						$(feature_scope+" .feature.prev_feature").removeClass("prev_feature");
						$(feature_scope+" .feature.current_feature").removeClass("current_feature").addClass("prev_feature").css({left: '-100%'});
						var next = $(feature_scope+" .feature.next_feature").removeClass("next_feature").addClass("current_feature").next();
						if (feature_scope == "#genre_featured"){
							if (next.length){
								next.addClass("next_feature");
							} else {
								$(feature_scope+" .feature").first().addClass("next_feature");
							}
						} else {
							next.addClass("next_feature");
						}
					});
				}
				$(feature_scope+" .feature.prev_feature").animate({left: "-100%"}, 100);
			} else if (feature_feature_delta_x < -50){
				if ($(feature_scope+" .feature.prev_feature").length){
					$(feature_scope+" .feature.prev_feature").animate({left: 0}, 200, function (){
						$(feature_scope+" .feature.next_feature").removeClass("next_feature");
						$(feature_scope+" .feature.current_feature").removeClass("current_feature").addClass("next_feature").css({left: '100%'});
						var prev = $(feature_scope+" .feature.prev_feature").removeClass("prev_feature").addClass("current_feature").css({left: '0'}).prev();
						if (feature_scope == "#genre_featured"){
							if (prev.length){
								prev.addClass("prev_feature");
							} else {
								$(feature_scope+" .feature").first().addClass("prev_feature");
							}
						} else {
							prev.addClass("prev_feature");
						}
					});
				}
				$(feature_scope+" .feature.next_feature").animate({left: "100%"}, 100);
			}
		}
		if (swiper_start_x !== false){
			swiper_start_x = false;
			if (swiper_delta_x > 50){
				if ($(swiper_scope).find(".next_swipe").length){
					$(swiper_scope).find(".next_swipe").animate({left: 0}, 200, function (){
						$(swiper_scope).find(".prev_swipe").removeClass("prev_swipe");
						$(swiper_scope).find(".current_swipe").removeClass("current_swipe").addClass("prev_swipe").css({left: '-100%'});
						var next = $(swiper_scope).find(".next_swipe").removeClass("next_swipe").addClass("current_swipe").next();
						if (swiper_scope.data("loop")){
							if (next.length){
								next.addClass("next_swipe");
							} else {
								$(swiper_scope+" ").first().addClass("next_swipe");
							}
						} else {
							next.addClass("next_swipe");
						}
					});
				}
				$(swiper_scope).find(".prev_swipe").animate({left: "-100%"}, 100);
			} else if (swiper_delta_x < -50){
				if ($(swiper_scope).find(".prev_swipe").length){
					$(swiper_scope).find(".prev_swipe").animate({left: 0}, 200, function (){
						$(swiper_scope).find(".next_swipe").removeClass("next_swipe");
						$(swiper_scope).find(".current_swipe").removeClass("current_swipe").addClass("next_swipe").css({left: '100%'});
						var prev = $(swiper_scope).find(".prev_swipe").removeClass("prev_swipe").addClass("current_swipe").css({left: '0'}).prev();
						if (swiper_scope.data("loop")){
							if (prev.length){
								prev.addClass("prev_swipe");
							} else {
								$(swiper_scope+" ").first().addClass("prev_swipe");
							}
						} else {
							prev.addClass("prev_swipe");
						}
					});
				}
				$(swiper_scope).find(".next_swipe").animate({left: "100%"}, 100);
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
		if (band_song_start_y){
			band_song_start_y = false;
			if (band_song_delta_y > 50){
				$("#band_songs").addClass("full");
				$("#band").scrollTop(0);
			}
			$("#band_songs").css({top: ""});
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
			$(".song .social_overlay").css({top: "100%"}, 100);
			if (next_questionnaire <= 0 && next_playlist(true)){
				next_questionnaire = next_questionnaire_count;
				questionnaire = true;
				var genres = JSON.parse($(".current_song .genre_data").html());
				var htmls = [];
				for (var i=0;i<genres.length;i++){
					htmls.push(template("free_question", genres[i]));
				}
				open_modal({title: "Free User Questionnaire", content: "Select the best genre for this song: "+htmls.join(""), button1: false, add_class: "questionnaire", callback: function (button){
					questionnaire = false;
					next_playlist();
				}});
				$(".genre_selector").on("click", function (){
					$.getJSON(base_url+"/ajax/song.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), action: "genre_input", song_id: $(".current_song").data("song_id"), genre: $(this).data("genre_id")}, function(data){
					});
					questionnaire = false;
					close_modal();
					next_playlist();
				});
			} else {
				--next_questionnaire;
				next_playlist();
			}
			$(".song.prev_song").animate({left: "-100%"}, 100);
		} else if (playlist_swipe_delta_x < -50){
			$(".song .social_overlay").css({top: "100%"}, 100);
			prev_playlist();
			$(".song.next_song").animate({left: "100%"}, 100);
		} else if (playlist_swipe_delta_y > 150){
			$(".song .social_overlay").animate({top: "0px"}, 100);
			back_log("open_social_interaction", [$(".current_song").data("post_id")]);
			$(".song.next_song").animate({left: "100%"}, 100);
			$(".song.prev_song").animate({left: "-100%"}, 100);
		} else {
			$(".song .social_overlay").css({top: "100%"}, 100);
			$(".song.next_song").animate({left: "100%"}, 100);
			$(".song.prev_song").animate({left: "-100%"}, 100);
		}
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
		setTimeout(function (){
			playlist_state = $("#playlist_songs").html();
		}, 1);
		player.pause();
	}, true);

	click_event(".start_audio", function (e){
		$(e.currentTarget).parents(".song_pause_menu").hide();
		$("#playlist").removeClass("paused");
		setTimeout(function (){
			playlist_state = $("#playlist_songs").html();
		}, 1);
		player.resume();
	}, true);
	
	click_event(".open_profile_yours", function (e){
		back_log("open_profile", [settings.get("user_id")]);
	}, true);

	click_event(".add_to_playlist", function (e){
		var song_id = $(e.currentTarget).data("song_id");
		var song_ids = [];
		if (!song_id){
			$(".selected_song").each(function (){
				song_ids.push($(this).data("song_id"));
			});
		} else {
			song_ids.push(song_id);
		}
		$.getJSON(base_url+"/ajax/settings.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), action: "add_to_playlist", playlist_id: $(e.currentTarget).data("playlist_id"), song_ids: song_ids}, function(data){
			if (data.good){
				if (!song_id)
					open_modal({title: "Playlist", content: "Songs added"});
			} else {
				open_modal({title: "Error", content: "error adding to playlist"});
			}
		});
	}, true, true);
	
	click_event(".play_playlist", function (e){
		if (!profile_playlist_edit)
			back_log("load_playlist", ["playlist", $(e.currentTarget).data("playlist_id")]);
	}, true);

	click_event(".create_playlist", function (e){
		var song_id = $(e.currentTarget).data("song_id");
		var song_ids = [];
		if (song_id){
			song_ids = [song_id];
		}
		open_modal({title:"Create Playlist", content: 'Create playlist with the name <input id="playlist_name" type="text" placeholder="Name">', button1:"Create", button2: true, callback: function (action){
			if (action == "Create"){
				open_modala("Creating");
				$("#playlist_name").val();
				$.getJSON(base_url+"/ajax/settings.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), action: "create_playlist", name:$("#playlist_name").val(), song_ids: song_ids}, function (data){
					close_modala();
					if (data.playlist){
						$("#profile_your_playlists").append(template("playlist_list", data.playlist));
					}
				});
			}
		}});
	}, true);

	click_event(".profile_show", function (e){
		$(".shown").removeClass("active");
		$("#show_"+$(e.currentTarget).data("show")).addClass("active");
		$("#profile").scrollTop(325);
	}, true);
	
	click_event(".open_profile", function (e){
		back_log("open_profile", [$(e.currentTarget).data("user_id")]);
	}, true);

	click_event(".change_photo", function (e){
		open_modala("Selecting");
		var obj = $(e.currentTarget);
		console.log(obj.data("id"));
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
				if (result.recache){
					for (var i=0;i<result.recache.length;i++){
						var img = new Image();
						img.src = url+"/data/"+result.recache[i]+"?v="+Math.random();
						console.log("recache", img.src);
					}
				}
				console.log(JSON.stringify(result));
				reload_page();
			}, function(error){
				close_modala();
				console.log(JSON.stringify(error));
				open_modal({title: "Error", content: "Uploading picture failed"});
			}, options);
		}, function(message) {
			close_modala();
			console.log(message);
			open_modal({title: "Error", content: "Getting picture failed"});
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

	click_event(".donation", function (e){
		console.log(".donation");
		open_modal({title:"Show Love", content: template("donation_modal", {band_id: $(e.currentTarget).data("band_id"), band_name: $(e.currentTarget).data("band_name"), extra_name: $(e.currentTarget).data("extra_name")}), button1:"Cancel", add_class: "donation_modal"});
	}, true);

	click_event(".donate", function (e){
		var value = $(e.currentTarget).data("value");
		var curr = (value*0.25).toFixed(2);
		var info_target = $(e.currentTarget);
		while (typeof info_target.data("band_name") == "undefined"){
			info_target = info_target.parent();
		}
		var band_id = info_target.data("band_id");
		var post_id = info_target.data("post_id") || 0;
		var extra = info_target.data("extra_name") || "";
		if (extra)
			extra = " for "+extra;
		var band_name = info_target.data("band_name");
		open_modal({title:"Thank You!", content: '<img src="images/cone_3.png" style="margin: auto; position: absolute; left: 0; right: 0; width: 150px;"><div style="padding-top: 220px;">Thank you for sending a $'+curr+' donation to '+band_name+extra+', you earned '+value+' points.<div style="font-size: 0.73em; margin-top:10px;">Your support directly impacts the artists in an unprecedented way, allowing them to create the music that feeds your soul, all while earning points towards rewards!<div></div>', button1:"Confirm", button2: true, add_class: "donation_confirm", callback: function (action){
			if (action == "Confirm"){
				$.getJSON(base_url+"/ajax/donation.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), band_id: band_id, post_id: post_id, num: value}, function (data){
					if (data.mess.Error){
						var mess = "";
						for (var i=0;i<data.mess.Error.length;i++)
							mess += "<div>"+data.mess.Error[i].message+"</div>";

						open_modal({title: "Error"+(data.mess.Error.length > 1?"s":""), content:mess});
					}
				});
			}
		}});
	}, true);

	click_event(".band_stats", function (e){
		$(".band_dashboard_pages").hide();
		$("#dash_stats").show();
		$("#band_dash_nav .nav_item.active").removeClass("active");
		$(e.currentTarget).addClass("active");
	}, true);

	click_event(".band_songs", function (e){
		$(".band_dashboard_pages").hide();
		$("#dash_songs").show();
		$("#band_dash_nav .nav_item.active").removeClass("active");
		$(e.currentTarget).addClass("active");
	}, true);

	click_event(".band_social", function (e){
		$(".band_dashboard_pages").hide();
		$("#dash_social").show();
		$("#band_dash_nav .nav_item.active").removeClass("active");
		$(e.currentTarget).addClass("active");
	}, true);

	click_event(".band_settings", function (e){
		$(".band_dashboard_pages").hide();
		$("#dash_settings").show();
		$("#band_dash_nav .nav_item.active").removeClass("active");
		$(e.currentTarget).addClass("active");
	}, true);
	
	$("#band_social_action").on("click", function (e){
		var params = {user_id: settings.get("user_id"), uuid: settings.get("uuid"), action:"band_post", band_id: $(e.currentTarget).data("band_id"), text: $("#band_social_text").val(), private: $("#band_social_private").prop("checked")};
		if (upload_selector.band_social){
			var imageURI = upload_selector.band_social;
			open_modala("Uploading");
			console.log(imageURI);
			var options = new FileUploadOptions();
			options.fileKey = "file";
			options.fileName = imageURI.substr(imageURI.lastIndexOf('/') + 1);
			options.params = params;
			options.chunkedMode = false;
			console.log(options);

			var ft = new FileTransfer();
			ft.upload(imageURI, base_url+"/ajax/settings.php?callback=?", function(result){
				close_modala();
				console.log(JSON.stringify(result));
				reload_page();
			}, function(error){
				close_modala();
				console.log(JSON.stringify(error));
				open_modal({title: "Error", content: "Uploading picture failed"});
			}, options);
		} else {
			$.getJSON(base_url+"/ajax/settings.php?callback=?", params, function (data){
				if (data.mess.Error){
					var mess = "";
					for (var i=0;i<data.mess.Error.length;i++)
						mess += "<div>"+data.mess.Error[i].message+"</div>";

					open_modal({title: "Error"+(data.mess.Error.length > 1?"s":""), content:mess});
				} else if (data.success){
					$("#band_social_text").val("");

				}
			});
		}
	});

	$("#band").on("scroll", function (){
		if ($("#band").scrollTop() < 100){
			$("#band_songs").removeClass("hidden");
		} else {
			$("#band_songs").addClass("hidden");
		}
	});

	click_event("#band .profile_image", function (e){
		$("#band_songs").removeClass("full");
	});

	$(".upload_selector").on("click", function (e){
		var t = $(e.currentTarget);
		if (t.data("type") == "photo"){
			navigator.camera.getPicture(function (imageURI){
				upload_selector[t.data("key")] = imageURI;
			}, function(message) {
				close_modala();
				console.log(message);
				open_modal({title: "Error", content: "Getting picture failed"});
			}, {
				quality: 100,
				destinationType: navigator.camera.DestinationType.FILE_URI,
				sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY
			});
		}
	});

	$("#save_band").on("click", function (){
		$.getJSON(base_url+"/ajax/settings.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), action:"save_band", band_id: $("#band_dashboard").data("band_id"), name: $("#band_name").val(), bio: $("#band_bio").val()}, function (data){
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
	
	click_event("#edit_playlist", function (e){
		$("#view_playlist").addClass("editing");
		$("#view_playlist_songs").sortable("enable");
	});
	$("#view_playlist_songs").sortable({scroll: true, handle:".selected_title"});
	$("#view_playlist_songs").sortable("disable");
	$("#view_playlist_songs").on("sortupdate", function( event, ui ) {
		var ids = [];
		$("#view_playlist_songs .half_list_song").each(function (){
			ids.push($(this).data("song_id"));
		});
		$.getJSON(base_url+"/ajax/settings.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), action:"save_playlist_sort", playlist_id: $("#playlist_submit").data("id"), ids: ids.join(",")}, function (data){

		});
	});
	
	click_event("#stop_edit_playlist", function (e){
		$("#view_playlist").removeClass("editing");
		$("#view_playlist_songs").sortable("disable");
	});

	click_event("#view_playlist_songs .fa-close", function (e){
		var target = $(e.currentTarget).parents(".half_list_song");
		$.getJSON(base_url+"/ajax/settings.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), action:"remove_from_playlist", playlist_id: $("#playlist_submit").data("id"), song_id: target.data("song_id")}, function (data){
			if (data.good){
				target.remove();
			}
		});
	}, true);
	
	click_event("#playlist_submit", function (e){
		$.getJSON(base_url+"/ajax/settings.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), action:"save_playlist", playlist_id: $(e.currentTarget).data("id"), name: $("#playlist_name").val(), type: $("#playlist_type").val()}, function (data){
			
		});
	});

	click_event(".play_now", function (e){
		play_song($(e.currentTarget).data("song_id"));
	}, true);

	click_event(".social_type_song img", function (e){
		play_song($(e.currentTarget).data("song_id"));
	}, true);
	
	click_event(".open_full_list_100", function (e){
		back_log("open_full_list", ["100", "Top 100"]);
	}, true);
	
	click_event(".open_full_list_rise", function (e){
		back_log("open_full_list", ["rise", "On Rise The"]);
	}, true);
	
	click_event(".open_full_list_local", function (e){
		back_log("open_full_list", ["local", "Local"]);
	}, true);
	
	click_event(".open_full_list_curated", function (e){
		back_log("open_full_list", ["curated", "Curated"]);
	}, true);
	
	click_event(".play_song", function (e){
		if (!profile_song_press){
			play_song($(e.currentTarget).data("song_id"), $(e.currentTarget).data("playlist_id"));
		}
	}, true);
	
	click_event(".add_friend", function (e){
		var t = $(e.currentTarget);
		$.getJSON(base_url+"/ajax/settings.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), action:"add_friend", users_id: $(e.currentTarget).data("user_id")}, function (data){
			t.hide();
		});
	}, true);
	
	click_event(".open_interact", function (){
		if ($(".open_interact").hasClass("active")){
			$(".open_interact").removeClass("active");
			$("#social_activity").removeClass("interacting");
		} else {
			$(".open_interact").addClass("active");
			$("#social_activity").addClass("interacting");
		}
	});

	click_event(".social_details", function (e){
		back_log("open_social_interaction", [$(e.currentTarget).data("post_id")]);
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

	$("#social_search").on("keyup", function (e){
		var term = $("#social_search").val().toLowerCase();
		var found = 0;
		if (term){
			$("._social_target").each(function (){
				if ($(this).children("div").html().toLowerCase().indexOf(term) >= 0){
					$(this).show();
					found += 1;
				} else {
					$(this).hide();
				}
			});
		} else {
			found = $("._social_target").show().length;
		}
		if (found == 0){
			$("#no_social_target").show();
		} else {
			$("#no_social_target").hide();
		}
	});

	click_event("._social_target", function (e){
		if ($(e.currentTarget).hasClass("active")){
			$(e.currentTarget).removeClass("active");
		} else {
			$("._social_target").removeClass("active");
			$(e.currentTarget).addClass("active");
			if ($(e.currentTarget).data("user_id") == -1){
				open_modal({title: "Social Post", content: "Posting to your social page.", button1: "Confirm", button2: true, callback: function (button){
					if (button == "Confirm"){
						social_submit_interaction();
					} else {
						$("._social_target").removeClass("active");
					}
				}});
			}
		}
	}, true);

	$("#social_input").on("keyup", function (e){
		if (e.keyCode == 13 || e.keyCode == 9){
			$("#social_input").css("height", 50);
			$("#social_interact").css("top", 0);
			social_submit_interaction();
		}
		var scrollTop = $(e.currentTarget).scrollTop();
		if (scrollTop){
			$("#social_interact").css("top", $("#social_interact").css("top").substr(0, $("#social_interact").css("top").length-2) - scrollTop);
			$("#social_input").css("height", $("#social_input").css("height").substr(0, $("#social_input").css("height").length-2)*1 + scrollTop);
		}
	});
	
	click_event(".toggle_last_details", function (e){
		$("#social_last_details").toggleClass("active");
	}, true);

	click_event(".collect", function (e){
		save_add_playlist($(e.currentTarget).data("song_id"));
	}, true);

	click_event(".send_message", function (e){
		$("#message_interface").addClass("active");
		$("#message_field").focus().data("user_id", $(e.currentTarget).data("user_id"));
	}, true);
	
	$("#message_field").on("keyup", function (e){
		if (e.keyCode == 13 || e.keyCode == 9){
			$.getJSON(base_url+"/ajax/settings.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), action:"send_message", users_id: $(e.currentTarget).data("user_id"), message: $(e.currentTarget).val()}, function (data){
				if (data.mess.Error){
					var mess = "";
					for (var i=0;i<data.mess.Error.length;i++)
						mess += "<div>"+data.mess.Error[i].message+"</div>";
					
					open_modal({title: "Error"+(data.mess.Error.length > 1?"s":""), content:mess});
				} else if (data.success){
					$("#message_interface").removeClass("active");
					open_modal({title: "Message Sent", content:""});
				}
			});
		}
	});

	click_event(".open_genre", function (e){
		back_log("load_playlist", ["genre", $(e.currentTarget).data("genre_id")]);
	}, true);
	
	click_event("#logo", function (e){
		if ($("#playlist:visible").length){
			back_log("load_playlist");
		} else {
			back_log("load_playlist", [playlist.type, playlist.key, playlist.empty]);
		}
	});

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
		if ($(e.currentTarget).data("func")){
			back_log($(e.currentTarget).data("func"));
		} else {
			open_page($(e.currentTarget).data("page"));
		}
	}, true, true);

	var profile_high = true;
	$("#profile").on("scroll", function (){
		if ($(this).scrollTop() > 320){
			if (profile_high){
				profile_high = false;
				$("#profile").addClass("scrolled");
			}
		} else if (!profile_high){
			profile_high = true;
			$("#profile").removeClass("scrolled");
		}
	});

	$(window).resize(function() {
		if ($(window).height() < window_base_height){
			$("body").addClass("keyboard");
		} else {
			$("body").removeClass("keyboard");
		}
	});
	window_base_height = $(window).height();
	
	
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