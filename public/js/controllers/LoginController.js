app.controller('LoginController', ['$rootScope', '$routeParams', '$route', '$scope', '$location', '$firebaseAuth', 
    function($rootScope, $routeParams, $route, $scope, $location, $firebaseAuth){
    
    $scope.auth = $firebaseAuth();
    
    $scope.auth.$onAuthStateChanged(function(firebaseUser) {
        $scope.firebaseUser = firebaseUser;
        if ($scope.firebaseUser !== null) {
            firebase.database().ref('admin/' + $scope.firebaseUser.uid).once('value').then(function (snapshot, error) {
                if (snapshot.val() != null) {
                    if (snapshot.val().isSuperAdmin) {
                        $location.path('/admin');
                        $route.reload();
                    } else {
                        $location.path('/dashboard');
                        $route.reload();
                    }
                } else {
                    $location.path('/dashboard');
                    $route.reload();
                }
            });
        }
    });
    
    $scope.notify = function(message, type) {
        $.notify({
            message: message
        },{
            placement: {
                from: "top",
                align: "center"
            },
            type: type,
            timer: 5000,
            newest_on_top: true
        });
    }
    
    if ($routeParams.forget !== undefined) {
        $scope.notify("Thanks! Please check (" + $routeParams.forget + ") for a link to reset your password.", "success");
    };
        
    $scope.passwordErrorMessage = null;
    $scope.staffIDErrorMessage = null;
	
    $scope.login = function() {
        if ($scope.staffID !== undefined) {
            if (/^[A-Z][0-9]{4}/.test($scope.staffID)) {
                if ($scope.password !== undefined) {
                    firebase.database().ref('logincheck/' + $scope.staffID).on('value', function(data) {
                        if (data.val() !== null) {
                            if (data.val().status === "Active") {
                                $scope.email = data.val().email;
                                $scope.auth.$signInWithEmailAndPassword($scope.email, $scope.password).then(function(firebaseUser) {
                                    console.log("Signed in as:", firebaseUser.uid);
                                    $scope.firebaseUser = firebaseUser;
                                }).catch(function(error) {
                                    //firebase $auth error
                                    $scope.firebaseUser = null;
                                    console.error("Authentication failed:", error);
                                    var message = '';
                                    switch (error.code) { /* edit */
                                        case 'auth/invalid-email':
                                            $scope.passwordErrorMessage = null;
                                            $scope.staffIDErrorMessage = "Invalid Staff ID/Email";
                                            break;
                                        case 'auth/user-not-found':
                                            $scope.passwordErrorMessage = null;
                                            $scope.staffIDErrorMessage = "User cannot be found";
                                            break;
                                        case 'auth/wrong-password':
                                            $scope.passwordErrorMessage = "Invalid password";
                                            $scope.staffIDErrorMessage = null;
                                            break;
                                        case 'auth/too-many-requests':
                                            $scope.passwordErrorMessage = null;
                                            $scope.staffIDErrorMessage = null;
                                            $scope.notify("You have tried too many times, please wait awhile before trying again", "danger");
                                            break;
                                        default:
                                            $scope.passwordErrorMessage = null;
                                            $scope.staffIDErrorMessage = null;
                                            $scope.notify(error.code, "danger");
                                            break;
                                    }
                                });
                            } else {
                                //inactive staff
                                console.log("auth/account-not-available");
                                $scope.passwordErrorMessage = null;
                                $scope.staffIDErrorMessage = null;
                                $scope.notify("Your account is currently not available, please contact the administrator", "danger");
                                $scope.$apply();
                            }
                        } else {
                            //cannot find email from database
                            console.log("auth/no-matching-id");
                            $scope.passwordErrorMessage = null;
                            $scope.staffIDErrorMessage = "Invalid Staff ID/Email";
                            $scope.$apply();
                        }
                    });
                } else {
                    //check password empty
                    console.log("auth/no-password-entered");
                    $scope.passwordErrorMessage = "Password is required";
                    $scope.staffIDErrorMessage = null;
                }
            } else {
                //regex staffID test
                console.log("auth/invalid-id");
                $scope.passwordErrorMessage = null;
                $scope.staffIDErrorMessage = "Invalid Staff ID/Email";
            }
        } else {
            //empty staffID
            console.log("auth/no-id-entered");
            $scope.passwordErrorMessage = null;
            $scope.staffIDErrorMessage = "Staff ID/Email is required";
        }
    }; //end of $scope.login()
    
    $scope.forgetPassword = function() {
        if ($scope.staffID !== undefined) {
            if (/^\w+$/.test($scope.staffID) && $scope.staffID.length === 5) {
                firebase.database().ref('logincheck/' + $scope.staffID).on('value', function(data) {
                    if (data.val() !== null) {
                        if (data.val().status === "Active") {
                            $scope.email = data.val().email;
                            firebase.auth().sendPasswordResetEmail($scope.email).then(function() {
                                $location.path('/login').search('forget', $scope.email);
                                $route.reload();
                            }, function(error) {
                                console.error("Reset failed:", error);
                                var message = '';
                                switch (error.code) { /* edit */
                                    case 'auth/invalid-email':
                                        $scope.passwordErrorMessage = null;
                                        $scope.staffIDErrorMessage = "Invalid Staff ID/Email";
                                        break;
                                    case 'auth/user-not-found':
                                        $scope.passwordErrorMessage = null;
                                        $scope.staffIDErrorMessage = "User cannot be found";
                                        break;
                                    default:
                                        $scope.passwordErrorMessage = null;
                                        $scope.staffIDErrorMessage = null;
                                        $scope.notify(error.code, "danger");
                                        break;
                                }
                                $scope.$apply();
                            });
                        } else {
                            console.log("auth/account-not-available");
                            $scope.passwordErrorMessage = null;
                            $scope.staffIDErrorMessage = null;
                            $scope.notify("Your account is currently not available, please contact the administrator", "danger");
                            $scope.$apply();
                        }
                    } else {
                        console.log("auth/no-matching-id");
                        $scope.passwordErrorMessage = null;
                        $scope.staffIDErrorMessage = "Invalid Staff ID/Email";
                        $scope.$apply();
                    }
                });
            } else if ($scope.staffID.includes("@")) {
                $scope.email = $scope.staffID;
                firebase.auth().sendPasswordResetEmail($scope.email).then(function() {
                    $location.path('/login').search('forget', $scope.email);
                    $route.reload();
                }, function(error) {
                    console.error("Reset failed:", error);
                    var message = '';
                    switch (error.code) { /* edit */
                        case 'auth/invalid-email':
                            $scope.passwordErrorMessage = null;
                            $scope.staffIDErrorMessage = "Invalid Staff ID/Email";
                            break;
                        case 'auth/user-not-found':
                            $scope.passwordErrorMessage = null;
                            $scope.staffIDErrorMessage = "User cannot be found";
                            break;
                        default:
                            $scope.passwordErrorMessage = null;
                            $scope.staffIDErrorMessage = null;
                            $scope.notify(error.code, "danger");
                            break;
                    }
                    $scope.$apply();
                });
            } else {
                console.log("auth/invalid-id-or-email");
                $scope.passwordErrorMessage = null;
                $scope.staffIDErrorMessage = "Invalid Staff ID/Email";
            }
        }
    };
    
    $scope.goToForgetPassword = function() {
        $location.path('/forget-password').search('forget', null);
    };
    
    $scope.goToLogin = function() {
        $location.path('/login');
    };
        
}]);