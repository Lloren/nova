"use strict"

function Audio_player(){
	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	this.context = new AudioContext();
	this.queue = [];
	this.playing = false;
	this.output_handle = false;

	this.add = function (audio){

	};

	this.play = function(audio){
		this.stop();
		this.playing = audio;
		this.playing.volume = 0.05;
		this.playing.play();
		var length = this.playing.duration;
		console.log(this.playing, length);
		var scope = this;
		this.output_handle = setInterval(function (){
			$(".song_played").css("width", (scope.playing.currentTime / scope.playing.duration * 100) + "%");
		}, 100);
	};

	this.play_url = function(url){
		if (!this.playing || this.playing.src != url){
			this.play(new Audio(url));
		}
	};

	this.stop = function (){
		if (this.playing){
			clearInterval(this.output_handle);
			var prev = this.playing;
			$(prev).animate({volume: 0}, 1000, function (){});
		}
	}
}
var player = new Audio_player();

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
		$("#band_dashboard #dash_songs").html(song_html);
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
		$("#band .profile_background").css("background-image", "url("+data.image+")");
		$("#band .profile_image").attr("src", data.image);
		$("#band .profile_name").html(data.name);
		show_page("band");
	});
}

var discover_touch = false;
var discover_swipe_start = false;
var discover_swipe_delta = false;
function load_discover(){
	$("#discover_songs").html("Loading...");
	$.getJSON(base_url+"/ajax/discover.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid")}, function (data){
		if (data.songs.length == 0){
			$("#discover_songs").html("<br /><br /><br /><br />No new Discover songs, try Genre or top lists.");
		} else {
			var htmls = [];
			for (var i=0;i<data.songs.length;i++){
				var song = data.songs[i];
				song.add_class = "";
				if (i == 0)
					song.add_class = "current_song";
				if (i == 1)
					song.add_class = "next_song";
				htmls.push(template("song_disp", song));
			}
			player.play_url(base_url+"/data/band_songs/"+data.songs[0].key);
			$("#discover_songs").html(htmls.join(""));
		}
	});
}

function next_discover(){
	if ($(".song.next_song").length){
		$(".song.next_song").animate({left: 0}, 200, function (){
			$(".song.prev_song").removeClass("prev_song");
			$(".song.current_song").removeClass("current_song").addClass("prev_song");
			$(".song.next_song").removeClass("next_song").addClass("current_song");
			$(".song.next_song").next().addClass("next_song");
		});
		player.play_url(base_url+"/data/band_songs/"+$(".song.next_song").data("key"));
	} else {
		$("#discover_songs").html("<br /><br /><br /><br />No new Discover songs, try Genre or top lists.");
	}
}

function play_song(song_id){
	$("#discover_songs").html("Loading...");
	show_page("discover", false);
	$.getJSON(base_url+"/ajax/discover.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), song_id: song_id}, function (data){
		if (data.songs[0]){
			var song = data.songs[0];
			song.add_class = "current_song";
			player.play_url(base_url+"/data/band_songs/"+song.key);
			$("#discover_songs").html(template("song_disp", song));
		}
	});
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
		$("#featured_band_image").attr("src", data.image_url);
		$("#featured_band_image").data("band_id", data.band_id);
	});
}

function load_genres(){
	$.getJSON(base_url+"/ajax/genre.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid")}, function (data){
		$("#genre_band_image").attr("src", data.image_url);
		$("#genre_band_image").data("band_id", data.band_id);
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
		$("#your_profile .profile_image").attr("src", data.image);
		$("#your_profile .profile_name").html(data.name);
		var song_htmls = [];
		for (var i=0;i<data.songs.length;i++){
			song_htmls.push(template("half_list", data.songs[i]));
		}
		$("#profile_your_songs").html(song_htmls.join(""));
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
		show_page("profile");
	});
}

