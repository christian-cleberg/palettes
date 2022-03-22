function getRGB() {
  var r = Math.floor(Math.random() * 255);
  var g = Math.floor(Math.random() * 255);
  var b = Math.floor(Math.random() * 255);
  return [r, g, b];
}

function getHex(rgb) {
  var hex = "";
  rgb.forEach(function(val) {
    var hexPartial = Number(val).toString(16);
    if (hexPartial.length < 2) {
      hexPartial = "0" + hexPartial;
    }
    hex = hex + hexPartial;
  });
  return hex;
}

function getCMYK(rgb) {
  var finalK = 0;

  var r = rgb[0];
  var g = rgb[1];
  var b = rgb[2];

  if (r === 0 && g === 0 && b === 0) {
    finalK = 1;
    return [0, 0, 0, 1];
  }

  var finalC = 1 - (r / 255);
  var finalM = 1 - (g / 255);
  var finalY = 1 - (b / 255);

  var minCMY = Math.min(finalC, Math.min(finalM, finalY));
  finalC = Math.trunc(((finalC - minCMY) / (1 - minCMY)) * 100);
  finalM = Math.trunc(((finalM - minCMY) / (1 - minCMY)) * 100);
  finalY = Math.trunc(((finalY - minCMY) / (1 - minCMY)) * 100);
  finalK = Math.trunc(minCMY * 100);

  return (finalC + "," + finalM + "," + finalY + "," + finalK);
}

function getContrast(rgb) {
  return ((299 * rgb[0]) + (587 * rgb[1]) + (114 * rgb[2])) / 1000;
}

function generate(elements) {
  elements.each(function(index, column) {
    let rgb = getRGB();
    $(column).find(".color-rgb").text(`(${rgb})`);
    $(column).find(".color-hex").text("#" + getHex(rgb));
    $(column).find(".color-cmyk").text(`(${getCMYK(rgb)})`);
    $(column).css("background-color", `rgb(${rgb})`);
    if (getContrast(rgb) < 123) {
      $(column).addClass("text-white");
    } else {
      $(column).removeClass("text-white");
    }
  });
}

function regenerate() {
  generate($(".color-column[data-locked='false']"));
}

function copy(type, text) {
  var $tempTextField = $("<input>");
  $("body").append($tempTextField);
  switch (type) {
    case "rgb":
      $tempTextField.val("rgb" + text).select();
      break;
    case "hex":
      $tempTextField.val(text).select();
      break;
    case "cmyk":
      $tempTextField.val("cmyk" + text).select();
      break;
  }
  document.execCommand("copy");
  $tempTextField.remove();
}

function showToast(type, text) {
  var alert = "<div class='toast-alert alert alert-" + type + "' role='alert'>" + text + "</div>";
  $(".container-fluid").append(alert);
  $(".toast-alert").animate({
    opacity: 0
  }, 2000, function() {
    $(this).remove();
  });
}

function init() {
  regenerate();

  $(".color-value").click(function(e) {
    var text = $(e.target).text();
    copy($(e.target).data("format"), text);
    showToast("success", "Color code copied to clipboard.");
  });

  $(".color-column-lock").click(function(e) {
    var icon = $(e.target);
    var column = $(e.target).parent().parent();
    var status = column.attr("data-locked");
    if (status === "true") {
      column.attr("data-locked", "false");
    } else {
      column.attr("data-locked", "true");
    }
    icon.toggleClass(["fa-lock-open", "fa-lock"]);
  });

  $(".color-column-regenerate").click(function(e) {
    generate($(e.target).parent().parent());
  });

  $("#submitNewColor").click(function(e) {
    setNewColor(getNewColor(e));
  });

  loadAllPalettes();
}

function setNewColor(values) {
  var column = $(".color-column:eq(" + (parseInt(values[1]) - 1) + ")");
  var rgb = JSON.parse("[" + values[0] + "]");
  $(column).find(".color-rgb").text(`(${rgb})`);
  $(column).find(".color-hex").text("#" + getHex(rgb));
  $(column).find(".color-cmyk").text(`(${getCMYK(rgb)})`);
  $(column).css("background-color", `rgb(${rgb})`);
  if (getContrast(rgb) < 123) {
    $(column).addClass("text-white");
  } else {
    $(column).removeClass("text-white");
  }
}

