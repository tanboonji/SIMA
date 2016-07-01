var app = angular.module('myApp', ['ngRoute', 'firebase', 'ngFlash']);

app.config(function($routeProvider){
  $routeProvider
	.when('/login', {
		controller: 'LoginController',
		templateUrl: 'views/login.html'
	})
	.when('/dashboard', {
		controller: 'DashboardController',
		templateUrl: 'views/dashboard.html'
	})
	.when('/projects', {
		controller: 'ProjectsController',
		templateUrl: 'views/projects.html'
	})
	.when('/staff', {
		controller: 'StaffController',
		templateUrl: 'views/projects.html'
	})
	.when('/facilities', {
		controller: 'FacilitiesController',
		templateUrl: 'views/facilities.html'
	})
	.when('/logout', {
		controller: 'LogoutController',
		templateUrl: 'views/logout.html'
	})
	.otherwise({
		redirectTo: '/login'
	});
});

app.constant("firebase_url", "https://kfsi-new.firebaseio.com");