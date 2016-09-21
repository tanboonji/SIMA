var app = angular.module('myApp', ['ngRoute', 'firebase', 'ngAnimate', 'ngFileUpload']);

app.config(function($routeProvider){
	$routeProvider
		.when('/login', {
			controller: 'LoginController',
			templateUrl: 'views/login.html'
		})
        .when('/login?:forget', {
			controller: 'LoginController',
			templateUrl: 'views/login.html'
		})
		.when('/forget-password', {
			controller: 'LoginController',
			templateUrl: 'views/forget-password.html'
		})
		.when('/dashboard', {
			controller: 'DashboardController',
			templateUrl: 'views/dashboard.html'
		})
		.when('/projects', {
			controller: 'ProjectsController',
			templateUrl: 'views/projects.html'
		})
		.when('/add-project', {
			controller: 'ProjectsController',
			templateUrl: 'views/add-project.html'
		})
		.when('/edit-project', {
			controller: 'ProjectsController',
			templateUrl: 'views/edit-project.html'
		})
		.when('/edit-project?:projectID', {
			controller: 'ProjectsController',
			templateUrl: 'views/edit-project.html'
		})
		.when('/staff', {
			controller: 'StaffController',
			templateUrl: 'views/staff.html'
		})
        .when('/add-staff', {
			controller: 'StaffController',
			templateUrl: 'views/add-staff.html'
		})
        .when('/edit-staff', {
            controller: 'StaffController',
            templateUrl: 'views/edit-staff.html'
        })
        .when('/edit-staff?:staffID', {
            controller: 'StaffController',
            templateUrl: 'views/edit-staff.html'
        })
        .when('/edit-profile', {
            controller: 'StaffController',
            templateUrl: 'views/edit-profile.html'
        })
		.when('/facilities', {
			controller: 'FacilitiesController',
			templateUrl: 'views/facilities.html'
		})
		.when('/facilities?:add?:edit', {
			controller: 'FacilitiesController',
			templateUrl: 'views/facilities.html'
		})
		.when('/add-facility', {
			controller: 'FacilitiesController',
			templateUrl: 'views/add-facility.html'
		})
		.when('/edit-facility', {
			controller: 'FacilitiesController',
			templateUrl: 'views/edit-facility.html'
		})
		.when('/edit-facility?:facilityID', {
			controller: 'FacilitiesController',
			templateUrl: 'views/edit-facility.html'
		})
        .when('/admin', {
            controller: 'AdminController',
            templateUrl: 'views/admin.html'
        })
        .when('/add-admin', {
            controller: 'AdminController',
            templateUrl: 'views/add-admin.html'
        })
        .when('/edit-admin', {
            controller: 'AdminController',
            templateUrl: 'views/edit-admin.html'
        })
        .when('/edit-admin?:adminID', {
            controller: 'AdminController',
            templateUrl: 'views/edit-admin.html'
        })
		.otherwise({
			redirectTo: '/login'
		});
});

app.constant("firebase_url", "https://kfpam-sima.firebaseio.com");