function getNewColor(e) {
  var string = $(e.target).closest(".modal-content").find("input").val();
  var newString = string.replace("(", "").replace(")", "").replace("rgb", "");
  var column = $(e.target).closest(".modal-content").find("select option:selected").text();
  return [newString, column];
}

function switchTheme() {
  $("body").toggleClass("custom-bg");
  $(".fa-moon").toggleClass("d-none");
  $(".fa-sun").toggleClass("d-none");
  $(".color-column-labels").toggleClass("text-white");
}

function storePalette(keysObject, paletteName) {
  // Query object of all rgb colors and store text values in new object
  var rgbDOMObject = $(".color-rgb");
  var rgbStorageObject = {
    "0": $(rgbDOMObject[0]).text().replace("(", "").replace(")", ""),
    "1": $(rgbDOMObject[1]).text().replace("(", "").replace(")", ""),
    "2": $(rgbDOMObject[2]).text().replace("(", "").replace(")", ""),
    "3": $(rgbDOMObject[3]).text().replace("(", "").replace(")", ""),
    "4": $(rgbDOMObject[4]).text().replace("(", "").replace(")", "")
  };
  // Generate random key, ensure it doesn't exist already, then save the key in storage
  var randomKey = generateRandomKey();
  if (keysObject === null) {
    var newKeysObject = {};
    newKeysObject[paletteName] = randomKey;
  } else {
    var newKeysObject = keysObject;
    newKeysObject[paletteName] = randomKey;
  }
  localStorage.setItem("paletteKeys", JSON.stringify(newKeysObject));
  // Save color palette object
  localStorage.setItem(randomKey, JSON.stringify(rgbStorageObject));

  return randomKey;
}

function savePalette() {
  // Get palette names object and user input of new palette name
  var keysObject = JSON.parse(localStorage.getItem("paletteKeys"));
  var paletteName = $("#inputPaletteName").val();
  var nameCheck = false;
  // Check palette name exists
  if (keysObject !== null && paletteName in keysObject) {
    nameCheck = true;
  }
  if (typeof(Storage) !== "undefined") {
    // If the input name is null or empty, show an error alert
    if (paletteName === null || paletteName == "undefined" || paletteName == "") {
      alert("Error: You must enter a valid name for this palette.");
    } else if (keysObject != null && nameCheck === true) { // If the name exists, ask user to confirm
      var userConfirmation = confirm("Palette name exists. Do you want to overwrite this palette?");
      // If the user confirms, save the palette
      if (userConfirmation) {
        var randomKey = storePalette(keysObject, paletteName);
        $("#savedPalettesBody").append("<button class='btn btn-outline-secondary my-2 w-100' onclick='loadPalette(" + randomKey + ")'>" + paletteName + "</button>");
        showToast("success", "Color palette saved.");
      }
    } else { // If the name doesn't exist, save palette
      var randomKey = storePalette(keysObject, paletteName);
      $("#savedPalettesBody").append("<div id='"+randomKey+"' class='my-2 d-flex'><div class='btn-group w-100' role='group' aria-label='Saved palette'><button class='btn btn-secondary w-100' onclick='loadPalette(" + randomKey + ")'>" + paletteName + "</button><button class='btn btn-danger' onclick='deletePalette(" + randomKey + ")'><i class='far fa-trash-alt'></i></button></div></div>");
      showToast("success", "Color palette saved.");
    }
  } else {
    alert("Sorry, your browser does not support Web Storage. Please ugrade your browser and try again.");
  }
}

