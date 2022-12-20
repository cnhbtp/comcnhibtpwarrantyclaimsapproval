sap.ui.define([
    "sap/ui/base/Object",
    "sap/m/MessageBox",
    "sap/ui/core/BusyIndicator"
], function (UI5Object, MessageBox, BusyIndicator) {
    "use strict";

    return UI5Object.extend("com.cnhi.btp.warrantyclaimsapproval.controller.ErrorHandler", {

        /**
        * Handles application errors by automatically attaching to the model events and displaying errors when needed.
        * @class
        * @param {sap.ui.core.UIComponent} oComponent reference to the app's component
        * @public
        * @alias qil.ovp.controller.ErrorHandler
        */
        constructor: function (oComponent) {
            this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
            this._oComponent = oComponent;
            this._oModel = oComponent.getModel();
            this._bMessageOpen = false;
            this._sErrorText = this._oResourceBundle.getText("errorText");

            this._oModel.attachMetadataFailed(function (oEvent) {
                BusyIndicator.hide();
                var oParams = oEvent.getParameters();
                this._showServiceError(oParams.response);
            }, this);

            this._oModel.attachRequestFailed(function (oEvent) {
                BusyIndicator.hide();
                var oParams = oEvent.getParameters();
                var aErrDetails;
                var sRes = oParams.response;
                var sDetails = sRes;
                if(!sRes.headers["Content-Type"] || (sRes.headers["Content-Type"] && sRes.headers["Content-Type"].indexOf('xml') !== -1)){
                    if(sRes && sRes.responseText && jQuery.parseXML(sRes.responseText).getElementsByTagName("message")){
                        sDetails = jQuery.parseXML(sRes.responseText).getElementsByTagName("message")[0].innerHTML;
                    }
                } else {
                    if(sRes && sRes.responseText && JSON.parse(sRes.responseText) && JSON.parse(sRes.responseText).error && JSON.parse(sRes.responseText).error.innererror){
                        aErrDetails = JSON.parse(sRes.responseText).error.innererror.errordetails;
                        if(aErrDetails && aErrDetails.length > 0){
                            if(aErrDetails.length === 1){
                                sDetails = aErrDetails[0].message;       
                            } else {
                                sDetails = aErrDetails.find(function(el){ return el.code === ''}) ? aErrDetails.find(function(el){ return el.code === ''}).message : sDetails;   
                            }                   
                        } else {
                            if(JSON.parse(sRes.responseText).error.message && JSON.parse(sRes.responseText).error.message.value){
                                sDetails = JSON.parse(sRes.responseText).error.message.value;
                            }
                        }
                    }
                }
                this._showServiceError(sDetails);
            }, this);
        },

        /**
        * Shows a {@link sap.m.MessageBox} when a service call has failed.
        * Only the first error message will be display.
        * @param {string} sDetails a technical error to be displayed on request
        * @private
        */
        _showServiceError: function (sDetails) {
            if (this._bMessageOpen) {
                return;
            }
            this._bMessageOpen = true;
            MessageBox.error(this._sErrorText,
                {
                    id: "serviceErrorMessageBox",
                    details: sDetails,
                    actions: [MessageBox.Action.CLOSE],
                    onClose: function () {
                        this._bMessageOpen = false;
                    }.bind(this)
                }
            );
        }

    });

}
);
