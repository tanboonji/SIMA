app.controller('ContractController', ['$rootScope', '$route', '$routeParams', '$scope', '$location', '$firebaseAuth', '$firebaseObject', 
	'$firebaseArray', function($rootScope, $route, $routeParams, $scope, $location, $firebaseAuth, $firebaseObject, $firebaseArray){
	
	/********************
    ****** General ******
    ********************/
    
    //bootstrap-notify
    //show pop-up notification
    $scope.notify = function(message, type) {
        $.notify({
            message: message
        },{
            placement: {
                from: "top",
                align: "center"
            },
            type: type,
            timer: 2000,
            newest_on_top: true
        });
    };
        
    /*********************
    *** Authentication ***
    *********************/
        
	$scope.auth = $firebaseAuth();
        
	//detect authentication state change (login/logout)
	$scope.auth.$onAuthStateChanged(function(firebaseUser) {
		$scope.firebaseUser = firebaseUser;
		if ($scope.firebaseUser == null) {
			$location.path('/login');
		} else {
            $scope.getUser();
        }
	});
        
    //get user details in rootScope
    $scope.getUser = function() {
        if ($rootScope.user == undefined) {
            firebase.database().ref("staff/" + $scope.firebaseUser.uid).once("value").then(function(snapshot) {
                if (snapshot.val() != null) {
                    $rootScope.user = snapshot.val();
                    if ($rootScope.user.role === "EXCO") {
                        $rootScope.user.isSuperAdmin = false;
                        $rootScope.user.isAdmin = true;
                        $rootScope.user.isBUH = true;
                        $rootScope.user.isTM = true;
                        $rootScope.user.isCM = true;
                    } else if ($rootScope.user.role === "BUH") {
                        $rootScope.user.isSuperAdmin = false;
                        $rootScope.user.isAdmin = false;
                        $rootScope.user.isBUH = true;
                        $rootScope.user.isTM = true;
                        $rootScope.user.isCM = true;
                    } else if ($rootScope.user.role === "TM") {
                        $rootScope.user.isSuperAdmin = false;
                        $rootScope.user.isAdmin = false;
                        $rootScope.user.isBUH = false;
                        $rootScope.user.isTM = true;
                        $rootScope.user.isCM = true;
                    } else if ($rootScope.user.role === "CM") {
                        $rootScope.user.isSuperAdmin = false;
                        $rootScope.user.isAdmin = false;
                        $rootScope.user.isBUH = false;
                        $rootScope.user.isTM = false;
                        $rootScope.user.isCM = true;
                    }
                    $rootScope.user.showName = $rootScope.user.name.toUpperCase();
                    $scope.user = $rootScope.user;
                    $scope.checkRouting(false);
                    $scope.$apply();
                } else {
                    firebase.database().ref("adminstaff/" + $scope.firebaseUser.uid).once("value").then(function(snapshot) {
                        if (snapshot.val() !== null) {
                            $rootScope.user = snapshot.val();
                            if ($rootScope.user.role === "Super Admin") {
                                $rootScope.user.isSuperAdmin = true;
                                $rootScope.user.isAdmin = false;
                                $rootScope.user.isBUH = false;
                                $rootScope.user.isTM = false;
                                $rootScope.user.isCM = false;
                            } else if ($rootScope.user.role === "Admin") {
                                $rootScope.user.isSuperAdmin = false;
                                $rootScope.user.isAdmin = true;
                                $rootScope.user.isBUH = true;
                                $rootScope.user.isTM = true;
                                $rootScope.user.isCM = true;
                            }
                            $rootScope.user.showName = $rootScope.user.name.toUpperCase();
                            $scope.user = $rootScope.user;
                            $scope.checkRouting(false);
                            $scope.$apply();
                        } else {
                            //(#error)database-user-not-found
                            console.log("database-user-not-found");
                            $scope.notify("User cannot be found in database (Error #002)", "danger");
                        }
                    }).catch(function(error) {
                        console.log(error);
                        if (error.code === "PERMISSION_DENIED") {
                            //(#error)firebase-permission-denied
                            $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
                        } else {
                            //(#error)unknown-error
                            $scope.notify("An unknown error has occured (Error #000)", "danger");
                        }
                    });
                }
            }).catch(function(error) {
                console.log(error);
                if (error.code === "PERMISSION_DENIED") {
                    //(#error)firebase-permission-denied
                    $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
                } else {
                    //(#error)unknown-error
                    $scope.notify("An unknown error has occured (Error #000)", "danger");
                }
            });
        } else {
            $scope.user = $rootScope.user;
            $scope.checkRouting(true);
        }
    }; //end of $scope.getUser()
        
    $scope.checkRouting = function(sendAlert) {
        if ($scope.user.isSuperAdmin) {
            if (sendAlert) {
                alert("You do not have permission to view this webpage (contract)");
            }
            $location.path("/admin");
            $route.reload();
        } else {
            if ($scope.user.lastPasswordChange == undefined) {
                $scope.changePasswordReason = "this is your first time logging in and you are still using the default password.";
                $scope.popupform = true;
            } else {
                $scope.loadController();
            }
        }
    };
        
    $scope.logout = function() {
        delete $rootScope.user;
        $scope.auth.$signOut();
    };
        
    /***********************
    **** Email Function ****
    ***********************/
        
    (function(){
        emailjs.init("user_0mk6KgqiS2U166LCZL9om");
    })();
    var service_id = 'gmail';
        
    firebase.database().ref("time").once("value").then(function(snapshot) {
        if (snapshot.val() !== null) {
            var lastReminderDate = snapshot.val();
            $scope.reminderDate = $scope.transformDate(lastReminderDate.toString());
            $scope.$apply();
        } else {
            //(#error)database-user-not-found
            console.log("database-user-not-found");
            $scope.notify("User cannot be found in database (Error #002)", "danger");
        }
    }).catch(function(error) {
        console.log(error);
        if (error.code === "PERMISSION_DENIED") {
            //(#error)firebase-permission-denied
            $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
        } else {
            //(#error)unknown-error
            $scope.notify("An unknown error has occured (Error #000)", "danger");
        }
    });
        
    $scope.sendReminder = function() {
        
        var newDate = new Date();
        
        firebase.database().ref("time").once("value").then(function(snapshot) {
            if (snapshot.val() !== null) {
                var lastReminderDate = snapshot.val().substr(0,8);
                var currentFullDay = newDate.newFullDay();
                
                    console.log(lastReminderDate);
                    console.log(currentFullDay);
                
                if (lastReminderDate < currentFullDay) {
                    console.log("here");
                    
                    angular.forEach($scope.contractList, function(contractValue, contractKey){
                        if (contractValue.status === "Existing") {

                            var currentYear = newDate.newYearNow();
                            var currentMonth = newDate.newMonthNow();
                            var currentDay = newDate.newDayNow();
                            var contractYear = contractValue.expiryDate.toString().substr(0,4);
                            var contractMonth = contractValue.expiryDate.toString().substr(4,2);
                            var contractDay = contractValue.expiryDate.toString().substr(6,2);

                            if ((contractYear - currentYear) == 0) {
                                var monthDiff = contractMonth - currentMonth;
                                if (monthDiff == 1) {

                                    var expiry_params = {
                                        "to_name": contractValue.CMName,
                                        "send_email": contractValue.CMEmail,
                                        "expiry_date": contractValue.showExpiryDate,
                                        "project_name": contractValue.projectName,
                                        "contract_name": contractValue.name
                                    };

                                    emailjs.send(service_id, 'contract_expiry_template', expiry_params)
                                        .then(function (response) {
                                            console.log("SUCCESS. status=%d, text=%s", response.status, response.text);
                                        }, function (err) {
                                            console.log("FAILED. error=", err);
                                        });

                                } else if (monthDiff == 0) {
                                    var dayDiff = contractDay - currentDay;
                                    if (dayDiff == 0) {

                                        var expiry_params = {
                                            "to_name": contractValue.CMName,
                                            "send_email": contractValue.CMEmail,
                                            "expiry_date": contractValue.showExpiryDate,
                                            "project_name": contractValue.projectName,
                                            "contract_name": contractValue.name
                                        };

                                        emailjs.send(service_id, 'contract_expiry_template', expiry_params)
                                            .then(function (response) {
                                                console.log("SUCCESS. status=%d, text=%s", response.status, response.text);
                                            }, function (err) {
                                                console.log("FAILED. error=", err);
                                            });

                                    } else if (dayDiff < 0) {

                                        var expiry_params = {
                                            "to_name": contractValue.CMName,
                                            "send_email": contractValue.CMEmail,
                                            "expiry_date": contractValue.showExpiryDate,
                                            "project_name": contractValue.projectName,
                                            "contract_name": contractValue.name
                                        };

                                        emailjs.send(service_id, 'contract_expiry_template', expiry_params)
                                            .then(function (response) {
                                                console.log("SUCCESS. status=%d, text=%s", response.status, response.text);
                                            }, function (err) {
                                                console.log("FAILED. error=", err);
                                            });


                                    } else {

                                        var expiry_params = {
                                            "to_name": contractValue.CMName,
                                            "send_email": contractValue.CMEmail,
                                            "expiry_date": contractValue.showExpiryDate,
                                            "project_name": contractValue.projectName,
                                            "contract_name": contractValue.name
                                        };

                                        emailjs.send(service_id, 'contract_expiry_template', expiry_params)
                                            .then(function (response) {
                                                console.log("SUCCESS. status=%d, text=%s", response.status, response.text);
                                            }, function (err) {
                                                console.log("FAILED. error=", err);
                                            });

                                    }
                                } else if (monthDiff <= 3) {

                                    var expiry_params = {
                                        "to_name": contractValue.CMName,
                                        "send_email": contractValue.CMEmail,
                                        "expiry_date": contractValue.showExpiryDate,
                                        "project_name": contractValue.projectName,
                                        "contract_name": contractValue.name
                                    };

                                    emailjs.send(service_id, 'contract_expiry_template', expiry_params)
                                        .then(function (response) {
                                            console.log("SUCCESS. status=%d, text=%s", response.status, response.text);
                                        }, function (err) {
                                            console.log("FAILED. error=", err);
                                        });

                                }
                            }

                        }
                    });
                } else {
                    console.log("herehere");
                }
                
                var fullDateTime = newDate.newFullDateTime();
                
                firebase.database().ref('time').set(''+fullDateTime).then(function () {

                }).catch(function(error) {
                    console.log(error);
                    if (error.code === "PERMISSION_DENIED") {
                        //(#error)firebase-permission-denied
                        $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
                    } else {
                        //(#error)unknown-error
                        $scope.notify("An unknown error has occured (Error #000)", "danger");
                    }
                });
            } else {
                //(#error)database-user-not-found
                console.log("database-user-not-found");
                $scope.notify("User cannot be found in database (Error #002)", "danger");
            }
        }).catch(function(error) {
            console.log(error);
            if (error.code === "PERMISSION_DENIED") {
                //(#error)firebase-permission-denied
                $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
            } else {
                //(#error)unknown-error
                $scope.notify("An unknown error has occured (Error #000)", "danger");
            }
        });
    };

//    var expiry_params = {
//        "to_name": name,
//        "send_email": send_email,
//        "expiry_date": "10 Dec 2016",
//        "project_name": "Heights Condominum"
//    };
//
//    $scope.sendExpiry = function() {
//        emailjs.send(service_id, 'expiry_template', expiry_params)
//            .then(function (response) {
//                console.log("SUCCESS. status=%d, text=%s", response.status, response.text);
//            }, function (err) {
//                console.log("FAILED. error=", err);
//            });
//    }
//
//    var facility_params = {
//        "to_name": name,
//        "send_email": send_email,
//        "frequency_type": "Weekly",
//        "project_name": "Heights Condominum"
//    };
//
//    $scope.sendFacility = function() {
//        emailjs.send(service_id, 'reminder_email', facility_params)
//            .then(function (response) {
//                console.log("SUCCESS. status=%d, text=%s", response.status, response.text);
//            }, function (err) {
//                console.log("FAILED. error=", err);
//            });
//    }
        
    /*********************
    *** Password Popup ***
    *********************/
    
    $scope.closePopup = function() {
        $scope.popupform = false;
    };
        
    $scope.openPopup = function($event) {
        $event.stopPropagation();
    };
        
    //update password of currently logged in user
    $scope.updatePassword = function () {
        if ($scope.newPassword == undefined || $scope.newPassword == "") {
            $scope.passwordEmpty = true;
            $scope.passwordLength = false;
            $scope.passwordComplex = false;
            
            $scope.passwordMatch = false;
            $scope.pwdEmpty1 = true;
        } else {
            if ($scope.newPassword.length < 8) {
                $scope.passwordEmpty = false;
                $scope.passwordLength = true;
                $scope.passwordComplex = false;
                
                $scope.passwordMatch = false;
                $scope.pwdEmpty1 = true;
            } else if (!/[A-z]/.test($scope.newPassword) || !/\d/.test($scope.newPassword)) {
                $scope.passwordEmpty = false;
                $scope.passwordLength = false;
                $scope.passwordComplex = true;
                
                $scope.passwordMatch = false;
                $scope.pwdEmpty1 = true;
            } else {
                $scope.passwordEmpty = false;
                $scope.passwordLength = false;
                $scope.passwordComplex = false;

                $scope.passwordMatch = false;
                $scope.pwdEmpty1 = false;
            }
        }
        
        if ($scope.confirmPassword == undefined || $scope.confirmPassword == "") {
            $scope.passwordEmpty2 = true;
            $scope.passwordLength2 = false;
            $scope.passwordComplex2 = false;
            
            $scope.passwordMatch = false;
            $scope.pwdEmpty2 = true;
        } else {
            if ($scope.confirmPassword.length < 8) {
                $scope.passwordEmpty2 = false;
                $scope.passwordLength2 = true;
                $scope.passwordComplex2 = false;
                
                $scope.passwordMatch = false;
                $scope.pwdEmpty2 = true;
            } else if (!/[A-z]/.test($scope.confirmPassword) || !/\d/.test($scope.confirmPassword)) {
                $scope.passwordEmpty2 = false;
                $scope.passwordLength2 = false;
                $scope.passwordComplex2 = true;
                
                $scope.passwordMatch = false;
                $scope.pwdEmpty2 = true;
            } else {
                $scope.passwordEmpty2 = false;
                $scope.passwordLength2 = false;
                $scope.passwordComplex2 = false;

                $scope.passwordMatch = false;
                $scope.pwdEmpty2 = false;
            }
        }
        
        if ($scope.pwdEmpty2 === false) {
            if ($scope.confirmPassword !== $scope.newPassword) {
//                $scope.passwordEmpty = false;
//                $scope.passwordLength = false;
//                $scope.passwordComplex = false;

                $scope.passwordEmpty2 = false;
                $scope.passwordLength2 = false;
                $scope.passwordComplex2 = false;

                $scope.passwordMatch = true;
                $scope.pwdEmpty2 = true;
                $scope.pwdEmpty1 = true;
            }
        }

        if ($scope.pwdEmpty1 === false && $scope.pwdEmpty2 === false) {
            //if confirm password field is identical, update password
            $scope.auth.$updatePassword($scope.newPassword).then(function () {
                var newDate = new Date();
                var datetime = newDate.dayNow() + " @ " + newDate.timeNow();
                var updates = {};
                
                firebase.database().ref('adminstaff/' + $scope.user.authID).once('value').then(function (snapshot, error) {
                    if (snapshot.val() != null) {
                        updates["/adminstaff/" + $scope.user.authID + '/lastPasswordChange'] = datetime;
                        firebase.database().ref().update(updates);
                    } else {
                        updates["/staff/" + $scope.user.authID + '/lastPasswordChange'] = datetime;
                        firebase.database().ref().update(updates);
                    }
                });
                $scope.popupform = !$scope.popupform;
                alert("You have successfully updated your password\n\nPlease login again\n");
                $scope.auth.$signOut();
            }).catch(function (error) {
                console.log(error);
                if (error.code === "auth/requires-recent-login") {
                    //(#error)auth-requires-recent-login
                    alert(error);
                    $scope.auth.$signOut();
                } else if (error.code === "auth/email-already-in-use")
                    //(#error)auth-email-already-in-use
                    alert(error);
                else
                    //(#error)unknown-auth-error
                    $scope.notify("An unknown error has occured (Error #200)", "danger");
            });
        }
    }; //end of $scope.updatePassword()
    
    /*********************
    ******** Date ********
    *********************/
    
    
    //get current date in yyyy/mm/dd format
    Date.prototype.dayNow = function () { 
        return (this.getFullYear() + "/" + (((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1) + "/" + 
            ((this.getDate() < 10)?"0":"") + this.getDate());
    }

    //get current date in yyyymmdd format
    Date.prototype.newFullDay = function () { 
        return (this.getFullYear() + (((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1) + 
                ((this.getDate() < 10)?"0":"") + this.getDate());
    };
        
        
    //get date and time in yyyymmdd hhmm format
    Date.prototype.newFullDateTime = function () { 
        return (this.getFullYear() + (((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1) + 
            ((this.getDate() < 10)?"0":"") + this.getDate() + " " + ((this.getHours() < 10)?"0":"") + this.getHours() + ((this.getMinutes() < 10)?"0":"") + 
            this.getMinutes());
    };

   //get current day in dd format
   Date.prototype.newDayNow = function () { 
       return (((this.getDate() < 10)?"0":"") + this.getDate());
   };

   //get current month in mm format
   Date.prototype.newMonthNow = function () { 
       return ((((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1));
   };

   //get current year in yyyy format
   Date.prototype.newYearNow = function () { 
       return (this.getFullYear());
   };
    
    //get current time in hh:mm:ss format
    Date.prototype.timeNow = function () {
        return ((this.getHours() < 10)?"0":"") + this.getHours() + ":" + ((this.getMinutes() < 10)?"0":"") + 
            this.getMinutes() + ":" + ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
    }
    
    /********************
    ** Search & Filter **
    ********************/
        
    $scope.sortByOrderList = ['Ascending','Descending'];
    $scope.sortByOrderItem = 'Ascending';
    
    $scope.sortByOrderItemSelected = function(itemSelected) {
        $scope.sortByOrderItem = itemSelected;
        if (itemSelected === "Ascending") {
            $scope.contractList.sort(function(a,b) {
                a = a.expiryDate;
                b = b.expiryDate;
                return a > b ? 1 : a < b ? -1 : 0;
            });
        } else if (itemSelected === "Descending") {
            $scope.contractList.sort(function(a,b) {
                a = a.expiryDate;
                b = b.expiryDate;
                return a > b ? -1 : a < b ? 1 : 0;
            });
        }
    };
        
    $scope.search = function(c) {
        return (angular.lowercase(c.name).indexOf(angular.lowercase($scope.query) || '') !== -1 ||
                angular.lowercase(c.MCSTS).toString().indexOf(angular.lowercase($scope.query) || '') !== -1 ||
                angular.lowercase(c.type).indexOf(angular.lowercase($scope.query) || '') !== -1);
    };
    
//    $scope.userrole = function(r) {
//        if ($scope.user.isAdmin)
//            return true;
//        else if (r.CMName === $scope.user.name || r.TMName === $scope.user.name || r.BUHName === $scope.user.name)
//            return true;
//        else
//            return false;
//    };
        
    $scope.sortByStatusList = ['Existing','Expired'];
    $scope.sortByStatusItem = 'Existing';
        
    $scope.sortByStatusItemSelected = function(itemSelected) {
        $scope.sortByStatusItem = itemSelected;
    };
    
    $scope.isexpired = function(c) {
        if ($scope.sortByStatusItem === 'Existing')
            return (c.status === 'Existing');
        else if ($scope.sortByStatusItem === 'Expired')
            return (c.status === 'Expired');
        else
            return false;
    }
        
    /*********************
    *** Dashboard List ***
    *********************/
        
    $scope.transformDate = function(date) {
        var year = date.substr(0,4);
        var month = date.substr(4,2);
        var day = date.substr(6,2);
        var inspectionDate = day + "/" + month + "/" + year;
        return inspectionDate;
    };
    
    $scope.loadController = function() {

        var ref = firebase.database().ref().child("contract");
        
        $scope.refreshContractList = function() {
            firebase.database().ref('contract').once('value').then(function (contractSnapshot, error) {
                firebase.database().ref('project').once('value').then(function (projectSnapshot, error) {
                    firebase.database().ref('staff').once('value').then(function (staffSnapshot, error) {
                        var tempList = [];
                        angular.forEach(contractSnapshot.val().existing, function(projectValue, projectKey) {
                            angular.forEach(projectValue, function(contractValue, contractKey) {
                                console.log(contractValue);
                                var temp = contractValue;
                                temp.projectID = projectKey;
                                temp.contractID = contractKey;
                                temp.status = 'Existing';

                                var newDate = new Date();
                                var currentYear = newDate.newYearNow();
                                var currentMonth = newDate.newMonthNow();
                                var currentDay = newDate.newDayNow();
                                var contractYear = contractValue.expiryDate.toString().substr(0,4);
                                var contractMonth = contractValue.expiryDate.toString().substr(4,2);
                                var contractDay = contractValue.expiryDate.toString().substr(6,2);

                                if ((contractYear - currentYear) == 0) {
                                    var monthDiff = contractMonth - currentMonth;
                                    if (monthDiff == 1) {
                                        temp.remarks = "Expiring in " + monthDiff + " month";
                                    } else if (monthDiff == 0) {
                                        var dayDiff = contractDay - currentDay;
                                        if (dayDiff == 0) {
                                            temp.remarks = "Expiring today"
                                        } else if (dayDiff < 0) {
                                            dayDiff = currentDay - contractDay;
                                            temp.remarks = "Expired " + dayDiff + " days ago";
                                            temp.hasIssue = true;
                                        } else {
                                            temp.remarks = "Expiring in " + dayDiff + " days";
                                        }
                                    } else if (monthDiff <= 3) {
                                        temp.remarks = "Expiring in " + monthDiff + " months";
                                    }
                                }

                                tempList.push(temp);
                            });
                        });
                        angular.forEach(contractSnapshot.val().expired, function(projectValue, projectKey) {
                            angular.forEach(projectValue, function(contractValue, contractKey) {
                                var temp = contractValue;
                                temp.projectID = projectKey;
                                temp.contractID = contractKey;
                                temp.status = 'Expired';
                                tempList.push(temp);
                            });
                        });
                        $scope.contractList = tempList;
                        tempList = [];
                    
                    console.log($scope.contractList);
                    
                        angular.forEach(staffSnapshot.val(), function(staffValue, staffKey) {
                            tempList.push(staffValue);
                        });
                        $scope.staffList = tempList;
                    
                       angular.forEach($scope.contractList, function(contractValue, contractkey) {

                           contractValue.MCSTS = projectSnapshot.val()[contractValue.projectID].MCSTS;
                           contractValue.projectName = projectSnapshot.val()[contractValue.projectID].name;
                           contractValue.showExpiryDate = $scope.transformDate(contractValue.expiryDate.toString());
                           contractValue.BUH = projectSnapshot.val()[contractValue.projectID].BUH;
                           contractValue.TM = projectSnapshot.val()[contractValue.projectID].TM;
                           contractValue.CM = projectSnapshot.val()[contractValue.projectID].CM;
                           var index = $scope.staffList.map(function(x) {return x.ID}).indexOf(contractValue.BUH);
                           contractValue.BUHName = $scope.staffList[index].name;
                           contractValue.BUHEmail = $scope.staffList[index].email;
                           var index = $scope.staffList.map(function(x) {return x.ID}).indexOf(contractValue.TM);
                           contractValue.TMName = $scope.staffList[index].name;
                           contractValue.TMEmail = $scope.staffList[index].email;
                           var index = $scope.staffList.map(function(x) {return x.ID}).indexOf(contractValue.CM);
                           contractValue.CMName = $scope.staffList[index].name;
                           contractValue.CMEmail = $scope.staffList[index].email;

                           // recordValue.inspectionDate = $scope.transformDate(recordValue.date);
                           // var projectID = recordValue.projectID;
                           // recordValue.MCSTS = projectSnapshot.val()[projectID].MCSTS;
                           // if (recordValue.MCSTS === "" || recordValue.MCSTS === undefined)
                           //     recordValue.MCSTS = "-";
                           // recordValue.name = projectSnapshot.val()[projectID].name;
                           // recordValue.BUH = recordValue.details.BUH;
                           // recordValue.TM = recordValue.details.TM;
                           // recordValue.CM = recordValue.details.CM;
                           // var index = $scope.staffList.map(function(x) {return x.ID}).indexOf(recordValue.BUH);
                           // recordValue.BUHName = $scope.staffList[index].name;
                           // var index = $scope.staffList.map(function(x) {return x.ID}).indexOf(recordValue.TM);
                           // recordValue.TMName = $scope.staffList[index].name;
                           // var index = $scope.staffList.map(function(x) {return x.ID}).indexOf(recordValue.CM);
                           // recordValue.CMName = $scope.staffList[index].name;
                           // recordValue.issueCount = 0;
                           // angular.forEach(recordValue.projectFacility, function(projectFacilityValue, projectFacilitykey) {
                           //     var categoryCount = -1;
                           //     angular.forEach(projectFacilityValue.category, function(categoryValue, categorykey) {
                           //         categoryCount++;
                           //         categoryValue.formID = categoryCount;
                           //         categoryValue.no = categoryCount+1;
                           //         categoryValue.ID = categorykey;
                           //         var questionCount = -1;
                           //         angular.forEach(categoryValue.question, function(questionValue, questionkey) {
                           //             questionCount++;
                           //             questionValue.formID = questionCount;
                           //             var questionNo = 'abcdefghijklmnopqrstuvwxyz'[questionCount];
                           //             questionValue.no = questionNo;
                           //             questionValue.ID = questionkey;
                           //             if (questionValue.answer === "no" || questionValue.comments.toLowerCase().includes("#issue")) {
                           //                 recordValue.issueCount++;
                           //             }
                           //             switch (questionValue.answer) {
                           //                 case "no":
                           //                     questionValue.isNo = true;
                           //                     break;
                           //                 case "na":
                           //                     questionValue.isNA = true;
                           //                     break;
                           //                 case "yes":
                           //                     questionValue.isYes = true;
                           //                     break;
                           //                 default:
                           //                     break;
                           //             }
                           //             if (questionValue.comments !== "" && questionValue.comments !== undefined)
                           //                 questionValue.hasComment = true;
                           //             if (questionValue.type === "MCQ")
                           //                 questionValue.isMCQ = true;
                           //             if (questionValue.image !== "")
                           //                 questionValue.hasImage = true;
                           //         });
                           //     });
                           // });
                           // if (recordValue.issueCount === 0)
                           //     recordValue.hasIssue = false;
                           // else
                           //     recordValue.hasIssue = true;
                       });
                    
                        $scope.contractList.sort(function(a,b) {
                            a = a.expiryDate;
                            b = b.expiryDate;
                            return a > b ? 1 : a < b ? -1 : 0;
                        });
                        $scope.$apply();
                    }).catch(function(error) {
                        console.log(error);
                        if (error.code === "PERMISSION_DENIED") {
                            //(#error)firebase-permission-denied
                            $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
                        } else {
                            //(#error)unknown-error
                            $scope.notify("An unknown error has occured (Error #000)", "danger");
                        }
                    });
                }).catch(function(error) {
                    console.log(error);
                    if (error.code === "PERMISSION_DENIED") {
                        //(#error)firebase-permission-denied
                        $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
                    } else {
                        //(#error)unknown-error
                        $scope.notify("An unknown error has occured (Error #000)", "danger");
                    }
                });
            }).catch(function(error) {
                console.log(error);
                if (error.code === "PERMISSION_DENIED") {
                    //(#error)firebase-permission-denied
                    $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
                } else {
                    //(#error)unknown-error
                    $scope.notify("An unknown error has occured (Error #000)", "danger");
                }
            });
        }; //end of $scope.refreshRecordList()
        
        ref.on('value', function() {
            $scope.refreshContractList();
        });
    }; //end of $scope.loadController()
        
    /*********************
    *** Dashboard View ***
    *********************/
    
//    $scope.overlay = false;
//    
//    $scope.closeOverlay = function() {
//        $scope.overlay = false;
//    };
//        
//    $scope.openOverlay = function($event) {
//        $event.stopPropagation();
//    };
//    
//    $scope.showChecklist = function() {
//        $scope.checklistShow = !$scope.checklistShow;
//    };
//        
//    $scope.viewRecord = function(record) {
//        $scope.checklistShow = false;
//        $scope.overlay = true;
//        $scope.record = record;
//        
//        $scope.record.fullBUH = "(" + $scope.record.BUH + ") " + $scope.record.BUHName;
//        $scope.record.fullTM = "(" + $scope.record.TM + ") " + $scope.record.TMName;
//        $scope.record.fullCM = "(" + $scope.record.CM + ") " + $scope.record.CMName;
//    };
    
}]);