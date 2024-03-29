app.controller('ProjectsController', ['$rootScope', '$route', '$routeParams', '$scope', '$location', '$firebaseAuth', '$firebaseObject', 
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
    ***** Validation *****
    *********************/
        
    $scope.validation = [];
    $scope.btnValidate = false;
        
    $scope.btnValidateAdd = function() {
        $scope.validation.push("add");
        $scope.btnValidate = true;
    }
    
    $scope.btnValidateRemove = function() {
        $scope.validation.pop();
        if ($scope.validation.length === 0) {
            $scope.btnValidate = false;
            $scope.$apply();
        }
    }
        
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
            alert("You do not have permission to view this webpage (projects1)");
            $location.path("/admin").search("projectID",null).search("edit",null).search("add",null);
            $route.reload();
        } else if (!$scope.user.isBUH) {
            alert("You do not have permission to view this webpage (projects2)");
            $location.path("/dashboard").search("projectID",null).search("edit",null).search("add",null);
            $route.reload();
        } else if (!$scope.user.isAdmin) {
            if ($location.path() === "/add-project") {
                alert("You do not have permission to view this webpage (projects3)");
                $location.path("/dashboard").search("projectID",null).search("edit",null).search("add",null);
                $route.reload();
            } else {
                 if ($scope.user.lastPasswordChange == undefined) {
                     $scope.changePasswordReason = "this is your first time logging in and you are still using the default password.";
                     $scope.popupform = true;
                 } else {
//                    $scope.loadController();
                 }
            }
        } else {
             if ($scope.user.lastPasswordChange == undefined) {
                 $scope.changePasswordReason = "this is your first time logging in and you are still using the default password.";
                 $scope.popupform = true;
             } else {
//                $scope.loadController();
             }
        }
    };
        
    $scope.checkSoftRouting = function() {
        if ($scope.user.isSuperAdmin) {
            $location.path("/admin").search("projectID",null).search("edit",null).search("add",null);
            $route.reload();
        } else if (!$scope.user.isBUH) {
            $location.path("/dashboard").search("projectID",null).search("edit",null).search("add",null);
            $route.reload();
        } else if (!$scope.user.isAdmin) {
            if ($location.path() === "/add-project") {
                alert("You do not have permission to view this webpage");
                $location.path("/dashboard").search("projectID",null).search("edit",null).search("add",null);
                $route.reload();
            } else {
                console.log("here");
                 if ($scope.user.lastPasswordChange == undefined) {
                     $scope.changePasswordReason = "this is your first time logging in and you are still using the default password.";
                     $scope.popupform = true;
                 } else {
//                    $scope.loadController();
                 }
            }
        } else {
             if ($scope.user.lastPasswordChange == undefined) {
                 $scope.changePasswordReason = "this is your first time logging in and you are still using the default password.";
                 $scope.popupform = true;
             } else {
//                $scope.loadController();
             }
        }
    };
        
    $scope.logout = function() {
        delete $rootScope.user;
        $scope.auth.$signOut();
    }
        
    /********************
    ****** Routing ******
    ********************/
	
	$scope.goToAddProject = function() {
		$location.path('/add-project').search('add',null).search('edit',null).search('projectID',null);
	};
        
    $scope.goToProjects = function() {
        $location.path('/projects').search('add',null).search('edit',null).search('projectID',null);
    }
    
    $scope.goToEditProject = function(p) {
        if (p === undefined) {
            if ($scope.projectID !== undefined) {
                $location.path("/edit-project").search("projectID",$scope.projectID).search("edit",null).search("add",null);
            } else {
                $location.path("/edit-project").search("projectID",$scope.project.ID).search("edit",null).search("add",null);
            }
        } else {
            $location.path("/edit-project").search("projectID",p.ID).search("edit",null).search("add",null);
        }
    };
    
    /*********************
    ******** Date ********
    *********************/
        
    Date.prototype.dayNow = function () { 
        return (this.getFullYear() + "/" + (((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1) + "/" + 
            ((this.getDate() < 10)?"0":"") + this.getDate());
    }
    
    Date.prototype.timeNow = function () {
        return ((this.getHours() < 10)?"0":"") + this.getHours() + ":" + ((this.getMinutes() < 10)?"0":"") + 
            this.getMinutes() + ":" + ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
    }
    
    /*********************
    *** Password Popup ***
    *********************/
    
    $scope.closePopup = function() {
        $scope.popupform = false;
    };
        
    $scope.openPopup = function($event) {
        $event.stopPropagation();
    };
        
    //update password of currently logged in user
    $scope.updatePassword = function () {
        if ($scope.newPassword == undefined || $scope.newPassword == "") {
            $scope.passwordEmpty = true;
            $scope.passwordLength = false;
            $scope.passwordComplex = false;
            
            $scope.passwordMatch = false;
            $scope.pwdEmpty1 = true;
        } else {
            if ($scope.newPassword.length < 8) {
                $scope.passwordEmpty = false;
                $scope.passwordLength = true;
                $scope.passwordComplex = false;
                
                $scope.passwordMatch = false;
                $scope.pwdEmpty1 = true;
            } else if (!/[A-z]/.test($scope.newPassword) || !/\d/.test($scope.newPassword)) {
                $scope.passwordEmpty = false;
                $scope.passwordLength = false;
                $scope.passwordComplex = true;
                
                $scope.passwordMatch = false;
                $scope.pwdEmpty1 = true;
            } else {
                $scope.passwordEmpty = false;
                $scope.passwordLength = false;
                $scope.passwordComplex = false;

                $scope.passwordMatch = false;
                $scope.pwdEmpty1 = false;
            }
        }
        
        if ($scope.confirmPassword == undefined || $scope.confirmPassword == "") {
            $scope.passwordEmpty2 = true;
            $scope.passwordLength2 = false;
            $scope.passwordComplex2 = false;
            
            $scope.passwordMatch = false;
            $scope.pwdEmpty2 = true;
        } else {
            if ($scope.confirmPassword.length < 8) {
                $scope.passwordEmpty2 = false;
                $scope.passwordLength2 = true;
                $scope.passwordComplex2 = false;
                
                $scope.passwordMatch = false;
                $scope.pwdEmpty2 = true;
            } else if (!/[A-z]/.test($scope.confirmPassword) || !/\d/.test($scope.confirmPassword)) {
                $scope.passwordEmpty2 = false;
                $scope.passwordLength2 = false;
                $scope.passwordComplex2 = true;
                
                $scope.passwordMatch = false;
                $scope.pwdEmpty2 = true;
            } else {
                $scope.passwordEmpty2 = false;
                $scope.passwordLength2 = false;
                $scope.passwordComplex2 = false;

                $scope.passwordMatch = false;
                $scope.pwdEmpty2 = false;
            }
        }
        
        if ($scope.pwdEmpty2 === false) {
            if ($scope.confirmPassword !== $scope.newPassword) {
//                $scope.passwordEmpty = false;
//                $scope.passwordLength = false;
//                $scope.passwordComplex = false;

                $scope.passwordEmpty2 = false;
                $scope.passwordLength2 = false;
                $scope.passwordComplex2 = false;

                $scope.passwordMatch = true;
                $scope.pwdEmpty2 = true;
                $scope.pwdEmpty1 = true;
            }
        }

        if ($scope.pwdEmpty1 === false && $scope.pwdEmpty2 === false) {
            //if confirm password field is identical, update password
            $scope.auth.$updatePassword($scope.newPassword).then(function () {
                var newDate = new Date();
                var datetime = newDate.dayNow() + " @ " + newDate.timeNow();
                var updates = {};
                
                firebase.database().ref('adminstaff/' + $scope.user.authID).once('value').then(function (snapshot, error) {
                    if (snapshot.val() != null) {
                        updates["/adminstaff/" + $scope.user.authID + '/lastPasswordChange'] = datetime;
                        firebase.database().ref().update(updates);
                    } else {
                        updates["/staff/" + $scope.user.authID + '/lastPasswordChange'] = datetime;
                        firebase.database().ref().update(updates);
                    }
                });
                $scope.popupform = !$scope.popupform;
                alert("You have successfully updated your password\n\nPlease login again\n");
                $scope.auth.$signOut();
            }).catch(function (error) {
                console.log(error);
                if (error.code === "auth/requires-recent-login") {
                    //(#error)auth-requires-recent-login
                    alert(error);
                    $scope.auth.$signOut();
                } else if (error.code === "auth/email-already-in-use")
                    //(#error)auth-email-already-in-use
                    alert(error);
                else
                    //(#error)unknown-auth-error
                    $scope.notify("An unknown error has occured (Error #200)", "danger");
            });
        }
    }; //end of $scope.updatePassword()
        
    /*********************
    **** Project List ****
    *********************/
    
    if ($routeParams.add !== undefined) {
        $scope.notify("Successfully added \"" +$routeParams.add + "\" project","success");
    }
        
    if ($routeParams.edit !== undefined) {
        $scope.notify("Successfully saved \"" +$routeParams.edit + "\" project","success");
    }
    
    if ($location.path() === "/projects") {
        var ref = firebase.database().ref().child("project");
        
        $scope.refreshProjectList = function() {
            firebase.database().ref('project').once('value').then(function (projectSnapshot, error) {
                firebase.database().ref('staff').once('value').then(function (staffSnapshot, error) {
                    tempList = [];
                    angular.forEach(staffSnapshot.val(), function(staffValue, projectKey) {
                        tempList.push(staffValue);
                    });
                    $scope.staffList = tempList;
                    var tempList = [];
                    angular.forEach(projectSnapshot.val(), function(projectValue, key) {
                        if (projectValue.MCSTS === undefined || projectValue.MCSTS === "")
                            projectValue.MCSTS = "-";
                        var index = $scope.staffList.map(function(x) {return x.ID}).indexOf(projectValue.BUH);
                        projectValue.BUHName = $scope.staffList[index].name;
                        var index = $scope.staffList.map(function(x) {return x.ID}).indexOf(projectValue.TM);
                        projectValue.TMName = $scope.staffList[index].name;
                        var index = $scope.staffList.map(function(x) {return x.ID}).indexOf(projectValue.CM);
                        projectValue.CMName = $scope.staffList[index].name;
                        if (projectValue.deletedAt !== undefined)
                            projectValue.deleted = true;
                        else
                            projectValue.deleted = false;
                        tempList.push(projectValue);
                    });
                    $scope.projectList = tempList;
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
        };

        ref.on('value', function() {
            $scope.refreshProjectList();
        });
    }
    
    /********************
    *** Magic Suggest ***
    **** Project Add ****
    ********************/
    
    if ($location.path() === "/add-project") {
//        $scope.staffList = [];
        $scope.buhList = [];
        $scope.tmList = [];
        $scope.cmList = [];
        $scope.fullStaff = [];

        firebase.database().ref('staff/').once('value').then(function (snapshot) {
            
            snapshot.forEach(function(staffValue) {
                if (staffValue.val().status === "Active") {
                    $scope.fullStaff.push(staffValue.val());
//                    $scope.staffList.push("(" + staffValue.val().ID + ") " + staffValue.val().name);
                    if (staffValue.val().role === "CM") {
                        $scope.cmList.push("(" + staffValue.val().ID + ") " + staffValue.val().name);
                    } else if (staffValue.val().role === "TM") {
                        $scope.cmList.push("(" + staffValue.val().ID + ") " + staffValue.val().name);
                        $scope.tmList.push("(" + staffValue.val().ID + ") " + staffValue.val().name);
                    } else if (staffValue.val().role === "EXCO") {
                        $scope.buhList.push("(" + staffValue.val().ID + ") " + staffValue.val().name);
                    } else if (staffValue.val().role === "BUH") {
                        $scope.tmList.push("(" + staffValue.val().ID + ") " + staffValue.val().name);
                        $scope.buhList.push("(" + staffValue.val().ID + ") " + staffValue.val().name);
                    }
                }
            });

            $scope.BUH = $('#magicsuggestBUH').magicSuggest({
                allowFreeEntries: false,
                data: $scope.buhList,
                highlight: false,
                placeholder: "Enter project BUH",
                maxSelection: 1
            });
            $scope.TM = $('#magicsuggestTM').magicSuggest({
                allowFreeEntries: false,
                data: $scope.tmList,
                highlight: false,
                placeholder: "Enter project TM",
                maxSelection: 1
            });
            $scope.CM = $('#magicsuggestCM').magicSuggest({
                allowFreeEntries: false,
                data: $scope.cmList,
                highlight: false,
                placeholder: "Enter project CM",
                maxSelection: 1
            });
        });
    }
        
    /********************
    ***** Checklist *****
    **** Project Add ****
    ********************/
    
    $scope.frequencyList = ["Daily","Weekly","Monthly","Quarterly","Yearly"];
        
    $scope.frequencyItemSelected = function(facility, frequency) {
        if (facility.frequency != frequency) {
            var oldFrequency = facility.frequency;
            var oldNumber = facility.order;
            facility.frequency = frequency;

            switch (frequency) {
                case 'Daily':
                    facility.order = ++$scope.dailySize;
                    $scope.dailyList.push($scope.dailySize);
                    break;
                case 'Weekly':
                    facility.order = ++$scope.weeklySize;
                    $scope.weeklyList.push($scope.weeklySize);
                    break;
                case 'Monthly':
                    facility.order = ++$scope.monthlySize;
                    $scope.monthlyList.push($scope.monthlySize);
                    break;
                case 'Quarterly':
                    facility.order = ++$scope.quarterlySize;
                    $scope.quarterlyList.push($scope.quarterlySize);
                    break;
                case 'Yearly':
                    facility.order = ++$scope.yearlySize;
                    $scope.yearlyList.push($scope.yearlySize);
                    break;
            }

            switch (oldFrequency) {
                case 'Daily':
                    --$scope.dailySize;
                    $scope.dailyList.pop();
                    break;
                case 'Weekly':
                    --$scope.weeklySize;
                    $scope.weeklyList.pop();
                    break;
                case 'Monthly':
                    --$scope.monthlySize;
                    $scope.monthlyList.pop();
                    break;
                case 'Quarterly':
                    --$scope.quarterlySize;
                    $scope.quarterlyList.pop();
                    break;
                case 'Yearly':
                    --$scope.yearlySize;
                    $scope.yearlyList.pop();
                    break;
            }

            $scope.reorganizeNumberList(oldFrequency, oldNumber);
        }
    }
    
    $scope.reorganizeNumberList = function(frequency, number) {
        angular.forEach($scope.project.projectFacilityList, function(projectFacilityValue, key) {
            if (projectFacilityValue.frequency == frequency) {
                if (number <= projectFacilityValue.order)
                    projectFacilityValue.order--;
            }
        })
    }
    
    $scope.addCategory = function(facility) {
        facility.categoryCount++;
        var newQuestion = {name:"", formID:0, no:"a", type:"MCQ"};
        var newCategory = {name:"", formID:facility.categoryCount, no:facility.categoryCount+1,
            questionCount:0, question:[newQuestion]};
        facility.checklist.push(newCategory);
    };
    
    $scope.addQuestion = function(category) {
        category.questionCount++;
        var questionNo = 'abcdefghijklmnopqrstuvwxyz'[category.questionCount];
        var newQuestion = {name:"", formID:category.questionCount, no:questionNo, type:"MCQ"};
        category.question.push(newQuestion);
    };
    
    $scope.deleteCategory = function(facility, category) {
        if (facility.categoryCount !== 0) {
            facility.categoryCount--;
            var index = facility.checklist.indexOf(category);
            facility.checklist.splice(index, 1);
            
            for(index; index < facility.checklist.length; index++) {
                facility.checklist[index].formID = index;
                facility.checklist[index].no = index+1;
            }
        }
    };
    
    $scope.deleteQuestion = function(category,question) {
        if (category.questionCount !== 0) {
            category.questionCount--;
            var index = category.question.indexOf(question);
            category.question.splice(index, 1);
            
            for(index; index < category.question.length; index++) {
                var questionNo = 'abcdefghijklmnopqrstuvwxyz'[index];
                category.question[index].formID = index;
                category.question[index].no = questionNo;
            }
        }
    };
    
    /** edit now **/
    $scope.deleteFacility = function(facility) {
//        $scope.facilityList.unshift({name:facility.name});
        var index = $scope.facilityAddedList.indexOf(facility);
        $scope.facilityAddedList.splice(index,1);
    };
    
    /** edit now **/
    $scope.moveFacility = function(facility) {
        if ($scope.validation.length === 0) {
            $scope.addFacilityToAddedList(facility.name);
        }
//        var index = $scope.facilityList.map(function(x) {return x.name}).indexOf(facility.name);
//        $scope.facilityList.splice(index,1);
    };
        
    /********************
    **** Drag & Drop ****
    **** Project Add ****
    ********************/
    
    if ($location.path() === "/add-project") {
        var dragAndDrop = {
            init: function () {
                this.dragula();
                this.eventListeners();
            },
            eventListeners: function () {
                this.dragula.on('drop', this.dropped.bind(this));
            },
            dragula: function () {
                this.dragula = dragula([document.querySelector('#left'), document.querySelector('#right')],
                {
                    revertOnSpill: true,
                });
            },
            dropped: function (el, source, target) {
                /** edit now **/
                if (target.id === "left" && source.id === "right") {
                    if ($scope.validation.length === 0) {
                        $scope.addFacilityToAddedList(el.id);
                        el.remove();
                        $scope.$apply();
                    }
//                    var index = $scope.facilityList.map(function(x) {return x.name}).indexOf(el.id);
//                    $scope.facilityList.splice(index,1);
                } else if (target.id === "right" && source.id === "left") {
//                    $scope.facilityList.unshift({name:el.id});
                    var index = $scope.facilityAddedList.map(function(x) {return x.name}).indexOf(el.id);
                    $scope.deleteAddedProjectFacility($scope.facilityAddedList[index]);
                    el.remove();
                    $scope.$apply();
                }
            }
        };

        dragAndDrop.init();
    }
        
    /********************
    **** Project Add ****
    ********************/

    $scope.facilityAddedList = [];

    $scope.refreshFacilityList = function() {
        firebase.database().ref('facility').once('value').then(function (snapshot, error) {
            var tempList = [];
            angular.forEach(snapshot.val(), function(facilityValue, key) {
                if (facilityValue.deletedAt !== undefined)
                    facilityValue.deleted = true;
                else
                    facilityValue.deleted = false;
                tempList.push(facilityValue);
            });
            $scope.facilityList = tempList;
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
    };
        
    if ($location.path() === "/add-project" || $location.path() === "/edit-project") {
        $scope.refreshFacilityList();
    }
    
    /** edit now **/
    $scope.addFacilityToAddedList = function(facilityName) {
        $scope.btnValidateAdd();
        $scope.facilityAddedList.unshift({name:facilityName,frequency:"Daily"});
        
        firebase.database().ref("facility").orderByChild("name").equalTo(facilityName).once("value").then(function(snapshot) {
            if (snapshot.val() != null) {
                angular.forEach(snapshot.val(), function(facilityValue, key) {
                    $scope.facilityAddedList[0].ID = facilityValue.ID;
                    $scope.facilityAddedList[0].category = facilityValue.category;
                    $scope.facilityAddedList[0].show = false;
                    console.log(facilityValue);
                });
                $scope.facilityAddedList[0].categoryCount = -1;
                $scope.facilityAddedList[0].checklist = [];
                angular.forEach($scope.facilityAddedList[0].category, function(categoryValue, key) {
                    $scope.facilityAddedList[0].categoryCount++;
                    $scope.facilityAddedList[0].checklist.push({});
                    var categoryCount = $scope.facilityAddedList[0].categoryCount;
                    $scope.facilityAddedList[0].checklist[categoryCount].name = categoryValue.name;
                    $scope.facilityAddedList[0].checklist[categoryCount].ID = categoryValue.ID;
                    $scope.facilityAddedList[0].checklist[categoryCount].no = categoryCount+1;
                    $scope.facilityAddedList[0].checklist[categoryCount].formID = categoryCount;
                    $scope.facilityAddedList[0].checklist[categoryCount].questionCount = -1;
                    $scope.facilityAddedList[0].checklist[categoryCount].question = [];
                    
                    angular.forEach(categoryValue.question, function(questionValue, key) {
                        $scope.facilityAddedList[0].checklist[categoryCount].question.push({});
                        $scope.facilityAddedList[0].checklist[categoryCount].questionCount++;
                        var questionCount = $scope.facilityAddedList[0].checklist[categoryCount].questionCount;
                        var questionNo = 'abcdefghijklmnopqrstuvwxyz'[questionCount];
                        $scope.facilityAddedList[0].checklist[categoryCount].question[questionCount].formID = questionCount;
                        $scope.facilityAddedList[0].checklist[categoryCount].question[questionCount].no = questionNo;
                        $scope.facilityAddedList[0].checklist[categoryCount].question[questionCount].name = questionValue.name;
                        $scope.facilityAddedList[0].checklist[categoryCount].question[questionCount].ID = questionValue.ID;
                        $scope.facilityAddedList[0].checklist[categoryCount].question[questionCount].type = questionValue.type;
                    });
                    
//                    firebase.database().ref("category/" + categoryID).once("value").then(function(snapshot) {
//                        if (snapshot.val() != null) {
//                            $scope.facilityAddedList[0].categoryCount++;
//                            $scope.facilityAddedList[0].checklist.push({});
//                            var categoryCount = $scope.facilityAddedList[0].categoryCount;
//                            $scope.facilityAddedList[0].checklist[categoryCount].name = snapshot.val().name;
//                            $scope.facilityAddedList[0].checklist[categoryCount].ID = snapshot.val().ID;
//                            $scope.facilityAddedList[0].checklist[categoryCount].no = categoryCount+1;
//                            $scope.facilityAddedList[0].checklist[categoryCount].formID = categoryCount;
//                            $scope.facilityAddedList[0].checklist[categoryCount].questionCount = -1;
//                            $scope.facilityAddedList[0].checklist[categoryCount].question = [];
//
//                            angular.forEach(snapshot.val().question, function(questionValue, key) {
//                                $scope.facilityAddedList[0].checklist[categoryCount].question.push({});
//                                $scope.facilityAddedList[0].checklist[categoryCount].questionCount++;
//                                var questionCount = $scope.facilityAddedList[0].checklist[categoryCount].questionCount;
//                                var questionNo = 'abcdefghijklmnopqrstuvwxyz'[questionCount];
//                                $scope.facilityAddedList[0].checklist[categoryCount].question[questionCount].formID = questionCount;
//                                $scope.facilityAddedList[0].checklist[categoryCount].question[questionCount].no = questionNo;
//                                $scope.facilityAddedList[0].checklist[categoryCount].question[questionCount].name = questionValue.name;
//                                $scope.facilityAddedList[0].checklist[categoryCount].question[questionCount].ID = questionValue.ID;
//                                $scope.facilityAddedList[0].checklist[categoryCount].question[questionCount].type = questionValue.type;
//                                $scope.$apply();
//                            });
//                            $scope.btnValidateRemove();
//                        } else {
//                            //(#error)database-category-not-found
//                            console.log("database-category-not-found");
//                            $scope.notify("An error occured when accessing firebase database (Error #004)", "danger");
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
//                    });
                });
                
                $scope.facilityAddedList[0].order = ++$scope.dailySize;
                $scope.dailyList.push($scope.dailySize);
                
                $scope.btnValidateRemove();
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
    };
        
//    $scope.sortAddProject = function() {
//        $scope.facilityAddedList.sort(function(a, b) {
//            switch (a.frequency) {
//                case 'Daily':
//                    if (b.frequency == 'Daily')
//                        return (a.no - b.no);
//                    else
//                        return -1;
//                    break;
//                case 'Weekly':
//                    if (b.frequency == 'Daily')
//                        return 1;
//                    else
//                        return (a.no - b.no);
//                    break;
//                case 'Monthly':
//                    if (b.frequency == 'Daily' || b.frequency == 'Weekly')
//                        return 1;
//                    else
//                        return (a.no - b.no);
//                    break;
//                case 'Quarterly':
//                    if (b.frequency == 'Daily' || b.frequency == 'Weekly' || b.frequency == 'Monthly')
//                        return 1;
//                    else
//                        return (a.no - b.no);
//                    break;
//                case 'Yearly':
//                    if (b.frequency == 'Daily' || b.frequency == 'Weekly' || b.frequency == 'Monthly' || b.frequency == 'Quarterly')
//                        return 1;
//                    else
//                        return (a.no - b.no);
//                    break;
//            }
//        });
//    };
    
    $scope.validateProject = function() {
        if ($scope.MCSTS === undefined || $scope.MCSTS === "") {
            $scope.MCSTSError = false;
            $scope.projectMCSTSInvalid = false;
            $scope.projectMCSTSLength = false;
        } else {
            if (!/^\d*(\.?)\d+$/.test($scope.MCSTS)) {
                $scope.MCSTSError = true;
                $scope.projectMCSTSInvalid = true;
                $scope.projectMCSTSLength = false;
            } else {
                if (!/^[0-9]{4}$/.test($scope.MCSTS)) {
                    $scope.MCSTSError = true;
                    $scope.projectMCSTSInvalid = false;
                    $scope.projectMCSTSLength = true;
                } else {
                    $scope.MCSTSError = false;
                    $scope.projectMCSTSInvalid = false;
                    $scope.projectMCSTSLength = false;
                }
            }
        }
        
        if ($scope.name === undefined || $scope.name === "")
            $scope.projectNameEmpty = true;
        else
            $scope.projectNameEmpty = false;
        
        if ($scope.address === undefined || $scope.address === "")
            $scope.projectAddressEmpty = true;
        else
            $scope.projectAddressEmpty = false;
        
        if ($scope.BUH.getValue().length === 0)
            $scope.projectBUHEmpty = true;
        else
            $scope.projectBUHEmpty = false;
        
        if ($scope.TM.getValue().length === 0)
            $scope.projectTMEmpty = true;
        else
            $scope.projectTMEmpty = false;
        
        if ($scope.CM.getValue().length === 0) {
            $scope.projectCMEmpty = true;
            $scope.projectCMError = true;
        } else {
            $scope.projectCMEmpty = false;
            $scope.projectCMError = false;
        }
        
        var error = false;
        $scope.checklistEmpty = false;
        
        angular.forEach($scope.facilityAddedList, function(facilityValue, key) {
            angular.forEach(facilityValue.checklist, function(categoryValue, key) {
                categoryValue.error = false;
            });
        });

        angular.forEach($scope.facilityAddedList, function(facilityValue, key) {
            angular.forEach(facilityValue.checklist, function(categoryValue, key) {
                if (categoryValue.name === undefined || categoryValue.name === "") {
                    $scope.checklistEmpty = true;
                    categoryValue.error = true;
                    error = true;
                } else {
                    angular.forEach(categoryValue.question, function(questionValue, key) {
                        if (questionValue.name === undefined || questionValue.name === "") {
                            $scope.checklistEmpty = true;
                            categoryValue.error = true;
                            error = true;
                        }
                    });
                }
            });
        });
        
//        if ($scope.projectCMError === false) {
            var CM = $scope.CM.getValue()[0];
            $scope.CMName = CM.substr(8);
            $scope.CMID = CM.substr(1,5);
//            
//            var index = $scope.fullStaff.map(function(x) {return x.name}).indexOf($scope.CMName);
//            if ($scope.fullStaff[index].hasProject) {
//                $scope.projectCMInvalid = true;
//                $scope.projectCMError = true;
//            } else {
//                $scope.newCM = $scope.fullStaff[index];
//                $scope.projectCMInvalid = false;
//                $scope.projectCMError = false;
//            }
//        }
        
//        if (!error && !$scope.MCSTSError && !$scope.projectNameEmpty && !$scope.projectAddressEmpty && !$scope.projectBUHEmpty && !$scope.projectTMEmpty && !$scope.projectCMEmpty && !$scope.checklistEmpty && !$scope.projectCMInvalid) {
        if (!error && !$scope.MCSTSError && !$scope.projectNameEmpty && !$scope.projectAddressEmpty && !$scope.projectBUHEmpty && !$scope.projectTMEmpty && !$scope.projectCMEmpty && !$scope.checklistEmpty) {
            var BUH = $scope.BUH.getValue()[0];
            $scope.BUHName = BUH.substr(8);
            $scope.BUHID = BUH.substr(1,5);
            var TM = $scope.TM.getValue()[0];
            $scope.TMName = TM.substr(8);
            $scope.TMID = TM.substr(1,5);
            
            $scope.addProject();
        }
    } //end of $scope.validateProject()
    
    //new database format - add project method
    $scope.addProject = function() {
        $scope.projectFacilityAdded = [];

        firebase.database().ref('count').once('value').then(function (snapshot, error) {
            if (snapshot.val() !== null) {

                $scope.projectAlphabet = snapshot.val().projectCount.alphabet;
                $scope.projectFacilityAlphabet = snapshot.val().projectFacilityCount.alphabet;
                $scope.projectCount = snapshot.val().projectCount.count;
                $scope.projectFacilityCount = snapshot.val().projectFacilityCount.count;
                $scope.categoryAlphabet = "C";
                $scope.categoryCount = 0;
                $scope.questionAlphabet = "Q";
                $scope.questionCount = 0;

                $scope.projectCount++;

                angular.forEach($scope.facilityAddedList, function(facilityValue, key) {
                    
                    $scope.projectFacilityCount++;
                    $scope.projectFacilityAdded.push($scope.projectFacilityAlphabet + $scope.projectFacilityCount);

                    //add projectFacility details
                    firebase.database().ref('projectfacility/' + $scope.projectFacilityAlphabet + $scope.projectFacilityCount).set({
                            frequency: facilityValue.frequency,
                            name: facilityValue.name,
                            order: facilityValue.order,
                            ID: $scope.projectFacilityAlphabet + $scope.projectFacilityCount,
                            projectID: $scope.projectAlphabet + $scope.projectCount
                    }).then(function() {
                        firebase.database().ref('count/projectFacilityCount').set({
                            count: $scope.projectFacilityCount,
                            alphabet: $scope.projectFacilityAlphabet
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

//                    //add category in each projectFacility
//                    angular.forEach($scope.categoryAdded, function(categoryValue, key) {
//                        firebase.database().ref('projectfacility/' + $scope.projectFacilityAlphabet + $scope.projectFacilityCount 
//                                + '/category/' + categoryValue).set(categoryValue)
//                        .then(function() {
//                            //do nothing
//                        }).catch(function(error) {
//                            console.log(error);
//                            if (error.code === "PERMISSION_DENIED") {
//                                //(#error)firebase-permission-denied
//                                $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
//                            } else {
//                                //(#error)unknown-error
//                                $scope.notify("An unknown error has occured (Error #000)", "danger");
//                            }
//                        });
//                    });
                    
                    angular.forEach(facilityValue.checklist, function(categoryValue, key) {
                        $scope.categoryCount++;

                        firebase.database().ref('projectfacility/' + $scope.projectFacilityAlphabet + $scope.projectFacilityCount
                                + '/category/' + $scope.categoryAlphabet + $scope.categoryCount).set({
                            name: categoryValue.name,
                            ID: $scope.categoryAlphabet + $scope.categoryCount
                        }).then(function() {
                            //do nothing
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

                        angular.forEach(categoryValue.question, function(questionValue, key) {
                            $scope.questionCount++;
                            
                            firebase.database().ref('projectfacility/' + $scope.projectFacilityAlphabet + $scope.projectFacilityCount
                                + '/category/' + $scope.categoryAlphabet + $scope.categoryCount 
                                + '/question/' + $scope.questionAlphabet + $scope.questionCount).set({
                                name: questionValue.name,
                                ID: $scope.questionAlphabet + $scope.questionCount,
                                type: questionValue.type
                            }).then(function() {
                                //do nothing
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
                        });
                    });
                });

                if ($scope.MCSTS === undefined)
                    $scope.MCSTS = "";
                
                var newDate = new Date();
                var datetime = newDate.dayNow() + " @ " + newDate.timeNow();
                
                firebase.database().ref('project/' + $scope.projectAlphabet + $scope.projectCount).set({
                    name: $scope.name,
                    ID: $scope.projectAlphabet + $scope.projectCount,
                    BUH: $scope.BUHID,
                    TM: $scope.TMID,
                    CM: $scope.CMID,
                    address: $scope.address,
                    MCSTS: $scope.MCSTS,
                    createdAt: datetime,
                    createdBy: $scope.user.ID,
                    updatedAt: datetime,
                    updatedBy: $scope.user.ID
                }).then(function() {
                    firebase.database().ref('count/projectCount').set({
                        count: $scope.projectCount,
                        alphabet: $scope.projectAlphabet
                    });

                    var error = false;
                    
//                    firebase.database().ref('staff/' + $scope.newCM.authID + '/hasProject').set(true);

                    angular.forEach($scope.projectFacilityAdded, function(projectFacilityValue, key) {
                        firebase.database().ref('project/' + $scope.projectAlphabet + $scope.projectCount + 
                            '/projectFacility/' + projectFacilityValue)
                            .set(projectFacilityValue)
                        .then(function() {
                            //do nothing
                        }).catch(function(error) {
                            error = true;
                            console.log(error);
                            if (error.code === "PERMISSION_DENIED") {
                                //(#error)firebase-permission-denied
                                $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
                            } else {
                                //(#error)unknown-error
                                $scope.notify("An unknown error has occured (Error #000)", "danger");
                            }
                        });
                    });

                    //redirect to projects if add success
                    if (!error) {
                        $location.path("/projects").search("add",$scope.name).search("projectID",null).search("edit",null);
                        $route.reload();
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
                //(#error)database-count-does-not-exist
                console.log("database-count-does-not-exist");
                $scope.notify("An error occured when accessing firebase database (Error #003)", "danger");
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
    }; //end of $scope.addProject()
    
    //old database format - add project method
//    $scope.addProject = function() {
//        $scope.projectFacilityAdded = [];
//        $scope.categoryAdded = [];
//
//        firebase.database().ref('count').once('value').then(function (snapshot, error) {
//            if (snapshot.val() !== null) {
//
//                $scope.questionAlphabet = snapshot.val().questionCount.alphabet;
//                $scope.categoryAlphabet = snapshot.val().categoryCount.alphabet;
//                $scope.projectAlphabet = snapshot.val().projectCount.alphabet;
//                $scope.projectFacilityAlphabet = snapshot.val().projectFacilityCount.alphabet;
//                $scope.questionCount = snapshot.val().questionCount.count;
//                $scope.categoryCount = snapshot.val().categoryCount.count;
//                $scope.projectCount = snapshot.val().projectCount.count;
//                $scope.projectFacilityCount = snapshot.val().projectFacilityCount.count;
//
//                $scope.projectCount++;
//
//                angular.forEach($scope.facilityAddedList, function(facilityValue, key) {
//                    angular.forEach(facilityValue.checklist, function(categoryValue, key) {
//                        $scope.categoryCount++;
//                        $scope.categoryAdded.push($scope.categoryAlphabet + $scope.categoryCount);
//
//                        firebase.database().ref('category/' + $scope.categoryAlphabet + $scope.categoryCount).set({
//                            name: categoryValue.name,
//                            ID: $scope.categoryAlphabet + $scope.categoryCount
//                        }).then(function() {
//                            firebase.database().ref('count/categoryCount').set({
//                                count: $scope.categoryCount,
//                                alphabet: $scope.categoryAlphabet
//                            });
//                        }).catch(function(error) {
//                            console.log(error);
//                            if (error.code === "PERMISSION_DENIED") {
//                                //(#error)firebase-permission-denied
//                                $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
//                            } else {
//                                //(#error)unknown-error
//                                $scope.notify("An unknown error has occured (Error #000)", "danger");
//                            }
//                        });
//
//                        angular.forEach(categoryValue.question, function(questionValue, key) {
//                            $scope.questionCount++;
//                            firebase.database().ref('category/' + $scope.categoryAlphabet + $scope.categoryCount + '/question/' + 
//                                $scope.questionAlphabet + $scope.questionCount).set({
//                                name: questionValue.name,
//                                ID: $scope.questionAlphabet + $scope.questionCount,
//                                type: questionValue.type
//                            }).then(function() {
//                                firebase.database().ref('count/questionCount').set({
//                                    count: $scope.questionCount,
//                                    alphabet: $scope.questionAlphabet
//                                });
//                            }).catch(function(error) {
//                                console.log(error);
//                                if (error.code === "PERMISSION_DENIED") {
//                                    //(#error)firebase-permission-denied
//                                    $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
//                                } else {
//                                    //(#error)unknown-error
//                                    $scope.notify("An unknown error has occured (Error #000)", "danger");
//                                }
//                            });
//                        });
//                    });
//
//                    $scope.projectFacilityCount++;
//                    $scope.projectFacilityAdded.push($scope.projectFacilityAlphabet + $scope.projectFacilityCount);
//
//                    //add projectFacility details
//                    firebase.database().ref('projectfacility/' + $scope.projectFacilityAlphabet + $scope.projectFacilityCount).set({
//                            frequency: facilityValue.frequency,
//                            name: facilityValue.name,
//                            ID: $scope.projectFacilityAlphabet + $scope.projectFacilityCount,
//                            projectID: $scope.projectAlphabet + $scope.projectCount
//                    }).then(function() {
//                        firebase.database().ref('count/projectFacilityCount').set({
//                            count: $scope.projectFacilityCount,
//                            alphabet: $scope.projectFacilityAlphabet
//                        });
//                    }).catch(function(error) {
//                        console.log(error);
//                        if (error.code === "PERMISSION_DENIED") {
//                            //(#error)firebase-permission-denied
//                            $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
//                        } else {
//                            //(#error)unknown-error
//                            $scope.notify("An unknown error has occured (Error #000)", "danger");
//                        }
//                    });
//
//                    //add category in each projectFacility
//                    angular.forEach($scope.categoryAdded, function(categoryValue, key) {
//                        firebase.database().ref('projectfacility/' + $scope.projectFacilityAlphabet + $scope.projectFacilityCount 
//                                + '/category/' + categoryValue).set(categoryValue)
//                        .then(function() {
//                            //do nothing
//                        }).catch(function(error) {
//                            console.log(error);
//                            if (error.code === "PERMISSION_DENIED") {
//                                //(#error)firebase-permission-denied
//                                $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
//                            } else {
//                                //(#error)unknown-error
//                                $scope.notify("An unknown error has occured (Error #000)", "danger");
//                            }
//                        });
//                    });
//                    $scope.categoryAdded = [];
//                });
//
//                if ($scope.MCSTS === undefined)
//                    $scope.MCSTS = "";
//                
//                var newDate = new Date();
//                var datetime = newDate.dayNow() + " @ " + newDate.timeNow();
//                
//                firebase.database().ref('project/' + $scope.projectAlphabet + $scope.projectCount).set({
//                    name: $scope.name,
//                    ID: $scope.projectAlphabet + $scope.projectCount,
//                    BUH: $scope.BUHID,
//                    TM: $scope.TMID,
//                    CM: $scope.CMID,
//                    address: $scope.address,
//                    MCSTS: $scope.MCSTS,
//                    createdAt: datetime,
//                    createdBy: $scope.user.ID,
//                    updatedAt: datetime,
//                    updatedBy: $scope.user.ID
//                }).then(function() {
//                    firebase.database().ref('count/projectCount').set({
//                        count: $scope.projectCount,
//                        alphabet: $scope.projectAlphabet
//                    });
//
//                    var error = false;
//                    
////                    firebase.database().ref('staff/' + $scope.newCM.authID + '/hasProject').set(true);
//
//                    angular.forEach($scope.projectFacilityAdded, function(projectFacilityValue, key) {
//                        firebase.database().ref('project/' + $scope.projectAlphabet + $scope.projectCount + 
//                            '/projectFacility/' + projectFacilityValue)
//                            .set(projectFacilityValue)
//                        .then(function() {
//                            //do nothing
//                        }).catch(function(error) {
//                            error = true;
//                            console.log(error);
//                            if (error.code === "PERMISSION_DENIED") {
//                                //(#error)firebase-permission-denied
//                                $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
//                            } else {
//                                //(#error)unknown-error
//                                $scope.notify("An unknown error has occured (Error #000)", "danger");
//                            }
//                        });
//                    });
//
//                    //redirect to projects if add success
//                    if (!error) {
//                        $location.path("/projects").search("add",$scope.name).search("projectID",null).search("edit",null);
//                        $route.reload();
//                    }
//
//                }).catch(function(error) {
//                    console.log(error);
//                    if (error.code === "PERMISSION_DENIED") {
//                        //(#error)firebase-permission-denied
//                        $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
//                    } else {
//                        //(#error)unknown-error
//                        $scope.notify("An unknown error has occured (Error #000)", "danger");
//                    }
//                });
//                
//            } else {
//                //(#error)database-count-does-not-exist
//                console.log("database-count-does-not-exist");
//                $scope.notify("An error occured when accessing firebase database (Error #003)", "danger");
//            }
//        }).catch(function(error) {
//            console.log(error);
//            if (error.code === "PERMISSION_DENIED") {
//                //(#error)firebase-permission-denied
//                $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
//            } else {
//                //(#error)unknown-error
//                $scope.notify("An unknown error has occured (Error #000)", "danger");
//            }
//        });
//    }; //end of $scope.addProject()
    
    /**********************
    *** Search & Filter ***
    **********************/
    
	$scope.sortByList = ['All','Not Deleted','Deleted'];
	$scope.sortByItem = 'Not Deleted';
	
	$scope.sortByItemSelected = function(itemSelected) {
		$scope.sortByItem = itemSelected;
	};
    
    $scope.search = function(p) {
    return (angular.lowercase(p.name).indexOf(angular.lowercase($scope.query) || '') !== -1 ||
            angular.lowercase(p.MCSTS).toString().indexOf(angular.lowercase($scope.query) || '') !== -1 ||
            angular.lowercase(p.BUHName).indexOf(angular.lowercase($scope.query) || '') !== -1 ||
            angular.lowercase(p.TMName).indexOf(angular.lowercase($scope.query) || '') !== -1 ||
            angular.lowercase(p.CMName).indexOf(angular.lowercase($scope.query) || '') !== -1);
    }
    
    $scope.isdeleted = function(p) {
        if ($scope.sortByItem === 'Not Deleted')
            return (!p.deleted);
        else if ($scope.sortByItem === 'Deleted')
            return (p.deleted);
        else if ($scope.sortByItem === 'All')
            return true;
        else
            return (!p.deleted);
    }
    
    $scope.isrole = function(p) {
        if ($scope.user === undefined)
            return false;
        else
            if ($scope.user.isAdmin)
                return true;
            else if ($scope.user.isBUH)
                return (p.BUHName === $scope.user.name);
    }
    
    $scope.sortType = "name";
    $scope.sortReverse = false;
    
    $scope.frequencyType = "frequency";
        
    $scope.customFrequencyComparison = function(firstObject, secondObject) {
        firstValue = firstObject.value;
        secondValue = secondObject.value;
        switch (firstValue) {
            case 'Daily':
                if (secondValue == 'Daily')
                    return 0;
                else
                    return -1;
                break;
            case 'Weekly':
                if (secondValue == 'Daily')
                    return 1;
                else
                    return (secondValue == 'Weekly') ? 0 : -1;
                break;
            case 'Monthly':
                if (secondValue == 'Daily' || secondValue == 'Weekly')
                    return 1;
                else
                    return (secondValue == 'Monthly') ? 0 : -1;
                break;
            case 'Quarterly':
                if (secondValue == 'Daily' || secondValue == 'Weekly' || secondValue == 'Monthly')
                    return 1;
                else
                    return (secondValue == 'Quaterly') ? 0 : -1;
                break;
            case 'Yearly':
                if (secondValue == 'Daily' || secondValue == 'Weekly' || secondValue == 'Monthly' || secondValue == 'Quarterly')
                    return 1;
                else
                    return (secondValue == 'Yearly') ? 0 : -1;
                break;
        }
    }
    
    /*********************
    **** Project View ****
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
        
    $scope.viewProject = function(project) {
        $scope.checklistShow = false;
        $scope.overlay = true;
        $scope.project = project;
        $scope.project.projectFacilityList = [];
        
        $scope.project.fullBUH = "("+$scope.project.BUH+") " + $scope.project.BUHName;
        $scope.project.fullTM = "("+$scope.project.TM+") " + $scope.project.TMName;
        $scope.project.fullCM = "("+$scope.project.CM+") " + $scope.project.CMName;

        angular.forEach($scope.project.projectFacility, function(projectFacilityValue, key) {
            firebase.database().ref("projectfacility/" + projectFacilityValue).once("value").then(function(snapshot) {
                var newProjectFacility = snapshot.val();
                newProjectFacility.checklist = [];
                //tempfix #001
                if (snapshot.val() != null && snapshot.val().category != null) {
                    newProjectFacility.categoryCount = Object.keys(snapshot.val().category).length;
                    var categoryCount = -1;
                    angular.forEach(snapshot.val().category, function(newCategory, key) {
                        var categoryValue = newCategory;
                        categoryCount++;
                        newProjectFacility.checklist.push(categoryValue);
                        newProjectFacility.checklist[categoryCount].questionList = [];
                        newProjectFacility.checklist[categoryCount].questionCount = Object.keys(categoryValue.question).length;
                        newProjectFacility.checklist[categoryCount].no = categoryCount+1;
                        newProjectFacility.checklist[categoryCount].formID = categoryCount;
                        var questionCount = -1;
                        angular.forEach(categoryValue.question, function(questionValue, key) {
                            newProjectFacility.checklist[categoryCount].questionList.push(questionValue);
                            questionCount++;
                            var questionNo = 'abcdefghijklmnopqrstuvwxyz'[questionCount];
                            newProjectFacility.checklist[categoryCount].questionList[questionCount].formID = questionCount;
                            newProjectFacility.checklist[categoryCount].questionList[questionCount].no = questionNo;
                            $scope.$apply();
                        });
                    });
                //tempfix #001
                } else if (snapshot.val().category == null) {
                    
                } else {
                    //(#error)database-project-not-found
                    console.log("database-project-not-found");
                    $scope.notify("An error occured when accessing firebase database (Error #006)", "danger");
                }
                $scope.project.projectFacilityList.push(newProjectFacility);
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
        });
        
//        angular.forEach($scope.project.projectFacility, function(projectFacilityValue, key) {
//            firebase.database().ref("projectfacility/" + projectFacilityValue).once("value").then(function(snapshot) {
//                var newProjectFacility = snapshot.val();
//                newProjectFacility.checklist = [];
//                //tempfix #001
//                if (snapshot.val() != null && snapshot.val().category != null) {
//                    newProjectFacility.categoryCount = Object.keys(snapshot.val().category).length;
//                    var categoryCount = -1;
//                    angular.forEach(snapshot.val().category, function(categoryValue, key) {
//                        firebase.database().ref("category/" + categoryValue).once("value").then(function(categorySnapshot) {
//                            if (snapshot.val() != null) {
//                                categoryCount++;
//                                newProjectFacility.checklist.push(categorySnapshot.val());
//                                newProjectFacility.checklist[categoryCount].questionList = [];
//                                newProjectFacility.checklist[categoryCount].questionCount = Object.keys(categorySnapshot.val().question).length;
//                                newProjectFacility.checklist[categoryCount].no = categoryCount+1;
//                                newProjectFacility.checklist[categoryCount].formID = categoryCount;
//                                var questionCount = -1;
//                                angular.forEach(categorySnapshot.val().question, function(questionValue, key) {
//                                    newProjectFacility.checklist[categoryCount].questionList.push(questionValue);
//                                    questionCount++;
//                                    var questionNo = 'abcdefghijklmnopqrstuvwxyz'[questionCount];
//                                    newProjectFacility.checklist[categoryCount].questionList[questionCount].formID = questionCount;
//                                    newProjectFacility.checklist[categoryCount].questionList[questionCount].no = questionNo;
//                                    $scope.$apply();
//                                });
//                            } else {
//                                //(#error)database-category-not-found
//                                console.log("database-category-not-found");
//                                $scope.notify("An error occured when accessing firebase database (Error #004)", "danger");
//                            }
//                        }).catch(function(error) {
//                            console.log(error);
//                            if (error.code === "PERMISSION_DENIED") {
//                                //(#error)firebase-permission-denied
//                                $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
//                            } else {
//                                //(#error)unknown-error
//                                $scope.notify("An unknown error has occured (Error #000)", "danger");
//                            }
//                        });
//                    });
//                //tempfix #001
//                } else if (snapshot.val().category == null) {
//                    
//                } else {
//                    //(#error)database-project-not-found
//                    console.log("database-project-not-found");
//                    $scope.notify("An error occured when accessing firebase database (Error #006)", "danger");
//                }
//                $scope.project.projectFacilityList.push(newProjectFacility);
//                $scope.$apply();
//            }).catch(function(error) {
//                console.log(error);
//                if (error.code === "PERMISSION_DENIED") {
//                    //(#error)firebase-permission-denied
//                    $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
//                } else {
//                    //(#error)unknown-error
//                    $scope.notify("An unknown error has occured (Error #000)", "danger");
//                }
//            });
//        });
    }; //end of $scope.viewFacility()
        
    /*********************
    **** Project Edit ****
    *********************/
        
    $scope.dailySize = 0;
    $scope.weeklySize = 0;
    $scope.monthlySize = 0;
    $scope.quarterlySize = 0;
    $scope.yearlySize = 0;
        
    $scope.dailyList = [];
    $scope.weeklyList = [];
    $scope.monthlyList = [];
    $scope.quarterlyList = [];
    $scope.yearlyList = [];
        
    $scope.numberList = [];
        
    $scope.getNumberList = function(frequency) {
        switch (frequency) {
            case 'Daily':
                $scope.numberList = $scope.dailyList;
                break;
            case 'Weekly':
                $scope.numberList = $scope.weeklyList;
                break;
            case 'Monthly':
                $scope.numberList = $scope.monthlyList;
                break;
            case 'Quarterly':
                $scope.numberList = $scope.quarterlyList;
                break;
            case 'Yearly':
                $scope.numberList = $scope.yearlyList;
                break;
        }
    }
    
    $scope.numberItemSelected = function(facility, number) {
        if (facility.order != number) {
            var oldNumber = facility.order;
            facility.order = 0;
            angular.forEach($scope.project.projectFacilityList, function(projectFacilityValue, key) {
                if (projectFacilityValue.frequency == facility.frequency) {
                    if (projectFacilityValue.order != 0 && (oldNumber > projectFacilityValue.order && projectFacilityValue.order >= number))
                        projectFacilityValue.order++;
                    else if (projectFacilityValue != 0 && (oldNumber < projectFacilityValue.order && projectFacilityValue.order <= number))
                        projectFacilityValue.order--;
                }
            })
            facility.order = number;
        }
    }
    
    $scope.reloadProject = function() {
        $scope.refreshFacilityList();
        firebase.database().ref("project/" + $scope.projectID).once("value").then(function(snapshot) {
            if (snapshot.val() != null) {
                $scope.project = null;
                $scope.project = snapshot.val();
                $scope.project.projectFacilityList = [];
                
                firebase.database().ref("staff").once("value").then(function(staffSnapshot) {
                    tempList = [];
                    angular.forEach(staffSnapshot.val(), function(staffValue, projectKey) {
                        tempList.push(staffValue);
                    });
                    var index = tempList.map(function(x) {return x.ID}).indexOf($scope.project.BUH);
                    $scope.project.BUHName = tempList[index].name;
                    var index = tempList.map(function(x) {return x.ID}).indexOf($scope.project.TM);
                    $scope.project.TMName = tempList[index].name;
                    var index = tempList.map(function(x) {return x.ID}).indexOf($scope.project.CM);
                    $scope.project.CMName = tempList[index].name;
                    
                    $scope.project.oldCM = $scope.project.CMName;
                    $scope.project.fullBUH = "("+$scope.project.BUH+") " + $scope.project.BUHName;
                    $scope.project.fullTM = "("+$scope.project.TM+") " + $scope.project.TMName;
                    $scope.project.fullCM = "("+$scope.project.CM+") " + $scope.project.CMName;
                    
                    $scope.loadMagicSuggest();
                });
                
                if ($scope.project.deletedAt !== undefined) {
                    $scope.project.deleted = true;
                } else {
                    $scope.project.deleted = false;
                }
                
                angular.forEach($scope.project.projectFacility, function(projectFacilityValue, key) {
                    firebase.database().ref("projectfacility/" + projectFacilityValue).once("value").then(function(snapshot) {
                        //old database load project
//                        var newProjectFacility = snapshot.val();
//                        if ($scope.facilityList !== undefined) {
//                            var index = $scope.facilityList.map(function(x) {return x.name}).indexOf(newProjectFacility.name);
//                            $scope.facilityList.splice(index,1);
//                        }
//                        if (snapshot.val() != null) {
//                            newProjectFacility.deleted = false;
//                            newProjectFacility.show = false;
//                            newProjectFacility.checklist = [];
//                            newProjectFacility.categoryCount = -1;
//                            angular.forEach(snapshot.val().category, function(categoryValue, key) {
//                                firebase.database().ref("category/" + categoryValue).once("value").then(function(categorySnapshot) {
//                                    if (categorySnapshot.val() != null) {
//                                        var categoryCount = ++newProjectFacility.categoryCount;
//                                        newProjectFacility.checklist.push(categorySnapshot.val());
//                                        newProjectFacility.checklist[categoryCount].deleted = false;
//                                        newProjectFacility.checklist[categoryCount].questionList = [];
//                                        newProjectFacility.checklist[categoryCount].no = categoryCount+1;
//                                        newProjectFacility.checklist[categoryCount].formID = categoryCount;
//                                        newProjectFacility.checklist[categoryCount].questionCount = -1;
//                                        angular.forEach(categorySnapshot.val().question, function(questionValue, key) {
//                                            newProjectFacility.checklist[categoryCount].questionList.push(questionValue);
//                                            var questionCount = ++newProjectFacility.checklist[categoryCount].questionCount;
//                                            var questionNo = 'abcdefghijklmnopqrstuvwxyz'[questionCount];
//                                            newProjectFacility.checklist[categoryCount].questionList[questionCount].formID = questionCount;
//                                            newProjectFacility.checklist[categoryCount].questionList[questionCount].no = questionNo;
//                                            $scope.$apply();
//                                        });
//                                    } else {
//                                        //(#error)database-category-not-found
//                                        console.log("database-category-not-found");
//                                        $scope.notify("An error occured when accessing firebase database (Error #004)", "danger");
//                                    }
//                                }).catch(function(error) {
//                                    console.log(error);
//                                    if (error.code === "PERMISSION_DENIED") {
//                                        //(#error)firebase-permission-denied
//                                        $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
//                                    } else {
//                                        //(#error)unknown-error
//                                        $scope.notify("An unknown error has occured (Error #000)", "danger");
//                                    }
//                                });
//                            });
//                        } else {
//                            //(#error)database-projectfacility-not-found
//                            console.log("database-projectfacility-not-found");
//                            $scope.notify("An error occured when accessing firebase database (Error #007)", "danger");
//                        }
//                        $scope.project.projectFacilityList.push(newProjectFacility);
//                        $scope.$apply();
                        
                        var newProjectFacility = snapshot.val();
                        //tempfix #001
                        if (snapshot.val() != null && snapshot.val().category != null) {
//                            if ($scope.facilityList !== undefined) {
//                                var index = $scope.facilityList.map(function(x) {return x.name}).indexOf(newProjectFacility.name);
//                                $scope.facilityList.splice(index,1);
//                            }
                            newProjectFacility.deleted = false;
                            newProjectFacility.show = false;
                            newProjectFacility.checklist = [];
                            newProjectFacility.categoryCount = -1;
                            newProjectFacility.categoryCount = Object.keys(snapshot.val().category).length;
                            var categoryCount = -1;
                            angular.forEach(snapshot.val().category, function(newCategory, key) {
                                var categoryValue = newCategory;
                                categoryCount++;
                                newProjectFacility.checklist.push(categoryValue);
                                newProjectFacility.checklist[categoryCount].questionList = [];
                                newProjectFacility.checklist[categoryCount].questionCount = Object.keys(categoryValue.question).length;
                                newProjectFacility.checklist[categoryCount].no = categoryCount+1;
                                newProjectFacility.checklist[categoryCount].formID = categoryCount;
                                var questionCount = -1;
                                angular.forEach(categoryValue.question, function(questionValue, key) {
                                    newProjectFacility.checklist[categoryCount].questionList.push(questionValue);
                                    questionCount++;
                                    var questionNo = 'abcdefghijklmnopqrstuvwxyz'[questionCount];
                                    newProjectFacility.checklist[categoryCount].questionList[questionCount].formID = questionCount;
                                    newProjectFacility.checklist[categoryCount].questionList[questionCount].no = questionNo;
                                });
                            });
                        //tempfix #001
                        } else if (snapshot.val().category == null) {

                        } else {
                            //(#error)database-project-not-found
                            console.log("database-project-not-found");
                            $scope.notify("An error occured when accessing firebase database (Error #006)", "danger");
                        }
                        console.log(newProjectFacility);
                        
                        if (newProjectFacility.order == null || newProjectFacility == undefined) {
                            switch (newProjectFacility.frequency) {
                                case 'Daily':
                                    newProjectFacility.order = ++$scope.dailySize;
                                    $scope.dailyList.push($scope.dailySize);
                                    break;
                                case 'Weekly':
                                    newProjectFacility.order = ++$scope.weeklySize;
                                    $scope.weeklyList.push($scope.weeklySize);
                                    break;
                                case 'Monthly':
                                    newProjectFacility.order = ++$scope.monthlySize;
                                    $scope.monthlyList.push($scope.monthlySize);
                                    break;
                                case 'Quarterly':
                                    newProjectFacility.order = ++$scope.quarterlySize;
                                    $scope.quarterlyList.push($scope.quarterlySize);
                                    break;
                                case 'Yearly':
                                    newProjectFacility.order = ++$scope.yearlySize;
                                    $scope.yearlyList.push($scope.yearlySize);
                                    break;
                            }
                        }
                        
                        $scope.project.projectFacilityList.push(newProjectFacility);
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
                });
            } else {
                //(#error)database-project-not-found
                console.log("database-project-not-found");
                $scope.notify("An error occured when accessing firebase database (Error #006)", "danger");
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
    }; //end of $scope.reloadFacility()
    
    if ($routeParams.projectID !== undefined) {
        $scope.projectID = $routeParams.projectID;
        var projectRef = firebase.database().ref().child("project/" + $scope.projectID);
        
        projectRef.on('value', function() {
            $scope.reloadProject();
        });
    };
        
    /**********************
    **** Magic Suggest ****
    **** Project Edit *****
    **********************/
    
    if ($location.path() === "/edit-project") {
        $scope.loadMagicSuggest = function() {
    //        $scope.staffList = [];
            $scope.buhList = [];
            $scope.tmList = [];
            $scope.cmList = [];
            $scope.fullStaff = [];

            firebase.database().ref('staff/').once('value').then(function (snapshot) {

                snapshot.forEach(function(staffValue) {
                    if (staffValue.val().status === "Active") {
                        $scope.fullStaff.push(staffValue.val());
    //                    $scope.staffList.push("(" + staffValue.val().ID + ") " + staffValue.val().name);
                        if (staffValue.val().role === "CM") {
                            $scope.cmList.push("(" + staffValue.val().ID + ") " + staffValue.val().name);
                        } else if (staffValue.val().role === "TM") {
                            $scope.cmList.push("(" + staffValue.val().ID + ") " + staffValue.val().name);
                            $scope.tmList.push("(" + staffValue.val().ID + ") " + staffValue.val().name);
                        } else if (staffValue.val().role === "EXCO") {
                            $scope.buhList.push("(" + staffValue.val().ID + ") " + staffValue.val().name);
                        } else if (staffValue.val().role === "BUH") {
                            $scope.tmList.push("(" + staffValue.val().ID + ") " + staffValue.val().name);
                            $scope.buhList.push("(" + staffValue.val().ID + ") " + staffValue.val().name);
                        }
                    }
                });

                $scope.BUH = $('#magicsuggestBUH').magicSuggest({
                    allowFreeEntries: false,
                    data: $scope.buhList,
                    highlight: false,
                    placeholder: "Enter project BUH",
                    maxSelection: 1
                });
                $scope.TM = $('#magicsuggestTM').magicSuggest({
                    allowFreeEntries: false,
                    data: $scope.tmList,
                    highlight: false,
                    placeholder: "Enter project TM",
                    maxSelection: 1
                });
                $scope.CM = $('#magicsuggestCM').magicSuggest({
                    allowFreeEntries: false,
                    data: $scope.cmList,
                    highlight: false,
                    placeholder: "Enter project CM",
                    maxSelection: 1
                });

                $scope.BUH.setValue([$scope.project.fullBUH]);
                $scope.TM.setValue([$scope.project.fullTM]);
                $scope.CM.setValue([$scope.project.fullCM]);
            });
        };
    };
        
    /*********************
    ***** Checklist ******
    **** Project Edit ****
    *********************/
        
    $scope.addProjectQuestion = function(category) {
        category.questionCount++;
        var questionNo = 'abcdefghijklmnopqrstuvwxyz'[category.questionCount];
        var newQuestion = {name:"", formID:category.questionCount, no:questionNo, type:"MCQ"};
        category.questionList.push(newQuestion);
    };
    
    $scope.deleteProjectQuestion = function(category,question) {
        if (category.questionCount !== 0) {
            category.questionCount--;
            var index = category.questionList.indexOf(question);
            category.questionList.splice(index, 1);
            
            for(index; index < category.questionList.length; index++) {
                var questionNo = 'abcdefghijklmnopqrstuvwxyz'[index];
                category.questionList[index].formID = index;
                category.questionList[index].no = questionNo;
            }
        }
    };
        
    $scope.addProjectCategory = function(facility) {
        facility.categoryCount++;
        var newQuestion = {name:"", formID:0, no:"a", type:"MCQ"};
        var newCategory = {name:"", formID:facility.categoryCount, no:facility.categoryCount+1,
            questionCount:0, questionList:[newQuestion], deleted:false};
        facility.checklist.push(newCategory);
    };
        
    $scope.deleteProjectCategory = function(facility, category) {
        if (facility.categoryCount !== 0) {
            category.deleted = true;
            facility.categoryCount--;
            
            var count = 0;
            for(var i = 0; i < facility.checklist.length; i++) {
                if (facility.checklist[i].deleted === true) {
                    count++;
                } else {
                    facility.checklist[i].formID = i-count;
                    facility.checklist[i].no = i+1-count;
                }
            }
        }
    };
        
    $scope.deleteProjectFacility = function(facility) {
//        $scope.facilityList.unshift({name:facility.name});
        switch (facility.frequency) {
            case 'Daily':
                --$scope.dailySize;
                $scope.dailyList.pop();
                break;
            case 'Weekly':
                --$scope.weeklySize;
                $scope.weeklyList.pop();
                break;
            case 'Monthly':
                --$scope.monthlySize;
                $scope.monthlyList.pop();
                break;
            case 'Quarterly':
                --$scope.quarterlySize;
                $scope.quarterlyList.pop();
                break;
            case 'Yearly':
                --$scope.yearlySize;
                $scope.yearlyList.pop();
                break;
        }
        $scope.reorganizeNumberList(facility.frequency, facility.order);
        facility.deleted = true;
    }
    
    $scope.deleteAddedProjectFacility = function(facility) {
//        $scope.facilityList.unshift({name:facility.name});
        var index = $scope.facilityAddedList.map(function(x) {return x.name}).indexOf(facility.name);
        
        switch (facility.frequency) {
            case 'Daily':
                --$scope.dailySize;
                $scope.dailyList.pop();
                break;
            case 'Weekly':
                --$scope.weeklySize;
                $scope.weeklyList.pop();
                break;
            case 'Monthly':
                --$scope.monthlySize;
                $scope.monthlyList.pop();
                break;
            case 'Quarterly':
                --$scope.quarterlySize;
                $scope.quarterlyList.pop();
                break;
            case 'Yearly':
                --$scope.yearlySize;
                $scope.yearlyList.pop();
                break;
        }
        $scope.reorganizeNumberListAdd(facility.frequency, facility.order);
        
        $scope.facilityAddedList.splice(index,1);
    }
    
    $scope.reorganizeNumberListAdd = function(frequency, number) {
        angular.forEach($scope.facilityAddedList, function(projectFacilityValue, key) {
            if (projectFacilityValue.frequency == frequency) {
                if (number <= projectFacilityValue.order)
                    projectFacilityValue.order--;
            }
        })
    }
    
    $scope.frequencyItemSelectedAdd = function(facility, frequency) {
        if (facility.frequency != frequency) {
            var oldFrequency = facility.frequency;
            var oldNumber = facility.order;
            facility.frequency = frequency;

            switch (frequency) {
                case 'Daily':
                    facility.order = ++$scope.dailySize;
                    $scope.dailyList.push($scope.dailySize);
                    break;
                case 'Weekly':
                    facility.order = ++$scope.weeklySize;
                    $scope.weeklyList.push($scope.weeklySize);
                    break;
                case 'Monthly':
                    facility.order = ++$scope.monthlySize;
                    $scope.monthlyList.push($scope.monthlySize);
                    break;
                case 'Quarterly':
                    facility.order = ++$scope.quarterlySize;
                    $scope.quarterlyList.push($scope.quarterlySize);
                    break;
                case 'Yearly':
                    facility.order = ++$scope.yearlySize;
                    $scope.yearlyList.push($scope.yearlySize);
                    break;
            }

            switch (oldFrequency) {
                case 'Daily':
                    --$scope.dailySize;
                    $scope.dailyList.pop();
                    break;
                case 'Weekly':
                    --$scope.weeklySize;
                    $scope.weeklyList.pop();
                    break;
                case 'Monthly':
                    --$scope.monthlySize;
                    $scope.monthlyList.pop();
                    break;
                case 'Quarterly':
                    --$scope.quarterlySize;
                    $scope.quarterlyList.pop();
                    break;
                case 'Yearly':
                    --$scope.yearlySize;
                    $scope.yearlyList.pop();
                    break;
            }

            $scope.reorganizeNumberListAdd(oldFrequency, oldNumber);
        }
    }
    
    $scope.numberItemSelectedAdd = function(facility, number) {
        if (facility.order != number) {
            var oldNumber = facility.order;
            facility.order = 0;
            angular.forEach($scope.facilityAddedList, function(projectFacilityValue, key) {
                if (projectFacilityValue.frequency == facility.frequency) {
                    if (projectFacilityValue.order != 0 && (oldNumber > projectFacilityValue.order && projectFacilityValue.order >= number))
                        projectFacilityValue.order++;
                    else if (projectFacilityValue != 0 && (oldNumber < projectFacilityValue.order && projectFacilityValue.order <= number))
                        projectFacilityValue.order--;
                }
            })
            facility.order = number;
        }
    }
    
    $scope.moveProjectFacility = function(facility) {
        if ($scope.validation.length === 0) {
//            $scope.btnValidate = false;
//            $scope.$apply();
            $scope.addFacilityToProjectList(facility.name);
        }
//        var index = $scope.facilityList.map(function(x) {return x.name}).indexOf(facility.name);
//        $scope.facilityList.splice(index,1);
    }
        
    $scope.addFacilityToProjectList = function(facilityName) {
        $scope.btnValidateAdd();
        $scope.project.projectFacilityList.unshift({name:facilityName,frequency:"Daily"});
        
        firebase.database().ref("facility").orderByChild("name").equalTo(facilityName).once("value").then(function(snapshot) {
            if (snapshot.val() != null) {
                angular.forEach(snapshot.val(), function(facilityValue, key) {
                    $scope.project.projectFacilityList[0].category = facilityValue.category;
                });
                $scope.project.projectFacilityList[0].categoryCount = -1;
                $scope.project.projectFacilityList[0].deleted = false;
                $scope.project.projectFacilityList[0].checklist = [];
                angular.forEach($scope.project.projectFacilityList[0].category, function(categoryValue, key) {
                    
                    $scope.project.projectFacilityList[0].categoryCount++;
                    var categoryCount = $scope.project.projectFacilityList[0].categoryCount;
                    $scope.project.projectFacilityList[0].checklist.push({});
                    $scope.project.projectFacilityList[0].checklist[categoryCount].deleted = false;
                    $scope.project.projectFacilityList[0].checklist[categoryCount].name = categoryValue.name;
                    $scope.project.projectFacilityList[0].checklist[categoryCount].ID = categoryValue.ID;
                    $scope.project.projectFacilityList[0].checklist[categoryCount].no = categoryCount+1;
                    $scope.project.projectFacilityList[0].checklist[categoryCount].formID = categoryCount;
                    $scope.project.projectFacilityList[0].checklist[categoryCount].questionCount = -1;
                    $scope.project.projectFacilityList[0].checklist[categoryCount].questionList = [];

                    angular.forEach(categoryValue.question, function(questionValue, key) {
                        $scope.project.projectFacilityList[0].checklist[categoryCount].questionList.push({});
                        $scope.project.projectFacilityList[0].checklist[categoryCount].questionCount++;
                        var questionCount = $scope.project.projectFacilityList[0].checklist[categoryCount].questionCount;
                        var questionNo = 'abcdefghijklmnopqrstuvwxyz'[questionCount];
                        $scope.project.projectFacilityList[0].checklist[categoryCount].questionList[questionCount].formID = questionCount;
                        $scope.project.projectFacilityList[0].checklist[categoryCount].questionList[questionCount].no = questionNo;
                        $scope.project.projectFacilityList[0].checklist[categoryCount].questionList[questionCount].name = questionValue.name;
                        $scope.project.projectFacilityList[0].checklist[categoryCount].questionList[questionCount].ID = questionValue.ID;
                        $scope.project.projectFacilityList[0].checklist[categoryCount].questionList[questionCount].type = questionValue.type;
                    });
                    
//                    firebase.database().ref("category/" + categoryID).once("value").then(function(categorySnapshot) {
//                        if (categorySnapshot.val() != null) {
//                            $scope.project.projectFacilityList[0].categoryCount++;
//                            var categoryCount = $scope.project.projectFacilityList[0].categoryCount;
//                            $scope.project.projectFacilityList[0].checklist.push({});
//                            $scope.project.projectFacilityList[0].checklist[categoryCount].deleted = false;
//                            $scope.project.projectFacilityList[0].checklist[categoryCount].name = categorySnapshot.val().name;
//                            $scope.project.projectFacilityList[0].checklist[categoryCount].ID = categorySnapshot.val().ID;
//                            $scope.project.projectFacilityList[0].checklist[categoryCount].no = categoryCount+1;
//                            $scope.project.projectFacilityList[0].checklist[categoryCount].formID = categoryCount;
//                            $scope.project.projectFacilityList[0].checklist[categoryCount].questionCount = -1;
//                            $scope.project.projectFacilityList[0].checklist[categoryCount].questionList = [];
//
//                            angular.forEach(categorySnapshot.val().question, function(questionValue, key) {
//                                $scope.project.projectFacilityList[0].checklist[categoryCount].questionList.push({});
//                                $scope.project.projectFacilityList[0].checklist[categoryCount].questionCount++;
//                                var questionCount = $scope.project.projectFacilityList[0].checklist[categoryCount].questionCount;
//                                var questionNo = 'abcdefghijklmnopqrstuvwxyz'[questionCount];
//                                $scope.project.projectFacilityList[0].checklist[categoryCount].questionList[questionCount].formID = questionCount;
//                                $scope.project.projectFacilityList[0].checklist[categoryCount].questionList[questionCount].no = questionNo;
//                                $scope.project.projectFacilityList[0].checklist[categoryCount].questionList[questionCount].name = questionValue.name;
//                                $scope.project.projectFacilityList[0].checklist[categoryCount].questionList[questionCount].ID = questionValue.ID;
//                                $scope.project.projectFacilityList[0].checklist[categoryCount].questionList[questionCount].type = questionValue.type;
//                                $scope.$apply();
//                            });
//                            $scope.btnValidateRemove();
//                        } else {
//                            //(#error)database-category-not-found
//                            console.log("database-category-not-found");
//                            $scope.notify("An error occured when accessing firebase database (Error #004)", "danger");
//                        } //end of if()
//                    }).catch(function(error) {
//                        console.log(error);
//                        if (error.code === "PERMISSION_DENIED") {
//                            //(#error)firebase-permission-denied
//                            $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
//                        } else {
//                            //(#error)unknown-error
//                            $scope.notify("An unknown error has occured (Error #000)", "danger");
//                        }
//                    });
                });
                
                $scope.project.projectFacilityList[0].order = ++$scope.dailySize;
                $scope.dailyList.push($scope.dailySize);
                
                $scope.btnValidateRemove();
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
    }; //end of $scope.addFacilityToProjectList()
        
    /**********************
    ***** Drag & Drop *****
    **** Project Edit *****
    **********************/
        
    if ($location.path() === "/edit-project") {
        var dragAndDrop = {
            init: function () {
                this.dragula();
                this.eventListeners();
            },
            eventListeners: function () {
                this.dragula.on('drop', this.dropped.bind(this));
            },
            dragula: function () {
                this.dragula = dragula([document.querySelector('#left'), document.querySelector('#right')],
                {
                    revertOnSpill: true,
                });
            },
            dropped: function (el, source, target) {
                if (target.id === "left" && source.id === "right") {
                    if ($scope.validation.length === 0) {
                        $scope.addFacilityToProjectList(el.id);
                        el.remove();
                        $scope.$apply();
                    }
//                    var index = $scope.facilityList.map(function(x) {return x.name}).indexOf(el.id);
//                    $scope.facilityList.splice(index,1);
                } else if (target.id === "right" && source.id === "left") {
//                    $scope.facilityList.unshift({name:el.id});
                    var index = $scope.project.projectFacilityList.map(function(x) {return x.name}).indexOf(el.id);
                    $scope.project.projectFacilityList[index].deleted = true;
                    $scope.deleteProjectFacility($scope.project.projectFacilityList[index]);
                    el.remove();
                    $scope.$apply();
                }
            }
        };

        dragAndDrop.init();
    }
    
    $scope.deleteProject = function() {
        var newDate = new Date();
        var datetime = newDate.dayNow() + " @ " + newDate.timeNow();
        firebase.database().ref('project/' + $scope.project.ID + "/deletedAt").set(datetime).then(function() {
            firebase.database().ref('project/' + $scope.project.ID + "/deletedBy").set($scope.user.ID).then(function() {
                $scope.notify("Successfully deleted \"" + $scope.project.name + "\" facility","success");
                $scope.project.deleted = true;
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
    };
        
    $scope.restoreProject = function() {
        firebase.database().ref('project/' + $scope.project.ID + "/deletedAt").set(null).then(function() {
            $scope.notify("Successfully restored \"" + $scope.project.name + "\" facility","success");
            $scope.project.deleted = false;
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
    };
    
    $scope.validateEditProject = function() {
        if ($scope.project.MCSTS === undefined || $scope.project.MCSTS === "") {
            $scope.MCSTSError = false;
            $scope.projectMCSTSInvalid = false;
            $scope.projectMCSTSLength = false;
        } else {
            if (!/^\d*(\.?)\d+$/.test($scope.project.MCSTS)) {
                $scope.MCSTSError = true;
                $scope.projectMCSTSInvalid = true;
                $scope.projectMCSTSLength = false;
            } else {
                if (!/^[0-9]{4}$/.test($scope.project.MCSTS)) {
                    $scope.MCSTSError = true;
                    $scope.projectMCSTSInvalid = false;
                    $scope.projectMCSTSLength = true;
                } else {
                    $scope.MCSTSError = false;
                    $scope.projectMCSTSInvalid = false;
                    $scope.projectMCSTSLength = false;
                }
            }
        }
        
        if ($scope.project.name === undefined || $scope.project.name === "")
            $scope.projectNameEmpty = true;
        else
            $scope.projectNameEmpty = false;
        
        if ($scope.project.address === undefined || $scope.project.address === "")
            $scope.projectAddressEmpty = true;
        else
            $scope.projectAddressEmpty = false;
        
        if ($scope.BUH.getValue().length === 0)
            $scope.projectBUHEmpty = true;
        else
            $scope.projectBUHEmpty = false;
        
        if ($scope.TM.getValue().length === 0)
            $scope.projectTMEmpty = true;
        else
            $scope.projectTMEmpty = false;
        
        if ($scope.CM.getValue().length === 0) {
            $scope.projectCMEmpty = true;
            $scope.projectCMError = true;
        } else {
            $scope.projectCMEmpty = false;
            $scope.projectCMError = false;
        }
        
        var error = false;
        $scope.checklistEmpty = false;
        
        angular.forEach($scope.project.projectFacilityList, function(facilityValue, key) {
            angular.forEach(facilityValue.checklist, function(categoryValue, key) {
                categoryValue.error = false;
            });
        });

        angular.forEach($scope.project.projectFacilityList, function(facilityValue, key) {
            if (!facilityValue.deleted) {
                angular.forEach(facilityValue.checklist, function(categoryValue, key) {
                    if (!categoryValue.deleted) {
                        if (categoryValue.name === undefined || categoryValue.name === "") {
                            $scope.checklistEmpty = true;
                            categoryValue.error = true;
                            error = true;
                        } else {
                            angular.forEach(categoryValue.questionList, function(questionValue, key) {
                                if (questionValue.name === undefined || questionValue.name === "") {
                                    $scope.checklistEmpty = true;
                                    categoryValue.error = true;
                                    error = true;
                                }
                            });
                        }
                    }
                });
            }
        });
        
//        if ($scope.projectCMError === false) {
            var CM = $scope.CM.getValue()[0];
            $scope.CMName = CM.substr(8);
            $scope.CMID = CM.substr(1,5);
//            
//            var newCMIndex = $scope.fullStaff.map(function(x) {return x.name}).indexOf($scope.CMName);
//            var oldCMIndex = $scope.fullStaff.map(function(x) {return x.name}).indexOf($scope.project.oldCM);
//            if ($scope.fullStaff[newCMIndex].hasProject && $scope.fullStaff[oldCMIndex].name !== $scope.fullStaff[newCMIndex].name) {
//                $scope.projectCMInvalid = true;
//                $scope.projectCMError = true;
//            } else {
//                $scope.oldCM = $scope.fullStaff[oldCMIndex];
//                $scope.newCM = $scope.fullStaff[newCMIndex];
//                $scope.projectCMInvalid = false;
//                $scope.projectCMError = false;
//            }
//        }

//        if (!error && !$scope.MCSTSError && !$scope.projectNameEmpty && !$scope.projectAddressEmpty && !$scope.projectBUHEmpty && !$scope.projectTMEmpty && !$scope.projectCMEmpty && !$scope.checklistEmpty && !$scope.projectCMInvalid) {
        if (!error && !$scope.MCSTSError && !$scope.projectNameEmpty && !$scope.projectAddressEmpty && !$scope.projectBUHEmpty && !$scope.projectTMEmpty && !$scope.projectCMEmpty && !$scope.checklistEmpty) {
            var BUH = $scope.BUH.getValue()[0];
            $scope.BUHName = BUH.substr(8);
            $scope.BUHID = BUH.substr(1,5);
            var TM = $scope.TM.getValue()[0];
            $scope.TMName = TM.substr(8);
            $scope.TMID = TM.substr(1,5);
            
            $scope.saveProject();
        }
    } //end of $scope.validateProject()
    
    $scope.saveProject = function() {
        $scope.projectFacilityAdded = [];
        $scope.categoryAdded = [];

        firebase.database().ref('count').once('value').then(function (snapshot, error) {
            if (snapshot.val() !== null) {

                $scope.questionAlphabet = "Q";
                $scope.categoryAlphabet = "C";
                $scope.projectFacilityAlphabet = snapshot.val().projectFacilityCount.alphabet;
                $scope.questionCount = 0;
                $scope.categoryCount = 0;
                $scope.projectFacilityCount = snapshot.val().projectFacilityCount.count;
                
                angular.forEach($scope.project.projectFacilityList, function(facilityValue, key) {
                    if (facilityValue.deleted === true && facilityValue.ID !== undefined) {
                        //deleted facility from firebase
                        //do not need to delete anymore //delete category in facility
//                        angular.forEach(facilityValue.checklist, function(categoryValue, key) {
//                            var categoryRef = firebase.database().ref('category/' + categoryValue.ID);
//                            categoryRef.remove().then(function() {
//                                //do nothing
//                            }).catch(function(error) {
//                                console.log(error);
//                                if (error.code === "PERMISSION_DENIED") {
//                                    //(#error)firebase-permission-denied
//                                    $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
//                                } else {
//                                    //(#error)unknown-error
//                                    $scope.notify("An unknown error has occured (Error #000)", "danger");
//                                }
//                            });
//                        });
                        var projectFacilityRef = firebase.database().ref('projectfacility/' + facilityValue.ID);
                        projectFacilityRef.remove().then(function() {
                            //do nothing
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
                    } else if (facilityValue.deleted === false && facilityValue.ID !== undefined) {
                        //update category in firebase
//                        angular.forEach(facilityValue.checklist, function(categoryValue, key) {
//                            if (categoryValue.deleted === true && categoryValue.ID !== undefined) {
//                                var categoryRef = firebase.database().ref('category/' + categoryValue.ID);
//                                categoryRef.remove().then(function() {
//                                    //do nothing
//                                }).catch(function(error) {
//                                    console.log(error);
//                                    if (error.code === "PERMISSION_DENIED") {
//                                        //(#error)firebase-permission-denied
//                                        $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
//                                    } else {
//                                        //(#error)unknown-error
//                                        $scope.notify("An unknown error has occured (Error #000)", "danger");
//                                    }
//                                });
//                            } else if (categoryValue.deleted === false && categoryValue.ID !== undefined) {
//                                $scope.categoryAdded.push(categoryValue.ID);
//                                firebase.database().ref('category/' + categoryValue.ID).set({
//                                    ID: categoryValue.ID,
//                                    name: categoryValue.name
//                                }).then(function() {
//                                    //do nothing
//                                }).catch(function(error) {
//                                    console.log(error);
//                                    if (error.code === "PERMISSION_DENIED") {
//                                        //(#error)firebase-permission-denied
//                                        $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
//                                    } else {
//                                        //(#error)unknown-error
//                                        $scope.notify("An unknown error has occured (Error #000)", "danger");
//                                    }
//                                });
//
//                                //remove existing questions
//                                var questionRef = firebase.database().ref('category/' + categoryValue.ID + '/question');
//                                questionRef.remove().then(function() {
//                                    //do nothing
//                                }).catch(function(error) {
//                                    console.log(error);
//                                    if (error.code === "PERMISSION_DENIED") {
//                                        //(#error)firebase-permission-denied
//                                        $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
//                                    } else {
//                                        //(#error)unknown-error
//                                        $scope.notify("An unknown error has occured (Error #000)", "danger");
//                                    }
//                                });
//
//                                //add new questions
//                                angular.forEach(categoryValue.questionList, function(questionValue, key) {
//                                    $scope.questionCount++;
//                                    firebase.database().ref('category/' + categoryValue.ID + '/question/' + 
//                                        $scope.questionAlphabet + $scope.questionCount)
//                                    .set({
//                                        name: questionValue.name,
//                                        ID: $scope.questionAlphabet + $scope.questionCount,
//                                        type: questionValue.type
//                                    }).then(function() {
//                                        firebase.database().ref('count/questionCount').set({
//                                            count: $scope.questionCount,
//                                            alphabet: $scope.questionAlphabet
//                                        });
//                                    }).catch(function(error) {
//                                        console.log(error);
//                                        if (error.code === "PERMISSION_DENIED") {
//                                            //(#error)firebase-permission-denied
//                                            $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
//                                        } else {
//                                            //(#error)unknown-error
//                                            $scope.notify("An unknown error has occured (Error #000)", "danger");
//                                        }
//                                    });
//                                });
//                            } else if (categoryValue.deleted === false && categoryValue.ID === undefined) {
//                                //add new category to firebase
//                                $scope.categoryCount++;
//                                $scope.categoryAdded.push($scope.categoryAlphabet + $scope.categoryCount);
//                                firebase.database().ref('category/' + $scope.categoryAlphabet + $scope.categoryCount).set({
//                                    name: categoryValue.name,
//                                    ID: $scope.categoryAlphabet + $scope.categoryCount
//                                }).then(function() {
//                                    firebase.database().ref('count/categoryCount').set({
//                                        count: $scope.categoryCount,
//                                        alphabet: $scope.categoryAlphabet
//                                    });
//                                }).catch(function(error) {
//                                    console.log(error);
//                                    if (error.code === "PERMISSION_DENIED") {
//                                        //(#error)firebase-permission-denied
//                                        $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
//                                    } else {
//                                        //(#error)unknown-error
//                                        $scope.notify("An unknown error has occured (Error #000)", "danger");
//                                    }
//                                });
//
//                                //add new questions to firebase
//                                angular.forEach(categoryValue.questionList, function(questionValue, key) {
//                                    $scope.questionCount++;
//                                    firebase.database().ref('category/' + $scope.categoryAlphabet + $scope.categoryCount + '/question/' + 
//                                        $scope.questionAlphabet + $scope.questionCount).set({
//                                        name: questionValue.name,
//                                        ID: $scope.questionAlphabet + $scope.questionCount,
//                                        type: questionValue.type
//                                    }).then(function() {
//                                        firebase.database().ref('count/questionCount').set({
//                                            count: $scope.questionCount,
//                                            alphabet: $scope.questionAlphabet
//                                        });
//                                    }).catch(function(error) {
//                                        console.log(error);
//                                        if (error.code === "PERMISSION_DENIED") {
//                                            //(#error)firebase-permission-denied
//                                            $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
//                                        } else {
//                                            //(#error)unknown-error
//                                            $scope.notify("An unknown error has occured (Error #000)", "danger");
//                                        }
//                                    });
//                                }); 
//                            }
//                        });
                        
                        //update existing projectFacility
                        $scope.projectFacilityAdded.push(facilityValue.ID);
                        firebase.database().ref('projectfacility/' + facilityValue.ID).set({
                            frequency: facilityValue.frequency,
                            name: facilityValue.name,
                            order: facilityValue.order,
                            ID: facilityValue.ID,
                            projectID: $scope.project.ID
                        }).then(function() {
                            //do nothing
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

                        angular.forEach(facilityValue.checklist, function(categoryValue, key) {
                            
                            if (!categoryValue.deleted) {
                                $scope.categoryCount++;

                                firebase.database().ref('projectfacility/' + facilityValue.ID
                                        + '/category/' + $scope.categoryAlphabet + $scope.categoryCount).set({
                                    name: categoryValue.name,
                                    ID: $scope.categoryAlphabet + $scope.categoryCount
                                }).then(function() {
                                    //do nothing
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

                                angular.forEach(categoryValue.question, function(questionValue, key) {
                                    $scope.questionCount++;

                                    firebase.database().ref('projectfacility/' + facilityValue.ID
                                        + '/category/' + $scope.categoryAlphabet + $scope.categoryCount 
                                        + '/question/' + $scope.questionAlphabet + $scope.questionCount).set({
                                        name: questionValue.name,
                                        ID: $scope.questionAlphabet + $scope.questionCount,
                                        type: questionValue.type
                                    }).then(function() {
                                        //do nothing
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
                                });
                            }
                        });
                        
                        //for old database format
//                        angular.forEach($scope.categoryAdded, function(categoryValue, key) {
//                            firebase.database().ref('projectfacility/' + facilityValue.ID + '/category/' + categoryValue)
//                            .set(categoryValue)
//                            .then(function() {
//                                //do nothing
//                            }).catch(function(error) {
//                                console.log(error);
//                                if (error.code === "PERMISSION_DENIED") {
//                                    //(#error)firebase-permission-denied
//                                    $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
//                                } else {
//                                    //(#error)unknown-error
//                                    $scope.notify("An unknown error has occured (Error #000)", "danger");
//                                }
//                            });
//                        });
                        $scope.categoryAdded = [];
                    } else if (facilityValue.deleted === false && facilityValue.ID === undefined) {
//                        angular.forEach(facilityValue.checklist, function(categoryValue, key) {
//                            if (categoryValue.deleted === false) {
//                                $scope.categoryCount++;
//                                $scope.categoryAdded.push($scope.categoryAlphabet + $scope.categoryCount);
//                                firebase.database().ref('category/' + $scope.categoryAlphabet + $scope.categoryCount).set({
//                                    name: categoryValue.name,
//                                    ID: $scope.categoryAlphabet + $scope.categoryCount
//                                }).then(function() {
//                                    firebase.database().ref('count/categoryCount').set({
//                                        count: $scope.categoryCount,
//                                        alphabet: $scope.categoryAlphabet
//                                    });
//                                }).catch(function(error) {
//                                    console.log(error);
//                                    if (error.code === "PERMISSION_DENIED") {
//                                        //(#error)firebase-permission-denied
//                                        $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
//                                    } else {
//                                        //(#error)unknown-error
//                                        $scope.notify("An unknown error has occured (Error #000)", "danger");
//                                    }
//                                });
//
//                                angular.forEach(categoryValue.questionList, function(questionValue, key) {
//                                    $scope.questionCount++;
//                                    firebase.database().ref('category/' + $scope.categoryAlphabet + $scope.categoryCount + '/question/' + 
//                                        $scope.questionAlphabet + $scope.questionCount).set({
//                                        name: questionValue.name,
//                                        ID: $scope.questionAlphabet + $scope.questionCount,
//                                        type: questionValue.type
//                                    }).then(function() {
//                                        firebase.database().ref('count/questionCount').set({
//                                            count: $scope.questionCount,
//                                            alphabet: $scope.questionAlphabet
//                                        });
//                                    }).catch(function(error) {
//                                        console.log(error);
//                                        if (error.code === "PERMISSION_DENIED") {
//                                            //(#error)firebase-permission-denied
//                                            $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
//                                        } else {
//                                            //(#error)unknown-error
//                                            $scope.notify("An unknown error has occured (Error #000)", "danger");
//                                        }
//                                    });
//                                });
//                            }
//                        });
                            
                        $scope.projectFacilityCount++;
                        $scope.projectFacilityAdded.push($scope.projectFacilityAlphabet + $scope.projectFacilityCount);

                        firebase.database().ref('projectfacility/' + $scope.projectFacilityAlphabet + $scope.projectFacilityCount).set({
                                frequency: facilityValue.frequency,
                                name: facilityValue.name,
                                order: facilityValue.order,
                                ID: $scope.projectFacilityAlphabet + $scope.projectFacilityCount,
                                projectID: $scope.project.ID
                        }).then(function() {
                            firebase.database().ref('count/projectFacilityCount').set({
                                count: $scope.projectFacilityCount,
                                alphabet: $scope.projectFacilityAlphabet
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
                        
                        angular.forEach(facilityValue.checklist, function(categoryValue, key) {
                            if (!categoryValue.deleted) {
                                $scope.categoryCount++;

                                firebase.database().ref('projectfacility/' + $scope.projectFacilityAlphabet + $scope.projectFacilityCount
                                        + '/category/' + $scope.categoryAlphabet + $scope.categoryCount).set({
                                    name: categoryValue.name,
                                    ID: $scope.categoryAlphabet + $scope.categoryCount
                                }).then(function() {
                                    //do nothing
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

                                angular.forEach(categoryValue.questionList, function(questionValue, key) {
                                    $scope.questionCount++;

                                    firebase.database().ref('projectfacility/' + $scope.projectFacilityAlphabet + $scope.projectFacilityCount
                                        + '/category/' + $scope.categoryAlphabet + $scope.categoryCount 
                                        + '/question/' + $scope.questionAlphabet + $scope.questionCount).set({
                                        name: questionValue.name,
                                        ID: $scope.questionAlphabet + $scope.questionCount,
                                        type: questionValue.type
                                    }).then(function() {
                                        //do nothing
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
                                });
                            }
                        });

//                        angular.forEach($scope.categoryAdded, function(categoryValue, key) {
//                            firebase.database().ref('projectfacility/' + $scope.projectFacilityAlphabet + $scope.projectFacilityCount 
//                                    + '/category/' + categoryValue).set(categoryValue)
//                            .then(function() {
//                                //do nothing
//                            }).catch(function(error) {
//                                console.log(error);
//                                if (error.code === "PERMISSION_DENIED") {
//                                    //(#error)firebase-permission-denied
//                                    $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
//                                } else {
//                                    //(#error)unknown-error
//                                    $scope.notify("An unknown error has occured (Error #000)", "danger");
//                                }
//                            });
//                        });
                        $scope.categoryAdded = [];
                    }
                });
                
                //update project details    
                if ($scope.MCSTS === undefined)
                    $scope.MCSTS = "";
                
                var newDate = new Date();
                var datetime = newDate.dayNow() + " @ " + newDate.timeNow();
                
                /***** remove *****/
                if ($scope.project.createdAt === undefined)
                    $scope.project.createdAt = datetime;
                if ($scope.project.createdBy === undefined)
                    $scope.project.createdBy = $scope.user.ID;

                firebase.database().ref('project/' + $scope.project.ID).set({
                    name: $scope.project.name,
                    ID: $scope.project.ID,
                    BUH: $scope.BUHID,
                    TM: $scope.TMID,
                    CM: $scope.CMID,
                    address: $scope.project.address,
                    MCSTS: $scope.project.MCSTS,
                    updatedAt: datetime,
                    updatedBy: $scope.user.ID,
                    createdAt: $scope.project.createdAt,
                    createdBy: $scope.project.createdBy
                }).then(function() {
                    var error = false;
                    
//                    if ($scope.oldCM.ID !== $scope.newCM.ID) {
//                        firebase.database().ref('staff/' + $scope.oldCM.authID + '/hasProject').set(false);
//                        firebase.database().ref('staff/' + $scope.newCM.authID + '/hasProject').set(true);
//                    }

                    angular.forEach($scope.projectFacilityAdded, function(projectFacilityValue, key) {
                        firebase.database().ref('project/' + $scope.project.ID + '/projectFacility/' + projectFacilityValue)
                        .set(projectFacilityValue)
                        .then(function() {
                            //do nothing
                        }).catch(function(error) {
                            error = true;
                            console.log(error);
                            if (error.code === "PERMISSION_DENIED") {
                                //(#error)firebase-permission-denied
                                $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
                            } else {
                                //(#error)unknown-error
                                $scope.notify("An unknown error has occured (Error #000)", "danger");
                            }
                        });
                    });

                    if (!error) {
                        $location.path("/projects").search("edit",$scope.project.name).search("projectID",null).search("add",null);
                        $route.reload();
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
                //(#error)database-count-does-not-exist
                console.log("database-count-does-not-exist");
                $scope.notify("An error occured when accessing firebase database (Error #003)", "danger");
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
    } //end of $scope.saveProject()
        
}]);