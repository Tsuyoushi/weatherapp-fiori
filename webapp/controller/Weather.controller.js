sap.ui.define([
    "weatherapp/controller/BaseController"
],
    
    function (BaseControler) {
        "use strict";

        return BaseControler.extend("weatherapp.controller.Weather", {
            onInit: function () {
                this._loadLocation();
            },
            
            _loadLocation: async function () {
                let oTes = await this.getServices({
                    q : "q=Brazil",
                    units: "units=metric",
                    lang: "lang=pt"
                })

                console.log(oTes);
            }
        });
    });
