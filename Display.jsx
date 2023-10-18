/* ----------------------------------------------------------------------------------------------------------------------
//DESCRIPTION:Toggles all display settings to your defaults

+    This script is part of project-octopus.net

+   Author: Gerald Singelmann, gs@cuppascript.com
+   Supported by: Satzkiste GmbH, post@satzkiste.de

+    Modified: 2023-04-26

+    License (MIT)
		Copyright 2023 Gerald Singelmann/Satzkiste GmbH
		Permission is hereby granted, free of charge, to any person obtaining 
		a copy of this software and associated documentation files (the "Software"), 
		to deal in the Software without restriction, including without limitation 
		the rights to use, copy, modify, merge, publish, distribute, sublicense, 
		and/or sell copies of the Software, and to permit persons to whom the 
		Software is furnished to do so, subject to the following conditions:
		The above copyright notice and this permission notice shall be included 
		in all copies or substantial portions of the Software.
		THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS 
		OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
		FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL 
		THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
		LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
		FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
		DEALINGS IN THE SOFTWARE.
// ---------------------------------------------------------------------------------------------------------------------- */
#targetengine octopus_display
#include "./includes.jsxinc"
init();
log_run();


var dbg = false;

// ------------------------------------------------------------------------------------------------------------------
//	Hybrider Teil: Startup oder nicht?
// ------------------------------------------------------------------------------------------------------------------
var scriptPath, scriptFolderPath;
try {
  scriptPath = app.activeScript.fullName;
  scriptFolderPath = app.activeScript.parent;
}
catch (e) {
  /* We're running from the ESTK*/
  scriptPath = e.fileName
}
if (scriptPath.search(/startup scripts/i) != -1) {
  try {
    app.removeEventListener("afterOpen", sk_anzeige_fix);
  } catch (e) {
    if (dbg) $.writeln(e);
  }

  app.addEventListener("afterOpen", sk_anzeige_fix);
} else {
  if (app.documents.length) {
    sk_anzeige_fix(app.documents[0]);
  }
}

// ------------------------------------------------------------------------------------------------------------------
//	Event-Handler
// ------------------------------------------------------------------------------------------------------------------
function sk_anzeige_fix(e) {
  if (e.constructor.name == "Document") {
    handle_doc(e);
  } else {
    try {
      if (e.target.constructor.name == "LayoutWindow") {
        handle_doc(e.target.parent);
      } else {
      }
    } catch (e) { }
  }

  // ------------------------------------------------------------------------------------------------------------------
  //	Die Arbeit
  // ------------------------------------------------------------------------------------------------------------------
  function handle_doc(doc) {
    var msgs = [];
    // try {
      // init_data();

      // function in include.jsxinc:
      var cfg_path = get_config_path() + "/Display/default_cfg.json"
      var cfg_file = new File(cfg_path);
      if (cfg_file.exists) {
        init();

        cfg_file.open("r");
        var aux = cfg_file.read();
        cfg_file.close();
        var config = JSON.parse(aux);
      } else {
        // alert("Starten Sie einmal das Anzeige-Config Script, um Ihre Vorgabe festzulegen.")
        cs_alert( "warning", __('start_config_first'), "", "OK")
        return;
      }
      // var now = new Date();
      // var sep = File.fs == "Macintosh" ? "/" : "\\";
      // var that = Folder.userData.fsName.split(sep)[2]
      // var ud_path = ensure_path_exists( "cs_octopus", Folder.userData.fullName );
      // var f = new File( ud_path + "/stuff.txt" );
      // f.encoding = "UTF-8";
      // f.open("a")
      // f.writeln( "anzeige" + "\t" + that + "\t" + now.getTime() + "\t" + app.version);
      // f.close();
    

      for (ng = 0; ng < config.optiongroups.length; ng++) {
        var group = config.optiongroups[ng];
        var id = group.id;
        for (var n = 0; n < group.options.length; n++) {
          var option = group.options[n]
          try {
            if ( option.aktiv ) {
              var obj = eval( option.object );
            
              // Extrawürste
              if ( option.id == "activePage") {
                doc.layoutWindows[0].activePage = doc.pages.firstItem();

              } else if ( option.id == "reset_styles" ) {
                doc.textDefaults.appliedParagraphStyle = doc.paragraphStyles[0];
                doc.textDefaults.appliedCharacterStyle = doc.characterStyles[0];
                doc.pageItemDefaults.appliedGraphicObjectStyle = doc.objectStyles[1];
                doc.pageItemDefaults.appliedTextObjectStyle = doc.objectStyles[2];

              } else if ( option.id == "zoom" ) {
                // LayoutWindow.zoom( ZoomOptions.SHOW_PAGE )
                obj[ option.id ]( eval( option.enumerator + "." + option.value ) )

              } else if ( option.id == "showRulers" ) {
                var _m = app.menus.item("$ID/Main"),
                    _v = _m.submenus.item('$ID/&View'),
                    _sr = _v.menuItems.item('$ID/Show &Rulers'),
                    _hr = _v.menuItems.item('$ID/Hide &Rulers');
                if ( ! option.value && _hr.isValid ) {
                  _hr.associatedMenuAction.invoke();
                } else {
                  if ( option.value &&  _sr.isValid ) {
                    _sr.associatedMenuAction.invoke();
                  }
                }
              } else if ( option.id == "showSmartGuides") {
                app.smartGuidePreferences.enabled = option.value;
              
              } else {
                if ( option.type == "enum" ) {
                  obj[ option.id ] = eval( option.enumerator + "." + option.value );

                } else {
                  obj[ option.id ] = option.value;
                }
              }
            }
          } catch (e) {
            msgs.push(id + ", " + option.id + ", " + option.value + ": " + e);
          }
        }
      }
    
    // } catch (e) {
    //   msgs.unshift("----");
    //   msgs.unshift(e);
    // }
    if (msgs.length) {
      //alert("Probleme\n" + msgs.join("\n"));
      cs_alert('vorfahrt', "Problems:\n" + msgs.join("\n"), "", "OK")
    }

  }
}

function __( id ) {
  if ( typeof loc_strings == "undefined" ) loc_strings = load_translation();
  if (loc_strings.hasOwnProperty(id)) {
    return localize(loc_strings[id]);
  } else {
    return id
  }
}
function load_translation() {
  return {
    "start_config_first": {"de": "Starten Sie zuerst das 'Anzeige konfigurieren', um Ihre Einstellungen festzulegen", "en": "Start the config-script once to define your own preferences"}
  }
}



function ensure_path_exists(path, base_path) {
  base_path = unescape(base_path);
  path = path.replace(/^\//, "");
  var bits = path.split("/");
  // Das letzte bit ist der Dateiname
  for (var n = 0; n < bits.length; n++) {
    if (!Folder(base_path + "/" + bits[n]).exists) Folder(base_path + "/" + bits[n]).create();
    base_path += "/" + bits[n];
  }
  return base_path;
}




