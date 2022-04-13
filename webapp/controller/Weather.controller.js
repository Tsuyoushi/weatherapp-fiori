sap.ui.define([
    "weatherapp/controller/BaseController",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment"
],
    
    function (BaseControler , MessageBox, JSONModel , Fragment) {
        "use strict";

        return BaseControler.extend("weatherapp.controller.Weather", {
            onInit: function () {
                this._loadLocalJSON();
                this._loadLocation();
            },

            _loadLocalJSON: function () {
                this.oViewModel = new JSONModel({
					UIControl: {
						busy: true
					},
                    HeaderWeather: {
                        nameCity: '...',
                        degreeCels: '-'
                    }
				});

                this.setModel(this.oViewModel, "local");	
            },
            
            _loadLocation: function () {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition((position) => {
                        this._loadPosition(position)
                    });
                }
                else {
                    MessageBox.error(this.getI18n("erroInterno"));
                }
            },

            _loadPosition: async function (position) {
                try {
                    let oResponseWeatherLocation = await this.getServices({
                        lat : `lat=${position.coords.latitude}`,
                        lon: `lon=${position.coords.longitude}`,
                        units: "units=metric",
                        lang: "lang=pt"
                    })

                    let oHeaderWeather = {
                        nameCity: oResponseWeatherLocation.name,
                        degreeCels: oResponseWeatherLocation.main.temp,
                        country: oResponseWeatherLocation.sys.country,
                        humidity: oResponseWeatherLocation.main.humidity,
                        feelsLike: oResponseWeatherLocation.main.feels_like 
                    }

                    if (oResponseWeatherLocation.weather.length !== 0) {
                        oHeaderWeather.descriptionWeather = oResponseWeatherLocation.weather[0].description 
                    }

                    this.oViewModel.setProperty("/HeaderWeather", oHeaderWeather)

                    this.onAlterarBusy(false);
                } catch (e) {
					try {
						var strMsg = JSON.parse(e.responseText);
						MessageBox.error(strMsg.error.message.value);
					} catch (errorServer) {
						MessageBox.error(this.getI18n("erroInterno"));
					}
				}
            },

            onPressPopoverInfo: function(oEvent) {
                var oView = this.getView(),
				oSourceControl = oEvent.getSource();

                if (!this._pPopover) {
                    this._pPopover = Fragment.load({
                        id: oView.getId(),
                        name: "weatherapp.view.fragment.CardWeatherDetail"
                    }).then(function (oPopover) {
                        oView.addDependent(oPopover);
                        return oPopover;
                    });
                }

                this._pPopover.then(function (oPopover) {
                    oPopover.openBy(oSourceControl);
                });
            }
        });
    });