function loadAllPalettes() {
  if (typeof(Storage) !== "undefined") {
    var fetchedData = localStorage.getItem("paletteKeys");
    if (fetchedData === null) {
      console.log("Warning: No palettes exist.");
    } else {
      $.each(JSON.parse(fetchedData), function(key, value) {
        var palette = localStorage.getItem(key);
        $("#savedPalettesBody").append("<div id='"+value+"' class='my-2 d-flex'><div class='btn-group w-100' role='group' aria-label='Saved palette'><button class='btn btn-secondary w-100' onclick='loadPalette(" + value + ")'>" + key + "</button><button class='btn btn-danger' onclick='deletePalette(" + value + ")'><i class='far fa-trash-alt'></i></button></div></div>");
        $("#editColorModal").modal("hide");
      });
      showToast("success", "Color palettes loaded.");
    }
  } else {
    alert("Sorry, your browser does not support Web Storage. Please ugrade your browser and try again.");
  }
}

function loadPalette(requestedKey) {
  var fetchedData = localStorage.getItem("paletteKeys");
  $.each(JSON.parse(fetchedData), function(key, value) {
    var newValue = parseInt(value, 10);
    if (requestedKey === newValue) {
      var palette = localStorage.getItem(value);
      $.each(JSON.parse(palette), function(subKey, subValue) {
        var col = parseInt(subKey, 10) + 1;
        setNewColor([subValue, col]);
      });
    }
    $("#editColorModal").modal("hide");
  });
}

function deleteAllPalettes() {
  var confirmation = confirm("Are you sure you want to delete all palettes?");
  if (confirmation) {
    $("#savedPalettesBody button").remove();
    localStorage.clear();
  }
}

function deletePalette(id) {
  var confirmation = confirm("Are you sure you want to delete this palette?");
  if (confirmation) {
    // Get name of palette by the id
    var keysObject = JSON.parse(localStorage.getItem("paletteKeys"));
    var name = getKeyByValue(keysObject, id);
    // Remove the button
    $("#" + id).remove();
    // Remove local storage item
    localStorage.removeItem(id);
    // Remove item from paletteKeys
    delete keysObject[name];
    // Set new paletteKeys object
    var newKeysObject = keysObject;
    localStorage.setItem("paletteKeys", JSON.stringify(newKeysObject));
  }
}

function generateRandomKey() {
  // Generate random key
  var randomKey = Math.floor((Math.random() * 9007199254740992) + 1);
  // Check if random key exists (up to 100 times)
  for (var i = 0; i < 100; i++) {
    // If the key exists, generate a new key
    if (checkKey(randomKey) === true) {
      randomKey = Math.floor((Math.random() * 9007199254740992) + 1);
    }
    // If the key does not exist, break the loop and return the key
    else {
      break;
    }
  }
  return randomKey;
}

function checkKey(key) {
  // Fetch paletteKeys object
  var keysObject = localStorage.getItem("paletteKeys");
  // If object is null, it doesn't exist yet
  if (keysObject !== null) {
    // If object exists, parse it and check to see if the key exists
    var tempObject = JSON.parse(keysObject);
    if (tempObject.hasOwnProperty(key.toString())) {
      return true;
    } else {
      return false;
    }
  }
}

function saveImage() {
  // Remove previous image
  $("#saveImageModal img").remove();
  // Hide toolbar so it doesn't appear in screenshot
  $(".color-column-toolbar").hide();
  // Set background color of canvas based on body
  var bgColor = $("body").hasClass("custom-bg") ? "#000000" : "#FFFFFF";
  // Get canvas and launch modal
  html2canvas(document.getElementsByClassName("container-fluid")[0], {backgroundColor:bgColor}).then(function(canvas) {
    $(".color-column-toolbar").show();
    var img = canvas.toDataURL("image/png");
    $("#saveImageModal").modal("show");
    $("#saveImageModal .modal-body").append('<img id="palette-image" class="img-fluid" src="'+img+'"/>');
  });
}

function getKeyByValue(object, value) {
  for (var i=0; i < Object.keys(object).length; i++) {
    var key = Object.keys(object)[i];
    var fetchedValue = object[key];
    if (value === fetchedValue) {
      return key;
    }
  }
}
