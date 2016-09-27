app.controller('DashboardController', ['$rootScope', '$route', '$routeParams', '$scope', '$location', '$firebaseAuth', '$firebaseObject', 
	'$firebaseArray', function($rootScope, $route, $routeParams, $scope, $location, $firebaseAuth, $firebaseObject, $firebaseArray){
	
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
        
	$scope.auth = $firebaseAuth();
        
	//detect authentication state change (login/logout)
	$scope.auth.$onAuthStateChanged(function(firebaseUser) {
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
        if ($scope.user.isSuperAdmin) {
            alert("You do not have permission to view this webpage");
            $location.path("/admin");
            $route.reload();
        }
    };
        
    $scope.checkSoftRouting = function() {
        if ($scope.user.isSuperAdmin) {
            $location.path("/admin");
            $route.reload();
        }
    };
        
    $scope.logout = function() {
        delete $rootScope.user;
        $scope.auth.$signOut();
    }
    
    /*********************
    ******** Date ********
    *********************/
    
    Date.prototype.dayNow = function () { 
        return (this.getFullYear() + (((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1) + 
                ((this.getDate() < 10)?"0":"") + this.getDate());
    }
    
    /********************
    ** Search & Filter **
    ********************/
    
    $scope.sortByDateList = ['All','Today','This Week','This Month'];
	$scope.sortByDateItem = 'Today';
    $scope.startdate = moment().format("YYYYMMDD");
	
	$scope.sortByDateItemSelected = function(itemSelected) {
		$scope.sortByDateItem = itemSelected;
        if (itemSelected === "All")
            $scope.startdate = 0;
        else if (itemSelected === "Today")
            $scope.startdate = moment().format("YYYYMMDD");
        else if (itemSelected === "This Week")
            $scope.startdate = moment().subtract(7, "days").format("YYYYMMDD");
        else if (itemSelected === "This Month")
            $scope.startdate = moment().subtract(31, "days").format("YYYYMMDD");
        else
            $scope.startdate = 0;
	};
        
    $scope.dateRange = function(r) {
        return (r.date >= $scope.startdate);
    }
        
    $scope.sortByOrderList = ['Descending','Ascending'];
    $scope.sortByOrderItem = 'Descending';
    
    $scope.sortByOrderItemSelected = function(itemSelected) {
        $scope.sortByOrderItem = itemSelected;
        if (itemSelected === "Ascending") {
            $scope.recordList.sort(function(a,b) {
                a = a.inspectionDate.split('/').reverse().join('');
                b = b.inspectionDate.split('/').reverse().join('');
                return a > b ? 1 : a < b ? -1 : 0;
            });
        } else if (itemSelected === "Descending") {
            $scope.recordList.sort(function(a,b) {
                a = a.inspectionDate.split('/').reverse().join('');
                b = b.inspectionDate.split('/').reverse().join('');
                return a > b ? -1 : a < b ? 1 : 0;
            });
        }
    };
        
    $scope.search = function(r) {
    return (angular.lowercase(r.name).indexOf(angular.lowercase($scope.query) || '') !== -1 ||
            angular.lowercase(r.MCSTS).toString().indexOf(angular.lowercase($scope.query) || '') !== -1 ||
            angular.lowercase(r.BUHName).indexOf(angular.lowercase($scope.query) || '') !== -1 ||
            angular.lowercase(r.TMName).indexOf(angular.lowercase($scope.query) || '') !== -1 ||
            angular.lowercase(r.CMName).indexOf(angular.lowercase($scope.query) || '') !== -1);
    }
    
    $scope.userrole = function(r) {
        if ($scope.user.isAdmin)
            return true;
        else if (r.CMName === $scope.user.name || r.TMName === $scope.user.name || r.BUHName === $scope.user.name)
            return true;
        else
            return false;
    }
        
    /*********************
    *** Dashboard List ***
    *********************/
        
    $scope.transformDate = function(date) {
        var year = date.substr(0,4);
        var month = date.substr(4,2);
        var day = date.substr(6,2);
        var inspectionDate = day + "/" + month + "/" + year;
        return inspectionDate;
    }
    
    var ref = firebase.database().ref().child("record");

    $scope.refreshRecordList = function() {
        firebase.database().ref('record').once('value').then(function (recordSnapshot, error) {
            firebase.database().ref('project').once('value').then(function (projectSnapshot, error) {
                firebase.database().ref('staff').once('value').then(function (staffSnapshot, error) {
                    var tempList = [];
                    angular.forEach(recordSnapshot.val(), function(projectValue, projectKey) {
                        angular.forEach(projectValue, function(recordValue, recordKey) {
                            var temp = recordValue;
                            temp.date = recordKey;
                            temp.projectID = projectKey;
                            tempList.push(temp);
                        });
                    });
                    $scope.recordList = tempList;
                    tempList = [];
                    angular.forEach(staffSnapshot.val(), function(staffValue, projectKey) {
                        tempList.push(staffValue);
                    });
                    $scope.staffList = tempList;
                    angular.forEach($scope.recordList, function(recordValue, recordkey) {
                        recordValue.inspectionDate = $scope.transformDate(recordValue.date);
                        var projectID = recordValue.projectID;
                        recordValue.MCSTS = projectSnapshot.val()[projectID].MCSTS;
                        if (recordValue.MCSTS === "" || recordValue.MCSTS === undefined)
                            recordValue.MCSTS = "-";
                        recordValue.name = projectSnapshot.val()[projectID].name;
                        recordValue.BUH = recordValue.details.BUH;
                        recordValue.TM = recordValue.details.TM;
                        recordValue.CM = recordValue.details.CM;
                        var index = $scope.staffList.map(function(x) {return x.ID}).indexOf(recordValue.BUH);
                        recordValue.BUHName = $scope.staffList[index].name;
                        var index = $scope.staffList.map(function(x) {return x.ID}).indexOf(recordValue.TM);
                        recordValue.TMName = $scope.staffList[index].name;
                        var index = $scope.staffList.map(function(x) {return x.ID}).indexOf(recordValue.CM);
                        recordValue.CMName = $scope.staffList[index].name;
                        recordValue.issueCount = 0;
                        angular.forEach(recordValue.projectFacility, function(projectFacilityValue, projectFacilitykey) {
                            var categoryCount = -1;
                            angular.forEach(projectFacilityValue.category, function(categoryValue, categorykey) {
                                categoryCount++;
                                categoryValue.formID = categoryCount;
                                categoryValue.no = categoryCount+1;
                                categoryValue.ID = categorykey;
                                var questionCount = -1;
                                angular.forEach(categoryValue.question, function(questionValue, questionkey) {
                                    questionCount++;
                                    questionValue.formID = questionCount;
                                    var questionNo = 'abcdefghijklmnopqrstuvwxyz'[questionCount];
                                    questionValue.no = questionNo;
                                    questionValue.ID = questionkey;
                                    if (questionValue.answer === "no" || questionValue.comments.toLowerCase().includes("#issue")) {
                                        recordValue.issueCount++;
                                    }
                                    switch (questionValue.answer) {
                                        case "no":
                                            questionValue.isNo = true;
                                            break;
                                        case "na":
                                            questionValue.isNA = true;
                                            break;
                                        case "yes":
                                            questionValue.isYes = true;
                                            break;
                                        default:
                                            break;
                                    }
                                    if (questionValue.comments !== "" && questionValue.comments !== undefined)
                                        questionValue.hasComment = true;
                                    if (questionValue.type === "MCQ")
                                        questionValue.isMCQ = true;
                                    if (questionValue.image !== "")
                                        questionValue.hasImage = true;
                                });
                            });
                        });
                        if (recordValue.issueCount === 0)
                            recordValue.hasIssue = false;
                        else
                            recordValue.hasIssue = true;
                    });
                    $scope.recordList.sort(function(a,b) {
                        a = a.inspectionDate.split('/').reverse().join('');
                        b = b.inspectionDate.split('/').reverse().join('');
                        return a > b ? -1 : a < b ? 1 : 0;
                    });
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
    }; //end of $scope.refreshProjectList()

    ref.on('value', function() {
        $scope.refreshRecordList();
    });
        
    /*********************
    *** Dashboard View ***
    *********************/
    
    $scope.overlay = false;
    
    $scope.closeOverlay = function() {
        $scope.overlay = false;
    };
        
    $scope.openOverlay = function($event) {
        $event.stopPropagation();
    }
    
    $scope.showChecklist = function() {
        $scope.checklistShow = !$scope.checklistShow;
    }
        
    $scope.viewRecord = function(record) {
        $scope.checklistShow = false;
        $scope.overlay = true;
        $scope.record = record;
        
        $scope.record.fullBUH = "(" + $scope.record.BUH + ") " + $scope.record.BUHName;
        $scope.record.fullTM = "(" + $scope.record.TM + ") " + $scope.record.TMName;
        $scope.record.fullCM = "(" + $scope.record.CM + ") " + $scope.record.CMName;
    }
    
}]);