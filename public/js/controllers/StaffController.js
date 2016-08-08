app.controller('StaffController', ['$scope', '$location', '$firebaseAuth', '$firebaseObject', 
	'$firebaseArray', function($scope, $location, $firebaseAuth, $firebaseObject, $firebaseArray){
	
	$scope.auth = $firebaseAuth();
	
	$scope.auth.$onAuthStateChanged(function(firebaseUser) {
		$scope.firebaseUser = firebaseUser;
		if ($scope.firebaseUser === null) {
			$location.path('/login');
		} else {
           firebase.database().ref("staff/" + $scope.firebaseUser.uid).once("value").then(function(snapshot) {
                if (snapshot.val() !== null) {
                    $scope.user = snapshot.val();
                    $scope.user.name = $scope.user.name.toUpperCase();
                    $scope.$apply();
                } else {
                    firebase.database().ref("adminstaff/" + $scope.firebaseUser.uid).once("value").then(function(snapshot) {
                        if (snapshot.val() !== null) {
                            $scope.user = snapshot.val();
                            $scope.user.name = $scope.user.name.toUpperCase();
                            $scope.$apply();
                        } else {
                            $scope.notify("user-not-found","danger"); /* edit */
                        } //end of if()
                    }).catch(function(error) {
                        if (error.code === "PERMISSION_DENIED") {
                            $scope.notify("auth/no-access-permission", "danger"); /* edit */
                        }
                    }); //end of firebase.database().ref()
                } //end of if()
            }).catch(function(error) {
                if (error.code === "PERMISSION_DENIED") {
                    $scope.notify("auth/no-access-permission", "danger"); /* edit */
                }
            }); //end of firebase.database().ref() 
        }
	});
        
    $scope.logout = function() {
        $scope.auth.$signOut();
    }
    
    var ref = firebase.database().ref().child("staff");
	$scope.staffList = $firebaseArray(ref);
	
	$scope.sortByList = ['Id', 'Name'];
	$scope.sortByItem = 'Id';
	
	$scope.sortByItemSelected = function(itemSelected) {
		$scope.sortByItem = itemSelected;
	};
        
    $scope.statusList = ['Active', 'Inactive', 'Deleted'];
	$scope.status = '--Status--';
        
    $scope.statusItemSelected = function(itemSelected) {
		$scope.status = itemSelected;
        
        if ($scope.status === "Inactive") {
            $scope.showStaffStatusMessage = true;
        } else {
            $scope.showStaffStatusMessage = false;
        }
	};
        
    $scope.roleList = ['HO', 'BUH', 'TM', 'CM'];
	$scope.role = '--Role--';
        
    $scope.roleItemSelected = function(itemSelected) {
		$scope.role = itemSelected;
	};
	
	$scope.goToAddStaff = function() {
		$location.path('/add-staff');
	};
        
    $scope.goToEditStaff = function() {
		$location.path('/edit-staff');
	};
        
    $scope.goToStaff = function() {
		$location.path('/staff');
	};
        
    /***** Add *****/
        
    $scope.addStaff = function() {
        
        if ($scope.name === undefined) {
            console.log("name");
            $scope.staffNameEmpty = true;
            $scope.staffContactEmpty = false;
            $scope.staffEmailEmpty = false;
            $scope.staffRoleEmpty = false;
            $scope.staffStatusEmpty = false;
            $scope.staffStatusMessageEmpty = false;
        } else if ($scope.contact === undefined) {
            $scope.staffNameEmpty = false;
            $scope.staffContactEmpty = true;
            $scope.staffEmailEmpty = false;
            $scope.staffRoleEmpty = false;
            $scope.staffStatusEmpty = false;
            $scope.staffStatusMessageEmpty = false;
        } else if ($scope.email === undefined) {
            $scope.staffNameEmpty = false;
            $scope.staffContactEmpty = false;
            $scope.staffEmailEmpty = true;
            $scope.staffRoleEmpty = false;
            $scope.staffStatusEmpty = false;
            $scope.staffStatusMessageEmpty = false;
        } else if ($scope.role === "--Role--") {
            $scope.staffNameEmpty = false;
            $scope.staffContactEmpty = false;
            $scope.staffEmailEmpty = false;
            $scope.staffRoleEmpty = true;
            $scope.staffStatusEmpty = false;
            $scope.staffStatusMessageEmpty = false;
        } else if ($scope.status === "--Status--") {
            $scope.staffNameEmpty = false;
            $scope.staffContactEmpty = false;
            $scope.staffEmailEmpty = false;
            $scope.staffRoleEmpty = false;
            $scope.staffStatusEmpty = true;
            $scope.staffStatusMessageEmpty = false;
        } else if ($scope.status === "Inactive" && $scope.statusMessage === undefined) {
            $scope.staffNameEmpty = false;
            $scope.staffContactEmpty = false;
            $scope.staffEmailEmpty = false;
            $scope.staffRoleEmpty = false;
            $scope.staffStatusEmpty = false;
            $scope.staffStatusMessageEmpty = true;
        } else {
            $scope.staffNameEmpty = false;
            $scope.staffContactEmpty = false;
            $scope.staffEmailEmpty = false;
            $scope.staffRoleEmpty = false;
            $scope.staffStatusEmpty = false;
            $scope.staffStatusMessageEmpty = false;
            
            /* Success Code */
            console.log("Success");
        } 
            
    }; //end of $scope.addFacility()
    
}]);