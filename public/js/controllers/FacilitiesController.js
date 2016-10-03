app.controller('FacilitiesController', ['$rootScope', '$route', '$routeParams', '$scope', '$location', '$firebaseAuth', '$firebaseObject', 
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
        
    $scope.btnValidate = false;
    
    /*********************
    *** Authentication ***
    *********************/
    
    $scope.auth = $firebaseAuth();
    
    //detect authentication state change (login/logout)
    $scope.auth.$onAuthStateChanged(function(firebaseUser) {
        $scope.firebaseUser = firebaseUser;
        if ($scope.firebaseUser === null)
            $location.path('/login').search("facilityID",null).search("edit",null).search("add",null);
        else
            $scope.checkUser();
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
            alert("You do not have permission to view this webpage (facilities1)");
            $location.path("/admin").search("facilityID",null).search("edit",null).search("add",null);
            $route.reload();
        } else if (!$scope.user.isAdmin) {
            alert("You do not have permission to view this webpage (facilities2)");
            $location.path("/dashboard").search("facilityID",null).search("edit",null).search("add",null);
            $route.reload();
        }
    };
        
    $scope.checkSoftRouting = function() {
        if ($scope.user.isSuperAdmin) {
            $location.path("/admin").search("facilityID",null).search("edit",null).search("add",null);
            $route.reload();
        } else if (!$scope.user.isAdmin) {
            $location.path("/dashboard").search("facilityID",null).search("edit",null).search("add",null);
            $route.reload();
        }
    };
    
    $scope.logout = function() {
        delete $rootScope.user;
        $scope.auth.$signOut();
    };
        
    /*********************
    ******** Date ********
    *********************/
    
    //get current date in yyyy/mm/dd format
    Date.prototype.dayNow = function () { 
        return (this.getFullYear() + "/" + (((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1) + "/" + 
            ((this.getDate() < 10)?"0":"") + this.getDate());
    }
    
    //get current time in hh:mm:ss format
    Date.prototype.timeNow = function () {
        return ((this.getHours() < 10)?"0":"") + this.getHours() + ":" + ((this.getMinutes() < 10)?"0":"") + 
            this.getMinutes() + ":" + ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
    }
    
    /*********************
    ** Firebase Storage **
    *********************/
    
    $scope.storageRef = firebase.storage().ref();
    $scope.facilitiesRef = $scope.storageRef.child('facility');
        
    /********************
    ** Search & Filter **
    ********************/
    
    $scope.sortByList = ['All','Not Deleted','Deleted'];
	$scope.sortByItem = 'Not Deleted';
	
	$scope.sortByItemSelected = function(itemSelected) {
		$scope.sortByItem = itemSelected;
	};
    
    //filter for facility status
    $scope.isdeleted = function(f) {
        if ($scope.sortByItem === 'Not Deleted')
            return (!f.deleted);
        else if ($scope.sortByItem === 'Deleted')
            return (f.deleted);
        else if ($scope.sortByItem === 'All')
            return true;
        else
            return (!f.deleted);
    };
    
    /********************
    ****** Routing ******
    ********************/
        
    $scope.goToAddFacility = function() {
        $location.path('/add-facility').search("facilityID",null).search("edit",null).search("add",null);
    };
    
    $scope.goToFacilities = function() {
        $location.path('/facilities').search("facilityID",null).search("edit",null).search("add",null);
    };
    
    $scope.goToEditFacility = function() {
        if ($scope.facilityID !== undefined)
            $location.path("/edit-facility").search("facilityID",$scope.facilityID).search("edit",null).search("add",null);
        else 
            $location.path("/edit-facility").search("facilityID",$scope.facility.ID).search("edit",null).search("add",null);
    };
        
    /********************
    ***** Checklist *****
    ********************/
        
    $scope.addEmptyCategory = function() {
        $scope.categoryCount++;
        var newCategory = {questionCount:-1, question:[]};
        $scope.checklist.push(newCategory);
    };
        
    $scope.addEmptyQuestion = function() {
        $scope.checklist[$scope.categoryCount].questionCount++;
        var questionNo = 'abcdefghijklmnopqrstuvwxyz'[$scope.checklist[$scope.categoryCount].questionCount];
        var newQuestion = {formID:$scope.checklist[$scope.categoryCount].questionCount, no:questionNo};
        $scope.checklist[$scope.categoryCount].question.push(newQuestion);
    };
    
    $scope.addCategory = function() {
        $scope.categoryCount++;
        var newQuestion = {name:"", formID:0, no:"a", type:"MCQ"};
        var newCategory = {name:"", formID:$scope.categoryCount, no:$scope.categoryCount+1,
            questionCount:0, question:[newQuestion]};
        $scope.checklist.push(newCategory);
    };
    
    $scope.addQuestion = function(category) {
        category.questionCount++;
        var questionNo = 'abcdefghijklmnopqrstuvwxyz'[category.questionCount];
        var newQuestion = {name:"", formID:category.questionCount, no:questionNo, type:"MCQ"};
        category.question.push(newQuestion);
    };
    
    $scope.deleteCategory = function(category) {
        if ($scope.categoryCount !== 0) {
            $scope.categoryCount--;
            var index = $scope.checklist.indexOf(category);
            $scope.checklist.splice(index, 1);
            
            for(index; index < $scope.checklist.length; index++) {
                $scope.checklist[index].formID = index;
                $scope.checklist[index].no = index+1;
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
    
    $scope.removeCategory = function(category) {
        if ($scope.categoryCount !== 0) {
            category.deleted = true;
            $scope.categoryCount--;
            
            var count = 0;
            for(var i = 0; i < $scope.checklist.length; i++) {
                if ($scope.checklist[i].deleted) {
                    count++;
                } else {
                    $scope.checklist[i].formID = i-count;
                    $scope.checklist[i].no = i+1-count;
                }
            }
        }
    };
        
    /*********************
    **** Facility Add ****
    *********************/
    
    if ($location.path() === "/add-facility") {
        $scope.categoryCount = 0;
        var newQuestion = {name:"", formID:0, no:"a", type:"MCQ"};
        var newCategory = {name:"", formID:0, no:1, questionCount:0, question:[newQuestion]};
        $scope.checklist = [];
        $scope.checklist.push(newCategory);
    };
        
    $scope.validateAddForm = function() {
        $scope.btnValidate = true;
        if ($scope.name === undefined || $scope.name === "")
            $scope.facilityNameEmpty = true;
        else
            $scope.facilityNameEmpty = false;
        
        if ($scope.photo === undefined || $scope.photo === null)
            $scope.facilityPhotoEmpty = true;
        else
            $scope.facilityPhotoEmpty = false;
        
        var error = false;
        
        angular.forEach($scope.checklist, function(categoryValue, key) {
            categoryValue.error = false;
        });
        
        angular.forEach($scope.checklist, function(categoryValue, key) {
            if (categoryValue.name === undefined || categoryValue.name === "") {
                categoryValue.error = true;
                error = true;
            } else {
                angular.forEach(categoryValue.question, function(questionValue, key) {
                    if (questionValue.name === undefined || questionValue.name === "") {
                        categoryValue.error = true;
                        error = true;
                    }
                });
            }
        });
        
        if (!error && !$scope.facilityNameEmpty && !$scope.facilityPhotoEmpty)
            $scope.addFacility();
        else
            $scope.btnValidate = false;
    }; //end of $scope.validateForm()
    
    $scope.addFacility = function() {
        $scope.categoryAdded = [];

        firebase.database().ref('count').once('value').then(function (snapshot, error) {
            if (snapshot.val().questionCount !== null && snapshot.val().categoryCount !== null) {

                $scope.questionAlphabet = snapshot.val().questionCount.alphabet;
                $scope.categoryAlphabet = snapshot.val().categoryCount.alphabet;
                $scope.facilityAlphabet = snapshot.val().facilityCount.alphabet;
                $scope.questionCount = snapshot.val().questionCount.count;
                $scope.categoryCount = snapshot.val().categoryCount.count;
                $scope.facilityCount = snapshot.val().facilityCount.count;

                $scope.facilityCount++;

                //loop through checklist to add category
                angular.forEach($scope.checklist, function(categoryValue, key) {
                    $scope.categoryCount++;
                    $scope.categoryAdded.push($scope.categoryAlphabet + $scope.categoryCount);

                    firebase.database().ref('category/' + $scope.categoryAlphabet + $scope.categoryCount).set({
                        name: categoryValue.name,
                        ID: $scope.categoryAlphabet + $scope.categoryCount
                    }).then(function() {
                        firebase.database().ref('count/categoryCount').set({
                            count: $scope.categoryCount,
                            alphabet: $scope.categoryAlphabet
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
                        $scope.btnValidate = false;
                        $scope.$apply();
                    });

                    //add question to category
                    angular.forEach(categoryValue.question, function(questionValue, key) {
                        $scope.questionCount++;
                        firebase.database().ref('category/' + $scope.categoryAlphabet + $scope.categoryCount + '/question/' + 
                            $scope.questionAlphabet + $scope.questionCount).set({
                            name: questionValue.name,
                            ID: $scope.questionAlphabet + $scope.questionCount,
                            type: questionValue.type
                        }).then(function() {
                            firebase.database().ref('count/questionCount').set({
                                count: $scope.questionCount,
                                alphabet: $scope.questionAlphabet
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
                            $scope.btnValidate = false;
                            $scope.$apply();
                        });
                    });
                });

                //add facility photo to storage
                var uploadTask = $scope.facilitiesRef.child($scope.facilityAlphabet + $scope.facilityCount).put($scope.photo);

                uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, function(snapshot) {
                    var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    $scope.photoProgress = 'Upload is ' + progress + '% done';

                    switch (snapshot.state) {
                        case firebase.storage.TaskState.PAUSED:
                            $scope.photoStatus = 'Upload is paused';
                            break;
                        case firebase.storage.TaskState.RUNNING:
                            $scope.photoStatus = 'Upload is running';
                            break;
                    }
                }, function(error) {
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
                    $scope.btnValidate = false;
                    $scope.$apply();
                }, function() {
                    $scope.downloadURL = uploadTask.snapshot.downloadURL;

                    var newDate = new Date();
                    var datetime = newDate.dayNow() + " @ " + newDate.timeNow();

                    //add facility to database
                    firebase.database().ref('facility/' + $scope.facilityAlphabet + $scope.facilityCount).set({
                        name: $scope.name,
                        ID: $scope.facilityAlphabet + $scope.facilityCount,
                        photoURL: $scope.downloadURL,
                        createdAt: datetime,
                        createdBy: $scope.user.ID,
                        updatedAt: datetime,
                        updatedBy: $scope.user.ID
                    }).then(function() {
                        firebase.database().ref('count/facilityCount').set({
                            count: $scope.facilityCount,
                            alphabet: $scope.facilityAlphabet
                        });

                        var error = false;

                        //add category to facility
                        angular.forEach($scope.categoryAdded, function(categoryValue, key) {
                            firebase.database().ref('facility/' + $scope.facilityAlphabet + $scope.facilityCount + '/category/' + categoryValue)
                            .set(categoryValue).then(function() {
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
                                $scope.btnValidate = false;
                                $scope.$apply();
                            });
                        });

                        if (!error) {
                            $location.path("/facilities").search("add",$scope.name);
                            $route.reload();
                        } else {
                            $scope.btnValidate = false;
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
                        $scope.btnValidate = false;
                        $scope.$apply();
                    });
                });
            } else {
                //(#error)database-count-does-not-exist
                console.log("database-count-does-not-exist");
                $scope.notify("An error occured when accessing firebase database (Error #003)", "danger");
                $scope.btnValidate = false;
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
            $scope.btnValidate = false;
            $scope.$apply();
        });
    }; //end of $scope.addFacility()
    
    /********************
    *** Facility List ***
    ********************/
    
    var ref = firebase.database().ref().child("facility");
    
    //refreshes facility list
    $scope.refreshFacilityList = function() {
        firebase.database().ref('facility').once('value').then(function (snapshot, error) {
            $scope.facilityList = [];
            angular.forEach(snapshot.val(), function(facilityValue, key) {
                $scope.facilityList.push(facilityValue);
            });
            angular.forEach($scope.facilityList, function(facilityValue, key) {
                if (facilityValue.deletedAt !== undefined)
                    facilityValue.deleted = true;
                else
                    facilityValue.deleted = false;
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
    };
    
    //listen for changes in firebase
    ref.on('value', function() {
        $scope.refreshFacilityList();
    });
        
    //show pop-up notifcation for add success
    if ($routeParams.add !== undefined) {
        $scope.notify("Successfully added \"" +$routeParams.add + "\" facility","success");
    }
        
    //show pop-up notifcation for edit success
    if ($routeParams.edit !== undefined) {
        $scope.notify("Successfully saved \"" +$routeParams.edit + "\" facility","success");
    }
    
    /********************
    ** Facility Manage **
    ********************/
    
    $scope.deleteFacility = function() {
        $scope.facility.deleted = true;
        var newDate = new Date();
        var datetime = newDate.dayNow() + " @ " + newDate.timeNow();
        firebase.database().ref('facility/' + $scope.facility.ID + "/deletedAt").set(datetime).then(function() {
            firebase.database().ref('facility/' + $scope.facility.ID + "/deletedBy").set($scope.user.ID).then(function() {
                $scope.notify("Successfully deleted \"" + $scope.facility.name + "\" facility","success");
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
        
    $scope.restoreFacility = function() {
        $scope.facility.deleted = false;
        firebase.database().ref('facility/' + $scope.facility.ID + "/deletedAt").set(null).then(function() {
            $scope.notify("Successfully restored \"" + $scope.facility.name + "\" facility","success");
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
    
    /********************
    *** Facility View ***
    ********************/
        
    $scope.overlay = false;
    
    $scope.closeOverlay = function() {
        $scope.overlay = false;
    };
        
    $scope.openOverlay = function($event) {
        $event.stopPropagation();
    };
        
    $scope.viewFacility = function(facility) {
        $scope.overlay = true;
        $scope.facility = facility;
        $scope.checklist = [];
        $scope.categoryCount = -1;
        
        if ($scope.facility.deletedAt !== undefined)
            $scope.facility.deleted = true;
        else
            $scope.facility.deleted = false;
        
        angular.forEach($scope.facility.category, function(categoryID, key) {
            firebase.database().ref("category/" + categoryID).once("value").then(function(snapshot) {
                if (snapshot.val() != null) {
                    $scope.addEmptyCategory();
                    $scope.checklist[$scope.categoryCount].name = snapshot.val().name;
                    $scope.checklist[$scope.categoryCount].ID = snapshot.val().ID;
                    $scope.checklist[$scope.categoryCount].no = $scope.categoryCount+1;
                    $scope.checklist[$scope.categoryCount].formID = $scope.categoryCount;

                    angular.forEach(snapshot.val().question, function(questionValue, key) {
                        $scope.addEmptyQuestion();
                        var questionCount = $scope.checklist[$scope.categoryCount].questionCount;
                        $scope.checklist[$scope.categoryCount].question[questionCount].name = questionValue.name;
                        $scope.checklist[$scope.categoryCount].question[questionCount].ID = questionValue.ID;
                        $scope.checklist[$scope.categoryCount].question[questionCount].type = questionValue.type;
                        $scope.$apply();
                    });
                    
                } else {
                    //(#error)database-category-not-found
                    console.log("database-category-not-found");
                    $scope.notify("An error occured when accessing firebase database (Error #004)", "danger");
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
        });
    }; //end of $scope.viewFacility()
        
    /********************
    *** Facility Edit ***
    ********************/
    
    $scope.reloadFacility = function() {
        firebase.database().ref("facility/" + $scope.facilityID).once("value").then(function(snapshot) {
            if (snapshot.val() != null) {
                $scope.facility = snapshot.val();
                $scope.photoURL = $scope.facility.photoURL;
                $scope.checklist = [];
                $scope.categoryCount = -1;
                
                if ($scope.facility.deletedAt !== undefined)
                    $scope.facility.deleted = true;
                
                angular.forEach($scope.facility.category, function(categoryID, key) {
                    firebase.database().ref("category/" + categoryID).once("value").then(function(snapshot) {
                        if (snapshot.val() != null) {
                            $scope.addEmptyCategory();
                            $scope.checklist[$scope.categoryCount].name = snapshot.val().name;
                            $scope.checklist[$scope.categoryCount].ID = snapshot.val().ID;
                            $scope.checklist[$scope.categoryCount].no = $scope.categoryCount+1;
                            $scope.checklist[$scope.categoryCount].formID = $scope.categoryCount;
                            $scope.checklist[$scope.categoryCount].deleted = false;

                            angular.forEach(snapshot.val().question, function(questionValue, key) {
                                $scope.addEmptyQuestion();
                                var questionCount = $scope.checklist[$scope.categoryCount].questionCount;
                                $scope.checklist[$scope.categoryCount].question[questionCount].name = questionValue.name;
                                $scope.checklist[$scope.categoryCount].question[questionCount].ID = questionValue.ID;
                                $scope.checklist[$scope.categoryCount].question[questionCount].type = questionValue.type;
                                $scope.$apply();
                            });
                        } else {
                            //(#error)database-category-not-found
                            console.log("database-category-not-found");
                            $scope.notify("An error occured when accessing firebase database (Error #004)", "danger");
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
                });
                
                $scope.$apply();
            } else {
                //(#error)database-facility-not-found
                console.log("database-facility-not-found");
                $scope.notify("An error occured when accessing firebase database (Error #005)", "danger");
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
    
    //get facilityID from URL
    if ($routeParams.facilityID !== undefined) {
        $scope.facilityID = $routeParams.facilityID;
        var facilityRef = firebase.database().ref().child("facility/" + $scope.facilityID);
        
        facilityRef.on('value', function() {
            $scope.reloadFacility();
        });
    };
        
    $scope.validateEditForm = function() {
        $scope.btnValidate = true;
        if ($scope.facility.name === undefined || $scope.facility.name === "")
            $scope.facilityNameEmpty = true;
        else
            $scope.facilityNameEmpty = false;
        
        if ($scope.facility.photoURL === undefined || $scope.facility.photoURL === null)
            $scope.facilityPhotoEmpty = true;
        else
            $scope.facilityPhotoEmpty = false;
        
        var error = false;
        
        angular.forEach($scope.checklist, function(categoryValue, key) {
            categoryValue.error = false;
        });
        
        angular.forEach($scope.checklist, function(categoryValue, key) {
            if (!categoryValue.deleted)
            {
                if (categoryValue.name === undefined || categoryValue.name === "") {
                    categoryValue.error = true;
                    error = true;
                } else {
                    angular.forEach(categoryValue.question, function(questionValue, key) {
                        if (questionValue.name === undefined || questionValue.name === "") {
                            categoryValue.error = true;
                            error = true;
                        }
                    });
                }
            }
        });
        
        if (!error && !$scope.facilityNameEmpty && !$scope.facilityPhotoEmpty)
            $scope.saveFacility();
        else
            $scope.btnValidate = false;
    }; //end of $scope.validateEditForm()
    
    $scope.saveFacility = function() {
        $scope.categoryAdded = [];
        
        firebase.database().ref('count').once('value').then(function (snapshot, error) {
            if (snapshot.val().questionCount !== null && snapshot.val().categoryCount !== null) {

                $scope.questionAlphabet = snapshot.val().questionCount.alphabet;
                $scope.categoryAlphabet = snapshot.val().categoryCount.alphabet;
                $scope.questionCount = snapshot.val().questionCount.count;
                $scope.databaseCategoryCount = snapshot.val().categoryCount.count;

                //loop through checklist to delete/edit/add category
                angular.forEach($scope.checklist, function(categoryValue, key) {
                    if (categoryValue.deleted && categoryValue.ID !== undefined) {
                        //delete category in database
                        var categoryRef = firebase.database().ref('category/' + categoryValue.ID);
                        categoryRef.remove().then(function() {
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
                            $scope.btnValidate = false;
                            $scope.$apply();
                        });
                    } else if (!categoryValue.deleted && categoryValue.ID !== undefined) {
                        //update category in database
                        $scope.categoryAdded.push(categoryValue.ID);
                        firebase.database().ref('category/' + categoryValue.ID).set({
                            ID: categoryValue.ID,
                            name: categoryValue.name
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
                            $scope.btnValidate = false;
                            $scope.$apply();
                        });

                        //remove old question in category
                        var questionRef = firebase.database().ref('category/' + categoryValue.ID + '/question');
                        questionRef.remove().then(function() {
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
                            $scope.btnValidate = false;
                            $scope.$apply();
                        });
                        
                        //add new question to category
                        angular.forEach(categoryValue.question, function(questionValue, key) {
                            $scope.questionCount++;
                            firebase.database().ref('category/' + categoryValue.ID + '/question/' + $scope.questionAlphabet + $scope.questionCount)
                            .set({
                                name: questionValue.name,
                                ID: $scope.questionAlphabet + $scope.questionCount,
                                type: questionValue.type
                            }).then(function() {
                                firebase.database().ref('count/questionCount').set({
                                    count: $scope.questionCount,
                                    alphabet: $scope.questionAlphabet
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
                                $scope.btnValidate = false;
                                $scope.$apply();
                            });
                        });
                    } else if (!categoryValue.deleted && categoryValue.ID === undefined) {
                        //add new category in database
                        $scope.databaseCategoryCount++;
                        $scope.categoryAdded.push($scope.categoryAlphabet + $scope.databaseCategoryCount);
                        firebase.database().ref('category/' + $scope.categoryAlphabet + $scope.databaseCategoryCount).set({
                            name: categoryValue.name,
                            ID: $scope.categoryAlphabet + $scope.databaseCategoryCount
                        }).then(function() {
                            firebase.database().ref('count/categoryCount').set({
                                count: $scope.databaseCategoryCount,
                                alphabet: $scope.categoryAlphabet
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
                            $scope.btnValidate = false;
                            $scope.$apply();
                        });

                        //add new question in database
                        angular.forEach(categoryValue.question, function(questionValue, key) {
                            $scope.questionCount++;
                            firebase.database().ref('category/' + $scope.categoryAlphabet + $scope.databaseCategoryCount + '/question/' + 
                                $scope.questionAlphabet + $scope.questionCount).set({
                                name: questionValue.name,
                                ID: $scope.questionAlphabet + $scope.questionCount,
                                type: questionValue.type
                            }).then(function() {
                                firebase.database().ref('count/questionCount').set({
                                    count: $scope.questionCount,
                                    alphabet: $scope.questionAlphabet
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
                                $scope.btnValidate = false;
                                $scope.$apply();
                            });
                        });
                    }
                });

                //update facility photo to storage
                if ($scope.facility.photoURL !== $scope.photoURL) {
                    //update facility with new photo
                    var uploadTask = $scope.facilitiesRef.child($scope.facility.ID).put($scope.facility.photoURL);

                    uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, function(snapshot) {
                        var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        $scope.photoProgress = 'Upload is ' + progress + '% done';

                        switch (snapshot.state) {
                            case firebase.storage.TaskState.PAUSED:
                                $scope.photoStatus = 'Upload is paused';
                                break;
                            case firebase.storage.TaskState.RUNNING:
                                $scope.photoStatus = 'Upload is running';
                                break;
                        }
                    }, function(error) {
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
                        $scope.btnValidate = false;
                        $scope.$apply();
                    }, function() {
                        $scope.downloadURL = uploadTask.snapshot.downloadURL;

                        var newDate = new Date();
                        var datetime = newDate.dayNow() + " @ " + newDate.timeNow();

                        //update facility in database
                        firebase.database().ref('facility/' + $scope.facility.ID).set({
                            ID: $scope.facility.ID,
                            name: $scope.facility.name,
                            photoURL: $scope.downloadURL,
                            updatedAt: datetime,
                            updatedBy: $scope.user.ID,
                            createdAt: $scope.facility.createdAt,
                            createdBy: $scope.facility.createdBy
                        }).then(function() {
                            //remove existing category in facility
                            var categoryRef = firebase.database().ref('facility/' + $scope.facility.ID + '/category');
                            categoryRef.remove().then(function() {
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
                                $scope.btnValidate = false;
                                $scope.$apply();
                            });

                            //add new category to facility
                            var error = false;
                            angular.forEach($scope.categoryAdded, function(categoryValue, key) {
                                firebase.database().ref('facility/' + $scope.facility.ID + '/category/' + categoryValue)
                                    .set(categoryValue)
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
                                    $scope.btnValidate = false;
                                    $scope.$apply();
                                });
                            })
                            
                            //redirect to facility list if successfully added facility
                            if (!error) {
                                $location.path("/facilities").search("edit",$scope.facility.name).search("facilityID",null);
                                $route.reload();
                            } else {
                                $scope.btnValidate = false;
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
                            $scope.btnValidate = false;
                            $scope.$apply();
                        });
                    });
                } else {
                    //update facility with old photo
                    var newDate = new Date();
                    var datetime = newDate.dayNow() + " @ " + newDate.timeNow();

                    /***** remove *****/
                    if ($scope.facility.createdAt === undefined)
                        $scope.facility.createdAt = datetime;
                    if ($scope.facility.createdBy === undefined)
                        $scope.facility.createdBy = $scope.user.ID;

                    //update facility in database
                    firebase.database().ref('facility/' + $scope.facility.ID).set({
                        ID: $scope.facility.ID,
                        name: $scope.facility.name,
                        photoURL: $scope.facility.photoURL,
                        updatedAt: datetime,
                        updatedBy: $scope.user.ID,
                        createdAt: $scope.facility.createdAt,
                        createdBy: $scope.facility.createdBy
                    }).then(function() {
                        var error = false;
                        
                        //add new category to facility
                        angular.forEach($scope.categoryAdded, function(categoryValue, key) {
                            firebase.database().ref('facility/' + $scope.facility.ID + '/category/' + categoryValue)
                            .set(categoryValue)
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
                                $scope.btnValidate = false;
                                $scope.$apply();
                            });
                        });
                        
                        //redirect to facility list if successfully added facility
                        if (!error) {
                            $location.path("/facilities").search("edit",$scope.facility.name).search("facilityID",null);
                            $route.reload();
                        } else {
                            $scope.btnValidate = false;
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
                        $scope.btnValidate = false;
                        $scope.$apply();
                    });
                }
            } else {
                //(#error)database-category-not-found
                console.log("database-category-not-found");
                $scope.notify("An error occured when accessing firebase database (Error #004)", "danger");
                $scope.btnValidate = false;
                $scope.$apply();
            } //end of if()
        }).catch(function(error) {
            console.log(error);
            if (error.code === "PERMISSION_DENIED") {
                //(#error)firebase-permission-denied
                $scope.notify("You do not have the permission to access this data (Error #001)", "danger");
            } else {
                //(#error)unknown-error
                $scope.notify("An unknown error has occured (Error #000)", "danger");
            }
            $scope.btnValidate = false;
            $scope.$apply();
        });
    }; //end of $scope.saveFacility()
    
    //refreshes checklist to the one in database
    $scope.refreshChecklist = function() {
        $scope.checklist = [];
        $scope.categoryCount = -1;
                
        angular.forEach($scope.facility.category, function(categoryID, key) {
            firebase.database().ref("category/" + categoryID).once("value").then(function(snapshot) {
                if (snapshot.val() != null) {
                    $scope.addEmptyCategory();
                    $scope.checklist[$scope.categoryCount].name = snapshot.val().name;
                    $scope.checklist[$scope.categoryCount].ID = snapshot.val().ID;
                    $scope.checklist[$scope.categoryCount].no = $scope.categoryCount+1;
                    $scope.checklist[$scope.categoryCount].formID = $scope.categoryCount;
                    $scope.checklist[$scope.categoryCount].deleted = false;
    
                    angular.forEach(snapshot.val().question, function(questionValue, key) {
                        $scope.addEmptyQuestion();
                        var questionCount = $scope.checklist[$scope.categoryCount].questionCount;
                        $scope.checklist[$scope.categoryCount].question[questionCount].name = questionValue.name;
                        $scope.checklist[$scope.categoryCount].question[questionCount].ID = questionValue.ID;
                        $scope.checklist[$scope.categoryCount].question[questionCount].type = questionValue.type;
                        $scope.$apply();
                    });
                } else {
                    //(#error)database-category-not-found
                    console.log("database-category-not-found");
                    $scope.notify("An error occured when accessing firebase database (Error #004)", "danger");
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
        });
    };
    
}]);