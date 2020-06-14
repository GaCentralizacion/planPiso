var appModule = angular.module("planPisoApp", ["ngRoute",'ui.grid', 'ui.grid.grouping', 'ui.grid.edit', 'ui.grid.selection', 'ui.grid.cellNav']);
appModule.config(function($routeProvider, $locationProvider) {


    $routeProvider.when('/', {
        templateUrl: 'angular/pages/empresa/empresa.html',
        controller: 'empresaController'
    })

    .when('/empresa', {
        templateUrl: 'angular/pages/empresa/empresa.html',
        controller: 'empresaController'
    })

    .when('/unuevas', {
        templateUrl: 'angular/pages/unuevas/unuevas.html',
        controller: 'unuevasController'
    })

    .when('/esquema', {
        templateUrl: 'angular/pages/esquema/esquema.html',
        controller: 'esquemaController'
    })

    .when('/financiera', {
        templateUrl: 'angular/pages/financiera/financiera.html',
        controller: 'financieraController'
    })

    .when('/interes', {
            templateUrl: 'angular/pages/interes/interes.html',
            controller: 'interesController'
    })
    .when('/polizas', {
        templateUrl: 'angular/pages/polizas/polizas.html',
        controller: 'polizasController'

    })
    .when('/proveedor', {
        templateUrl: 'angular/pages/proveedor/proveedor.html',
        controller: 'proveedorController'
    })
    .when('/inventario', {
        templateUrl: 'angular/pages/inventario/inventario.html',
        controller: 'inventarioController'
    })
    .when('/sacarunidad', {
        templateUrl: 'angular/pages/sacarunidad/sacarunidad.html',
        controller: 'sacarunidadController'
    })
    .when('/dashboard', {
        templateUrl: 'angular/pages/dashboard/dashboard.html',
        controller: 'dashboardController'
    })

    .when('/tiie', {
        templateUrl: 'angular/pages/tiie/tiie.html',
        controller: 'tiieController'
    })

    .when('/reprogramacion', {
        templateUrl: 'angular/pages/reduccion/templetes/reduccion.html',
        controller: 'reduccionController'
    })

    .when('/conciliacion', {
        templateUrl: 'angular/pages/conciliacion/conciliacion.html',
        controller: 'conciliacionController'
    })

    .when('/autoriza', {
        templateUrl: 'angular/pages/autoriza/autoriza.html',
        controller: 'autorizaController'
    })

    .when('/crealote', {
        templateUrl: 'angular/pages/crealote/crealote.html',
        controller: 'crealoteController'
    })

    .when('/guardarLote', {
        templateUrl: 'angular/pages/crealote/guardarLote.html',
        controller: 'guardarLoteController'
    })

    .when('/fechaPromesa', {
        templateUrl: 'angular/pages/fechaPromesa/fechaPromesa.html',
        controller: 'fechaPromesaController'
    });


    $routeProvider.otherwise({ requireBasedirectTo: '/' });

    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });

});