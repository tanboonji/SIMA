console.log(error);
if (error.code === "PERMISSION_DENIED") {
    //(#error)firebase-permission-denied
    $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
} else {
    //(#error)unknown-error
    $scope.notify("An unknown error has occured (Error #000)", "danger");
}

console.log(error);
switch (error.code) {
    case 'storage/unauthorized':
        //(#error)storage-unauthorized
        $scope.notify("You do not have the permission to access firebase storage (Error #100)", "danger");
        $scope.photoStatus = 'User does not have the permission to access the object';
        break;
    case 'storage/canceled':
        //(#error)storage-canceled
        $scope.notify("You cancelled the photo upload process (Error #101)", "danger");
        $scope.photoStatus = 'User cancelled the upload';
        break;
    case 'storage/unknown':
        //(#error)storage-unknown
        $scope.notify("An unknown error occured when accessing firebase storage (Error #102)", "danger");
        $scope.photoStatus = 'Unknown error occurred';
        break;
    default:
        //(#error)unknown-error
        $scope.notify("An unknown error has occurred (Error #103)", "danger");
        $scope.photoStatus = 'Unknown error occurred';
        break;
}

//(#error)database-user-not-found
console.log("database-user-not-found");
$scope.notify("User cannot be found in database (Error #002)", "danger");

//(#error)database-count-does-not-exist
console.log("database-count-does-not-exist");
$scope.notify("An error occured when accessing firebase database (Error #003)", "danger");

//(#error)database-category-not-found
console.log("database-category-not-found");
$scope.notify("An error occured when accessing firebase database (Error #004)", "danger");

//(#error)database-facility-not-found
console.log("database-facility-not-found");
$scope.notify("An error occured when accessing firebase database (Error #005)", "danger");

//(#error)database-project-not-found
console.log("database-project-not-found");
$scope.notify("An error occured when accessing firebase database (Error #006)", "danger");

//(#error)database-projectfacility-not-found
console.log("database-projectfacility-not-found");
$scope.notify("An error occured when accessing firebase database (Error #007)", "danger");

//(#error)user-not-admin
console.log("user-not-admin");
$scope.notify("You do not have the permission to access this function (Error #008)", "danger");

//(#error)database-cannot-get-new-staff-id
console.log("database-cannot-get-new-staff-id");
$scope.notify("An error occured when accessing firebase database (Error #009)", "danger");

//(#error)user-not-super-admin
console.log("user-not-super-admin");
$scope.notify("You do not have the permission to access this function (Error #010)", "danger");

//(#error)unknown-auth-error
$scope.notify("An unknown error has occured (Error #200)", "danger");

//(#error)auth-account-not-available
$scope.notify("Your account is currently not available, please contact the administrator (Error: #201)", "danger");

//(#error)auth-too-many-requests
$scope.notify("You have tried too many times, please wait awhile before trying again (Error: #202)", "danger");