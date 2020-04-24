var traspasoUrl = global_settings.urlCORS + 'api/apiTraspaso/';
appModule.factory('traspasoFactory', function($http) {
    return {
        traspasoFinanciera: function(params) {
            return $http({
                url: traspasoUrl + 'TraspasoFinanciera/',
                method: "GET",
                params: params,
                headers: { 'Content-Type': 'application/json' }
            });
        },
        traspasoFinancieraDetalle: function(params) {
            return $http({
                url: traspasoUrl + 'TraspasoFinancieraDetalle/',
                method: "GET",
                params: params,
                headers: { 'Content-Type': 'application/json' }
            });
        },
        setChangeSchema: function(params) {
            return $http({
                url: traspasoUrl + 'setChangeSchema/',
                method: "GET",
                params: params,
                headers: { 'Content-Type': 'application/json' }
            });
        },
        procesaTraspaso: function( lastId ) {
            return $http({
                url: traspasoUrl + 'procesaTraspaso/',
                method: "GET",
                params: {
                    idTraspasoFinanciera: lastId
                },
                headers: { 'Content-Type': 'application/json' }
            });
        },
        traspasoFlujo: function( financieraDestino, financieraOrigen ) {
            return $http({
                url: traspasoUrl + 'traspasoFlujo/',
                method: "GET",
                params: {
                    financieraDestino: financieraDestino,
                    financieraOrigen: financieraOrigen
                },
                headers: { 'Content-Type': 'application/json' }
            });
        },
        TraspasoFinancieraFlujo: function(params) {
            return $http({
                url: traspasoUrl + 'TraspasoFinancieraFlujo/',
                method: "GET",
                params: params,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    };
});