app.controller('LoginController', ['$scope', '$location', '$firebaseAuth', 
	function($scope, $location, $firebaseAuth){
	
	$scope.auth = $firebaseAuth();
	
	$scope.auth.$onAuthStateChanged(function(firebaseUser) {
		$scope.firebaseUser = firebaseUser;
		if ($scope.firebaseUser !== null) {
			$location.path('/dashboard');
		}
	});
	
	$scope.login = function() {
		if (/^\w+$/.test($scope.staffId) && $scope.staffId.length === 5) {
			firebase.database().ref('logincheck/' + $scope.staffId).on('value', function(data) {
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
							$.notify({
								message: error.code /* edit */
							},{
								placement: {
									from: "top",
									align: "center"
								},
								type: "danger",
								timer: 5000,
								newest_on_top: true
							});
						});
					} else { 
						$.notify({
							message: "auth/account-not-available" /* edit */
						},{
							placement: {
								from: "top",
								align: "center"
							},
							type: "danger",
							timer: 5000,
							newest_on_top: true
						});
					}
				} else {
					$.notify({
						message: "auth/no-matching-id" /* edit */
					},{
						placement: {
							from: "top",
							align: "center"
						},
						type: "danger",
						timer: 5000,
						newest_on_top: true
					});
				}
			});
		} else {
			$.notify({
				message: "auth/invalid-id" /* edit */
			},{
				placement: {
					from: "top",
					align: "center"
				},
				type: "danger",
				timer: 5000,
				newest_on_top: true
			});
		}
	};
	
	$scope.forgetPassword = function() {
		
	};
	
}]);