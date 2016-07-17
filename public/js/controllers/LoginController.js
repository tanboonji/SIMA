app.controller('LoginController', ['$routeParams', '$route', '$scope', '$location', '$firebaseAuth', 
    function($routeParams, $route, $scope, $location, $firebaseAuth){
    
    $scope.auth = $firebaseAuth();
    
    $scope.auth.$onAuthStateChanged(function(firebaseUser) {
        $scope.firebaseUser = firebaseUser;
        if ($scope.firebaseUser !== null) {
            $location.path('/dashboard');
        }
    }); //end of $scope.auth.$onAuthStateChanged()
    
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
    } //end of notify()
    
    if ($routeParams.forget !== undefined) {
        $scope.notify("Thanks! Please check (" + $routeParams.forget + ") for a link to reset your password.", "success");
    };
        
    $scope.passwordErrorMessage = null;
    $scope.staffIDErrorMessage = null;
	
    $scope.login = function() {
        if ($scope.staffID !== undefined) {
            if (/^\w+$/.test($scope.staffID) && $scope.staffID.length === 5) {
                firebase.database().ref('logincheck/' + $scope.staffID).on('value', function(data) {
                    if (data.val() !== null) {
                        if (data.val().status === "Active") {
                            $scope.email = data.val().email;
                            $scope.auth.$signInWithEmailAndPassword($scope.email, $scope.password).then(function(firebaseUser) {
                                console.log("Signed in as:", firebaseUser.uid);
                                $scope.firebaseUser = firebaseUser;
                            }).catch(function(error) {
                                $scope.firebaseUser = null;
                                console.error("Authentication failed:", error);
                                var message = '';
                                switch (error.code) { /* edit */
                                    case 'auth/invalid-email':
                                        $scope.passwordErrorMessage = null;
                                        $scope.staffIDErrorMessage = "auth/invalid-id";
                                        break;
                                    case 'auth/user-not-found':
                                        $scope.passwordErrorMessage = null;
                                        $scope.staffIDErrorMessage = "auth/user-not-found";
                                        break;
                                    case 'auth/wrong-password':
                                        $scope.passwordErrorMessage = "auth/wrong-password";
                                        $scope.staffIDErrorMessage = null;
                                        break;
                                    case 'auth/too-many-requests':
                                        $scope.passwordErrorMessage = null;
                                        $scope.staffIDErrorMessage = null;
                                        $scope.notify("auth/too-many-requests", "danger");
                                        break;
                                    default:
                                        $scope.passwordErrorMessage = null;
                                        $scope.staffIDErrorMessage = null;
                                        $scope.notify(error.code, "danger");
                                        break;
                                }
                            }); //end of $scope.auth.$signInWithEmailAndPassword()
                        } else {
                            $scope.passwordErrorMessage = null;
                            $scope.staffIDErrorMessage = null;
                            $scope.notify("auth/account-not-available", "danger");
                        }
                    } else {
                        $scope.passwordErrorMessage = null;
                        $scope.staffIDErrorMessage = "auth/no-matching-id";
                        $scope.$apply();
                    }
                }); //end of firebase.database().ref()
            } else {
                $scope.passwordErrorMessage = null;
                $scope.staffIDErrorMessage = "auth/invalid-id";
            }
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
                            }).catch(function(error) {
                                console.error("Reset failed:", error);
                                var message = '';
                                switch (error.code) { /* edit */
                                    case 'auth/invalid-email':
                                        $scope.passwordErrorMessage = null;
                                        $scope.staffIDErrorMessage = null;
                                        $scope.notify(error.code, "danger");
                                        break;
                                    case 'auth/user-not-found':
                                        $scope.passwordErrorMessage = null;
                                        $scope.staffIDErrorMessage = null;
                                        $scope.notify(error.code, "danger");
                                        break;
                                    default:
                                        $scope.passwordErrorMessage = null;
                                        $scope.staffIDErrorMessage = null;
                                        $scope.notify(error.code, "danger");
                                        break;
                                }
                            }); //end of $scope.auth.$sendPasswordResetEmail()
                        } else {
                            $scope.passwordErrorMessage = null;
                            $scope.staffIDErrorMessage = null;
                            $scope.notify("auth/account-not-available", "danger");
                        }
                    } else {
                        $scope.passwordErrorMessage = null;
                        $scope.staffIDErrorMessage = "auth/no-matching-id";
                        $scope.$apply();
                    }
                }); //end of firebase.database().ref()
            } else if ($scope.staffID.includes("@")) {
                $scope.email = $scope.staffID;
                firebase.auth().sendPasswordResetEmail($scope.email).then(function() {
                    $location.path('/login').search('forget', $scope.email);
                    $route.reload();
                }).catch(function(error) {
                    console.error("Reset failed:", error);
                    var message = '';
                    switch (error.code) { /* edit */
                        case 'auth/invalid-email':
                            $scope.passwordErrorMessage = null;
                            $scope.staffIDErrorMessage = null;
                            $scope.notify(error.code, "danger");
                            break;
                        case 'auth/user-not-found':
                            $scope.passwordErrorMessage = null;
                            $scope.staffIDErrorMessage = null;
                            $scope.notify(error.code, "danger");
                            break;
                        default:
                            $scope.passwordErrorMessage = null;
                            $scope.staffIDErrorMessage = null;
                            $scope.notify(error.code, "danger");
                            break;
                    }
                }); //end of $scope.auth.$sendPasswordResetEmail()
            } else {
                $scope.passwordErrorMessage = null;
                $scope.staffIDErrorMessage = "auth/invalid-id-or-email";
            }
        }
    }; //end of $scope.forgetPassword()
    
    $scope.goToForgetPassword = function() {
        $location.path('/forget-password').search('forget', null);
    }; //end of $scope.goToForgetPassword()
    
    $scope.goToLogin = function() {
        $location.path('/login');
    }; //end of $scope.goToLogin()
        
}]);