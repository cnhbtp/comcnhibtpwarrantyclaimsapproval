sap.ui.define([],

    function () {
        return {
            sendGetReq: function (url) {
                return new Promise(function (resolve, reject) {
                    $.get({
                        url: url,
                        success: function (data) {
                            resolve(data);
                        },
                        error: function (data) {
                            reject(data);
                        }
                    });


                })
            },

            sendUpdateReq: function (url, data) {
                return new Promise(function (resolve, reject) {
                    $.post({
                        type: "PATCH",
                        url: url,
                        contentType: "application/json",
                        data: JSON.stringify(data),
                        async: true,
                        success: function (response) {
                            resolve(response);
                        }.bind(this),
                        error: function (response) {
                            reject(response);
                        }
                    });
                })
            },

            sendCreateReq: function (url, data) {
                return new Promise(function (resolve, reject) {
                    $.post({
                        type: "POST",
                        url: url,
                        contentType: "application/json",
                        data: JSON.stringify(data),
                        async: true,
                        success: function (response) {
                            resolve(response);
                        }.bind(this),
                        error: function (response) {
                            reject(response);
                        }
                    });
                })
            },

            sendDeleteReq: function (url) {
                return new Promise(function (resolve, reject) {
                    $.post({
                        type: "DELETE",
                        url: url,
                        success: function (response) {
                            resolve(response);
                        }.bind(this),
                        error: function (response) {
                            reject(response);
                        }
                    });
                })
            }
        }

    })