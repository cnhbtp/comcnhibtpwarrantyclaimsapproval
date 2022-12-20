sap.ui.define([
    "./BaseController",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/ui/core/routing/History",
    "sap/ui/model/Sorter",
    "com/cnhi/btp/warrantyclaimsapproval/model/ReqHelper",
    "sap/ui/core/BusyIndicator"
],
    function (BaseController, MessageBox, Filter, FilterOperator, MessageToast, History, Sorter, ReqHelper, BusyIndicator) {
        "use strict";
        var sServiceUrl;
        return BaseController.extend("com.cnhi.btp.warrantyclaimsapproval.controller.Main", {
            
            /* =========================================================== */
            /* lifecycle methods                                           */
            /* =========================================================== */

            /**
             * Called when this controller is instantiated.
             * @public
             */
            onInit: function () {
                sServiceUrl = this.getOwnerComponent().getModel("ClaimApprovalCAP").sServiceUrl;
                this.getRouter().getRoute("main").attachPatternMatched(this._onObjectMatched, this);
            },
            _onObjectMatched: function(oEvent){
                var oLocalModel = this.getModel('LocalModel');
                var bIsRequestor = oLocalModel.getProperty("/IsRequestorLoggedIn");
                
                if(bIsRequestor){
                    var dToday = new Date();
                    if(!oLocalModel.getProperty("/FromDate")){
                        oLocalModel.setProperty("/FromDate", new Date(dToday.setDate(dToday.getDate() - 7)));
                        oLocalModel.setProperty("/ToDate", new Date());
                    }
                    
                    //Call if logged in user is the requestor
                    this._getWarrantyList(bIsRequestor);
                } else {
                    //Call if logged in user is not the requestor
                    this._getClaimsFromCAPM();
                }
            },

            /* =========================================================== */
            /* event handlers                                              */
            /* =========================================================== */
            onRefresh: function(){
                var oLocalModel = this.getModel('LocalModel');
                var bIsRequestor = oLocalModel.getProperty("/IsRequestorLoggedIn");
                if(bIsRequestor){
                    this._getWarrantyList(bIsRequestor);
                } else {
                    //Call if logged in user is not the requestor
                    this._getClaimsFromCAPM();
                }
            },
            
            /**
             * Event handler for table item
             * navigate to detail view
             * @param {sap.ui.base.Event} oEvent item press event
             * @public
             */
            onItemPress: function(oEvent){
                var oSrc = oEvent.getSource();
                var oBindingObj = oSrc.getBindingContext("LocalModel").getObject();
                this.getRouter().navTo("detail",{
                    claim: oBindingObj.Clmno
                });
            },

            onRowsUpdated: function(oEvent){
                var oSrc = oEvent.getSource();
                var oLocalModel = this.getModel('LocalModel');
                var iRows = oSrc.getBinding("rows").iLength;
                oLocalModel.setProperty("/claimTblTitle", this.getResourceBundle().getText("tblTitle",[iRows]));
            },

            onClearSortFilter: function(){
                var oTable = this.getControl('claimsTbl');
                var oBindingRows = oTable.getBinding('rows');
                oBindingRows.filter([]);
                oBindingRows.sort(null);
                this._resetFilterAndSortingState();
            },
            _resetFilterAndSortingState : function() {
                var oTable = this.getControl('claimsTbl');
                var aColumns = oTable.getColumns();
                for (var i = 0; i < aColumns.length; i++) {
                    aColumns[i].setSorted(false);
                    aColumns[i].setFiltered(false);
                }
            },
            
            /* =========================================================== */
            /* internal methods                                            */
            /* =========================================================== */
            _getWarrantyList: function(){
                var that = this;
                var oLocalModel = that.getModel('LocalModel');
                var oDataModel = that.getModel();
                var oDateTimeInstance = sap.ui.core.format.DateFormat.getDateTimeInstance({
                    formatOptions: {UTC:true}
                });
                var oFrmDateYr = oLocalModel.getProperty('/FromDate').getFullYear();
                var oFrmDateMnth = oLocalModel.getProperty('/FromDate').getMonth()+1;
                var oFrmDateDate = oLocalModel.getProperty('/FromDate').getDate();
                var oFrmttdFrmDate = new Date([oFrmDateYr, oFrmDateMnth, oFrmDateDate].join('-'));
                oFrmttdFrmDate.setDate(oFrmttdFrmDate.getDate());

                var aFinal = [], aFilter=[];
                aFilter.push(new Filter({
                    path: "CreateDate",
                    operator: FilterOperator.BT,
                    // value1: new Date(oDateTimeInstance.format(oLocalModel.getProperty('/FromDate'))),
                    // value2: new Date(oDateTimeInstance.format(oLocalModel.getProperty('/ToDate')))
                    value1: oFrmttdFrmDate,
                    value2: oLocalModel.getProperty('/ToDate')
                  }));
                BusyIndicator.show();
                oLocalModel.setProperty("/Results", []);
                oDataModel.read("/WarrantySet",{
                    filters: aFilter,
                    success: function(oData){
                        BusyIndicator.hide();
                        if(oData.results.length > 0){
                            var aUniqueClaims = [...new Set(oData.results.map(function(el){
                                return el.Clmno;
                            }))];
                            for(var i=0; i<aUniqueClaims.length; i++){
                                var aItems = oData.results.filter(function(el){
                                    return el.Clmno === aUniqueClaims[i];
                                });
                                if(aItems.length > 0){
                                    var oHeader = aItems[0];
                                    oHeader.Items = $.extend(true,[],aItems);
                                    oHeader.ActualData = JSON.stringify(aItems[0]);
                                    aFinal.push(oHeader);
                                }
                            }
                            oLocalModel.setProperty("/Results", $.extend(true,[],aFinal));
                            that._getClaimsFromCAPM();
                        }
                    }
                });
            },
            _rebindTable: function(){
                var oSmartTable = this.getControl('claimsSmartTbl');
                if(oSmartTable.isInitialised()){
                    oSmartTable.rebindTable();
                }
            },
            
            _getClaimsFromCAPM: function(){
                var that = this;
                var oLocalModel = this.getModel('LocalModel');
                var bIsRequestor = oLocalModel.getProperty("/IsRequestorLoggedIn");
                var sLoggedInUserID = oLocalModel.getProperty("/LoggedInUserID");
                var aResults = oLocalModel.getProperty("/Results") ? oLocalModel.getProperty("/Results") : [];
                var sUrl = sServiceUrl + "ClaimSet";
                var aFinal = [], oRowObj;
                this.loadBusyIndicator("page", true);
                ReqHelper.sendGetReq(sUrl).then(function (oRes) {
                    that.loadBusyIndicator("page",false);
                    if(oRes.value.length > 0){
                        if(bIsRequestor){
                            for(var i=0; i<aResults.length; i++){
                                var iIdx = oRes.value.findIndex(function(el){
                                    return el.claimNo === aResults[i].Clmno;
                                });
                                aResults[i]['IsRequestor'] = true;
                                aResults[i]['IsApprover'] = false;
                                if(iIdx >= 0){
                                    if(oRes.value[iIdx].statusCode === 'C'){
                                        aResults[i]['nextApprover'] = '';
                                        aResults[i]['currentLevel'] = null;
                                        aResults[i]['NextApprovers'] = [];
                                    
                                        aResults[i]['uistatus'] = that.getResourceBundle().getText("notSubmitted");
                                        aResults[i]['uistatusstate'] = "None";
                                    } else {
                                        aResults[i]['id'] = oRes.value[iIdx].id;
                                        aResults[i]['nextApprover'] = oRes.value[iIdx].nextApprover;
                                        aResults[i]['currentLevel'] = oRes.value[iIdx].currentLevel;
                                        aResults[i]['NextApprovers'] = oRes.value[iIdx].sequence ? oRes.value[iIdx].sequence : [];
                                        aResults[i]['CAPMStatusCode'] = oRes.value[iIdx].statusCode;
                                        aResults[i]['WorkflowStatus'] = oRes.value[iIdx].statusCode === 'A' ? 'Approved' : oRes.value[iIdx].statusCode === 'IP' ? 'Inprogress' : oRes.value[iIdx].statusCode === 'C' ? 'Completed' : oRes.value[iIdx].statusCode === 'R' ? 'Rejected' : 'None';
                                        
                                        if(oRes.value[iIdx].statusCode === 'IP'){
                                            aResults[i]['uistatus'] = that.getResourceBundle().getText("uiStatus",[oRes.value[iIdx].currentLevel]);
                                            aResults[i]['uistatusstate'] = "Warning";
                                        } else if(oRes.value[iIdx].statusCode === 'A'){
                                            aResults[i]['uistatus'] = that.getResourceBundle().getText("claimApproved");
                                            aResults[i]['uistatusstate'] = "Success";
                                        } else if(oRes.value[iIdx].statusCode === 'R'){
                                            aResults[i]['uistatus'] = that.getResourceBundle().getText("claimRejected");
                                            aResults[i]['uistatusstate'] = "Error";
                                        } else {
                                            aResults[i]['uistatus'] = that.getResourceBundle().getText("notSubmitted");
                                            aResults[i]['uistatusstate'] = "None";
                                        }
                                    }
                                    aFinal.push(aResults[i]);
                                } else {
                                    aResults[i]['nextApprover'] = '';
                                    aResults[i]['currentLevel'] = null;
                                    aResults[i]['NextApprovers'] = [];
                                   
                                    aResults[i]['uistatus'] = that.getResourceBundle().getText("notSubmitted");
                                    aResults[i]['uistatusstate'] = "None";
                                    aFinal.push(aResults[i]);
                                }
                            }
                        } else {
                            for(var iIdx=0; iIdx<oRes.value.length; iIdx++){
                                oRowObj = {};
                                if(oRes.value[iIdx].nextApprover === sLoggedInUserID){
                                    oRowObj['id'] = oRes.value[iIdx].id;
                                    oRowObj['nextApprover'] = oRes.value[iIdx].nextApprover;
                                    oRowObj['currentLevel'] = oRes.value[iIdx].currentLevel;
                                    oRowObj['NextApprovers'] = oRes.value[iIdx].sequence ? oRes.value[iIdx].sequence : [];
                                    oRowObj['CAPMStatusCode'] = oRes.value[iIdx].statusCode;
                                    oRowObj['WorkflowStatus'] = oRes.value[iIdx].statusCode === 'A' ? 'Approved' : oRes.value[iIdx].statusCode === 'IP' ? 'Inprogress' : oRes.value[iIdx].statusCode === 'C' ? 'Completed' : oRes.value[iIdx].statusCode === 'R' ? 'Rejected' : 'None';

                                    oRowObj['IsRequestor'] = false;
                                    oRowObj['IsApprover'] = true;
                                    oRowObj['uistatus'] = that.getResourceBundle().getText("uiStatus",[oRes.value[iIdx].currentLevel]);
                                    oRowObj['uistatusstate'] = "Warning";

                                    oRowObj = Object.assign(oRowObj, JSON.parse(oRes.value[iIdx].claimActualData));
                                    oRowObj.CreateDate = typeof oRowObj.CreateDate === 'string' ? new Date(oRowObj.CreateDate) : oRowObj.CreateDate;
                                    oRowObj.FailureDate = typeof oRowObj.FailureDate === 'string' ? new Date(oRowObj.FailureDate) : oRowObj.FailureDate;
                                    oRowObj.RepairStart = typeof oRowObj.RepairStart === 'string' ? new Date(oRowObj.RepairStart) : oRowObj.RepairStart;
                                    oRowObj.RepairEnd = typeof oRowObj.RepairEnd === 'string' ? new Date(oRowObj.RepairEnd) : oRowObj.RepairEnd;
                                    aFinal.push(oRowObj);
                                }
                            }
                        }
                        oLocalModel.setProperty("/Results", $.extend(true,[],aFinal)); 
                    }
                    //that._rebindTable();
                }.bind(this))
                .catch(function (response) {
                    that.loadBusyIndicator("page",false);
                }.bind(this));
            },
            handleChange: function(){

            },
            afterValueHelpClose: function(){
                
            },
            onFilter: function(oEvent){
                var oParams;
            }
        });
    });
