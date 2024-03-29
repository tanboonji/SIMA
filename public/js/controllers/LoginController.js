app.controller('LoginController', ['$rootScope', '$routeParams', '$route', '$scope', '$location', '$firebaseAuth', 
    function($rootScope, $routeParams, $route, $scope, $location, $firebaseAuth){
        
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
        
    $scope.auth = $firebaseAuth(primaryApp.auth());
    
    //detect authentication state change (login/logout)
    $scope.auth.$onAuthStateChanged(function(firebaseUser) {
        $scope.firebaseUser = firebaseUser;
        if ($scope.firebaseUser != null) {
            //check if user is supersuper, if superadmin => redirect to admin page, else => redirect to dashboard
            firebase.database().ref('admin/' + $scope.firebaseUser.uid).once('value').then(function (snapshot, error) {
                if (snapshot.val() == null) {
                    $location.path('/dashboard').search('forget',null);
                    $route.reload();
                } else if (snapshot.val().isSuperAdmin) {
                    $location.path('/admin').search('forget',null);
                    $route.reload();
                } else {
                    $location.path('/dashboard').search('forget',null);
                    $route.reload();
                }
            });
        } else {
            delete $rootScope.user;
        }
    });
    
    if ($routeParams.forget != undefined) {
        $scope.notify("<p>You have succesfully reset your password!</p> Please check your email (" + $routeParams.forget + ") for a link to reset your password.", "success");
    };
        
    /********************
    ****** Routing ******
    ********************/
    
    $scope.goToForgetPassword = function() {
        $location.path('/forget-password').search('forget', null);
    };
    
    $scope.goToLogin = function() {
        $location.path('/login');
    };
        
    /**************************
    * Login & Forget Password *
    **************************/
        
    $scope.btnClicked = false;
    $scope.passwordError = null;
    $scope.staffIDError = null;
        
    $scope.login = function() {
        $scope.btnClicked = true;
        
        if ($scope.staffID == undefined) {
            //empty staffID
            console.log("auth/no-id-entered");
            $scope.staffIDError = "Staff ID is required";
        } else if (!/^[a-zA-Z][0-9]{4}/.test($scope.staffID)) {
            $scope.staffID = $scope.staffID.toUpperCase();
            //regex staffID test
            console.log("auth/invalid-id");
            $scope.staffIDError = "Invalid Staff ID";
        } else {
            $scope.staffID = $scope.staffID.toUpperCase();
            //valid staffID
            $scope.staffIDError = null;
        }
        
        if ($scope.password == undefined) {
            //check password empty
            console.log("auth/no-password-entered");
            $scope.passwordError = "Password is required";
        } else {
            //valid password
            $scope.passwordError = null;
        }
        
        if ($scope.staffIDError == null && $scope.passwordError == null) {
            firebase.database().ref('logincheck/' + $scope.staffID).once('value').then(function (snapshot, error) {
                if (snapshot.val() == null) {
                    $scope.btnClicked = false;
                    //cannot find email from database
                    console.log("auth/no-matching-id");
                    $scope.staffIDError = "Invalid Staff ID";
                    $scope.$apply();
                } else if (snapshot.val().status === "Active") {
                    $scope.email = snapshot.val().email;
                    $scope.auth.$signInWithEmailAndPassword($scope.email, $scope.password).then(function(firebaseUser) {
                        console.log("Signed in as:", firebaseUser.uid);
                        $scope.firebaseUser = firebaseUser;
                    }).catch(function(error) {
                        $scope.btnClicked = false;
                        //firebase $auth error
                        $scope.firebaseUser = null;
                        console.error("Authentication failed:", error);
                        switch (error.code) {
                            case 'auth/invalid-email':
                                $scope.staffIDError = "Invalid Staff ID";
                                break;
                            case 'auth/user-not-found':
                                $scope.staffIDError = "User cannot be found";
                                break;
                            case 'auth/wrong-password':
                                $scope.passwordError = "Invalid password";
                                break;
                            case 'auth/too-many-requests':
                                //(#error)auth-too-many-requests
                                $scope.notify("You have tried too many times, please wait awhile before trying again (Error: #202)", "danger");
                                break;
                            default:
                                //(#error)unknown-auth-error
                                $scope.notify("An unknown error has occured (Error #200)", "danger");
                                break;
                        }
                    });
                } else {
                    $scope.btnClicked = false;
                    //inactive staff
                    console.log("auth/account-not-available");
                    //(#error)auth-account-not-available
                    $scope.notify("Your account is currently not available, please contact the administrator (Error: #201)", "danger");
                    $scope.$apply();
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
                $scope.btnClicked = false;
                $scope.$apply();
            });
        } else {
            $scope.btnClicked = false;
        }
    };
	
//    $scope.login = function() {
//        $scope.btnValidate = true;
//        if ($scope.staffID != undefined) {
//            $scope.staffID = $scope.staffID.toUpperCase();
//            if (/^[A-Z][0-9]{4}/.test($scope.staffID)) {
//                if ($scope.password != undefined) {
//                    firebase.database().ref('logincheck/' + $scope.staffID).once('value').then(function (snapshot, error) {
//                        if (snapshot.val() != null) {
//                            if (snapshot.val().status === "Active") {
//                                $scope.email = snapshot.val().email;
//                                $scope.auth.$signInWithEmailAndPassword($scope.email, $scope.password).then(function(firebaseUser) {
//                                    console.log("Signed in as:", firebaseUser.uid);
//                                    $scope.firebaseUser = firebaseUser;
//                                }).catch(function(error) {
//                                    $scope.btnValidate = false;
//                                    //firebase $auth error
//                                    $scope.firebaseUser = null;
//                                    console.error("Authentication failed:", error);
//                                    var message = '';
//                                    switch (error.code) {
//                                        case 'auth/invalid-email':
//                                            $scope.passwordErrorMessage = null;
//                                            $scope.staffIDErrorMessage = "Invalid Staff ID";
//                                            break;
//                                        case 'auth/user-not-found':
//                                            $scope.passwordErrorMessage = null;
//                                            $scope.staffIDErrorMessage = "User cannot be found";
//                                            break;
//                                        case 'auth/wrong-password':
//                                            $scope.passwordErrorMessage = "Invalid password";
//                                            $scope.staffIDErrorMessage = null;
//                                            break;
//                                        case 'auth/too-many-requests':
//                                            $scope.passwordErrorMessage = null;
//                                            $scope.staffIDErrorMessage = null;
//                                            //(#error)auth-too-many-requests
//                                            $scope.notify("You have tried too many times, please wait awhile before trying again (Error: #202)", "danger");
//                                            break;
//                                        default:
//                                            $scope.passwordErrorMessage = null;
//                                            $scope.staffIDErrorMessage = null;
//                                            //(#error)unknown-auth-error
//                                            $scope.notify("An unknown error has occured (Error #200)", "danger");
//                                            break;
//                                    }
//                                });
//                            } else {
//                                $scope.btnValidate = false;
//                                //inactive staff
//                                console.log("auth/account-not-available");
//                                $scope.passwordErrorMessage = null;
//                                $scope.staffIDErrorMessage = null;
//                                //(#error)auth-account-not-available
//                                $scope.notify("Your account is currently not available, please contact the administrator (Error: #201)", "danger");
//                                $scope.$apply();
//                            }
//                        } else {
//                            $scope.btnValidate = false;
//                            //cannot find email from database
//                            console.log("auth/no-matching-id");
//                            $scope.passwordErrorMessage = null;
//                            $scope.staffIDErrorMessage = "Invalid Staff ID";
//                            $scope.$apply();
//                        }
//                    }).catch(function(error) {
//                        console.log(error);
//                        if (error.code === "PERMISSION_DENIED") {
//                            //(#error)firebase-permission-denied
//                            $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
//                        } else {
//                            //(#error)unknown-error
//                            $scope.notify("An unknown error has occured (Error #000)", "danger");
//                        }
//                        $scope.btnValidate = false;
//                        $scope.$apply();
//                    });
//                } else {
//                    $scope.btnValidate = false;
//                    //check password empty
//                    console.log("auth/no-password-entered");
//                    $scope.passwordErrorMessage = "Password is required";
//                    $scope.staffIDErrorMessage = null;
//                }
//            } else {
//                $scope.btnValidate = false;
//                //regex staffID test
//                console.log("auth/invalid-id");
//                $scope.passwordErrorMessage = null;
//                $scope.staffIDErrorMessage = "Invalid Staff ID";
//            }
//        } else {
//            $scope.btnValidate = false;
//            //empty staffID
//            console.log("auth/no-id-entered");
//            $scope.passwordErrorMessage = null;
//            $scope.staffIDErrorMessage = "Staff ID is required";
//        }
//    };
        
    $scope.forgetPassword = function() {
        $scope.btnClicked = true;
        
        if ($scope.staffID == undefined) {
            $scope.btnClicked = false;
            //empty staffID/Email
            console.log("auth/no-id-entered");
            $scope.staffIDError = "Staff ID/Email is required";
        } else if (/^\w+$/.test($scope.staffID) && $scope.staffID.length === 5) {
            firebase.database().ref('logincheck/' + $scope.staffID).on('value', function(data) {
                if (data.val() == null) {
                    $scope.btnClicked = false;
                    console.log("auth/no-matching-id");
                    $scope.staffIDError = "Invalid Staff ID/Email";
                    $scope.$apply();
                } else if (data.val().status === "Active") {
                    $scope.email = data.val().email;
                    firebase.auth().sendPasswordResetEmail($scope.email).then(function() {
                        $location.path('/login').search('forget', $scope.email);
                        $route.reload();
                    }, function(error) {
                        $scope.btnClicked = false;
                        console.error("Reset failed:", error);
                        switch (error.code) {
                            case 'auth/invalid-email':
                                $scope.staffIDError = "Invalid Staff ID/Email";
                                break;
                            case 'auth/user-not-found':
                                $scope.staffIDError = "User cannot be found";
                                break;
                            default:
                                $scope.staffIDError = null;
                                //(#error)unknown-auth-error
                                $scope.notify("An unknown error has occured (Error #200)", "danger");
                                break;
                        }
                        $scope.$apply();
                    });
                } else {
                    $scope.btnClicked = false;
                    console.log("auth/account-not-available");
                    $scope.staffIDError = null;
                    //(#error)auth-account-not-available
                    $scope.notify("Your account is currently not available, please contact the administrator (Error: #201)", "danger");
                    $scope.$apply();
                }
            });
        } else if ($scope.staffID.includes("@") && $scope.staffID.includes(".")) {
            $scope.email = $scope.staffID;
            firebase.auth().sendPasswordResetEmail($scope.email).then(function() {
                $location.path('/login').search('forget', $scope.email);
                $route.reload();
            }, function(error) {
                $scope.btnClicked = false;
                console.error("Reset failed:", error);
                switch (error.code) {
                    case 'auth/invalid-email':
                        $scope.staffIDError = "Invalid Staff ID/Email";
                        break;
                    case 'auth/user-not-found':
                        $scope.staffIDError = "User cannot be found";
                        break;
                    default:
                        $scope.staffIDError = null;
                        //(#error)unknown-auth-error
                        $scope.notify("An unknown error has occured (Error #200)", "danger");
                        break;
                }
                $scope.$apply();
            });
        } else {
            $scope.btnClicked = false;
            console.log("auth/invalid-id-or-email");
            $scope.staffIDError = "Invalid Staff ID/Email";
        }
    };
    
//    $scope.forgetPassword = function() {
//        $scope.btnValidate = true;
//        if ($scope.staffID != undefined) {
//            if (/^\w+$/.test($scope.staffID) && $scope.staffID.length === 5) {
//                firebase.database().ref('logincheck/' + $scope.staffID).on('value', function(data) {
//                    if (data.val() != null) {
//                        if (data.val().status === "Active") {
//                            $scope.email = data.val().email;
//                            firebase.auth().sendPasswordResetEmail($scope.email).then(function() {
//                                $location.path('/login').search('forget', $scope.email);
//                                $route.reload();
//                            }, function(error) {
//                                console.error("Reset failed:", error);
//                                var message = '';
//                                switch (error.code) {
//                                    case 'auth/invalid-email':
//                                        $scope.passwordErrorMessage = null;
//                                        $scope.staffIDErrorMessage = "Invalid Staff ID/Email";
//                                        break;
//                                    case 'auth/user-not-found':
//                                        $scope.passwordErrorMessage = null;
//                                        $scope.staffIDErrorMessage = "User cannot be found";
//                                        break;
//                                    default:
//                                        $scope.passwordErrorMessage = null;
//                                        $scope.staffIDErrorMessage = null;
//                                        //(#error)unknown-auth-error
//                                        $scope.notify("An unknown error has occured (Error #200)", "danger");
//                                        break;
//                                }
//                                $scope.$apply();
//                            });
//                        } else {
//                            $scope.btnValidate = false;
//                            console.log("auth/account-not-available");
//                            $scope.passwordErrorMessage = null;
//                            $scope.staffIDErrorMessage = null;
//                            //(#error)auth-account-not-available
//                            $scope.notify("Your account is currently not available, please contact the administrator (Error: #201)", "danger");
//                            $scope.$apply();
//                        }
//                    } else {
//                        $scope.btnValidate = false;
//                        console.log("auth/no-matching-id");
//                        $scope.passwordErrorMessage = null;
//                        $scope.staffIDErrorMessage = "Invalid Staff ID/Email";
//                        $scope.$apply();
//                    }
//                });
//            } else if ($scope.staffID.includes("@") && $scope.staffID.includes(".")) {
//                $scope.email = $scope.staffID;
//                firebase.auth().sendPasswordResetEmail($scope.email).then(function() {
//                    $location.path('/login').search('forget', $scope.email);
//                    $route.reload();
//                }, function(error) {
//                    $scope.btnValidate = false;
//                    console.error("Reset failed:", error);
//                    var message = '';
//                    switch (error.code) {
//                        case 'auth/invalid-email':
//                            $scope.passwordErrorMessage = null;
//                            $scope.staffIDErrorMessage = "Invalid Staff ID/Email";
//                            break;
//                        case 'auth/user-not-found':
//                            $scope.passwordErrorMessage = null;
//                            $scope.staffIDErrorMessage = "User cannot be found";
//                            break;
//                        default:
//                            $scope.passwordErrorMessage = null;
//                            $scope.staffIDErrorMessage = null;
//                            //(#error)unknown-auth-error
//                            $scope.notify("An unknown error has occured (Error #200)", "danger");
//                            break;
//                    }
//                    $scope.$apply();
//                });
//            } else {
//                $scope.btnValidate = false;
//                console.log("auth/invalid-id-or-email");
//                $scope.passwordErrorMessage = null;
//                $scope.staffIDErrorMessage = "Invalid Staff ID/Email";
//            }
//        }
//    };
        
}]);