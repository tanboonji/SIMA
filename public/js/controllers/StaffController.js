app.controller('StaffController', ['$route', '$rootScope', '$routeParams', '$scope', '$location', '$firebaseAuth', '$firebaseObject', 
	'$firebaseArray', function($route, $rootScope, $routeParams, $scope, $location, $firebaseAuth, $firebaseObject, $firebaseArray){
	
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
        
    //current user authentication object
	$scope.auth = $firebaseAuth(primaryApp.auth());
    //authentication object to create users
    $scope.authObj = $firebaseAuth(secondaryApp.auth());
    
    //detech authentication state change (login/logout)
	$scope.auth.$onAuthStateChanged(function(firebaseUser) {
		$scope.firebaseUser = firebaseUser;
		if ($scope.firebaseUser === null) {
			$location.path('/login').search("staffID",null).search("edit",null).search("add",null);
		} else {
            $scope.checkUser();
        }
	});
        
    //get user details in rootScope
    $scope.checkUser = function() {
        if ($rootScope.user === undefined) {
            firebase.database().ref("staff/" + $scope.firebaseUser.uid).once("value").then(function(snapshot) {
                if (snapshot.val() !== null) {
                    $rootScope.user = snapshot.val();
                    if ($rootScope.user.role === "HO") {
                        $rootScope.user.isAdmin = true;
                        $rootScope.user.isBUH = true;
                        $rootScope.user.isTM = true;
                        $rootScope.user.isCM = true;
                    } else if ($rootScope.user.role === "BUH") {
                        $rootScope.user.isAdmin = false;
                        $rootScope.user.isBUH = true;
                        $rootScope.user.isTM = true;
                        $rootScope.user.isCM = true;
                    } else if ($rootScope.user.role === "TM") {
                        $rootScope.user.isAdmin = false;
                        $rootScope.user.isBUH = false;
                        $rootScope.user.isTM = true;
                        $rootScope.user.isCM = true;
                    } else if ($rootScope.user.role === "CM") {
                        $rootScope.user.isAdmin = false;
                        $rootScope.user.isBUH = false;
                        $rootScope.user.isTM = false;
                        $rootScope.user.isCM = true;
                    }
                    $rootScope.user.showName = $rootScope.user.name.toUpperCase();
                    $scope.user = $rootScope.user;
                    $scope.checkSoftRouting();
                    $scope.$apply();
                } else {
                    firebase.database().ref("adminstaff/" + $scope.firebaseUser.uid).once("value").then(function(snapshot) {
                        if (snapshot.val() !== null) {
                            $rootScope.user = snapshot.val();
                            firebase.database().ref("admin/" + $rootScope.user.authID + "/isSuperAdmin").once("value").then(function(snapshot) {
                                if (snapshot.val()) {
                                    $rootScope.user.isSuperAdmin = true;
                                    $rootScope.user.isAdmin = false;
                                    $rootScope.user.isBUH = false;
                                    $rootScope.user.isTM = false;
                                    $rootScope.user.isCM = false;
                                } else {
                                    $rootScope.user.isSuperAdmin = false;
                                    $rootScope.user.isAdmin = true;
                                    $rootScope.user.isBUH = true;
                                    $rootScope.user.isTM = true;
                                    $rootScope.user.isCM = true;
                                }
                                $rootScope.user.showName = $rootScope.user.name.toUpperCase();
                                $scope.user = $rootScope.user;
                                $scope.checkSoftRouting();
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
                            //(#error)database-user-not-found
                            console.log("database-user-not-found");
                            $scope.notify("User cannot be found in database (Error #002)", "danger");
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
            $scope.checkRouting();
        }
    }; //end of $scope.checkUser()
        
    $scope.checkRouting = function() {
        if ($scope.user.isSuperAdmin) {
            if ($location.path() !== "/edit-profile") {
                alert("You do not have permission to view this webpage");
                $location.path("/admin").search("staffID",null).search("edit",null).search("add",null);
                $route.reload();
            }
        } else if (!$scope.user.isAdmin) {
            if ($location.path() !== "/edit-profile") {
                alert("You do not have permission to view this webpage");
                $location.path("/dashboard").search("staffID",null).search("edit",null).search("add",null);
                $route.reload();
            }
        }
    };
        
    $scope.checkSoftRouting = function() {
        if ($scope.user.isSuperAdmin) {
            if ($location.path() !== "/edit-profile") {
                $location.path("/admin").search("staffID",null).search("edit",null).search("add",null);
                $route.reload();
            }
        } else if (!$scope.user.isAdmin) {
            if ($location.path() !== "/edit-profile") {
                $location.path("/dashboard").search("staffID",null).search("edit",null).search("add",null);
                $route.reload();
            }
        }
    };
        
    $scope.logout = function() {
        delete $rootScope.user;
        $scope.auth.$signOut();
    }
    
    /*********************
    ******** Date ********
    *********************/
    
    //get current date in yyyy/mm/dd format
    Date.prototype.dayNow = function () { 
        return (this.getFullYear() + "/" + (((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1) + "/" + 
            ((this.getDate() < 10)?"0":"") + this.getDate());
    }
    
    //get current time in hh:mm:ss format
    Date.prototype.timeNow = function () {
        return ((this.getHours() < 10)?"0":"") + this.getHours() + ":" + ((this.getMinutes() < 10)?"0":"") + 
            this.getMinutes() + ":" + ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
    }
    
    /********************
    ** Search & Filter **
    ********************/
	
	$scope.sortByRoleList = ['All','CM','TM','BUH','HO'];
	$scope.sortByRoleItem = 'All';
	
	$scope.sortByRoleItemSelected = function(itemSelected) {
		$scope.sortByRoleItem = itemSelected;
	};
        
    $scope.sortByDeletedList = ['All','Active','Inactive','Deleted'];
	$scope.sortByDeletedItem = 'Active';
	
	$scope.sortByDeletedItemSelected = function(itemSelected) {
		$scope.sortByDeletedItem = itemSelected;
	};
    
    $scope.search = function(s) {
    return (angular.lowercase(s.name).indexOf(angular.lowercase($scope.query) || '') !== -1  ||
            angular.lowercase(s.ID).toString().indexOf(angular.lowercase($scope.query) || '') !== -1);
    }
    
    $scope.isdeleted = function(s) {
        if ($scope.sortByDeletedItem === 'Active')
            return (s.status === 'Active');
        else if ($scope.sortByDeletedItem === 'All')
            return true;
        else if ($scope.sortByDeletedItem === 'Inactive')
            return (s.status === 'Inactive');
        else if ($scope.sortByDeletedItem === 'Deleted')
            return (s.status === 'Deleted');
        else
            return (s.status === 'Active');
    }
    
    $scope.isrole = function(s) {
        if ($scope.sortByRoleItem === 'All')
            return true;
        else if ($scope.sortByRoleItem === 'HO')
            return (s.role === 'HO');
        else if ($scope.sortByRoleItem === 'BUH')
            return (s.role === 'BUH');
        else if ($scope.sortByRoleItem === 'TM')
            return (s.role === 'TM');
        else if ($scope.sortByRoleItem === 'CM')
            return (s.role === 'CM');
        else
            return true;
    }
	
    /********************
    ****** Routing ******
    ********************/
        
	$scope.goToAddStaff = function() {
		$location.path('/add-staff').search("staffID",null).search("edit",null).search("add",null);
	};
        
    $scope.goToEditStaff = function(staff) {
        //if not editing self
        if (staff.authID != $scope.firebaseUser.uid) {
            if ($scope.staffID !== undefined)
                $location.path("/edit-staff").search("staffID", $scope.staffID).search("edit", null).search("add", null);
            else
                $location.path("/edit-staff").search("staffID", staff.ID).search("edit", null).search("add", null);

        } else 
            $location.path("/edit-profile").search("staffID",null).search("edit",null).search("add",null);
    }; //end of $scope.goToEditStaff()
        
    $scope.goToStaff = function() {
		$location.path('/staff').search("staffID",null).search("edit",null).search("add",null);
	};
        
    $scope.goToDashboard = function () {
        $scope.firebaseUser = firebase.auth().currentUser;
        firebase.database().ref('admin/' + $scope.firebaseUser.uid).once('value').then(function (snapshot, error) {
            //if user is admin
            if (snapshot.val() != null) {
                if (snapshot.val().isSuperAdmin == true) {
                    $location.path('/admin');
                    $route.reload();
                } else  {
                    $location.path('/dashboard');
                    $route.reload();
                }
            } else {
                $location.path('/dashboard');
                $route.reload();
            }
        });
    };
        
    /*******************
    **** Staff View ****
    *******************/

    $scope.popupform = false;
    $scope.overlay = false;

    $scope.closeOverlay = function() {
        $scope.overlay = false;
        $scope.popupform = false;
    };

    $scope.openOverlay = function($event) {
        $event.stopPropagation();
    }
    
    $scope.viewStaff = function(staff) {
        $scope.overlay = true;
        $scope.staff = staff;

        //firstly check if user is admin
        firebase.database().ref('admin/' + $scope.firebaseUser.uid).once('value').then(function (snapshot, error) {
            //if admin
            if (snapshot.val() != null) {
                //grab values
                firebase.database().ref('staff/' + $scope.staff.authID).once('value').then(function (values) {
                    if (values.val() != null) {
                        $scope.staff = values.val();
                        if ($scope.staff.status === "Inactive")
                            $scope.staffStatusMessage = true;
                        else
                            $scope.staffStatusMessage = false;
                    }
                    $scope.$apply();
                }).catch(function (error) {
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
                //(#error)user-not-admin
                console.log("user-not-admin");
                $scope.notify("You do not have the permission to access this function (Error #008)", "danger");
            }
        }).catch(function (error) {
            console.log(error);
            if (error.code === "PERMISSION_DENIED") {
                //(#error)firebase-permission-denied
                $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
            } else {
                //(#error)unknown-error
                $scope.notify("An unknown error has occured (Error #000)", "danger");
            }
        });
    }; //end of $scope.viewStaff()

    /*******************
    **** Staff List ****
    *******************/
        
    //show pop-up notifcation for add success
    if ($routeParams.add !== undefined) {
        $scope.notify("Successfully added \"" +$routeParams.add + "\" staff","success");
    }
        
    //show pop-up notifcation for edit success
    if ($routeParams.edit !== undefined) {
        $scope.notify("Successfully saved \"" +$routeParams.edit + "\" staff","success");
    }

    var ref = firebase.database().ref().child("staff");

    $scope.refreshStaffList = function () {
        firebase.database().ref('staff').once('value').then(function (snapshot, error) {
            var tempList = {}; //key - numerical ID, value - staff
            var IDList = []; //to store numerical value of ID
            var ID;

            angular.forEach(snapshot.val(), function (staffValue, key) {
                ID = (staffValue.ID).substr(1);

                IDList.push(parseInt(ID));
                tempList[parseInt(ID)] = staffValue;
            });
            
            $scope.orderById(tempList, IDList);
            $scope.$apply();
        }).catch(function (error) {
            console.log(error);
            if (error.code === "PERMISSION_DENIED") {
                //(#error)firebase-permission-denied
                $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
            } else {
                //(#error)unknown-error
                $scope.notify("An unknown error has occured (Error #000)", "danger");
            }
        });
    }; //end of $scope.refreshStaffList()

    $scope.orderById = function(tempList, IDList) {
        var valuekeyList = [];

        //sort by ascending
        IDList = IDList.sort(function (a, b) {
            return a - b
        });

        //insert accordingly to where sorted id matches
        for (var i = 0; i < IDList.length; i++) {
            valuekeyList[i] = tempList[IDList[i]];
        }

        $scope.staffList = valuekeyList;
    };

    ref.on('value', function () {
        $scope.refreshStaffList();
    });

    /*******************
    **** Staff Edit ****
    *******************/

    $scope.reloadStaff = function () {
        $scope.firebaseUser = firebase.auth().currentUser;
        firebase.database().ref('admin/' + $scope.firebaseUser.uid).once('value').then(function (snapshot, error) {
            $scope.staff = {};
            $scope.prevstaff = {};
            //if user is admin
            if (snapshot.val() != null) {
                //grab values
                firebase.database().ref('staff/').orderByChild('ID/').equalTo($scope.staffID).once('value').then(function (values) {
                    if (values.val() != null) {
                        values.forEach(function (snap) {
                            $scope.staff = snap.val();
                            if ($scope.staff.status === "Inactive")
                                $scope.staffStatusMessage = true;
                            $scope.prevstaff.role = snap.val().role;
                        });
                        $scope.$apply();
                    }
                });
            } else {
                //(#error)user-not-admin
                console.log("user-not-admin");
                $scope.notify("You do not have the permission to access this function (Error #008)", "danger");
            }
        });
    }; //end of $scope.reloadStaff()

    if ($routeParams.staffID !== undefined) {
        $scope.staffID = $routeParams.staffID;

        firebase.database().ref('staff/').on('value', function (snapshot, error) {
            $scope.reloadStaff();
        });
    };

    $scope.saveStaff = function () {
        var phone = document.getElementById("phoneNo").value;
        if ($scope.staff.name === undefined)
            $scope.staffNameEmpty = true;
        else
            $scope.staffNameEmpty = false;

        if (phone === undefined || phone.trim() === "") {
            $scope.staffPhoneEmpty = true;
            $scope.staffPhoneError = true;
            $scope.staffPhoneLength = false;
            $scope.staffPhoneDigits = false;
        } else if (!/^\d+$/.test(phone)) {
            $scope.staffPhoneDigits = true;
            $scope.staffPhoneError = true;
            $scope.staffPhoneLength = false;
            $scope.staffPhoneEmpty = false;
        } else if (phone.length != 8) {
            $scope.staffPhoneLength = true;
            $scope.staffPhoneError = true;
            $scope.staffPhoneEmpty = false;
            $scope.staffPhoneDigits = false;
        } else
            defaultPhone();
        
        if ($scope.staffStatusMessage) {
            if ($scope.staff.statusMessage === undefined || $scope.staff.statusMessage === "")
                $scope.staffStatusEmpty = true;
            else
                $scope.staffStatusEmpty = false;
        } else
            $scope.staffStatusEmpty = false;

        var updates = {};
        if (!$scope.staffPhoneError && !$scope.staffNameError && !($scope.staff.authID === undefined) && !$scope.staffStatusEmpty) {
            var newDate = new Date();
            var datetime = newDate.dayNow() + " @ " + newDate.timeNow();
            
            updates["/staff/" + $scope.staff.authID + '/updatedAt'] = datetime;
            updates["/staff/" + $scope.staff.authID + '/updatedBy'] = $scope.user.ID;
            updates["/staff/" + $scope.staff.authID + '/name'] = $scope.staff.name;
            updates["/staff/" + $scope.staff.authID + '/role'] = $scope.staff.role;
            updates["/staff/" + $scope.staff.authID + '/status'] = $scope.staff.status;
            updates["/staff/" + $scope.staff.authID + '/phone'] = $scope.staff.phone;
            updates["logincheck/" + $scope.staff.ID + '/status'] = $scope.staff.status;
            
            if ($scope.staff.status === "Inactive")
                updates["/staff/" + $scope.staff.authID + '/statusMessage'] = $scope.staff.statusMessage;
            else
                firebase.database().ref("/staff/" + $scope.staff.authID + '/statusMessage').remove();

            var newDate = new Date();
            var datetime = newDate.dayNow() + " @ " + newDate.timeNow();

            //if deleted, add at and by
            if ($scope.staff.status == "Deleted") {
                firebase.database().ref("/staff/" + $scope.staff.authID + '/deletedAt').set(datetime);
                firebase.database().ref("/staff/" + $scope.staff.authID + '/deletedBy').set($scope.user.ID);
            } else {
                firebase.database().ref("/staff/" + $scope.staff.authID + '/deletedAt').remove();
                firebase.database().ref("/staff/" + $scope.staff.authID + '/deletedBy').remove();
            }

            if ($scope.prevstaff.role != "HO" && $scope.staff.role === "HO") {
                firebase.database().ref('admin/' + $scope.staff.authID).set({
                    isSuperAdmin: false
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

            if ($scope.prevstaff.role === "HO" && $scope.staff.role !== "HO") {
                //if no longer HO remove from admin table
                firebase.database().ref('/admin/' + $scope.staff.authID).remove();
                updates['/staff/' + $scope.staff.authID + '/role'] = $scope.staff.role;
            }

            firebase.database().ref().update(updates);
            firebase.database().ref('staff/' + $scope.staff.authID).once('value').then(function (snapshot, error) {
                $scope.prevstaff.role = snapshot.val().role;
                if (!error) {
                    $location.path("/staff").search("edit", $scope.staff.name).search("staffID", null).search("add", null);
                    $route.reload();
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
    }; //end of $scope.saveStaff()

    var defaultPhone = function() {
        $scope.staffPhoneEmpty = false;
        $scope.staffPhoneError = false;
        $scope.staffPhoneLength = false;
        $scope.staffPhoneDigits = false;
    };
    
    /********************
    ***** Staff Add *****
    ********************/

    $scope.statusList = ['Active', 'Inactive', 'Deleted'];
    $scope.statusListSmall = ['Active', 'Inactive'];
    
    $scope.selectStatusValue = function(x) {
        $scope.staff.status = x;
        if (x === "Inactive") {
            $scope.staffStatusMessage = true;
        } else {
            $scope.staffStatusMessage = false;
        }
    }

    $scope.roleList = ['HO', 'BUH', 'TM', 'CM'];
        
    $scope.selectRoleValue = function(x) {
        $scope.staff.role = x;
    }
        
    $scope.initAdd = function() {
        $scope.staff = {};
        $scope.staff.role = "CM";
        $scope.staff.status = "Active";
        $scope.staffStatusMessage = false;
    }
    
    $scope.addStaff = function () {
        var phone = document.getElementById("phoneNo").value;
        if ($scope.staff.name === undefined)
            $scope.staffNameEmpty = true;
        else 
            $scope.staffNameEmpty = false;

        if (phone === undefined || phone.trim() === "") {
            $scope.staffPhoneEmpty = true;
            $scope.staffPhoneError = true;
            $scope.staffPhoneLength = false;
            $scope.staffPhoneDigits = false;
        } else if (!/^\d+$/.test(phone)) {
            $scope.staffPhoneDigits = true;
            $scope.staffPhoneError = true;
            $scope.staffPhoneLength = false;
            $scope.staffPhoneEmpty = false;
        } else if (phone.length != 8) {
            $scope.staffPhoneLength = true;
            $scope.staffPhoneError = true;
            $scope.staffPhoneEmpty = false;
            $scope.staffPhoneDigits = false;
        } else 
            defaultPhone();

        $scope.adminEmailError = false;
        
        if ($scope.staff.email === undefined) {
            $scope.adminEmailError = true;
            $scope.staffEmailEmpty = true;
        } else {
            $scope.adminEmailError = false;
            $scope.staffEmailEmpty = false;
        }
        
        $scope.adminEmailUsed = false;
        $scope.adminEmailInvalid = false;
        
        if ($scope.staffStatusMessage) {
            if ($scope.staff.statusMessage === undefined || $scope.staff.statusMessage === "")
                $scope.staffStatusEmpty = true;
            else
                $scope.staffStatusEmpty = false;
        } else
            $scope.staffStatusEmpty = false;

        if (!$scope.staffPhoneError && !$scope.staffNameEmpty && !$scope.staffEmailEmpty && !$scope.staffStatusEmpty) {
            firebase.database().ref('count/staffCount').once('value').then(function (snapshot, error) {
                if (snapshot.val() != null) {
                    $scope.id = snapshot.val().count + 1;
                    $scope.alpha = snapshot.val().alphabet;

                    //create user in authentication
                    $scope.authObj.$createUserWithEmailAndPassword($scope.staff.email.trim(), "SIMAStaff").then(function (userData) {
                            //formatting for ID
                            if (angular.isNumber($scope.id)) {
                                if ($scope.id < 10)
                                    $scope.finalid = $scope.alpha + "000" + $scope.id;
                                else if ($scope.id < 100)
                                    $scope.finalid = $scope.alpha + "00" + $scope.id;
                                else if ($scope.id < 1000)
                                    $scope.finalid = $scope.alpha + "0" + $scope.id;
                                else if ($scope.id < 10000)
                                    $scope.finalid = $scope.alpha + $scope.id;
                                
                                if ($scope.staff.status !== "Inactive")
                                    $scope.staff.statusMessage = null;
                                
                                var newDate = new Date();
                                var datetime = newDate.dayNow() + " @ " + newDate.timeNow();

                                //once done, get generated uid and save in staff table
                                firebase.database().ref('staff/' + userData.uid).set({
                                    email: $scope.staff.email.trim(),
                                    ID: $scope.finalid,
                                    name: $scope.staff.name,
                                    role: $scope.staff.role,
                                    status: $scope.staff.status,
                                    phone: $scope.staff.phone,
                                    authID: userData.uid,
                                    statusMessage: $scope.staff.statusMessage,
                                    createdAt: datetime,
                                    updatedAt: datetime,
                                    createdBy: $scope.user.ID,
                                    updatedBy: $scope.user.ID
                                }).then(function () {
                                    console.log(userData.uid + "--> Created");
                                    console.log($scope.firebaseUser.uid + "--> Current");

                                    //update count in database
                                    firebase.database().ref('count/staffCount').set({
                                        alphabet: $scope.alpha,
                                        count: $scope.id
                                    });

                                    //add in logincheck table
                                    firebase.database().ref('logincheck/' + $scope.finalid).set({
                                        ID: $scope.finalid,
                                        email: $scope.staff.email.trim(),
                                        status: $scope.staff.status
                                    });

                                    //if staff added is HO, give admin permissions (add in admin table)
                                    if ($scope.staff.role == "HO") {
                                        firebase.database().ref('admin/' + userData.uid).set({
                                            isSuperAdmin: false
                                        }).then(function() {
                                            $scope.authObj.$signOut();
                                            alert("Login information of staff created\nStaff ID: " + $scope.finalid + "\nPassword: SIMAStaff");
                                            $location.path("/staff").search("add", $scope.staff.name).search("staffID", null).search("edit", null);
                                            $route.reload();
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
                                        $scope.authObj.$signOut();
                                        alert("Login information of staff created\nStaff ID: " + $scope.finalid + "\nPassword: SIMAStaff");
                                        $location.path("/staff").search("add", $scope.staff.name).search("staffID", null).search("edit", null);
                                        $route.reload();
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
                            } else if (error.code === "auth/email-already-in-use") {
                                //(#error)auth-email-already-in-use
                                $scope.adminEmailUsed = true;
                                $scope.adminEmailError = true;
                            } else if (error.code === "auth/email-already-in-use") {
                                //(#error)auth-invalid-email
                                $scope.adminEmailInvalid = true;
                                $scope.adminEmailError = true;
                            } else {
                                //(#error)unknown-error
                                $scope.notify("An unknown error has occured (Error #000)", "danger");
                            }
                        });
                } else {
                    //(#error)database-cannot-get-new-staff-id
                    console.log("database-cannot-get-new-staff-id");
                    $scope.notify("An error occured when accessing firebase database (Error #009)", "danger");
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
    }; //end of $scope.addStaff()

    /********************
    ****** Profile ******
    ********************/
        
    //update password of currently logged in user
    $scope.updatePassword = function () {
        if ($scope.newPassword == undefined || $scope.newPassword == "") {
            $scope.passwordEmpty = true;
            $scope.passwordMatch = false;
            $scope.passwordLength = false;
            $scope.pwdEmpty1 = true;
        } else {
            if ($scope.newPassword.length < 6) {
                $scope.passwordEmpty = false;
                $scope.passwordMatch = false;
                $scope.passwordLength = true;
                $scope.pwdEmpty1 = true;
            } else {
                if ($scope.confirmPassword != $scope.newPassword) {
                    $scope.passwordEmpty2 = false;
                    $scope.passwordMatch = true;
                    $scope.passwordLength2 = false;
                    $scope.passwordEmpty = false;
                    $scope.passwordLength = false;

                    $scope.pwdEmpty2 = true;
                    $scope.pwdEmpty1 = true;
                } else
                    $scope.passwordEmpty = false;
                $scope.passwordMatch = false;
                $scope.passwordLength = false;
                $scope.pwdEmpty1 = false;
            }
        }
        
        if ($scope.confirmPassword == undefined || $scope.newPassword == "") {
            $scope.passwordEmpty2 = true;
            $scope.passwordMatch = false;
            $scope.passwordLength2 = false;
            $scope.pwdEmpty2 = true;
        } else {
            if ($scope.confirmPassword.length < 6) {
                $scope.passwordEmpty2 = false;
                $scope.passwordMatch = false;
                $scope.passwordLength2 = true;
                $scope.pwdEmpty2 = true;
            } else {
                if ($scope.confirmPassword != $scope.newPassword) {
                    $scope.passwordEmpty2 = false;
                    $scope.passwordMatch = true;
                    $scope.passwordLength2 = false;
                    $scope.passwordEmpty1 = false;
                    $scope.passwordLength1 = false;

                    $scope.pwdEmpty2 = true;
                    $scope.pwdEmpty1 = true;
                } else {
                    $scope.passwordEmpty2 = false;
                    $scope.passwordMatch = false;
                    $scope.passwordLength2 = false;
                    $scope.pwdEmpty2 = false;
                }
            }
        }

        if ($scope.pwdEmpty1 === false && $scope.pwdEmpty2 === false) {
            //if confirm password field is identical, update password        
            $scope.auth.$updatePassword($scope.newPassword).then(function () {
                $scope.auth.$signOut();
                delete $rootScope.user;
                alert("You have successfully updated your password\n\nPlease login again");
                $scope.popupform = !$scope.popupform;
            }).catch(function (error) {
                console.log(error);
                if (error.code === "auth/requires-recent-login")
                    //(#error)auth-requires-recent-login
                    alert(error);
                else if (error.code === "auth/email-already-in-use")
                    //(#error)auth-email-already-in-use
                    alert(error);
                else
                    //(#error)unknown-auth-error
                    $scope.notify("An unknown error has occured (Error #200)", "danger");
            });
        }
    }

    $scope.saveProfile = function () {
        var phone = document.getElementById("phoneNo").value;
        if ($scope.user.email === undefined)
            $scope.staffEmailEmpty = true;
        else 
            $scope.staffEmailEmpty = false;

        if (phone === undefined || phone.trim() === "") {
            $scope.staffPhoneEmpty = true;
            $scope.staffPhoneError = true;
            $scope.staffPhoneLength = false;
            $scope.staffPhoneDigits = false;
        } else if (!/^\d+$/.test(phone)) {
            $scope.staffPhoneDigits = true;
            $scope.staffPhoneError = true;
            $scope.staffPhoneLength = false;
            $scope.staffPhoneEmpty = false;
        } else if (phone.length != 8) {
            $scope.staffPhoneLength = true;
            $scope.staffPhoneError = true;
            $scope.staffPhoneEmpty = false;
            $scope.staffPhoneDigits = false;
        } else 
            defaultPhone();

        var updates = {};
        firebase.database().ref('adminstaff/' + $scope.user.authID).once('value').then(function (snapshot, error) {
            if (snapshot.val() != null) {
                updates["/adminstaff/" + $scope.user.authID + '/phone'] = $scope.user.phone;

                var newDate = new Date();
                var datetime = newDate.dayNow() + " @ " + newDate.timeNow();
                
                updates["/adminstaff/" + $scope.user.authID + '/updatedAt'] = datetime;
                updates["/adminstaff/" + $scope.user.authID + '/updatedBy'] = $scope.user.ID;
                
                $scope.auth.$updateEmail($scope.user.email).then(function () {
                    //update email
                    //update for staff, adminstaff, logincheck, authentication
                    updates["/adminstaff/" + $scope.user.authID + '/email'] = $scope.user.email;
                    updates["/logincheck/" + $scope.user.ID + '/email'] = $scope.user.email;
                    firebase.database().ref().update(updates);
                    alert("You have successfully updated your profile");
                    firebase.database().ref('admin/' + $scope.user.authID).once('value').then(function (snapshot, error) {
                        if (snapshot.val() != null) {
                            if (snapshot.val().isSuperAdmin) {
                                    $location.path("/admin").search("edit",null).search("add",null);
                                    $route.reload();
                            } else {
                                $location.path("/dashboard").search("edit",null).search("add",null);
                                $route.reload();
                            }
                        } else {
                            $location.path("/dashboard").search("edit",null).search("add",null);
                            $route.reload();
                        }
                    });
                }).catch(function(error) {
                    console.log(error);
                    if (error.code === "auth/requires-recent-login")
                        //(#error)auth-requires-recent-login
                        alert(error);
                    else if (error.code === "auth/email-already-in-use")
                        //(#error)auth-email-already-in-use
                        alert(error);
                    else
                        //(#error)unknown-auth-error
                        $scope.notify("An unknown error has occured (Error #200)", "danger");
                });
            } else {
                var newDate = new Date();
                var datetime = newDate.dayNow() + " @ " + newDate.timeNow();
                
                updates["/staff/" + $scope.user.authID + '/updatedAt'] = datetime;
                updates["/staff/" + $scope.user.authID + '/updatedBy'] = $scope.user.ID;
                updates["/staff/" + $scope.user.authID + '/phone'] = $scope.user.phone;
        
                $scope.auth.$updateEmail($scope.user.email).then(function () {
                    //update email
                    //update for staff, adminstaff, logincheck, authentication
                    updates["/staff/" + $scope.user.authID + '/email'] = $scope.user.email;
                    updates["/logincheck/" + $scope.user.ID + '/email'] = $scope.user.email;
                    firebase.database().ref().update(updates);
                    alert("You have successfully updated your profile");
                    $location.path("/dashboard").search("edit",null).search("add",null);
                    $route.reload();
                }).catch(function(error) {
                    console.log(error);
                    if (error.code === "auth/requires-recent-login")
                        //(#error)auth-requires-recent-login
                        alert(error);
                    else if (error.code === "auth/email-already-in-use")
                        //(#error)auth-email-already-in-use
                        alert(error);
                    else
                        //(#error)unknown-auth-error
                        $scope.notify("An unknown error has occured (Error #200)", "danger");
                });
            }
        });
    };
    
}]);