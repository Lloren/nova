"use strict"

function open_band_dashboard(band_id){
	$.getJSON(base_url+"/ajax/band.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), band_id: band_id, action:'dashboard'}, function (data){
		$("#band_dashboard").data("band_id", data.id);
		$("#band_dashboard .profile_background").css("background-image", "url("+data.image+")");
		$("#band_dashboard .profile_image").attr("src", data.image);
		$("#band_dashboard .profile_name").html(data.name);
		$("#band_dashboard .change_photo").data("id", data.id);
		var song_html = "";
		for (var i=0;i<data.songs.length;i++){
			song_html += template("song_list", data.songs[i]);
		}
		$("#band_dashboard #dash_songs").html(song_html);
		open_page("band_dashboard");
	});
}

function save_settings(){
	var settings_data = Object.create(settings.data);
	if (settings.get("user_id") > 0){
		$.post(base_url+"/ajax/settings.php?action=save&uuid="+settings.get("uuid")+"&user_id="+settings.get("user_id"), {data: settings_data}, function (data){
		});
	}
}

var pages = [];
function open_page(key){
	if ($("#"+key).data("back")){
		pages = [];
		if ($("#"+key).data("back") == "hide")
			$("#head_back").hide();
		else
			$("#head_back").show();
	} else {
		pages.push($(".page:visible").attr("id"));
		$("#head_back").show();
	}
	$(".page").hide();
	$("#"+key).show();
}

var saved_song_data = false;

function startup(){
	console.log("startup");
	if (!has_internet){
		$("body").html("This app requires internet to function.");
		start_splash_remove();
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
					$(".logged_in").show();
					$(".logged_out").hide();
					open_page("discover");
				}
				login_responce(data);
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
	
	click_event(".open_profile_yours", function (e){
		$.getJSON(base_url+"/ajax/profile.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), users_id: settings.get("user_id")}, function (data){
			$("#your_profile .profile_background").css("background-image", "url("+data.image+")");
			$("#your_profile .profile_image").attr("src", data.image);
			$("#your_profile .profile_name").html(data.name);
			var band_html = "";
			for (var i=0;i<data.bands.length;i++){
				band_html += template("band_list", data.bands[i]);
			}
			$("#settings_bands").html(band_html);
			open_page("your_profile");
		});
	}, true);
	
	click_event(".open_profile", function (e){
		$.getJSON(base_url+"/ajax/profile.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), users_id: $(e.currentTarget).data("user_id")}, function (data){
			$("#profile .profile_background").css("background-image", "url("+data.image+")");
			$("#profile .profile_image").attr("src", data.image);
			$("#profile .profile_name").html(data.name);
			open_page("profile");
		});
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
		var options = new FileUploadOptions();
		options.fileKey = "file";
		options.fileName = data.exportedurl.substr(data.exportedurl.lastIndexOf('/') + 1);
		options.params = {user_id: settings.get("user_id"), uuid: settings.get("uuid"), action: "new_song", name: $("#song_name").val(), band_id: $("#band_dashboard").data("band_id")};
		options.chunkedMode = false;
		console.log(options);

		var ft = new FileTransfer();
		ft.upload(data.exportedurl, base_url+"/ajax/settings.php", function(result){
			close_modala();
			saved_song_data = false;
			$("#song_name").val("");
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

	click_event("#song_submit", function (e){
		var mess = [];
		if ($("#song_name").val() == ""){
			mess.push("You need to enter a song name");
		}
		if (!saved_song_data){
			mess.push("You need to select a song");
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
				open_band_dashboard(data.band_id);
			}
		})
	});

	click_event(".open_band", function (e){
		$.getJSON(base_url+"/ajax/band.php?callback=?", {user_id: settings.get("user_id"), uuid: settings.get("uuid"), band_id: $(e.currentTarget).data("band_id")}, function (data){
			$("#band .profile_background").css("background-image", "url("+data.image+")");
			$("#band .profile_image").attr("src", data.image);
			$("#band .profile_name").html(data.name);
			open_page("band");
		});
	}, true);

	click_event(".open_band_dashboard", function (e){
		open_band_dashboard($(e.currentTarget).data("band_id"));
	}, true);
	
	click_event("#head_back", function (e){
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
		open_page("discover");
		$(".logged_in").show();
		$(".logged_out").hide();
	} else {
		$(".logged_in").hide();
		$(".logged_out").show();
	}

};