sap.ui.define([
        "sap/ui/core/UIComponent",
        "sap/ui/Device",
        "com/cnhi/btp/warrantyclaimsapproval/model/models",
        "./controller/ErrorHandler"
    ],
    function (UIComponent, Device, models, ErrorHandler) {
        "use strict";

        return UIComponent.extend("com.cnhi.btp.warrantyclaimsapproval.Component", {
            metadata: {
                manifest: "json"
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                var me = this;
                me._oErrorHandler = new ErrorHandler(this);
                
                // set the device model
                this.setModel(models.createDeviceModel(), "device");

                //get logged in user info
                this._getLoggedInUserInfo();

                // call the base component's init function
                UIComponent.prototype.init.apply(this, arguments);

                // enable routing
                this.getRouter().initialize();
            },

            _getLoggedInUserInfo: function(){
                var oLocalModel = this.getModel('LocalModel');
                var oStartUpParams = this.getComponentData().startupParameters;
                var sEmailId, sName;
                try {
                    sEmailId = sap.ushell.Container.getService("UserInfo").getEmail();
                    sName = sap.ushell.Container.getService("UserInfo").getFullName();
                    if (!sEmailId) {
                        // sEmailId = "testuser@mindsetconsulting.com";
                        //sName = "Test User";
                        sEmailId = "harikrishnaanatha@mindsetconsulting.com";
                        sName = "Harikrishna Anantha";
                        sEmailId = "abhilashgampa@mindsetconsulting.com";
                        sName = "Abhilash Gampa";
                        //sEmailId = "matthewwhigham@mindsetconsulting.com";
                        //sName = "Matthew Whigham";
                        //sEmailId = "jonathanbragg@mindsetconsulting.com";
                        //sName = "Jonathan Bragg";
                    }
                } catch (error) {
                    sEmailId = "testuser@mindsetconsulting.com";
                    sName = "Test User";
                }
                oLocalModel.setProperty("/LoggedInUserID", sEmailId);
                oLocalModel.setProperty("/LoggedInUserName", sName);
                oLocalModel.setProperty("/IsRequestorLoggedIn", oStartUpParams.Requestor ? true : false);
            }
        });
    }
);