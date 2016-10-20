app.controller('TestController', ['$route', '$rootScope', '$routeParams', '$scope', '$location', '$firebaseAuth', '$firebaseObject', 
	'$firebaseArray', function($route, $rootScope, $routeParams, $scope, $location, $firebaseAuth, $firebaseObject, $firebaseArray){
    
    $scope.generateReport = function() {
        var loadFile=function(url,callback){
            JSZipUtils.getBinaryContent(url,callback);
        }
        loadFile("examples/tagExample.docx",function(err,content){
            if (err) { throw err };
            doc=new Docxgen(content);
            doc.setData( {"first_name":"Hipp",
                "last_name":"Edgar",
                "phone":"0652455478",
                "description":"New Website"
                }
            ) //set the templateVariables
            doc.render() //apply them (replace all occurences of {first_name} by Hipp, ...)
            out=doc.getZip().generate({type:"blob"}) //Output the document using Data-URI
            saveAs(out,"output.docx")
        })
    };
        
    (function () {
        emailjs.init("user_naRQ2sIhozhAFF7shVZnE");
    })();
    var service_id = 'gmail';
    var template_id = 'staff_creation_template';
    var name = "John";
    var password = "KnightFrank";
    var send_email = "tanboonji@hotmail.com";
    var id = "A0001";
    var template_params = {
        "to_name": name,
        "send_email": send_email,
        "password": password,
        "user_id": id
    };

    $scope.sendEmail = function() {
        emailjs.send(service_id, template_id, template_params)
            .then(function (response) {
                console.log("SUCCESS. status=%d, text=%s", response.status, response.text);
            }, function (err) {
                console.log("FAILED. error=", err);
            });
    }

    var expiry_params = {
        "to_name": name,
        "send_email": send_email,
        "expiry_date": "10 Dec 2016",
        "project_name": "Heights Condominum"
    };

    $scope.sendExpiry = function() {
        emailjs.send(service_id, 'expiry_template', expiry_params)
            .then(function (response) {
                console.log("SUCCESS. status=%d, text=%s", response.status, response.text);
            }, function (err) {
                console.log("FAILED. error=", err);
            });
    }

    var facility_params = {
        "to_name": name,
        "send_email": send_email,
        "frequency_type": "Weekly",
        "project_name": "Heights Condominum"
    };

    $scope.sendFacility = function() {
        emailjs.send(service_id, 'reminder_email', facility_params)
            .then(function (response) {
                console.log("SUCCESS. status=%d, text=%s", response.status, response.text);
            }, function (err) {
                console.log("FAILED. error=", err);
            });
    }
    
}]);