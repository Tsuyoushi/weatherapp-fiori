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
                //Carregar a localização atual pela Latitude e Longitude
                this._loadLocation();
                //Carregar a lista das cidades do Brasil - Ainda não implementado
                //Carregar Content Card
                this._configManifestCard();
            },

            _loadLocalJSON: function () {
                this.oViewModel = new JSONModel({
					UIControl: {
						busy: true
					},
                    HeaderWeather: {
                        nameCity: '...',
                        degreeCels: '-'
                    },
                    CityWeather: {},
                    LastAttDate: undefined
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

            _configManifestCard: function () {
                let oModelExist = this.getModel("manifests");

				if (!oModelExist) {
					let oCardManifests = new JSONModel();

					oCardManifests.loadData(sap.ui.require.toUrl("weatherapp/model/cardManifest.json"));

					this.setModel(oCardManifests, "manifests");
					
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
            },

            onSearch: function (oEvent) {
				var aFilters = [];
				var aFiltersInput = oEvent.getParameter("selectionSet");
				aFiltersInput.map( (oInput) => {
					
					if (oInput.getName() === 'Cidade') {
						if (oInput.getValue()) {
                            this._loadWeatherCity(oInput.getValue());
                        }
					}
				});
			},

            onChangeCity: function (oEvent) {
                let sValue = oEvent.getParameter("value");

                if (sValue) {
                    this._loadWeatherCity(sValue);
                }
            },

            _loadWeatherCity: async function (sValue) {
                this.onAlterarBusy(true);
                try {
                    let oModelExist = this.getModel("manifests");
                    let sPropertyRec = "/stackedReward/sap.card/header";

                    let oResponseWeatherLocation = await this.getServices({
                        q: `q=${sValue}`,
                        units: "units=metric",
                        lang: "lang=pt"
                    })
                    if (oResponseWeatherLocation.cod === 200) {
                        let oCityWeather = {
                            nameCity: oResponseWeatherLocation.name,
                            degreeCels: oResponseWeatherLocation.main.temp,
                            country: oResponseWeatherLocation.sys.country,
                            humidity: oResponseWeatherLocation.main.humidity,
                            feelsLike: oResponseWeatherLocation.main.feels_like,
                            speedWind: oResponseWeatherLocation.wind.speed
                        }
    
                        if (oResponseWeatherLocation.weather.length !== 0) {
                            oCityWeather.descriptionWeather = oResponseWeatherLocation.weather[0].description
                            oCityWeather.icon = oResponseWeatherLocation.weather[0].icon
                        }
    
                        let oCardKPI = this.byId("cardKPI");
    
                        oModelExist.setProperty(sPropertyRec + "/title", oCityWeather.nameCity);
                        oModelExist.setProperty(sPropertyRec + "/subTitle", `${oCityWeather.descriptionWeather} | ${oCityWeather.country}`);
                        oModelExist.setProperty(sPropertyRec + "/data/json/n", oCityWeather.degreeCels);
                        oModelExist.setProperty(sPropertyRec + "/data/json/state", "Information");//Critical, Error, Good, Neutral
                        oModelExist.setProperty(sPropertyRec + "/data/json/feelsLike", oCityWeather.feelsLike);
                        oModelExist.setProperty(sPropertyRec + "/data/json/speedWind", oCityWeather.speedWind);
                        oModelExist.setProperty(sPropertyRec + "/data/json/humidity", oCityWeather.humidity);
                        oModelExist.setProperty("/iconWeather", oCityWeather.icon);
    
                        oCardKPI.refresh();
    
                        this.oViewModel.setProperty("/CityWeather", oCityWeather)
                        this._lastLoaded(oModelExist, sPropertyRec); //Atualizar a ultima data
    
                        this.onAlterarBusy(false);
                    } else {
                        if (oResponseWeatherLocation.message) {
                            MessageBox.error(oResponseWeatherLocation.message);
                            this.onAlterarBusy(false);
                        } else {
                            MessageBox.error(this.getI18n("erroInterno"));
                        }
                    }
                } catch (e) {
					try {
						var strMsg = JSON.parse(e.responseText);
						MessageBox.error(strMsg.error.message.value);
                        this.onAlterarBusy(false);
					} catch (errorServer) {
						MessageBox.error(this.getI18n("erroInterno"));
					}
				}
            },

            _lastLoaded: function (oModelExist, sPropertyRec) {
                this.oViewModel.setProperty("/LastAttDate", new Date());
                oModelExist.setProperty(sPropertyRec + "/data/json/details", new Date().toLocaleString());
            }
        });
    });
