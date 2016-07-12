app.controller('LoginController', ['$scope', 'Flash', '$location', '$firebaseAuth', 
	function($scope, Flash, $location, $firebaseAuth){
	
	$scope.auth = $firebaseAuth();
	
	$scope.auth.$onAuthStateChanged(function(firebaseUser) {
		$scope.firebaseUser = firebaseUser;
		if ($scope.firebaseUser !== null) {
			$location.path('/dashboard');
		}
	});
	
	$scope.login = function() {
		if (/^\w+$/.test($scope.staffId) && $scope.staffId.length === 5) {
			firebase.database().ref('loginchecks/' + $scope.staffId).on('value', function(data) {
				if (data.val() !== null) {
					if (data.val().status === "Active") {
						$scope.email = data.val().email;
						$scope.auth.$signInWithEmailAndPassword($scope.email, $scope.password)
							.then(function(firebaseUser) {
							console.log("Signed in as:", firebaseUser.uid);
							$scope.firebaseUser = firebaseUser;
						}).catch(function(error) {
							$scope.firebaseUser = null;
							console.error("Authentication failed:", error);
							var message = '';
							switch (error.code) { /* edit */
								case 'auth/invalid-email':
									break;
								case 'auth/user-not-found':
									break;
								case 'auth/wrong-password':
									break;
								case 'auth/too-many-requests':
									break;
								default:
									break;
							}
							if ($scope.flashId !== null) {
								Flash.dismiss($scope.flashId);
							}
							$scope.flashId = Flash.create('danger', error.code, 5000);
						});
					} else { 
						if ($scope.flashId !== null) {
							Flash.dismiss($scope.flashId);
						}
						$scope.flashId = Flash.create('danger', 'auth/account-not-available', 5000); /* edit */
					}
				} else {
					if ($scope.flashId !== null) {
						Flash.dismiss($scope.flashId);
					}
					$scope.flashId = Flash.create('danger', 'auth/no-matching-id', 5000); /* edit */
				}
			});
		} else {
			if ($scope.flashId !== null) {
				Flash.dismiss($scope.flashId);
			}
			$scope.flashId = Flash.create('danger', 'auth/invalid-id', 5000); /* edit */
		}
	};
	
	$scope.forgetPassword = function() {
		/* edit */
	};
	
}]);