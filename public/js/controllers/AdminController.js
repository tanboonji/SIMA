app.controller('AdminController', ['$route', '$rootScope', '$routeParams', '$scope', '$location', '$firebaseAuth', '$firebaseObject',
	'$firebaseArray', function($route, $rootScope, $routeParams, $scope, $location, $firebaseAuth, $firebaseObject, $firebaseArray) {

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
    //authentication object to create admins
    $scope.authObj = $firebaseAuth(secondaryApp.auth());

    //detect authentication state change (login/logout)
    $scope.auth.$onAuthStateChanged(function (firebaseUser) {
        $scope.firebaseUser = firebaseUser;
        if ($scope.firebaseUser === null) {
            $location.path('/login');
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
                    if ($rootScope.user.role === "EXCO") {
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
            $scope.checkRouting();
        }
    }; //end of $scope.checkUser()
        
    $scope.checkRouting = function() {
        if (!$scope.user.isSuperAdmin) {
            alert("You do not have permission to view this webpage (admin)");
            $location.path("/dashboard").search("adminID",null).search("edit",null).search("add",null);
            $route.reload();
        }
    };
        
    $scope.checkSoftRouting = function() {
        if (!$scope.user.isSuperAdmin) {
            $location.path("/dashboard").search("adminID",null).search("edit",null).search("add",null);
            $route.reload();
        }
    };

    $scope.logout = function () {
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
    
    $scope.sortByDeletedList = ['All', 'Active', 'Inactive', 'Deleted'];
    $scope.sortByDeletedItem = 'Active';

    $scope.sortByDeletedItemSelected = function(itemSelected) {
        $scope.sortByDeletedItem = itemSelected;
    };

    $scope.search = function (s) {
        return (angular.lowercase(s.name).indexOf(angular.lowercase($scope.query) || '') !== -1 ||
            angular.lowercase(s.ID).toString().indexOf(angular.lowercase($scope.query) || '') !== -1);
    }

    $scope.isdeleted = function (s) {
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
	
    /********************
    ****** Routing ******
    ********************/

    $scope.goToAddAdmin = function () {
        $location.path('/add-admin').search("adminID", null).search("edit", null).search("add", null);
    };

    $scope.goToEditAdmin = function (admin) {
        $scope.admin = admin;
        //if not editing self
        if (admin.authID != $scope.firebaseUser.uid) {
            if ($scope.adminID !== undefined)
                $location.path("/edit-admin").search("adminID", $scope.adminID).search("edit", null).search("add", null);
            else
                $location.path("/edit-admin").search("adminID", $scope.admin.ID).search("edit", null).search("add", null);
        } else 
            $location.path("/edit-profile").search("adminID", null).search("edit", null).search("add", null);
    };

    $scope.goToAdmin = function () {
        $location.path('/admin').search("adminID", null).search("edit", null).search("add", null);
    };
        
    /*******************
    **** Admin View ****
    *******************/

    $scope.overlay = false;
    $scope.popupform = false;

    $scope.closeOverlay = function () {
        $scope.overlay = false;
        $scope.popupform = false;
    };

    $scope.openOverlay = function ($event) {
        $event.stopPropagation();
    }

    $scope.viewAdmin = function (admin) {
        $scope.overlay = true;
        $scope.admin = admin;

        //firstly check if user is admin
        firebase.database().ref('admin/' + $scope.firebaseUser.uid).once('value').then(function (snapshot, error) {
            //if admin
            if (snapshot.val() != null) {
                if (snapshot.val().isSuperAdmin == "true")
                    //grab values
                    firebase.database().ref('adminstaff/' + $scope.admin.authID).once('value').then(function (values) {
                        if (values.val() != null) {
                            $scope.admin = values.val();
                            if ($scope.admin.status === "Inactive")
                                $scope.adminStatusMessage = true;
                            else
                                $scope.adminStatusMessage = false;
                            $scope.$apply();
                        } else {
                            //(#error)user-not-super-admin
                            console.log("user-not-super-admin");
                            $scope.notify("You do not have the permission to access this function (Error #010)", "danger");
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
    };

    /*******************
    **** Admin List ****
    *******************/
        
    //show pop-up notifcation for add success
    if ($routeParams.add !== undefined) {
        $scope.notify("Successfully added \"" +$routeParams.add + "\" admin","success");
    }
        
    //show pop-up notifcation for edit success
    if ($routeParams.edit !== undefined) {
        $scope.notify("Successfully saved \"" +$routeParams.edit + "\" admin","success");
    }

    var ref = firebase.database().ref().child("adminstaff");

    $scope.refreshAdminList = function () {
        firebase.database().ref('adminstaff').once('value').then(function (snapshot, error) {
            var tempList = {}; //key - numerical ID, value - admin
            var IDList = []; //to store numerical value of ID
            var ID;

            angular.forEach(snapshot.val(), function (adminValue, key) {
                ID = (adminValue.ID).substr(1);

                IDList.push(parseInt(ID));
                tempList[parseInt(ID)] = adminValue;
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
    }; //end of $scope.refreshAdminList()

    $scope.orderById = function (tempList, IDList) {
        var valuekeyList = [];

        //sort by ascending
        IDList = IDList.sort(function (a, b) {
            return a - b
        });

        //insert accordingly to where sorted id matches
        for (var i = 0; i < IDList.length; i++) {
            valuekeyList[i] = tempList[IDList[i]];
        }

        $scope.adminList = valuekeyList;
    };

    ref.on('value', function () {
        $scope.refreshAdminList();
    });

    /*******************
    **** Admin Edit ****
    *******************/
        
    $scope.statusList = ['Active', 'Inactive', 'Deleted'];
    $scope.statusListSmall = ['Active', 'Inactive'];
        
    $scope.selectStatusValue = function (x) {
        if ($location.path() === "/add-admin") {
            $scope.newadmin.status = x;
        } else {
            $scope.admin.status = x;
        }
        
        if (x === "Inactive") {
            $scope.adminStatusMessage = true;
        } else {
            $scope.adminStatusMessage = false;
        }
    }

    $scope.reloadAdmin = function () {
        $scope.firebaseUser = firebase.auth().currentUser;
        firebase.database().ref('admin/' + $scope.firebaseUser.uid).once('value').then(function (snapshot, error) {
            $scope.admin = {};
            //if user is admin
            if (snapshot.val() != null) {
                if (snapshot.val().isSuperAdmin == true) {
                    //grab values
                    firebase.database().ref('adminstaff/').orderByChild('ID/').equalTo($scope.adminID).once('value').then(function (values) {
                        if (values.val() != null) {
                            values.forEach(function (snap) {
                                $scope.admin = snap.val();
                                if ($scope.admin.status === "Inactive")
                                    $scope.adminStatusMessage = true;
                            });
                            $scope.$apply();
                        }
                    });
                } else  {
                    //(#error)user-not-super-admin
                    console.log("user-not-super-admin");
                    $scope.notify("You do not have the permission to access this function (Error #010)", "danger");
                }
            } else {
                //(#error)i//(#error)user-not-super-admin
                console.log("user-not-super-admin");
                $scope.notify("You do not have the permission to access this function (Error #010)", "danger");
            }
        });
    }; //end of $scope.reloadAdmin()

    if ($routeParams.adminID !== undefined) {
        $scope.adminID = $routeParams.adminID;
        firebase.database().ref('adminstaff/').on('value', function (snapshot, error) {
            $scope.reloadAdmin();
        });
    };

    $scope.saveAdmin = function () {
        var phone = document.getElementById("phoneNo").value;
        if ($scope.admin.name === undefined)
            $scope.adminNameEmpty = true;
        else
            $scope.adminNameEmpty = false;

        if (phone === undefined || phone.trim() === "") {
            $scope.adminPhoneEmpty = true;
            $scope.adminPhoneError = true;
            $scope.adminPhoneLength = false;
            $scope.adminPhoneDigits = false;
        } else if (!/^\d+$/.test(phone)) {
            $scope.adminPhoneDigits = true;
            $scope.adminPhoneError = true;
            $scope.adminPhoneLength = false;
            $scope.adminPhoneEmpty = false;
        } else if (phone.length != 8) {
            $scope.adminPhoneLength = true;
            $scope.adminPhoneError = true;
            $scope.adminPhoneEmpty = false;
            $scope.adminPhoneDigits = false;
        } else 
            defaultPhone();

        if ($scope.adminStatusMessage) {
            if ($scope.admin.statusMessage === undefined || $scope.admin.statusMessage === "")
                $scope.adminStatusEmpty = true;
            else
                $scope.adminStatusEmpty = false;
        } else
            $scope.adminStatusEmpty = false;
        
        var updates = {};
        if (!$scope.adminPhoneError && !$scope.adminNameError && !($scope.admin.authID === undefined) && !$scope.adminStatusEmpty) {
            
            var newDate = new Date();
            var datetime = newDate.dayNow() + " @ " + newDate.timeNow();
            
            updates["/adminstaff/" + $scope.admin.authID + '/updatedAt'] = datetime;
            updates["/adminstaff/" + $scope.admin.authID + '/updatedBy'] = $scope.user.ID;
            updates["/adminstaff/" + $scope.admin.authID + '/name'] = $scope.admin.name;
            updates["/adminstaff/" + $scope.admin.authID + '/status'] = $scope.admin.status;
            updates["/adminstaff/" + $scope.admin.authID + '/phone'] = $scope.admin.phone;
            updates["/logincheck/" + $scope.admin.ID + '/status'] = $scope.admin.status;

            if ($scope.admin.status === "Inactive")
                updates["/adminstaff/" + $scope.admin.authID + '/statusMessage'] = $scope.admin.statusMessage;
            else
                firebase.database().ref("/adminstaff/" + $scope.admin.authID + '/statusMessage').remove();

            var newDate = new Date();
            var datetime = newDate.dayNow() + " @ " + newDate.timeNow();

            //if deleted, add at and by
            if ($scope.admin.status == "Deleted") {
                firebase.database().ref("/adminstaff/" + $scope.admin.authID + '/deletedAt').set(datetime);
                firebase.database().ref("/adminstaff/" + $scope.admin.authID + '/deletedBy').set($scope.firebaseUser.uid);
            } else {
                firebase.database().ref("/adminstaff/" + $scope.admin.authID + '/deletedAt').remove();
                firebase.database().ref("/adminstaff/" + $scope.admin.authID + '/deletedBy').remove();
            }

            firebase.database().ref().update(updates);
            $location.path("/admin").search("edit", $scope.admin.name).search("adminID", null).search("add", null);
            $route.reload();
        }
    }; //end of $scope.saveAdmin()

    var defaultPhone = function () {
        $scope.adminPhoneEmpty = false;
        $scope.adminPhoneError = false;
        $scope.adminPhoneLength = false;
        $scope.adminPhoneDigits = false;
    };
    
    /********************
    ***** Admin Add *****
    ********************/

    $scope.initAdd = function () {
        $scope.newadmin = {};
        $scope.newadmin.status = "Active";
    };

    $scope.addAdmin = function () {
        var phone = document.getElementById("phoneNo").value;
        
        if ($scope.newadmin.name === undefined)
            $scope.adminNameEmpty = true;
        else
            $scope.adminNameEmpty = false;

        if (phone === undefined || phone.trim() === "") {
            $scope.adminPhoneEmpty = true;
            $scope.adminPhoneError = true;
            $scope.adminPhoneLength = false;
            $scope.adminPhoneDigits = false;
        } else if (!/^\d+$/.test(phone)) {
            $scope.adminPhoneDigits = true;
            $scope.adminPhoneError = true;
            $scope.adminPhoneLength = false;
            $scope.adminPhoneEmpty = false;
        } else if (phone.length != 8) {
            $scope.adminPhoneLength = true;
            $scope.adminPhoneError = true;
            $scope.adminPhoneEmpty = false;
            $scope.adminPhoneDigits = false;
        } else 
            defaultPhone();
        
        $scope.adminEmailError = false;

        if ($scope.newadmin.email === undefined) {
            $scope.adminEmailEmpty = true;
            $scope.adminEmailError = true;
        } else { 
            $scope.adminEmailEmpty = false;
            $scope.adminEmailError = false;
        }
        
        if ($scope.adminStatusMessage) {
            if ($scope.newadmin.statusMessage === undefined || $scope.newadmin.statusMessage === "")
                $scope.adminStatusEmpty = true;
            else
                $scope.adminStatusEmpty = false;
        } else
            $scope.adminStatusEmpty = false;
        
        $scope.adminEmailUsed = false;
        $scope.adminEmailInvalid = false;

        if (!$scope.adminPhoneError && !$scope.adminNameEmpty && !$scope.adminEmailError && !$scope.adminStatusEmpty) {
            firebase.database().ref('count/adminCount').once('value').then(function (snapshot, error) {
                if (snapshot.val() != null) {
                    $scope.id = snapshot.val().count + 1;
                    $scope.alpha = snapshot.val().alphabet;
                    
                    //create user in auth
                    $scope.authObj.$createUserWithEmailAndPassword($scope.newadmin.email.trim(), "SIMAAdmin").then(function (userData) {
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
                                
                                if ($scope.newadmin.status !== "Inactive")
                                    $scope.newadmin.statusMessage = null;
                                
                                var newDate = new Date();
                                var datetime = newDate.dayNow() + " @ " + newDate.timeNow();

                                //once done, get generated uid and save in admin table
                                firebase.database().ref('adminstaff/' + userData.uid).set({
                                    email: $scope.newadmin.email.trim(),
                                    ID: $scope.finalid,
                                    name: $scope.newadmin.name,
                                    status: $scope.newadmin.status,
                                    phone: $scope.newadmin.phone,
                                    authID: userData.uid,
                                    statusMessage: $scope.newadmin.statusMessage,
                                    updatedAt: datetime,
                                    createdAt: datetime,
                                    updatedBy: $scope.user.ID,
                                    createdBy: $scope.user.ID,
                                    role: "Admin"
                                }).then(function () {
                                    console.log(userData.uid + "--> Created");
                                    console.log($scope.firebaseUser.uid + "--> Current");

                                    //update count in database
                                    firebase.database().ref('count/adminCount').set({
                                        alphabet: $scope.alpha,
                                        count: $scope.id
                                    });

                                    //add in logincheck table
                                    firebase.database().ref('logincheck/' + $scope.finalid).set({
                                        ID: $scope.finalid,
                                        email: $scope.newadmin.email.trim(),
                                        status: $scope.newadmin.status
                                    });

                                    firebase.database().ref('admin/' + userData.uid).set({
                                        isSuperAdmin: false
                                    });
                                    
                                    $scope.authObj.$signOut();
                                    alert("Login information of admin created\nAdmin ID: " + $scope.finalid + "\nPassword: SIMAAdmin");
                                    $location.path("/admin").search("add", $scope.newadmin.name).search("adminID", null).search("edit", null);
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
                            } else if (error.code === "auth/invalid-email") {
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
    }; //end of $scope.addAdmin()

}]);