function open_genre(genre_id){
	$.getJSON(base_url+"/ajax/genre.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), genre_id: genre_id}, function (data){
		var htmls = [];
		for (var i=0;i<data.songs.length;i++){
			var item = data.songs[i];
			item.num = i+1;
			htmls.push(template("full_list", item));
		}
		$("#full_list_content").html(htmls.join(""));
		$("#full_list_title").html("Genre: "+data.name);
	});
	$("#full_list_content").html("Loading...");
	$("#full_list_title").html("Genre: ");
	show_page("full_list");
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
	if (onload && page.data("on_open")){
		window[page.data("on_open")]();
	}
	$(".page").hide();
	page.show();
}
function open_page(key){
	back_log("show_page", [key]);
}

var saved_song_data = false;
var search_query_handle = false;

function startup(){
	console.log("startup");
	start_splash_remove();
	if (!has_internet){
		$("body").html("This app requires internet to function.");
		return;
	}
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
					open_page("discover");
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
				open_page("discover");
			}
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
				open_page("discover");
			}
		});
	});
	click_event(".logout", function (){
		$(".is_admin").hide();
		$(".logged_in").hide();
		$(".logged_out").show();
		open_page("login");
	});

	$("#discover_songs").on("touchstart", function(e){
		console.log("start");
		discover_touch = e.originalEvent.touches[0];
		discover_swipe_start = discover_touch.clientX;
	});
	$(window).on("touchmove", function(e){
		e = e.originalEvent.touches[0];
		if (discover_swipe_start !== false){
			discover_swipe_delta = discover_swipe_start - e.clientX;
			if (discover_swipe_delta < 0)
				discover_swipe_delta = 0;
			$(".song.next_song").css({left: "calc(100% - "+discover_swipe_delta+"px)"});
		}
	});
	$("#discover_songs").on("touchend", function(e){
		console.log(discover_swipe_delta);
		if (discover_swipe_delta > 50){
			next_discover();
		} else {
			$(".song.next_song").animate({left: "100%"}, 100);
		}
		discover_touch = false;
		discover_swipe_delta = false;
		discover_swipe_start = false;
	});

	click_event(".song_pass", function (e){
		$.getJSON(base_url+"/ajax/song.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), action: "pass", song_id: $(e.currentTarget).parents(".song").data("song_id")}, function(data){
			next_discover();
		});
	}, true);

	click_event(".song_like", function (e){
		$.getJSON(base_url+"/ajax/song.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), action: "like", song_id: $(e.currentTarget).parents(".song").data("song_id")}, function(data){
			next_discover();
		});
	}, true);

	click_event(".stop_audio", function (e){
		$(e.currentTarget).hide();
		player.stop();
	}, true);
	
	click_event(".open_profile_yours", function (e){
		back_log("open_profile_yours");
	}, true);

	click_event(".open_albums", function (e){
		$("#profile_your_songs").show();
		$("#profile_notifications").hide();
		$(".nav_item.active").removeClass("active");
		$(e.currentTarget).addClass("active");
	}, true);
	
	click_event(".open_notifications", function (e){
		$("#profile_notifications").show();
		$("#profile_your_songs").hide();
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

	$(".admin_band_update").on("change", function (){
		var dat = {user_id: settings.get("user_id"), uuid: settings.get("uuid"), action:"band_update", band_id: $("#band_dashboard").data("band_id")};
		dat["status"] = $("#band_status").val();
		$.getJSON(base_url+"/ajax/admin.php?callback=?", dat, function (data){
		});
	});

	click_event(".play_now", function (e){
		player.play_url(base_url+"/data/band_songs/"+$(e.currentTarget).data("song_key"));
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
		back_log("play_song", $(e.currentTarget).data("song_id"));
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
		back_log("open_genre", $(e.currentTarget).data("genre_id"));
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
		if ($(".page:visible").data("back")){
			open_page($(".page:visible").data("back"));
		} else if (pages.length > 0){
			open_page(pages.pop());
		}
	});

	click_event(".open_page", function (e){
		$("#menu-overlay").trigger("click_event");
		open_page($(e.currentTarget).data("page"));
	}, true, true);
	
	
	if (settings.get("user_id") > 0){
		if (settings.get("is_admin") > 0){
			$(".is_admin").show();
		}
		open_page("discover");
		$(".logged_in").show();
		$(".logged_out").hide();
	} else {
		$(".logged_in").hide();
		$(".logged_out").show();
	}

}