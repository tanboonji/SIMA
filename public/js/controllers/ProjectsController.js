app.controller('ProjectsController', ['$scope', '$location', '$firebaseAuth', '$firebaseObject', 
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
	
	var ref = firebase.database().ref().child("project");
	$scope.projectsList = $firebaseArray(ref);
	
	$scope.sortByList = ['Id', 'Name', 'Last Inspection', 'Defects'];
	$scope.sortByItem = 'Id';
	
	$scope.sortByItemSelected = function(itemSelected) {
		$scope.sortByItem = itemSelected;
	};
	
	$scope.goToAddProject = function() {
		$location.path('/add-project');
	};
	
}]);