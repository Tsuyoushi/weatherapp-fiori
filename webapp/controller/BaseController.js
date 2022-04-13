sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/m/library",
    "sap/m/Dialog",
    "sap/m/Text",
    "sap/m/Button",
    "sap/ui/core/routing/History",
    "sap/m/MessageBox"
],
    function (Controller, UIComponent, mobileLibrary, Dialog, Text, Button, History, MessageBox) {
        "use strict";
        var ButtonType = mobileLibrary.ButtonType;
        return Controller.extend("weatherapp.controller.BaseController", {


            _onNavBack: function (sPath) {
                var sPreviousHash = History.getInstance().getPreviousHash(),
                    sHistory = sPath;
                // sHistory = Utils.returnNow(sPath);
                if (sPreviousHash === sHistory) {
                    window.history.go(-1);
                } else {
                    sap.ui.core.UIComponent.getRouterFor(this).navTo(sHistory, true);
                }
            },

            getI18n: function (sText) {
                return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(sText);
            },
            getRouter: function () {
                return UIComponent.getRouterFor(this);
            },
            getModel: function (sName) {
                return this.getView().getModel(sName);
            },
            setModel: function (oModel, sName) {
                return this.getView().setModel(oModel, sName);
            },
            setCoreModel: function (oJson, sPath) {
                sap.ui.getCore().setModel(oJson, sPath);
            },
            getCoreModel: function (sPath) {
                return sap.ui.getCore().getModel(sPath);
            },
            getServices: async function (oParams) {
                let oMethodCall, aReturnGet, sParams;

                sParams = this._configParams(oParams);
                oMethodCall = this.callServices(`${sParams}`);

                aReturnGet = await oMethodCall.method('GET')

                return aReturnGet;
            },
            callServices: function (sParams) {
                var oModel = this.getOwnerComponent().getModel();
                var sUrlService = "/weather";

               
                return {
                    method: async (sMethod) => {

                        let oResponse = await fetch(
                            `${sUrlService}?${sParams}`,
                            {
                                method: sMethod.toUpperCase()
                            }
                        ).then((response) => response.text())
                            .catch((err) => err);

                        return JSON.parse(oResponse);
                    }
                }
            },
            _configParams: function (oParams) {
                let sTextReturn, aReturn = [];

                if (!oParams.appid) {
                    aReturn.push("appid=e57aebea803cf85131035e9757a85b2c");
                } // Chave utilizada para API
                if (oParams.q) {
                    aReturn.push(oParams.q)
                }
                if (oParams.lat) {
                    aReturn.push(oParams.lat);
                }
                if (oParams.lon) {
                    aReturn.push(oParams.lon);
                }
                if (oParams.units) {
                    aReturn.push(oParams.units);
                }
                if (oParams.lang) {
                    aReturn.push(oParams.lang);
                }

                sTextReturn = aReturn.join("&");

                return sTextReturn;
            },
            
            onAlterarBusy: function(bState) {
				this.getModel("local").setProperty("/UIControl/busy", bState);
            }


        });

    });